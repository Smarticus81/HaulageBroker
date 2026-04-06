# SOP: Invoice Processing Workflow

## Purpose
Define the standard process for receiving, validating, matching, and approving invoices (both inbound supplier invoices and outbound customer invoices) to ensure accurate and timely financial operations.

## Scope
Applies to:
- **Inbound invoices**: Invoices received from subcontractors, fuel suppliers, and other vendors
- **Outbound invoices**: Invoices generated for customers based on completed and POD-confirmed deliveries
- **Remittance advices**: Payment confirmations received from customers

## Roles Involved
- **Billing Clerk**: Processes invoices, resolves discrepancies, manages payment runs
- **Backoffice**: Uploads and routes incoming invoices
- **Compliance Officer**: Verifies VAT and regulatory requirements on invoices
- **Admin**: Approves high-value invoices, manages billing configuration
- **Operations Manager**: Resolves disputes related to job charges

## Process: Outbound Invoicing

### Step 1: Invoice Eligibility
1. A job becomes eligible for invoicing when:
   - Job status is "delivered"
   - A validated POD is linked to the job
   - No unresolved exceptions exist on the job or its documents
2. The billing dashboard displays all jobs eligible for invoicing

### Step 2: Invoice Generation
1. The billing clerk selects jobs for invoicing (individually or in batch)
2. The system generates invoices using the rate card associated with the customer contract
3. Invoice line items are calculated based on:
   - Base delivery rate
   - Surcharges (fuel, waiting time, weekend/bank holiday)
   - Discounts (volume, contract terms)
4. The draft invoice is presented for review

### Step 3: Invoice Review and Approval
1. The billing clerk reviews the draft invoice for accuracy
2. For invoices above the configured threshold (default: 5,000 GBP), admin approval is required
3. Once approved, the invoice status changes to "issued"
4. The invoice is sent to the customer via their preferred channel (email, EDI, portal)

### Step 4: Payment Tracking
1. The system tracks the invoice against payment terms (default: 30 days)
2. Aged debt reports are generated weekly
3. Automated reminders are sent at:
   - 7 days before due date (courtesy reminder)
   - Due date (payment due notification)
   - 7 days overdue (first overdue notice)
   - 14 days overdue (second notice, escalate to operations manager)
   - 30 days overdue (final notice, escalate to admin)

## Process: Inbound Invoice Processing

### Step 1: Invoice Receipt
1. Supplier invoices arrive via email, post (scanned), or API
2. The document enters the standard pipeline for classification and extraction
3. Extracted fields: supplier name, invoice number, date, line items, total, VAT, payment terms

### Step 2: Three-Way Match
1. The system attempts to match the invoice against:
   - **Purchase order**: Does a matching PO exist?
   - **Delivery confirmation**: Was the service/goods received?
   - **Rate agreement**: Do the charges match the agreed rates?
2. Match results:
   - **Full match**: All three elements align within tolerance (default: 2%)
   - **Partial match**: Some elements match but discrepancies exist
   - **No match**: No corresponding PO or delivery found

### Step 3: Exception Handling
1. Full matches proceed automatically to approval
2. Partial matches generate exceptions for billing clerk review:
   - **Rate discrepancy**: Charged rate differs from agreed rate
   - **Quantity discrepancy**: Invoiced quantity differs from delivered quantity
   - **Missing PO**: No purchase order found for the invoice
3. The billing clerk investigates and resolves each exception:
   - Accept the invoice as-is (with documented reason)
   - Request a credit note from the supplier
   - Create a revised PO to match

### Step 4: Approval and Payment
1. Matched and resolved invoices enter the approval queue
2. Approval thresholds:
   - Under 1,000 GBP: Billing clerk can approve
   - 1,000 - 10,000 GBP: Operations manager approval required
   - Over 10,000 GBP: Admin approval required
3. Approved invoices are scheduled for the next payment run
4. Payment runs are executed weekly (configurable)

## Process: Remittance Matching

### Step 1: Remittance Receipt
1. Remittance advices arrive via email or bank feed
2. The document pipeline extracts: payer name, payment date, amount, invoice references

### Step 2: Automatic Matching
1. The Invoice Auto-Match automation attempts to link remittances to outstanding invoices
2. Matching uses invoice reference numbers and amounts
3. Successful matches update the invoice status to "paid"

### Step 3: Unmatched Payments
1. Payments that cannot be automatically matched are flagged for review
2. The billing clerk manually identifies the corresponding invoices
3. Common reasons for failed matching:
   - Customer used a different reference number
   - Partial payment across multiple invoices
   - Payment includes deductions not previously agreed

## SLA Targets
| Metric | Target |
|--------|--------|
| Outbound invoices generated | Within 48 hours of POD validation |
| Inbound invoices processed | 90% within 24 hours of receipt |
| Three-way match rate | 80%+ automatic full match |
| Exception resolution | 95% within 3 business days |
| Remittance matching | 85%+ automatic match |
| Payment run execution | Weekly, no delays |

## Escalation Path
1. Billing Clerk (standard processing, exceptions under threshold)
2. Operations Manager (rate disputes, delivery discrepancies)
3. Admin (high-value approvals, policy exceptions)
4. Finance Director (aged debt over 60 days, write-offs)
