"""LLM Copilot service - chat endpoint with RAG and tool use."""

from __future__ import annotations

import logging
from uuid import UUID

from fastapi import FastAPI, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from shared.database import get_db

from .chat import handle_chat

app = FastAPI(title="LLM Copilot Service", version="0.1.0")
logger = logging.getLogger(__name__)


class ChatRequest(BaseModel):
    org_id: UUID
    user_id: UUID
    conversation_id: UUID
    message: str


class ChatResponse(BaseModel):
    content: str
    citations: list[dict] = []
    tool_calls: dict | None = None
    pending_action: dict | None = None


@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(body: ChatRequest, db: AsyncSession = Depends(get_db)):
    """Process a copilot chat message."""
    result = await handle_chat(
        db,
        org_id=body.org_id,
        user_id=body.user_id,
        conversation_id=body.conversation_id,
        message=body.message,
    )

    return ChatResponse(
        content=result["content"],
        citations=result.get("citations", []),
        tool_calls=result.get("tool_calls"),
        pending_action=result.get("pending_action"),
    )
