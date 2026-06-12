"""RAG pipeline - embedding, vector search, and context building."""

from __future__ import annotations

import logging
import os
from typing import Any
from uuid import UUID

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "text-embedding-3-small")
EMBEDDING_DIM = 1536


async def embed_query(query: str) -> list[float]:
    """Generate an embedding vector for a query string using OpenAI.

    Falls back to a zero vector if OpenAI is not configured.
    """
    if not OPENAI_API_KEY:
        logger.warning("OPENAI_API_KEY not set, returning zero vector")
        return [0.0] * EMBEDDING_DIM

    try:
        import openai

        client = openai.OpenAI(api_key=OPENAI_API_KEY)
        response = client.embeddings.create(input=query, model=EMBEDDING_MODEL)
        return response.data[0].embedding
    except Exception:
        logger.exception("Failed to generate embedding")
        return [0.0] * EMBEDDING_DIM


async def search_similar(
    db: AsyncSession,
    org_id: UUID,
    query_embedding: list[float],
    limit: int = 5,
) -> list[dict[str, Any]]:
    """Search for similar documents using pgvector cosine similarity.

    Args:
        db: Database session.
        org_id: Organization ID to scope the search.
        query_embedding: The query embedding vector.
        limit: Maximum number of results.

    Returns:
        List of matching document chunks with content and metadata.
    """
    embedding_str = "[" + ",".join(str(v) for v in query_embedding) + "]"

    result = await db.execute(
        text("""
            SELECT id, source_type, source_id, chunk_index, content, metadata,
                   1 - (embedding <=> :embedding::vector) AS similarity
            FROM doc_embeddings
            WHERE org_id = :org_id
            ORDER BY embedding <=> :embedding::vector
            LIMIT :limit
        """),
        {"org_id": str(org_id), "embedding": embedding_str, "limit": limit},
    )
    rows = result.mappings().all()

    return [
        {
            "id": str(row["id"]),
            "source_type": row["source_type"],
            "source_id": str(row["source_id"]) if row["source_id"] else None,
            "chunk_index": row["chunk_index"],
            "content": row["content"],
            "metadata": row["metadata"],
            "similarity": float(row["similarity"]),
        }
        for row in rows
    ]


async def build_context(
    db: AsyncSession,
    org_id: UUID,
    message: str,
) -> tuple[str, list[dict[str, Any]]]:
    """Build RAG context for the copilot from DB queries and vector search.

    Args:
        db: Database session.
        org_id: Organization ID.
        message: User's chat message.

    Returns:
        Tuple of (context_string, citations_list).
    """
    citations: list[dict[str, Any]] = []
    context_parts: list[str] = []

    # Vector search for relevant document chunks
    query_embedding = await embed_query(message)
    similar_docs = await search_similar(db, org_id, query_embedding, limit=5)

    for doc in similar_docs:
        if doc["similarity"] > 0.3:  # Relevance threshold
            context_parts.append(f"[Document: {doc['source_type']}] {doc['content']}")
            citations.append({
                "source_type": doc["source_type"],
                "source_id": doc["source_id"],
                "content_preview": doc["content"][:200] if doc["content"] else "",
            })

    # Add summary stats from DB
    try:
        stats_result = await db.execute(
            text("""
                SELECT
                    (SELECT count(*) FROM load_records WHERE org_id = :org_id) AS total_loads,
                    (SELECT count(*) FROM load_records WHERE org_id = :org_id AND status = 'docs_pending') AS pending_loads,
                    (SELECT count(*) FROM exceptions WHERE org_id = :org_id AND status = 'open') AS open_exceptions,
                    (SELECT count(*) FROM tasks WHERE org_id = :org_id AND status = 'open') AS open_tasks
            """),
            {"org_id": str(org_id)},
        )
        stats = stats_result.mappings().first()
        if stats:
            context_parts.append(
                f"[Org Stats] Total loads: {stats['total_loads']}, "
                f"Docs pending: {stats['pending_loads']}, "
                f"Open exceptions: {stats['open_exceptions']}, "
                f"Open tasks: {stats['open_tasks']}"
            )
    except Exception:
        logger.exception("Failed to fetch org stats for RAG context")

    context = "\n\n".join(context_parts) if context_parts else "No relevant context found."
    return context, citations
