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
