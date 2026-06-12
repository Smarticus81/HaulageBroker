-- Migration 001: Enable required PostgreSQL extensions
-- CarrierBackOffice platform

BEGIN;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";  -- pgvector for document embeddings

COMMIT;
