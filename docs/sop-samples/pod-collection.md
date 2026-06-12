# SOP: Proof of Delivery (POD) Collection

## Purpose
Define the standard process for collecting, processing, and storing Proof of Delivery documents to ensure timely invoicing and compliance with customer requirements.

## Scope
Applies to all deliveries performed by company drivers and subcontractors.

## Roles Involved
- **Driver**: Captures and uploads POD at point of delivery
- **Backoffice**: Reviews and processes PODs, resolves exceptions
- **Billing**: Uses validated PODs to trigger invoice generation
- **Operations Manager**: Handles escalations for missing or disputed PODs

## Process

### Step 1: POD Capture at Delivery
1. Driver arrives at the delivery location and completes the delivery
2. Driver obtains the recipient's signature on the POD (paper or electronic)
3. Driver photographs the signed POD using the Driver Portal app
4. Driver uploads the POD photo through the app, selecting the associated job reference
5. If the recipient refuses to sign, the driver notes the reason and photographs any relevant evidence (e.g., damaged goods, incorrect delivery address)

### Step 2: Automated Processing
1. The uploaded POD enters the document pipeline (see ADR-003)
2. The system classifies the document as a POD
3. OCR extracts: job reference, delivery date, recipient name, signature presence
4. Validation checks:
   - Job reference matches an existing delivered job
   - Delivery date falls within the expected window
   - Signature is detected in the image
5. If validation passes, the POD is linked to the job

### Step 3: Exception Handling
1. If any validation check fails, an exception is created
2. The backoffice team reviews the exception in the dashboard
3. Common exceptions and resolutions:
   - **No matching job reference**: Manually search for the job and link the POD
   - **Signature not detected**: Verify the image quality; request a re-upload if unreadable
   - **Duplicate POD**: Compare with the existing POD and archive the duplicate
4. The backoffice user resolves the exception and advances the POD to linked status

### Step 4: POD Chase for Missing Documents
1. The POD Chase automation (see Automations runbook) triggers 48 hours after delivery if no POD is linked
2. The driver receives an automated reminder via the app and email
3. If not received after 72 hours, a task is created for the operations manager
4. The operations manager contacts the driver directly to resolve
5. If the POD cannot be obtained, the operations manager records the reason and escalates to the customer if needed

### Step 5: Invoicing
1. Once a POD is linked and validated, the job becomes eligible for invoicing
2. The billing team can generate invoices for all jobs with validated PODs
3. The POD document is attached to or referenced in the invoice for customer verification

## SLA Targets
| Metric | Target |
|--------|--------|
| POD upload within delivery | 95% within 2 hours |
| POD processing (upload to linked) | 90% within 1 hour |
| Missing POD resolution | 95% within 5 business days |
| Exception resolution | 90% within 24 hours |

## Escalation Path
1. Driver (initial upload)
2. Backoffice team (exception resolution)
3. Operations Manager (missing POD chase, 72+ hours)
4. Account Manager (customer disputes)
