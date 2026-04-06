-- Migration 010: Copilot conversations, messages, and document embeddings
-- CarrierBackOffice platform

BEGIN;

CREATE TYPE copilot_message_role AS ENUM (
    'user',
    'assistant',
    'system',
    'tool'
);

CREATE TABLE copilot_conversations (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id      uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title       text,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_copilot_conversations_user_id ON copilot_conversations(user_id);
CREATE INDEX idx_copilot_conversations_org_id ON copilot_conversations(org_id);

CREATE TABLE copilot_messages (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id   uuid NOT NULL REFERENCES copilot_conversations(id) ON DELETE CASCADE,
    role              copilot_message_role NOT NULL,
    content           text,
    tool_calls        jsonb,
    citations         jsonb NOT NULL DEFAULT '[]',
    created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_copilot_messages_conversation_id ON copilot_messages(conversation_id);

CREATE TABLE doc_embeddings (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id        uuid NOT NULL,
    source_type   text,
    source_id     uuid,
    chunk_index   integer,
    content       text,
    embedding     vector(1536),
    metadata      jsonb NOT NULL DEFAULT '{}',
    created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_doc_embeddings_org_id ON doc_embeddings(org_id);
CREATE INDEX idx_doc_embeddings_source ON doc_embeddings(source_type, source_id);
CREATE INDEX idx_doc_embeddings_vector ON doc_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

COMMIT;
