"""Simple event bus using Redis pub/sub."""

from __future__ import annotations

import asyncio
import json
import logging
from typing import Any, Callable, Coroutine

from .redis_client import get_redis

logger = logging.getLogger(__name__)

# Well-known event types
EVENT_DOCUMENT_UPLOADED = "document.uploaded"
EVENT_DOCUMENT_CLASSIFIED = "document.classified"
EVENT_DOCUMENT_VALIDATED = "document.validated"
EVENT_LOAD_CREATED = "load.created"
EVENT_LOAD_STATUS_CHANGED = "load.status_changed"
EVENT_COMPLIANCE_EXPIRING = "compliance.expiring"
EVENT_INVOICEPACKET_READY = "invoicepacket.ready"
EVENT_EXCEPTION_RAISED = "exception.raised"
EVENT_TASK_CREATED = "task.created"


class EventBus:
    """Publish/subscribe event bus backed by Redis pub/sub."""

    def __init__(self) -> None:
        self._redis = get_redis()
        self._handlers: dict[str, list[Callable[..., Coroutine[Any, Any, None]]]] = {}

    async def publish(self, event_type: str, payload: dict[str, Any]) -> None:
        """Publish an event to all subscribers."""
        message = json.dumps({"event_type": event_type, "payload": payload})
        await self._redis.publish(f"events:{event_type}", message)
        logger.info("Published event %s", event_type)

    def subscribe(
        self,
        event_type: str,
        handler: Callable[..., Coroutine[Any, Any, None]],
    ) -> None:
        """Register an async handler for an event type."""
        self._handlers.setdefault(event_type, []).append(handler)

    async def listen(self) -> None:
        """Start listening for subscribed events. Runs indefinitely."""
        if not self._handlers:
            logger.warning("EventBus.listen() called with no handlers registered")
            return

        pubsub = self._redis.pubsub()
        channels = [f"events:{et}" for et in self._handlers]
        await pubsub.subscribe(*channels)
        logger.info("EventBus listening on channels: %s", channels)

        async for raw_message in pubsub.listen():
            if raw_message["type"] != "message":
                continue
            try:
                data = json.loads(raw_message["data"])
                event_type = data["event_type"]
                payload = data["payload"]
                for handler in self._handlers.get(event_type, []):
                    try:
                        await handler(payload)
                    except Exception:
                        logger.exception(
                            "Handler %s failed for event %s",
                            handler.__name__,
                            event_type,
                        )
            except Exception:
                logger.exception("Failed to process event message")

    async def close(self) -> None:
        """Clean up the Redis connection."""
        await self._redis.aclose()
