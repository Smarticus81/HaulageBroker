"""CarrierBackOffice API Gateway - main FastAPI application."""

from __future__ import annotations

import logging
import os

import sentry_sdk
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers import (
    auth_routes,
    audit,
    automations,
    billing,
    compliance,
    copilot,
    document_requests,
    documents,
    exceptions,
    load_records,
    settlements,
    tasks,
)

# ---------------------------------------------------------------------------
# Sentry (optional)
# ---------------------------------------------------------------------------
_sentry_dsn = os.getenv("SENTRY_DSN")
if _sentry_dsn:
    sentry_sdk.init(dsn=_sentry_dsn, traces_sample_rate=0.2)

# ---------------------------------------------------------------------------
# OpenTelemetry (optional)
# ---------------------------------------------------------------------------
_otel_enabled = os.getenv("OTEL_ENABLED", "false").lower() == "true"
if _otel_enabled:
    from opentelemetry import trace
    from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
    from opentelemetry.sdk.trace import TracerProvider
    from opentelemetry.sdk.trace.export import SimpleSpanProcessor

    trace.set_tracer_provider(TracerProvider())

# ---------------------------------------------------------------------------
# Application
# ---------------------------------------------------------------------------
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s %(levelname)s %(message)s")

app = FastAPI(
    title="CarrierBackOffice API",
    version="0.1.0",
    description="Unified back-office platform for small/mid-size trucking carriers.",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:3000").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Instrument with OpenTelemetry after app creation
if _otel_enabled:
    FastAPIInstrumentor.instrument_app(app)

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
app.include_router(auth_routes.router, prefix="/auth", tags=["Auth"])
app.include_router(load_records.router, prefix="/load-records", tags=["Load Records"])
app.include_router(documents.router, tags=["Documents"])
app.include_router(exceptions.router, prefix="/exceptions", tags=["Exceptions"])
app.include_router(tasks.router, prefix="/tasks", tags=["Tasks"])
app.include_router(document_requests.router, prefix="/document-requests", tags=["Document Requests"])
app.include_router(compliance.router, prefix="/compliance", tags=["Compliance"])
app.include_router(billing.router, tags=["Billing"])
app.include_router(settlements.router, prefix="/settlement-packets", tags=["Settlements"])
app.include_router(automations.router, prefix="/automations", tags=["Automations"])
app.include_router(copilot.router, prefix="/copilot", tags=["Copilot"])
app.include_router(audit.router, prefix="/audit-logs", tags=["Audit"])


@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "ok"}
