"""Business Plan service - stateless plan computation over HTTP.

Persistence (profiles, plan history, policies) lives in the API gateway; this
service only exposes the pure engine so other services and batch jobs can
compute plans without importing it.
"""

from __future__ import annotations

import logging
from typing import Any

from fastapi import FastAPI
from pydantic import BaseModel

from .engine import DEFAULT_INPUTS, INPUT_FIELDS, compute_plan, inputs_from_profile

app = FastAPI(title="Business Plan Service", version="0.1.0")
logger = logging.getLogger(__name__)


class ComputeRequest(BaseModel):
    """Partial onboarding profile; missing fields use the spec defaults."""

    profile: dict[str, Any] = {}


class ComputeResponse(BaseModel):
    inputs: dict[str, Any]
    results: dict[str, Any]
    projection: list[dict[str, Any]]
    recommendations: list[dict[str, Any]]
    health: int
    warnings: list[str] = []


@app.post("/compute", response_model=ComputeResponse)
async def compute_endpoint(body: ComputeRequest):
    """Compute a business plan from a (partial) onboarding profile."""
    plan = compute_plan(inputs_from_profile(body.profile))
    return ComputeResponse(**plan.to_dict())


@app.get("/defaults")
async def defaults_endpoint():
    """The spec defaults, in field order, for clients that render the onboarding form."""
    return {"fields": list(INPUT_FIELDS), "defaults": DEFAULT_INPUTS.__dict__}
