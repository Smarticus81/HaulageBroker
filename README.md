# CarrierBackOffice

Production-grade, LLM-powered trucking company **back office platform** focused on paperwork, billing support, and compliance. Explicitly excludes dispatching functionality.

## What It Does

- **Document Inbox** — Upload, OCR extract, classify, and validate trucking documents (POD, BOL, Rate Confirmations, etc.)
- **Compliance Tracking** — Monitor CDL, medical cards, insurance, inspections with automated expiry alerts
- **Billing Paperwork** — Build invoice packets from load documents, approval workflows, CSV export
- **Settlement Support** — Generate settlement packets with supporting documentation
- **Automations Engine** — Rule-based triggers for missing docs, compliance expirations, billing readiness
- **LLM Copilot** — Chat assistant with RAG over SOPs + database, tool calling with confirmation guardrails
- **Audit Trail** — Immutable logs for every state change, automation run, and copilot action

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Monorepo | pnpm + Turborepo |
| Frontend | Next.js 14 (App Router) + TypeScript + Tailwind CSS + shadcn/ui |
| Backend | FastAPI (Python) |
| Database | PostgreSQL 16 + pgvector |
| Cache/Queues | Redis 7 |
| Workflows | Temporal |
| File Storage | S3-compatible (MinIO for local dev) |
| Auth | JWT + RBAC (7 roles) |
| Observability | OpenTelemetry + Sentry |

## Repository Structure

```
apps/
  backoffice/              # Main dashboard (docs, compliance, billing, automations, copilot)
  driver-docs-portal/      # Minimal driver portal for document uploads
services/
  api-gateway/             # FastAPI REST API
  docs-svc/                # Document classification + validation
  ocr-svc/                 # OCR extraction per document type
  compliance-svc/          # Compliance monitoring + expiry scanning
  billing-svc/             # Invoice packet generation + export
  settlements-svc/         # Settlement packet generation
  automations-svc/         # Rules engine + scheduled triggers
  llm-copilot-svc/         # RAG chat + tool calling
  notify-svc/              # Email/SMS notifications (stub)
  shared/                  # Shared Python utilities (DB, auth, storage, events)
packages/
  ui/                      # Shared React components (shadcn/ui style)
  types/                   # Shared TypeScript types
  sdk/                     # TypeScript API client SDK
infra/
  docker-compose.yml       # Postgres, Redis, MinIO, Temporal
sql/migrations/            # Database migrations (001-011)
docs/
  adr/                     # Architecture Decision Records
  runbooks/                # Operational runbooks
  sop-samples/             # Sample SOPs for copilot RAG
tests/
  e2e/                     # End-to-end tests
```

## Quick Start

### Prerequisites

- Node.js 20+
- pnpm 9+
- Python 3.11+
- Docker & Docker Compose

### Setup

```bash
# 1. Clone and enter the repo
git clone <repo-url> && cd HaulageBroker

# 2. Copy environment config
cp .env.example .env

# 3. Start infrastructure
docker compose -f infra/docker-compose.yml up -d

# 4. Install Node dependencies
pnpm install

# 5. Run database migrations
psql $DATABASE_URL -f sql/migrations/001_extensions.sql
psql $DATABASE_URL -f sql/migrations/002_core_tables.sql
# ... through 011_seed_data.sql
# Or run all at once:
for f in sql/migrations/*.sql; do psql $DATABASE_URL -f "$f"; done

# 6. Install Python dependencies
pip install -r services/requirements.txt

# 7. Start the API gateway
cd services/api-gateway && uvicorn main:app --reload --port 8000

# 8. Start the backoffice UI (in another terminal)
pnpm --filter @carrier/backoffice dev

# 9. Start the driver portal (in another terminal)
pnpm --filter @carrier/driver-docs-portal dev
```

### Access

| Service | URL |
|---------|-----|
| Backoffice UI | http://localhost:3000 |
| Driver Portal | http://localhost:3001 |
| API Gateway | http://localhost:8000 |
| API Docs (Swagger) | http://localhost:8000/docs |
| MinIO Console | http://localhost:9001 |
| Temporal UI | http://localhost:8080 |

### Default Users

| Email | Password | Role |
|-------|----------|------|
| admin@acme.com | password123 | admin |
| billing@acme.com | password123 | billing |
| compliance@acme.com | password123 | compliance |
| safety@acme.com | password123 | safety |
| backoffice@acme.com | password123 | backoffice |
| driver1@acme.com | password123 | driver_readonly |

## RBAC Roles

| Role | Permissions |
|------|------------|
| admin | Full access to all features |
| backoffice | Document management, load records, tasks |
| billing | Invoice packets, settlements, billing tasks |
| compliance | Compliance artifacts, rules, safety tasks |
| safety | Compliance monitoring (read-heavy) |
| auditor | Read-only access to all data + audit logs |
| driver_readonly | View own loads, upload requested documents |

## Default Automations

1. **POD Chase** — If delivery passed and no POD within 12h, create document request + reminder every 24h
2. **Rate Confirmation Required** — If load created and no RateConf in 2h, create billing task
3. **Validation Mismatch** — If extracted amount differs from load amount by >2%, raise exception
4. **Compliance Expirations** — Daily scan for items expiring in 30/14/7 days, notify + create tasks
5. **Invoice Packet Readiness** — When all required docs present and valid, mark packet ready
6. **Weekly Settlement** — Generate settlement packets with missing docs list

## Document Pipeline

```
Upload → Classify → OCR/Extract → Validate → Link → Ready
                                      ↓
                              Exception → Task → Notify
```

## Testing

```bash
# Unit tests
pytest services/ -v

# E2E tests (requires running services)
pytest tests/e2e/ -v -m e2e
```

## API Endpoints

See full OpenAPI docs at http://localhost:8000/docs when the API is running.

Key endpoints:
- `POST /load-records` — Create load record
- `POST /documents/upload` — Upload document (multipart)
- `POST /documents/{id}/classify` — Classify document type
- `POST /documents/{id}/extract` — Extract fields via OCR
- `POST /documents/{id}/validate` — Validate against load
- `GET /compliance/expiring` — Get expiring compliance items
- `POST /invoice-packets/generate` — Generate invoice packet
- `POST /invoice-packets/{id}/approve` — Approve invoice packet
- `POST /copilot/chat` — Chat with LLM copilot
- `GET /audit-logs` — Query audit trail

## Architecture Decisions

See [docs/adr/](docs/adr/) for Architecture Decision Records.
