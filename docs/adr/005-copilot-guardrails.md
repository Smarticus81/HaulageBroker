# ADR-005: LLM Copilot Safety Guardrails

## Status
Accepted

## Context
The CarrierBackOffice platform includes an LLM-powered copilot that assists backoffice users with document queries, workflow guidance, and operational tasks. Given the sensitivity of financial and compliance data in the logistics domain, we must ensure the copilot operates safely and predictably.

## Decision
Implement a layered guardrail system for the LLM copilot: read-only by default, explicit confirmation for writes, full interaction logging, RAG grounding, and strict tool-calling schemas.

## Rationale
- **Read-only by default**: The copilot can query data, summarize documents, and answer questions without any risk of modifying system state. This allows users to explore and ask questions freely without fear of accidental changes
- **Write operations require explicit user confirmation**: When the copilot determines that a write action is needed (e.g., updating a document status, creating an exception, linking a document), it presents the proposed action to the user for explicit approval before execution. No write operation is performed without user consent
- **All interactions logged**: Every copilot conversation, query, tool call, and action is logged with the user context. This enables audit review, debugging of incorrect responses, and analysis of usage patterns for improvement
- **RAG grounding to prevent hallucination**: The copilot uses Retrieval-Augmented Generation to ground responses in actual platform data (documents, SOPs, job records). Responses include source citations so users can verify the information. This significantly reduces the risk of fabricated or misleading answers
- **Tool calling with strict schemas**: The copilot interacts with platform services exclusively through predefined tool functions with strict Pydantic schemas. This prevents prompt injection from causing arbitrary API calls and ensures all copilot actions are type-safe and validated

## Consequences
- Copilot tool definitions are maintained as versioned Pydantic models
- A confirmation UI component is required in the frontend for write-action approval
- Interaction logs are stored separately from the audit log and have their own retention policy
- RAG index must be kept in sync with document and SOP changes
- Copilot responses include confidence indicators and source references
- Regular evaluation of copilot accuracy is performed using logged interactions
