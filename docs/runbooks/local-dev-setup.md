# Local Development Setup

## Prerequisites
- Node.js 20+
- pnpm 9+
- Python 3.11+
- Docker & Docker Compose

## Quick Start
1. Clone the repo
2. Copy `.env.example` to `.env`
3. Start infrastructure: `docker compose -f infra/docker-compose.yml up -d`
4. Run migrations: `pnpm db:migrate`
5. Seed database: `pnpm db:seed`
6. Install dependencies: `pnpm install`
7. Start API: `cd services/api-gateway && uvicorn main:app --reload --port 8000`
8. Start frontend: `pnpm --filter @carrier/backoffice dev`
9. Access at http://localhost:3000

## Default Users
| Email | Password | Role |
|-------|----------|------|
| admin@acme.com | password123 | admin |
| billing@acme.com | password123 | billing |
| compliance@acme.com | password123 | compliance |
| backoffice@acme.com | password123 | backoffice |
| driver1@acme.com | password123 | driver_readonly |

## Services
| Service | Port | Description |
|---------|------|-------------|
| Backoffice UI | 3000 | Main dashboard |
| Driver Portal | 3001 | Driver document upload |
| API Gateway | 8000 | FastAPI backend |
| PostgreSQL | 5432 | Database |
| Redis | 6379 | Cache/queues |
| MinIO | 9000/9001 | Object storage |
| Temporal | 7233 | Workflow engine |
| Temporal UI | 8080 | Temporal dashboard |

## Database Migrations
`pnpm db:migrate` (or `for f in sql/migrations/*.sql; do psql $DATABASE_URL -f "$f"; done`) applies the files in `sql/migrations/` in order. Each file is one transaction.

| File | Contents |
|------|----------|
| 001_extensions.sql | pgcrypto, uuid, vector extensions |
| 002_core_tables.sql | organizations, users, customers, carrier profiles |
| 003_load_records.sql | load records |
| 004_documents.sql | documents, document requests |
| 005_compliance.sql | compliance artifacts and rules |
| 006_billing.sql | invoice packets, invoice drafts, settlement packets |
| 007_tasks_exceptions.sql | tasks, exceptions |
| 008_automations.sql | automation rules and runs |
| 009_audit_log.sql | append-only audit log |
| 010_copilot.sql | copilot conversations and messages |
| 011_seed_data.sql | demo org (Acme Trucking LLC), users, loads, documents |
| 012_lean_model.sql | plans/subscriptions, onboarding profiles, business plans, autopilot policies and events, plus demo seed (Fleet plan, worked-example profile and plan, a week of Autopilot receipts) |

## Python Unit Tests
`python3 -m pytest services -q` runs the service unit tests without a database. The root `conftest.py` maps the hyphenated service directories to importable packages (`business_plan_svc`, `automations_svc`, ...).
