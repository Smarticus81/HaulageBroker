# ADR-003: Document Pipeline Architecture

## Status
Accepted

## Context
The platform must process a high volume of logistics documents (PODs, invoices, compliance certificates, remittance advices) from diverse sources including email, driver uploads, and API integrations. Processing involves classification, data extraction, validation, and linking to operational entities such as jobs and invoices.

## Decision
Implement an event-driven document pipeline with discrete, idempotent processing stages: upload, classify, extract, validate, and link.

## Rationale
- **Event-driven architecture**: Each stage emits events that trigger the next, enabling loose coupling between processing steps and allowing independent scaling of each stage
- **Upload -> Classify -> Extract -> Validate -> Link**: This linear pipeline reflects the natural document processing flow. Classification determines the document type, extraction pulls structured data, validation checks business rules, and linking associates the document with the correct operational entities
- **Each step is idempotent and can be retried**: Idempotency ensures that retries (whether from Temporal or manual re-processing) do not create duplicate data or side effects. This is critical for reliability given the dependence on external OCR and LLM services
- **Exceptions generated at validation step**: When extracted data fails business rules (e.g., missing fields, mismatched amounts, unrecognized references), structured exceptions are created and surfaced in the backoffice UI for resolution rather than silently failing
- **Human review loop for low-confidence classifications**: When the classifier confidence score falls below a configurable threshold, the document is routed to a human review queue. The reviewer's decision feeds back into the pipeline and is used to improve future classification accuracy

## Consequences
- Each pipeline stage is implemented as a Temporal activity
- The full pipeline is orchestrated as a Temporal workflow with per-stage retry policies
- A document status model tracks the current stage and any exceptions
- Low-confidence documents appear in a review queue in the backoffice UI
- Metrics are collected per stage for monitoring throughput and error rates
