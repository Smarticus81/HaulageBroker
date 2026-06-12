"""Copilot chat routes."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from shared.auth import TokenPayload, get_current_user
from shared.database import get_db
from shared.models import CopilotConversation, CopilotMessage

router = APIRouter()


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class ChatRequest(BaseModel):
    conversation_id: UUID | None = None
    message: str


class Citation(BaseModel):
    source_type: str
    source_id: str | None = None
    content_preview: str


class PendingAction(BaseModel):
    action_type: str
    description: str
    parameters: dict


class ChatResponse(BaseModel):
    conversation_id: UUID
    message_id: UUID
    content: str
    citations: list[Citation] = []
    pending_action: PendingAction | None = None


class ConfirmActionRequest(BaseModel):
    conversation_id: UUID
    action_type: str
    parameters: dict
    confirmed: bool


class ConfirmActionResponse(BaseModel):
    success: bool
    message: str
    result: dict | None = None


class ConversationResponse(BaseModel):
    id: UUID
    org_id: UUID
    user_id: UUID
    title: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ConversationListResponse(BaseModel):
    items: list[ConversationResponse]
    total: int


class MessageResponse(BaseModel):
    id: UUID
    conversation_id: UUID
    role: str
    content: str | None = None
    tool_calls: dict | None = None
    citations: list = []
    created_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/chat", response_model=ChatResponse)
async def copilot_chat(
    body: ChatRequest,
    current_user: TokenPayload = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Send a message to the copilot and receive a response with citations."""
    org_id = UUID(current_user.org_id)
    user_id = UUID(current_user.user_id)

    # Get or create conversation
    if body.conversation_id:
        conv_result = await db.execute(
            select(CopilotConversation).where(
                CopilotConversation.id == body.conversation_id,
                CopilotConversation.user_id == user_id,
            )
        )
        conversation = conv_result.scalar_one_or_none()
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
    else:
        conversation = CopilotConversation(org_id=org_id, user_id=user_id, title=body.message[:80])
        db.add(conversation)
        await db.commit()
        await db.refresh(conversation)

    # Save user message
    user_msg = CopilotMessage(
        conversation_id=conversation.id,
        role="user",
        content=body.message,
    )
    db.add(user_msg)
    await db.commit()

    # Process through the copilot service
    from llm_copilot_svc.chat import handle_chat

    result = await handle_chat(db, org_id, user_id, conversation.id, body.message)

    # Save assistant message
    assistant_msg = CopilotMessage(
        conversation_id=conversation.id,
        role="assistant",
        content=result["content"],
        citations=result.get("citations", []),
        tool_calls=result.get("tool_calls"),
    )
    db.add(assistant_msg)
    await db.commit()
    await db.refresh(assistant_msg)

    return ChatResponse(
        conversation_id=conversation.id,
        message_id=assistant_msg.id,
        content=result["content"],
        citations=[Citation(**c) for c in result.get("citations", [])],
        pending_action=PendingAction(**result["pending_action"]) if result.get("pending_action") else None,
    )


@router.post("/actions/confirm", response_model=ConfirmActionResponse)
async def confirm_copilot_action(
    body: ConfirmActionRequest,
    current_user: TokenPayload = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Confirm or deny a pending copilot write action."""
    if not body.confirmed:
        return ConfirmActionResponse(success=False, message="Action cancelled by user")

    from llm_copilot_svc.tools import execute_write_action

    result = await execute_write_action(
        db,
        org_id=UUID(current_user.org_id),
        user_id=UUID(current_user.user_id),
        action_type=body.action_type,
        parameters=body.parameters,
    )

    return ConfirmActionResponse(success=True, message="Action executed", result=result)


@router.get("/conversations", response_model=ConversationListResponse)
async def list_conversations(
    current_user: TokenPayload = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    user_id = UUID(current_user.user_id)
    result = await db.execute(
        select(CopilotConversation)
        .where(CopilotConversation.user_id == user_id)
        .order_by(CopilotConversation.updated_at.desc())
        .limit(50)
    )
    conversations = result.scalars().all()
    return ConversationListResponse(items=conversations, total=len(conversations))


@router.get("/conversations/{conv_id}/messages", response_model=list[MessageResponse])
async def get_conversation_messages(
    conv_id: UUID,
    current_user: TokenPayload = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Verify ownership
    conv_result = await db.execute(
        select(CopilotConversation).where(
            CopilotConversation.id == conv_id,
            CopilotConversation.user_id == UUID(current_user.user_id),
        )
    )
    if not conv_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Conversation not found")

    result = await db.execute(
        select(CopilotMessage)
        .where(CopilotMessage.conversation_id == conv_id)
        .order_by(CopilotMessage.created_at.asc())
    )
    return result.scalars().all()
