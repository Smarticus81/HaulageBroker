"""Email sender - stub implementation with logging for development.

In production, replace with SMTP, SendGrid, SES, or similar integration.
"""

from __future__ import annotations

import logging
import os

logger = logging.getLogger(__name__)

SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_FROM = os.getenv("SMTP_FROM", "noreply@carrierbackoffice.local")


async def send_email(
    to: str,
    subject: str,
    body: str,
    html: bool = False,
) -> bool:
    """Send an email.

    In development mode (no SMTP_HOST configured), logs the email instead
    of actually sending it.

    Args:
        to: Recipient email address.
        subject: Email subject line.
        body: Email body (plain text or HTML).
        html: Whether the body is HTML.

    Returns:
        True if the email was sent (or logged) successfully.
    """
    if not SMTP_HOST:
        logger.info(
            "DEV EMAIL | to=%s | subject=%s | html=%s | body_preview=%s",
            to, subject, html, body[:200],
        )
        return True

    try:
        import smtplib
        from email.mime.text import MIMEText

        msg = MIMEText(body, "html" if html else "plain")
        msg["Subject"] = subject
        msg["From"] = SMTP_FROM
        msg["To"] = to

        smtp_port = int(os.getenv("SMTP_PORT", "587"))
        smtp_user = os.getenv("SMTP_USER", "")
        smtp_pass = os.getenv("SMTP_PASS", "")

        with smtplib.SMTP(SMTP_HOST, smtp_port) as server:
            server.starttls()
            if smtp_user:
                server.login(smtp_user, smtp_pass)
            server.send_message(msg)

        logger.info("Email sent to %s: %s", to, subject)
        return True
    except Exception:
        logger.exception("Failed to send email to %s", to)
        return False
