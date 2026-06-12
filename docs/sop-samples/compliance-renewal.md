# SOP: Compliance Document Renewal

## Purpose
Define the standard process for tracking, renewing, and verifying compliance documents for drivers, vehicles, and the operating company to ensure continuous regulatory compliance.

## Scope
Applies to all compliance-critical documents including but not limited to:
- Driver licenses (Category C, C+E)
- Driver CPC (Certificate of Professional Competence)
- Digital tachograph cards
- Vehicle MOT certificates
- Vehicle tax
- Operator license
- Goods in transit insurance
- Public and employer liability insurance

## Roles Involved
- **Compliance Officer**: Monitors expiry dates, initiates renewals, verifies updated documents
- **Driver**: Submits renewal documents, completes required training
- **Admin**: Manages system configuration, handles escalations
- **Operations Manager**: Receives alerts for compliance risks affecting operations

## Process

### Step 1: Expiry Monitoring
1. The system maintains a compliance register of all tracked documents with their expiry dates
2. The Compliance Renewal Reminder automation runs daily at 08:00
3. Notifications are sent at the following intervals before expiry:
   - **60 days**: Informational reminder to the compliance officer
   - **30 days**: Reminder to the compliance officer and the affected driver/department
   - **14 days**: High-priority task created for the compliance officer
   - **7 days**: Alert to admin and operations manager
   - **Expired**: Immediate alert to all stakeholders; driver/vehicle flagged as non-compliant

### Step 2: Renewal Initiation
1. The compliance officer reviews upcoming renewals in the compliance dashboard
2. For each document approaching expiry:
   - Contacts the relevant party (driver, insurer, DVSA) to initiate renewal
   - Creates a renewal task with the expected completion date
   - Updates the compliance register with the renewal status

### Step 3: Document Collection
1. The renewed document is uploaded via:
   - Driver Portal (for driver-held documents)
   - Email ingestion (for insurer/authority correspondence)
   - Manual upload by the compliance officer
2. The document enters the standard document pipeline for processing
3. The system validates:
   - Document type matches the expected renewal
   - New expiry date is in the future
   - Document holder matches the expected entity (driver, vehicle)

### Step 4: Verification and Approval
1. The compliance officer reviews the processed document
2. Verification checks:
   - Document authenticity (visual inspection, cross-reference with issuing authority)
   - Coverage continuity (no gap between old and new expiry dates)
   - Correct entity association (right driver, right vehicle)
3. If approved, the compliance officer marks the document as verified
4. The compliance register is updated with the new expiry date
5. The previous document is archived but retained for audit purposes

### Step 5: Non-Compliance Handling
1. If a document expires without renewal:
   - The driver/vehicle is automatically flagged as non-compliant in the system
   - Non-compliant drivers cannot be assigned to new jobs
   - Non-compliant vehicles are removed from the available fleet
2. The compliance officer investigates the reason for non-renewal
3. A remediation plan is created with a target resolution date
4. Once renewed and verified, the non-compliant flag is removed

## Compliance Register Fields
| Field | Description |
|-------|-------------|
| Entity type | driver, vehicle, company |
| Entity ID | Reference to the specific driver or vehicle |
| Document type | License, CPC, MOT, insurance, etc. |
| Document reference | Certificate/policy number |
| Issue date | Date the document was issued |
| Expiry date | Date the document expires |
| Status | valid, expiring, expired, renewal_pending |
| Verified by | Compliance officer who approved |
| Verified at | Date of verification |

## SLA Targets
| Metric | Target |
|--------|--------|
| Renewal initiated before expiry | 100% at 30+ days |
| Document verified within upload | 95% within 24 hours |
| Zero compliance gaps | 100% (no day without valid documents) |
| Audit readiness | Compliance register accurate within 24 hours |

## Escalation Path
1. Compliance Officer (standard renewals)
2. Admin (system configuration, overrides)
3. Operations Manager (operational impact of non-compliance)
4. Director (regulatory risk, authority liaison)
