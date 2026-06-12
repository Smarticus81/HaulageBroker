# ADR-001: FastAPI as Backend Framework

## Status
Accepted

## Context
We need a backend framework for the CarrierBackOffice platform that supports async operations, strong typing, and good developer experience.

## Decision
Use FastAPI (Python) as the backend framework for all services.

## Rationale
- Native async/await support for high-concurrency document processing
- Pydantic models provide runtime validation and auto-generated OpenAPI docs
- Strong ecosystem for ML/LLM integration (langchain, openai, etc.)
- Excellent performance characteristics for I/O-bound workloads
- Built-in dependency injection for clean service architecture

## Consequences
- All backend services written in Python 3.11+
- SQLAlchemy with asyncpg for database access
- Team needs Python expertise alongside TypeScript frontend skills
