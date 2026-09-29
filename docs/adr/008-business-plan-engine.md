# ADR-008: Business Plan Engine

## Status
Accepted

## Context
Every Haulage workspace has a living business plan: monthly volume, costs, margin, cash gap, a twelve-month projection, a health score and recommendations. The plan has to update live while the owner answers onboarding questions (before the workspace exists) and again whenever real operating data changes. Two codebases need the numbers: the web app for instant feedback and the API for persistence, history and Autopilot.

## Decision
Implement the formulas in `docs/business-model.md` section 4 as a **pure, dependency-free engine** in two places that must agree to the cent: `services/business-plan-svc/engine.py` (Python, the reference) and `packages/core` (TypeScript). Both are tested against the worked example in section 4.8.

Rules of the engine:
- Inputs are a flat dataclass (`PlanInputs`) with the spec defaults; `inputs_from_profile()` applies defaults for missing/null keys, coerces database `Decimal`s and strings, and ignores non-numeric profile fields.
- Output is a dict-shaped `PlanResult` (`results`, `projection`, `recommendations`, `health`, `to_dict()`), stored verbatim as JSONB in `business_plans`.
- Money is rounded half-up to cents, ratios to four decimals, only at the output boundary; intermediates stay unrounded.
- Undefined values (zero trucks, zero revenue, non-positive contribution) become `null`, never `NaN`/`Infinity`, so every plan is JSON-safe.
- Recommendations are deterministic and ordered exactly as the spec table; `healthy` is emitted only when nothing else fires.

Persistence and versioning live in the gateway (`routers/business_plan.py`): `POST /onboarding/complete` stores version 1 (`generated_by='onboarding'`), `POST /business-plan/recompute` appends a version (`'recompute'`), Autopilot jobs will append with `'autopilot'`. `POST /business-plan/preview` is unauthenticated and stateless so the onboarding conversation can call it after every answer.

## Rationale
- A pure function is trivially unit-testable and identical on the server, in the browser and in batch jobs; there is nothing to mock.
- Keeping the spec as the single source of truth (with a numeric fixture) is what lets two implementations coexist without drift.
- Versioned snapshots make the plan a record the owner can look back on ("what did my plan say in March?") and give Autopilot a stable baseline to compare against.

## Consequences
- Any formula change is a change to `docs/business-model.md` first, then both engines, then the fixture in 4.8.
- Engine tests (`services/business-plan-svc/tests/test_engine.py`) assert every value of the worked example, the utilization ramp, collections lag with and without factoring, health clamping, recommendation ordering and zero-truck safety.
- The engine has no I/O and no SQLAlchemy dependency; the gateway imports it lazily (`business_plan_svc.engine`) like other sibling services.
- Rounding is half-up (Decimal) to match `Math.round`-style rounding on the web; Python's banker's `round()` is deliberately not used.
