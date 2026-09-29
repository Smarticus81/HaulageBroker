# ADR-006: Lean Business Model (Haulage)

## Status
Accepted

## Context
CarrierBackOffice was built as a multi-role back-office suite sold to fleets with office staff. The carriers who actually churn on paperwork are 1-10 truck operators who have no office, buy on their phone, and think in dollars per truck. They will not sit through a sales call or configure dashboards, and they hire their first office person around truck number four.

## Decision
Rebrand to **Haulage, the autonomous back office for carriers**, and adopt the lean model in `docs/business-model.md`:

- **Product-led, self-serve**: landing page to a running workspace in under ten minutes; no sales motion.
- **Per-truck pricing with three plans**: Solo ($0, 1 truck, suggest-only), Fleet ($39/truck/month, acts within policy limits), Autopilot ($79/truck/month, full autonomy within policy limits). Quick-pay routing through a factoring partner is the only add-on revenue and never marks up the carrier's rate.
- **Voice-first onboarding** collects a fixed profile (spec section 3) with defaults for every skipped answer, so a business plan can always be produced.
- **Autopilot, not dashboards**: the default posture is "the system did it, here is the receipt". Every action is bounded by an explicit policy (spec section 5) and recorded as an `autopilot_events` row with an outcome (`done`, `needs_you`, `skipped`) and a `saved_minutes` estimate.
- **Living business plan**: each workspace keeps a versioned plan recomputed from operating data (see ADR-008).

## Rationale
- One price the owner already thinks in removes the seat/document-fee negotiation that kills self-serve conversion.
- Suggest / act / full autonomy tiers let a carrier grow into automation while keeping the human in control through policies rather than approvals on every item.
- Receipts with time saved turn an invisible back office into a visible "hours given back" number, which is the retention story.
- Keeping plan tiers, policies and events as plain relational tables (migration 012) means the existing automation engine, audit log and RBAC keep working unchanged underneath.

## Consequences
- New tables: `subscriptions`, `onboarding_profiles`, `business_plans`, `autopilot_policies`, `autopilot_events` (`sql/migrations/012_lean_model.sql`).
- New gateway routes: `/plans`, `/onboarding`, `/business-plan`, `/autopilot`; the API title becomes "Haulage API".
- Autopilot mode is derived from the plan tier at onboarding (solo -> suggest, fleet -> act, autopilot -> full) and can never exceed what the plan allows; downgrades clamp the mode.
- The multi-role back-office UI is replaced by a Today page built around receipts; existing routers stay as the data layer.
- Automations continue to run through `automations_svc`; policy keys are the parameters those rules read (`pod_chase_hours`, `auto_invoice_max_amount`, ...).
- Pricing and plan limits live in one place (`routers/plans.py`) and are served by `GET /plans/` so the landing page and the app cannot drift.
