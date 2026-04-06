# Document Processing Pipeline Runbook

## Overview
The document pipeline processes uploaded files through five stages: upload, classify, extract, validate, and link. Each stage is orchestrated as a Temporal workflow activity.

## Pipeline Stages

### 1. Upload
- Documents arrive via driver portal upload, email ingestion, or API
- Files are stored in MinIO with a unique key
- A `document` record is created in PostgreSQL with status `uploaded`
- The Temporal `DocumentPipelineWorkflow` is started

### 2. Classify
- The document is sent to the classification service
- Supported types: `pod`, `invoice`, `remittance_advice`, `compliance_certificate`, `cmr`, `delivery_note`, `other`
- If confidence is below the threshold (default 0.85), the document is routed to the human review queue
- Status updates to `classified` or `pending_review`

### 3. Extract
- Based on the document type, the appropriate extraction template is applied
- OCR is performed if the document is an image or scanned PDF
- Structured data is extracted into the `document_data` JSON column
- Status updates to `extracted`

### 4. Validate
- Business rules are applied based on document type
- Example validations:
  - POD: job reference exists, delivery date is plausible, signature present
  - Invoice: amounts match expected values, supplier is known, no duplicates
  - Compliance: certificate number is valid, expiry date is in the future
- Failures generate exception records linked to the document
- Status updates to `validated` or `has_exceptions`

### 5. Link
- The document is associated with its parent entities (job, invoice, vehicle, driver)
- Linking uses extracted reference numbers matched against existing records
- Status updates to `linked` (terminal success state)

## Monitoring

### Key Metrics
- Documents processed per hour (by stage)
- Average time per stage
- Classification confidence distribution
- Exception rate by document type
- Human review queue depth

### Temporal Dashboard
Access the Temporal UI at http://localhost:8080 to:
- View running and completed workflows
- Inspect workflow history and activity results
- Retry failed activities
- Terminate stuck workflows

### Database Queries
```sql
-- Documents stuck in a stage for more than 1 hour
SELECT id, status, created_at FROM documents
WHERE status NOT IN ('linked', 'rejected')
AND updated_at < NOW() - INTERVAL '1 hour';

-- Exception counts by type
SELECT exception_type, COUNT(*) FROM document_exceptions
WHERE resolved_at IS NULL
GROUP BY exception_type;
```

## Troubleshooting

### Document stuck in "uploaded" status
1. Check the Temporal workflow for the document ID
2. Verify the classification service is healthy: `curl http://localhost:8000/health`
3. Check for errors in the API gateway logs: `docker logs api-gateway`
4. If the workflow is missing, re-trigger: `POST /api/documents/{id}/reprocess`

### High exception rate
1. Check the exception breakdown in the dashboard
2. Review recent extraction accuracy for the affected document type
3. Verify that reference data (jobs, suppliers) is up to date
4. Consider adjusting validation thresholds if rules are too strict

### Classification confidence is low
1. Review the documents in the human review queue
2. Check if a new document format has been introduced
3. Review the classification model's recent accuracy metrics
4. Consider retraining or adding new training samples

## Manual Operations

### Reprocess a document
```bash
curl -X POST http://localhost:8000/api/documents/{document_id}/reprocess \
  -H "Authorization: Bearer $TOKEN"
```

### Bulk reprocess documents with exceptions
```bash
curl -X POST http://localhost:8000/api/documents/bulk-reprocess \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "has_exceptions", "document_type": "invoice"}'
```

### Skip a pipeline stage (admin only)
```bash
curl -X POST http://localhost:8000/api/documents/{document_id}/advance \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"target_status": "validated", "reason": "Manual verification completed"}'
```
