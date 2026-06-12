"""Chat handler for the LLM copilot.

Builds system prompt with RAG context, calls the LLM with tool definitions,
handles tool calls (read-only execute immediately, write ops return
confirmation request), and logs everything.
"""

from __future__ import annotations

import json
import logging
import os
from typing import Any
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from shared.audit import write_audit_log
from shared.models import CopilotMessage

from .guardrails import build_confirmation_request, is_read_only, validate_tool_parameters
from .rag import build_context
from .tools import TOOL_DEFINITIONS, execute_read_tool

logger = logging.getLogger(__name__)

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
LLM_MODEL = os.getenv("COPILOT_LLM_MODEL", "gpt-4o")

SYSTEM_PROMPT_TEMPLATE = """You are CarrierBackOffice Copilot, an AI assistant for trucking carrier back-office operations.

You help users with:
- Querying load records, documents, exceptions, and tasks
- Creating tasks and document requests (with user confirmation)
- Drafting emails for common back-office communications
- Answering questions about compliance, billing, and operations
- Proposing automation rules

Always cite your sources when referencing specific data. Be concise and action-oriented.

Current context from the organization's data:
{context}
"""


async def handle_chat(
    db: AsyncSession,
    org_id: UUID,
    user_id: UUID,
    conversation_id: UUID,
    message: str,
) -> dict[str, Any]:
    """Process a user chat message and return the copilot response.

    Args:
        db: Database session.
        org_id: Organization ID.
        user_id: User ID.
        conversation_id: Conversation ID.
        message: User's message text.

    Returns:
        Dict with content, citations, tool_calls, and optional pending_action.
    """
    # Build RAG context
    context, citations = await build_context(db, org_id, message)

    # Build system prompt
    system_prompt = SYSTEM_PROMPT_TEMPLATE.format(context=context)

    # Load conversation history
    history = await _load_history(db, conversation_id, limit=20)

    # Build messages for LLM
    messages = [{"role": "system", "content": system_prompt}]
    for msg in history:
        messages.append({"role": msg["role"], "content": msg["content"] or ""})
    messages.append({"role": "user", "content": message})

    # Call LLM
    llm_response = await _call_llm(messages)

    # Handle tool calls if any
    pending_action = None
    tool_call_data = None

    if llm_response.get("tool_calls"):
        tool_call = llm_response["tool_calls"][0]
        tool_name = tool_call["name"]
        tool_params = tool_call.get("arguments", {})

        # Validate parameters
        validation_errors = validate_tool_parameters(tool_name, tool_params)
        if validation_errors:
            llm_response["content"] += f"\n\nI tried to use the {tool_name} tool but encountered validation errors: {', '.join(validation_errors)}"
        elif is_read_only(tool_name):
            # Execute immediately
            tool_result = await execute_read_tool(db, org_id, tool_name, tool_params)
            tool_call_data = {"tool": tool_name, "params": tool_params, "result": tool_result}

            # Append tool result to response
            result_summary = json.dumps(tool_result, indent=2, default=str)
            llm_response["content"] += f"\n\nHere are the results:\n```json\n{result_summary}\n```"
        else:
            # Write operation - require confirmation
            pending_action = build_confirmation_request(tool_name, tool_params)
            llm_response["content"] += (
                f"\n\nI'd like to **{pending_action['description']}** with the following details:\n"
                f"```json\n{json.dumps(tool_params, indent=2)}\n```\n"
                f"Please confirm this action."
            )

    # Log to audit
    await write_audit_log(
        db,
        org_id=org_id,
        actor_id=user_id,
        actor_type="copilot",
        action="copilot.chat",
        entity_type="copilot_conversation",
        entity_id=conversation_id,
        metadata={
            "message_preview": message[:200],
            "had_tool_calls": bool(tool_call_data or pending_action),
        },
        source="copilot",
    )

    return {
        "content": llm_response.get("content", "I'm sorry, I couldn't generate a response."),
        "citations": citations,
        "tool_calls": tool_call_data,
        "pending_action": pending_action,
    }


async def _load_history(
    db: AsyncSession,
    conversation_id: UUID,
    limit: int = 20,
) -> list[dict[str, Any]]:
    """Load recent conversation history."""
    result = await db.execute(
        select(CopilotMessage)
        .where(CopilotMessage.conversation_id == conversation_id)
        .order_by(CopilotMessage.created_at.desc())
        .limit(limit)
    )
    messages = result.scalars().all()

    return [
        {"role": msg.role.value if hasattr(msg.role, "value") else str(msg.role), "content": msg.content}
        for msg in reversed(messages)
    ]


async def _call_llm(messages: list[dict[str, str]]) -> dict[str, Any]:
    """Call the LLM API with messages and tool definitions.

    Falls back to a simple echo response if OpenAI is not configured.
    """
    if not OPENAI_API_KEY:
        logger.warning("OPENAI_API_KEY not set, using stub response")
        user_msg = messages[-1]["content"] if messages else ""
        return {
            "content": (
                f"I received your message: \"{user_msg[:100]}...\" "
                "However, the LLM backend is not configured. "
                "Please set the OPENAI_API_KEY environment variable to enable full copilot functionality."
            ),
            "tool_calls": None,
        }

    try:
        import openai

        client = openai.OpenAI(api_key=OPENAI_API_KEY)

        # Convert tool definitions to OpenAI format
        tools = [
            {
                "type": "function",
                "function": {
                    "name": t["name"],
                    "description": t["description"],
                    "parameters": t["parameters"],
                },
            }
            for t in TOOL_DEFINITIONS
        ]

        response = client.chat.completions.create(
            model=LLM_MODEL,
            messages=messages,
            tools=tools,
            tool_choice="auto",
        )

        choice = response.choices[0]
        result: dict[str, Any] = {"content": choice.message.content or "", "tool_calls": None}

        if choice.message.tool_calls:
            tc = choice.message.tool_calls[0]
            result["tool_calls"] = [
                {
                    "name": tc.function.name,
                    "arguments": json.loads(tc.function.arguments),
                }
            ]

        return result

    except Exception:
        logger.exception("LLM API call failed")
        return {
            "content": "I'm sorry, I encountered an error processing your request. Please try again.",
            "tool_calls": None,
        }
