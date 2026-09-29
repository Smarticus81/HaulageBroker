"""Business plan routes: the living plan, its history, recompute and live preview."""

from __future__ import annotations

from datetime import datetime
from typing import Any, Literal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from shared.auth import TokenPayload, get_current_user
from shared.audit import write_audit_log
from shared.database import get_db
from shared.models import BusinessPlan, OnboardingProfile

router = APIRouter()

# onboarding_profiles columns the engine consumes (spec section 3 numeric/bool fields + stage)
PLAN_INPUT_FIELDS = (
    "stage",
    "trucks",
    "trailers",
    "drivers",
    "miles_per_truck_per_week",
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
    "payment_terms_days",
    "factoring_enabled",
    "factoring_rate_pct",
    "factoring_advance_pct",
    "starting_cash",
)


def _engine():
    """Import the engine lazily, the way other routers reach sibling services (llm_copilot_svc, billing_svc)."""
    from business_plan_svc import engine

    return engine


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class BusinessPlanResponse(BaseModel):
    id: UUID
    org_id: UUID
    version: int
    inputs: dict
    results: dict
    projection: list
    recommendations: list
    health: int
    generated_by: str
    created_at: datetime

    model_config = {"from_attributes": True}


class BusinessPlanListResponse(BaseModel):
    items: list[BusinessPlanResponse]
    total: int


class PlanPreviewRequest(BaseModel):
    """Partial plan inputs; anything omitted or null uses the spec defaults."""

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


class ComputedPlanResponse(BaseModel):
    inputs: dict
    results: dict
    projection: list
    recommendations: list
    health: int
    warnings: list[str] = []


# ---------------------------------------------------------------------------
# Helpers (also used by the onboarding router)
# ---------------------------------------------------------------------------

def profile_plan_inputs(profile: OnboardingProfile) -> dict[str, Any]:
    return {name: getattr(profile, name, None) for name in PLAN_INPUT_FIELDS}


def compute_from_inputs(raw: dict[str, Any]) -> dict[str, Any]:
    engine = _engine()
    return engine.compute_plan(engine.inputs_from_profile(raw)).to_dict()


async def next_plan_version(db: AsyncSession, org_id: UUID) -> int:
    current = (await db.execute(
        select(func.max(BusinessPlan.version)).where(BusinessPlan.org_id == org_id)
    )).scalar()
    return int(current or 0) + 1


async def create_plan_from_profile(
    db: AsyncSession,
    *,
    org_id: UUID,
    profile: OnboardingProfile,
    generated_by: Literal["onboarding", "recompute", "autopilot"],
) -> BusinessPlan:
    """Compute a plan from the profile and store it as the next version."""
    computed = compute_from_inputs(profile_plan_inputs(profile))
    plan = BusinessPlan(
        org_id=org_id,
        version=await next_plan_version(db, org_id),
        inputs=computed["inputs"],
        results=computed["results"],
        projection=computed["projection"],
        recommendations=computed["recommendations"],
        health=computed["health"],
        generated_by=generated_by,
    )
    db.add(plan)
    await db.commit()
    await db.refresh(plan)
    return plan


async def _latest_plan(db: AsyncSession, org_id: UUID) -> BusinessPlan | None:
    result = await db.execute(
        select(BusinessPlan)
        .where(BusinessPlan.org_id == org_id)
        .order_by(BusinessPlan.version.desc(), BusinessPlan.created_at.desc())
        .limit(1)
    )
    return result.scalar_one_or_none()


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("/", response_model=BusinessPlanResponse)
async def get_latest_plan(
    current_user: TokenPayload = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    plan = await _latest_plan(db, UUID(current_user.org_id))
    if not plan:
        raise HTTPException(status_code=404, detail="No business plan yet. Complete onboarding first.")
    return plan


@router.get("/history", response_model=BusinessPlanListResponse)
async def list_plan_history(
    current_user: TokenPayload = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    limit: int = Query(20, ge=1, le=100),
):
    org_id = UUID(current_user.org_id)
    total = (await db.execute(
        select(func.count()).select_from(BusinessPlan).where(BusinessPlan.org_id == org_id)
    )).scalar() or 0
    rows = (await db.execute(
        select(BusinessPlan)
        .where(BusinessPlan.org_id == org_id)
        .order_by(BusinessPlan.version.desc(), BusinessPlan.created_at.desc())
        .limit(limit)
    )).scalars().all()
    return BusinessPlanListResponse(items=rows, total=total)


@router.post("/recompute", response_model=BusinessPlanResponse)
async def recompute_plan(
    current_user: TokenPayload = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Recompute the plan from the current onboarding profile and store a new version."""
    org_id = UUID(current_user.org_id)
    result = await db.execute(select(OnboardingProfile).where(OnboardingProfile.org_id == org_id))
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=404, detail="No onboarding profile to recompute from")

    plan = await create_plan_from_profile(db, org_id=org_id, profile=profile, generated_by="recompute")

    await write_audit_log(
        db,
        org_id=org_id,
        actor_id=UUID(current_user.user_id),
        actor_type="user",
        action="business_plan.recomputed",
        entity_type="business_plan",
        entity_id=plan.id,
        after_state={"version": plan.version, "health": plan.health},
        source="api",
    )
    return plan


@router.post("/preview", response_model=ComputedPlanResponse)
async def preview_plan(body: PlanPreviewRequest):
    """Compute a plan from partial inputs without storing anything.

    Unauthenticated and stateless: the onboarding conversation calls it after
    every answer so the plan updates live, before the workspace exists.
    """
    return ComputedPlanResponse(**compute_from_inputs(body.model_dump(exclude_none=True)))
