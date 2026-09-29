"""Onboarding profile routes (docs/business-model.md section 3)."""

from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal
from typing import Literal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from shared.auth import TokenPayload, get_current_user
from shared.audit import write_audit_log
from shared.database import get_db
from shared.models import OnboardingProfile

from .autopilot import ensure_default_policies
from .business_plan import BusinessPlanResponse, create_plan_from_profile
from .plans import DEFAULT_MODE_BY_PLAN, current_plan_id

router = APIRouter()

# Numeric columns stored as numeric(...) - bind Decimals so the driver never sees floats.
_DECIMAL_FIELDS = {
    "deadhead_pct",
    "rate_per_loaded_mile",
    "fuel_mpg",
    "fuel_price",
    "driver_pay_per_mile",
    "insurance_per_truck_month",
    "truck_payment_per_month",
    "trailer_payment_per_month",
    "maintenance_per_mile",
    "tires_per_mile",
    "tolls_permits_per_truck_month",
    "overhead_per_month",
    "factoring_rate_pct",
    "factoring_advance_pct",
    "starting_cash",
}


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class OnboardingProfileUpdate(BaseModel):
    """Everything optional: the conversation saves answers as they arrive."""

    company_name: str | None = Field(None, max_length=200)
    dot_number: str | None = Field(None, max_length=32)
    mc_number: str | None = Field(None, max_length=32)
    stage: Literal["starting", "operating"] | None = None
    trucks: int | None = Field(None, ge=0, le=10_000)
    trailers: int | None = Field(None, ge=0, le=10_000)
    drivers: int | None = Field(None, ge=0, le=10_000)
    miles_per_truck_per_week: int | None = Field(None, ge=0, le=10_000)
    deadhead_pct: float | None = Field(None, ge=0, le=1)
    rate_per_loaded_mile: float | None = Field(None, ge=0)
    fuel_mpg: float | None = Field(None, ge=0)
    fuel_price: float | None = Field(None, ge=0)
    driver_pay_per_mile: float | None = Field(None, ge=0)
    insurance_per_truck_month: float | None = Field(None, ge=0)
    truck_payment_per_month: float | None = Field(None, ge=0)
    trailer_payment_per_month: float | None = Field(None, ge=0)
    maintenance_per_mile: float | None = Field(None, ge=0)
    tires_per_mile: float | None = Field(None, ge=0)
    tolls_permits_per_truck_month: float | None = Field(None, ge=0)
    overhead_per_month: float | None = Field(None, ge=0)
    payment_terms_days: int | None = Field(None, ge=0, le=365)
    factoring_enabled: bool | None = None
    factoring_rate_pct: float | None = Field(None, ge=0, le=100)
    factoring_advance_pct: float | None = Field(None, ge=0, le=100)
    starting_cash: float | None = Field(None, ge=0)
    doc_channels: list[str] | None = None
    voice_used: bool | None = None
    answers: dict | None = None


class OnboardingProfileResponse(BaseModel):
    id: UUID
    org_id: UUID
    company_name: str | None = None
    dot_number: str | None = None
    mc_number: str | None = None
    stage: str
    trucks: int
    trailers: int | None = None
    drivers: int | None = None
    miles_per_truck_per_week: int
    deadhead_pct: float
    rate_per_loaded_mile: float
    fuel_mpg: float
    fuel_price: float
    driver_pay_per_mile: float
    insurance_per_truck_month: float
    truck_payment_per_month: float
    trailer_payment_per_month: float
    maintenance_per_mile: float
    tires_per_mile: float
    tolls_permits_per_truck_month: float
    overhead_per_month: float
    payment_terms_days: int
    factoring_enabled: bool
    factoring_rate_pct: float
    factoring_advance_pct: float
    starting_cash: float
    doc_channels: list[str]
    voice_used: bool
    completed_at: datetime | None = None
    answers: dict = {}
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class OnboardingCompleteResponse(BaseModel):
    profile: OnboardingProfileResponse
    plan: BusinessPlanResponse


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

async def _get_profile(db: AsyncSession, org_id: UUID) -> OnboardingProfile | None:
    result = await db.execute(select(OnboardingProfile).where(OnboardingProfile.org_id == org_id))
    return result.scalar_one_or_none()


def _apply_updates(profile: OnboardingProfile, updates: dict) -> None:
    for name, value in updates.items():
        if name in _DECIMAL_FIELDS and value is not None:
            value = Decimal(str(value))
        setattr(profile, name, value)
    profile.updated_at = datetime.now(timezone.utc)


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("/", response_model=OnboardingProfileResponse)
async def get_onboarding_profile(
    current_user: TokenPayload = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    profile = await _get_profile(db, UUID(current_user.org_id))
    if not profile:
        raise HTTPException(status_code=404, detail="Onboarding profile not found")
    return profile


@router.put("/", response_model=OnboardingProfileResponse)
async def upsert_onboarding_profile(
    body: OnboardingProfileUpdate,
    current_user: TokenPayload = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create or update the profile with whatever fields were answered so far."""
    org_id = UUID(current_user.org_id)
    updates = body.model_dump(exclude_unset=True)

    profile = await _get_profile(db, org_id)
    created = profile is None
    if created:
        profile = OnboardingProfile(org_id=org_id)
        db.add(profile)

    # Explicit nulls reset trailers/drivers to "same as trucks"; other columns are NOT NULL and keep their value.
    _apply_updates(profile, {k: v for k, v in updates.items() if v is not None or k in ("trailers", "drivers")})
    await db.commit()
    await db.refresh(profile)

    await write_audit_log(
        db,
        org_id=org_id,
        actor_id=UUID(current_user.user_id),
        actor_type="user",
        action="onboarding_profile.created" if created else "onboarding_profile.updated",
        entity_type="onboarding_profile",
        entity_id=profile.id,
        after_state={k: v for k, v in updates.items() if k != "answers"},
        source="api",
    )
    return profile


@router.post("/complete", response_model=OnboardingCompleteResponse)
async def complete_onboarding(
    current_user: TokenPayload = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mark onboarding done, generate the first business plan and switch Autopilot on.

    Autopilot's mode follows the plan tier: solo -> suggest, fleet -> act, autopilot -> full.
    """
    org_id = UUID(current_user.org_id)
    profile = await _get_profile(db, org_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Onboarding profile not found. Save answers with PUT /onboarding first.")

    profile.completed_at = datetime.now(timezone.utc)
    profile.updated_at = profile.completed_at
    await db.commit()
    await db.refresh(profile)

    plan = await create_plan_from_profile(db, org_id=org_id, profile=profile, generated_by="onboarding")

    plan_tier = await current_plan_id(db, org_id)
    policy = await ensure_default_policies(db, org_id, mode=DEFAULT_MODE_BY_PLAN[plan_tier])

    await write_audit_log(
        db,
        org_id=org_id,
        actor_id=UUID(current_user.user_id),
        actor_type="user",
        action="onboarding.completed",
        entity_type="onboarding_profile",
        entity_id=profile.id,
        after_state={
            "company_name": profile.company_name,
            "trucks": profile.trucks,
            "voice_used": profile.voice_used,
            "plan_version": plan.version,
            "health": plan.health,
            "autopilot_mode": policy.mode,
        },
        source="api",
    )
    return OnboardingCompleteResponse(profile=profile, plan=plan)
