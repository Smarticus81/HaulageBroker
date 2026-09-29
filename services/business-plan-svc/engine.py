"""Business Plan engine - the reference implementation of docs/business-model.md section 4.

Pure functions, no I/O.  The web app (``packages/core``) implements the same
formulas; both are tested against the worked example in section 4.8, so any
change here must be mirrored there.

Conventions:
- all money is USD per month, rounded half-up to cents in ``results``;
- ratios (operating ratio, per-mile figures, runway) are rounded to 4 decimals;
- ``margin_pct`` is a percentage and is rounded to 2 decimals;
- undefined values (zero trucks, zero revenue, non-positive contribution) are
  ``None`` so the result is always JSON-serialisable (no NaN / Infinity).
"""

from __future__ import annotations

from dataclasses import asdict, dataclass, field, fields
from decimal import ROUND_HALF_UP, Decimal
from typing import Any, Mapping

WEEKS_PER_MONTH = 52 / 12
PROJECTION_MONTHS = 12
STARTING_RAMP = (0.60, 0.80, 1.00)
STAGES = ("starting", "operating")


# ---------------------------------------------------------------------------
# Inputs
# ---------------------------------------------------------------------------

@dataclass
class PlanInputs:
    """Numeric / boolean onboarding fields (spec section 3) with spec defaults.

    ``trailers`` and ``drivers`` default to ``trucks`` when left as ``None``.
    """

    stage: str = "operating"
    trucks: int = 1
    trailers: int | None = None
    drivers: int | None = None
    miles_per_truck_per_week: int = 2500
    deadhead_pct: float = 0.15
    rate_per_loaded_mile: float = 2.35
    fuel_mpg: float = 6.5
    fuel_price: float = 3.85
    driver_pay_per_mile: float = 0.62
    insurance_per_truck_month: float = 1400.0
    truck_payment_per_month: float = 2200.0
    trailer_payment_per_month: float = 600.0
    maintenance_per_mile: float = 0.18
    tires_per_mile: float = 0.04
    tolls_permits_per_truck_month: float = 350.0
    overhead_per_month: float = 800.0
    payment_terms_days: int = 35
    factoring_enabled: bool = False
    factoring_rate_pct: float = 3.0
    factoring_advance_pct: float = 95.0
    starting_cash: float = 15000.0

    def __post_init__(self) -> None:
        if self.stage not in STAGES:
            self.stage = "operating"
        if self.trailers is None:
            self.trailers = self.trucks
        if self.drivers is None:
            self.drivers = self.trucks


DEFAULT_INPUTS = PlanInputs()

_INT_FIELDS = {"trucks", "trailers", "drivers", "miles_per_truck_per_week", "payment_terms_days"}
_BOOL_FIELDS = {"factoring_enabled"}
_STR_FIELDS = {"stage"}
INPUT_FIELDS: tuple[str, ...] = tuple(f.name for f in fields(PlanInputs))


def _coerce(name: str, value: Any) -> Any:
    if name in _STR_FIELDS:
        return str(value).strip().lower()
    if name in _BOOL_FIELDS:
        if isinstance(value, str):
            return value.strip().lower() in ("1", "true", "yes", "y", "on")
        return bool(value)
    if name in _INT_FIELDS:
        return int(float(value))
    return float(value)


def inputs_from_profile(profile: Mapping[str, Any] | None) -> PlanInputs:
    """Build ``PlanInputs`` from an onboarding profile dict.

    Missing keys and ``None`` values fall back to the spec defaults; extra keys
    (company name, DOT number, doc channels, ...) are ignored.  Numeric strings
    and ``Decimal`` values from the database are coerced.
    """
    profile = profile or {}
    kwargs: dict[str, Any] = {}
    for name in INPUT_FIELDS:
        value = profile.get(name)
        if value is None or (isinstance(value, str) and not value.strip()):
            continue
        kwargs[name] = _coerce(name, value)
    return PlanInputs(**kwargs)


# ---------------------------------------------------------------------------
# Result
# ---------------------------------------------------------------------------

@dataclass
class PlanResult:
    inputs: PlanInputs
    results: dict[str, Any]
    projection: list[dict[str, Any]]
    recommendations: list[dict[str, Any]]
    health: int
    warnings: list[str] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return {
            "inputs": asdict(self.inputs),
            "results": self.results,
            "projection": self.projection,
            "recommendations": self.recommendations,
            "health": self.health,
            "warnings": list(self.warnings),
        }


# ---------------------------------------------------------------------------
# Rounding helpers (half-up, matching Math.round-style rounding on the web)
# ---------------------------------------------------------------------------

def _round_half_up(value: float, places: int) -> float:
    quantum = Decimal(1).scaleb(-places)  # 10 ** -places
    return float(Decimal(repr(float(value))).quantize(quantum, rounding=ROUND_HALF_UP))


def money(value: float | None) -> float | None:
    return None if value is None else _round_half_up(value, 2)


def ratio(value: float | None) -> float | None:
    return None if value is None else _round_half_up(value, 4)


def _clamp(value: float, low: float = 0.0, high: float = 1.0) -> float:
    return max(low, min(high, value))


def _fmt_money(value: float) -> str:
    return f"${_round_half_up(value, 2):,.2f}"


# ---------------------------------------------------------------------------
# Engine
# ---------------------------------------------------------------------------

def compute_plan(inputs: PlanInputs) -> PlanResult:
    """Compute results (4.1-4.4), projection (4.5), health (4.6) and recommendations (4.7)."""
    i = inputs
    warnings: list[str] = []

    # 4.1 Volume
    total_miles = i.trucks * i.miles_per_truck_per_week * WEEKS_PER_MONTH
    loaded_miles = total_miles * (1 - i.deadhead_pct)
    revenue = loaded_miles * i.rate_per_loaded_mile

    # 4.2 Costs
    if i.fuel_mpg > 0:
        fuel = total_miles / i.fuel_mpg * i.fuel_price
    else:
        fuel = 0.0
        warnings.append("fuel_mpg must be positive; fuel cost treated as zero")
    driver_pay = total_miles * i.driver_pay_per_mile
    maintenance = total_miles * (i.maintenance_per_mile + i.tires_per_mile)
    variable = fuel + driver_pay + maintenance

    fixed = (
        i.trucks * (i.insurance_per_truck_month + i.truck_payment_per_month + i.tolls_permits_per_truck_month)
        + i.trailers * i.trailer_payment_per_month
        + i.overhead_per_month
    )
    factoring_fee = revenue * i.factoring_rate_pct / 100 if i.factoring_enabled else 0.0
    total_cost = fixed + variable + factoring_fee

    # 4.3 Results
    profit = revenue - total_cost
    if revenue > 0:
        margin_pct = profit / revenue * 100
        operating_ratio: float | None = total_cost / revenue
    else:
        margin_pct = 0.0
        operating_ratio = None
        warnings.append("revenue is zero; margin and operating ratio are undefined")

    if total_miles > 0:
        revenue_per_mile: float | None = revenue / total_miles
        cost_per_mile: float | None = total_cost / total_miles
        contribution_per_mile: float | None = (revenue - variable - factoring_fee) / total_miles
    else:
        revenue_per_mile = cost_per_mile = contribution_per_mile = None

    if contribution_per_mile is not None and contribution_per_mile > 0:
        break_even_miles: float | None = fixed / contribution_per_mile
    else:
        break_even_miles = None  # spec: Infinity when contribution <= 0; None keeps JSON valid

    # 4.4 Cash
    daily_revenue = revenue / 30
    if i.factoring_enabled:
        cash_gap_days = 1 + i.payment_terms_days * (1 - i.factoring_advance_pct / 100)
    else:
        cash_gap_days = float(i.payment_terms_days)
    working_capital_need = daily_revenue * cash_gap_days
    runway_months = i.starting_cash / max(total_cost, 1)

    # 4.6 Health
    margin_score = _clamp(margin_pct / 20) * 40
    runway_score = _clamp(runway_months / 3) * 30
    deadhead_score = _clamp((0.30 - i.deadhead_pct) / 0.20) * 15
    util_score = _clamp(i.miles_per_truck_per_week / 2500) * 15
    health = int(_round_half_up(margin_score + runway_score + deadhead_score + util_score, 0))

    # 4.5 Projection
    projection = _projection(i, revenue=revenue, variable=variable, fixed=fixed, factoring_fee=factoring_fee)

    # 4.7 Recommendations
    recommendations = _recommendations(
        i,
        total_miles=total_miles,
        revenue=revenue,
        fuel=fuel,
        margin_pct=margin_pct,
        factoring_fee=factoring_fee,
        working_capital_need=working_capital_need,
    )

    results: dict[str, Any] = {
        # 4.1
        "total_miles": money(total_miles),
        "loaded_miles": money(loaded_miles),
        "revenue": money(revenue),
        # 4.2
        "fuel": money(fuel),
        "driver_pay": money(driver_pay),
        "maintenance": money(maintenance),
        "variable": money(variable),
        "fixed": money(fixed),
        "factoring_fee": money(factoring_fee),
        "total_cost": money(total_cost),
        # 4.3
        "profit": money(profit),
        "margin_pct": money(margin_pct),
        "operating_ratio": ratio(operating_ratio),
        "revenue_per_mile": ratio(revenue_per_mile),
        "cost_per_mile": ratio(cost_per_mile),
        "contribution_per_mile": ratio(contribution_per_mile),
        "break_even_miles": money(break_even_miles),
        # 4.4
        "daily_revenue": money(daily_revenue),
        "cash_gap_days": money(cash_gap_days),
        "working_capital_need": money(working_capital_need),
        "runway_months": ratio(runway_months),
    }

    return PlanResult(
        inputs=i,
        results=results,
        projection=projection,
        recommendations=recommendations,
        health=health,
        warnings=warnings,
    )


def collections_lag_months(payment_terms_days: int) -> int:
    """``round(payment_terms_days / 30)`` with half-up rounding (45 days -> 2 months)."""
    return int(_round_half_up(payment_terms_days / 30, 0))


def _projection(
    i: PlanInputs,
    *,
    revenue: float,
    variable: float,
    fixed: float,
    factoring_fee: float,
) -> list[dict[str, Any]]:
    ramp = STARTING_RAMP if i.stage == "starting" else ()
    lag = collections_lag_months(i.payment_terms_days)
    advance = i.factoring_advance_pct / 100 if i.factoring_enabled else 0.0

    revenues: dict[int, float] = {}
    rows: list[dict[str, Any]] = []
    cash = float(i.starting_cash)

    for month in range(1, PROJECTION_MONTHS + 1):
        utilization = ramp[month - 1] if month - 1 < len(ramp) else 1.0
        revenue_m = revenue * utilization
        variable_m = variable * utilization
        fee_m = factoring_fee * utilization
        revenues[month] = revenue_m

        lagged_revenue = revenues.get(month - lag, 0.0) if month - lag >= 1 else 0.0
        if i.factoring_enabled:
            collections = revenue_m * advance + lagged_revenue * (1 - advance) - fee_m
        else:
            collections = lagged_revenue

        costs_m = fixed + variable_m + fee_m
        profit_m = revenue_m - costs_m
        cash = cash + collections - fixed - variable_m

        rows.append({
            "month": month,
            "revenue": money(revenue_m),
            "costs": money(costs_m),
            "profit": money(profit_m),
            "collections": money(collections),
            "cash": money(cash),
        })
    return rows


def _rec(rec_id: str, title: str, message: str, impact: float | None) -> dict[str, Any]:
    return {"id": rec_id, "title": title, "message": message, "impact_per_month": money(impact)}


def _recommendations(
    i: PlanInputs,
    *,
    total_miles: float,
    revenue: float,
    fuel: float,
    margin_pct: float,
    factoring_fee: float,
    working_capital_need: float,
) -> list[dict[str, Any]]:
    recs: list[dict[str, Any]] = []

    if margin_pct < 8:
        impact = total_miles * 0.05
        recs.append(_rec(
            "thin_margin",
            "Margin is thin",
            f"Margin is thin. Every 5 cents per mile on rate adds {_fmt_money(impact)} per month.",
            impact,
        ))

    if i.deadhead_pct > 0.20:
        impact = (i.deadhead_pct - 0.15) * total_miles * i.rate_per_loaded_mile
        recs.append(_rec(
            "deadhead",
            "Empty miles are high",
            f"Empty miles are above 20%. Cutting to 15% is worth {_fmt_money(impact)} per month.",
            impact,
        ))

    if not i.factoring_enabled and i.starting_cash < working_capital_need:
        recs.append(_rec(
            "cash_gap",
            "Cash does not cover the payment gap",
            "Cash on hand does not cover the payment gap. Quick-pay on the slowest customers closes it.",
            None,
        ))

    if i.factoring_enabled and margin_pct > 15 and i.starting_cash > working_capital_need * 2:
        recs.append(_rec(
            "drop_factoring",
            "You can stop factoring",
            f"You can afford to stop factoring. That saves {_fmt_money(factoring_fee)} per month.",
            factoring_fee,
        ))

    if revenue > 0 and fuel / revenue > 0.30:
        recs.append(_rec(
            "fuel",
            "Fuel is over 30% of revenue",
            "Fuel is over 30% of revenue. A fuel card with network discounts typically saves 8 to 12 percent.",
            None,
        ))

    if not recs:
        recs.append(_rec(
            "healthy",
            "Fundamentals are healthy",
            "Fundamentals are healthy. Autopilot will focus on days-to-cash and compliance.",
            None,
        ))
    return recs
