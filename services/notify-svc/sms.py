"""SMS sender - stub implementation with logging for development.

In production, replace with Twilio, AWS SNS, or similar integration.
"""

from __future__ import annotations

import logging
import os

logger = logging.getLogger(__name__)

TWILIO_SID = os.getenv("TWILIO_ACCOUNT_SID", "")
TWILIO_TOKEN = os.getenv("TWILIO_AUTH_TOKEN", "")
TWILIO_FROM = os.getenv("TWILIO_FROM_NUMBER", "")


async def send_sms(to: str, message: str) -> bool:
    """Send an SMS message.

    In development mode (no TWILIO_SID configured), logs the message
    instead of actually sending it.

    Args:
        to: Recipient phone number.
        message: SMS message text.

    Returns:
        True if the SMS was sent (or logged) successfully.
    """
    if not TWILIO_SID:
        logger.info("DEV SMS | to=%s | message=%s", to, message[:160])
        return True

    try:
        from twilio.rest import Client

        client = Client(TWILIO_SID, TWILIO_TOKEN)
        client.messages.create(
            body=message[:1600],  # SMS character limit
            from_=TWILIO_FROM,
            to=to,
        )
        logger.info("SMS sent to %s", to)
        return True
    except Exception:
        logger.exception("Failed to send SMS to %s", to)
        return False
