"""Notification service - email and SMS dispatching."""

from __future__ import annotations

import logging

from fastapi import FastAPI
from pydantic import BaseModel

from .email import send_email
from .sms import send_sms

app = FastAPI(title="Notification Service", version="0.1.0")
logger = logging.getLogger(__name__)


class EmailRequest(BaseModel):
    to: str
    subject: str
    body: str
    html: bool = False


class SmsRequest(BaseModel):
    to: str
    message: str


class NotificationResponse(BaseModel):
    success: bool
    message: str


@app.post("/send-email", response_model=NotificationResponse)
async def send_email_endpoint(body: EmailRequest):
    """Send an email notification."""
    success = await send_email(to=body.to, subject=body.subject, body=body.body, html=body.html)
    return NotificationResponse(
        success=success,
        message="Email sent" if success else "Email sending failed",
    )


@app.post("/send-sms", response_model=NotificationResponse)
async def send_sms_endpoint(body: SmsRequest):
    """Send an SMS notification."""
    success = await send_sms(to=body.to, message=body.message)
    return NotificationResponse(
        success=success,
        message="SMS sent" if success else "SMS sending failed",
    )
