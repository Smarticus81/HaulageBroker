# Haulage

**The autonomous back office for carriers.** Paperwork, billing, compliance and
cash planning that run themselves, for trucking companies with 1 to 50 trucks.
Set up by talking for seven minutes. Then watch the ledger fill.

> Formerly CarrierBackOffice. See [docs/business-model.md](docs/business-model.md)
> for the lean model this version implements and [docs/design-system.md](docs/design-system.md)
> for the visual language.

## What it does

| Room | What happens there |
|---|---|
| **Today** | The morning list: what Autopilot did (with receipts and time saved), the few decisions that need you, cash, loads on the road, the compliance horizon. |
| **Loads** | Every haul from booked to paid, with a paperwork packet per load and a moving route ribbon for loads in transit. |
| **Inbox** | Paperwork as it arrives by email, photo, portal or the driver app. Classified, extracted, and linked to loads above a confidence bar you set. |
| **Money** | Invoices go out when packets are complete. Days-to-cash by customer, aging, quick-pay routing for slow payers, weekly settlements. |
| **Compliance** | CDLs, medical cards, inspections, IFTA, 2290, insurance on a 120-day horizon with alerts at 30, 14, 7 and 1 days. |
| **Autopilot** | The control plane: suggest / act / full autonomy, the policies that bound it, and the ledger of everything it did. |
| **Plan** | A living business plan: cost per mile, break-even, cash runway, twelve-month projection, and what-if levers, recomputed as loads close. |
| **Driver app** | A phone page with no login. Snap the POD at the dock; the invoice goes out before the truck leaves the lot. |
| **Copilot** | Ask anything about the business, by voice or text. Confirms before it acts. `⌘K` for the command bar, `⌘J` for the drawer. |

## Business model in one paragraph

Product-led and self-serve, priced per truck per month (Solo free for one truck,
Fleet $39, Autopilot $79), no seats and no per-document fees. Onboarding is a
voice-guided conversation that produces the workspace and the first business
plan. Autopilot acts within explicit policies and leaves a receipt for every
action. Full details, plan limits, the onboarding profile, the business plan
engine formulas and the policy catalogue are in `docs/business-model.md`.

## Stack

| Layer | Technology |
|---|---|
| Web | Next.js 16 (App Router, Turbopack), React 19, Tailwind CSS 4, Motion, Recharts 3, Zustand |
| Type + fonts | Geist Sans / Geist Mono, Instrument Serif; OKLCH tokens, hand-tuned light and dark |
| Voice | Web Speech API (synthesis + recognition) with a deterministic NLU in `packages/core` |
| Shared | `@haulage/core` (business plan engine, plan catalogue, NLU) · `@haulage/types` |
| API | FastAPI (Python 3.11), SQLAlchemy 2 async, PostgreSQL 16 + pgvector, Redis, Temporal, S3-compatible storage |
| Auth | JWT + RBAC |
| Monorepo | pnpm workspaces + Turborepo |

## Repository layout

```
apps/web/                    Next.js app: marketing site, /start onboarding, /app shell, /driver
  src/app/                   routes (/, /pricing, /start, /login, /driver, /app/*)
  src/components/ui/         design-system primitives
  src/components/shell/      sidebar, top bar, command palette, copilot drawer
  src/lib/data/              coherent demo fleet used when NEXT_PUBLIC_API_URL is unset
packages/core/               business plan engine, plan catalogue, spoken-answer parser (+ vitest)
packages/types/              shared TypeScript types
services/api-gateway/        FastAPI REST API (routers incl. /onboarding, /business-plan, /autopilot, /plans)
services/business-plan-svc/  Python mirror of the plan engine (+ pytest, same fixtures)
services/*-svc/              documents, OCR, compliance, billing, settlements, automations, copilot, notify
sql/migrations/              001–012 (012 = lean model: subscriptions, onboarding, plans, autopilot)
docs/                        business model, design system, ADRs 001–008, runbooks, SOP samples
infra/                       docker-compose for Postgres, Redis, MinIO, Temporal
```

The previous UI (`apps/backoffice`, `apps/driver-docs-portal`) and the old
`packages/ui` / `packages/sdk` are no longer part of the workspace and can be
deleted.

## Quick start

```bash
pnpm install
pnpm --filter @haulage/web dev          # http://localhost:3000, runs on the demo fleet
pnpm --filter @haulage/core test        # engine + NLU tests
```

With the API:

```bash
cp .env.example .env
docker compose -f infra/docker-compose.yml up -d
for f in sql/migrations/*.sql; do psql "$DATABASE_URL" -f "$f"; done
pip install -r services/requirements.txt
cd services/api-gateway && uvicorn main:app --reload --port 8000
# then set NEXT_PUBLIC_API_URL=http://localhost:8000 for the web app
python3 -m pytest services -q           # backend tests
```

Demo sign-in: any email and password on `/login`, or "Try the demo". Voice
onboarding lives at `/start` and works best in Chrome, Edge or Safari.

## Key API endpoints

- `GET /plans/` plan catalogue · `GET|PUT /plans/subscription`
- `GET|PUT /onboarding/` · `POST /onboarding/complete` → `{profile, plan}`
- `GET /business-plan/` · `GET /business-plan/history` · `POST /business-plan/recompute` · `POST /business-plan/preview`
- `GET|PUT /autopilot/policies` · `GET /autopilot/events` · `GET /autopilot/summary` · `POST /autopilot/events/{id}/resolve`
- Existing: load records, documents, compliance, billing, settlements, automations, copilot, audit logs

Swagger at `http://localhost:8000/docs` when the API is running.

## Design rules

Read `docs/design-system.md` before adding a screen. In short: warm bone by
day, deep asphalt by night, one signal accent; hairline surfaces; serif display
titles; mono labels and tabular numbers; springs, not fades; and Autopilot
speaks in receipts.

## Architecture decisions

`docs/adr/` — 001 FastAPI, 002 Temporal, 003 document pipeline, 004 RBAC,
005 copilot guardrails, 006 lean business model, 007 voice-guided onboarding,
008 business plan engine.
