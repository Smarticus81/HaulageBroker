# ADR-004: Role-Based Access Control Model

## Status
Accepted

## Context
The CarrierBackOffice platform serves multiple user types with different responsibilities and data access needs. We need a clear, enforceable authorization model that supports audit requirements in the regulated haulage and logistics industry.

## Decision
Implement role-based access control (RBAC) with seven predefined roles, JWT-based authentication, middleware-level enforcement, and comprehensive audit logging.

## Rationale
- **Role-based with 7 roles**: The platform defines the following roles, each mapping to a distinct set of permissions:
  1. `admin` - Full system access, user management, configuration
  2. `billing` - Invoice processing, payment tracking, financial reports
  3. `compliance` - Compliance document management, renewal tracking, audits
  4. `backoffice` - Day-to-day operations, document processing, job management
  5. `driver_readonly` - Read-only access to own documents and job assignments
  6. `driver_upload` - Driver role with ability to upload documents (PODs, photos)
  7. `viewer` - Read-only access for external stakeholders and auditors
- **JWT tokens with role claims**: Authentication issues JWT tokens containing the user's role as a claim. This allows stateless authorization checks without database lookups on every request
- **Middleware-level enforcement**: Authorization is enforced at the API gateway middleware layer using FastAPI dependencies, ensuring no endpoint can bypass access controls regardless of how the route handler is implemented
- **Audit logging for all state changes**: Every create, update, and delete operation is logged with the acting user, their role, timestamp, and the affected resource. This provides a complete audit trail for compliance and dispute resolution

## Consequences
- All API endpoints declare their required role(s) via dependency injection
- Role definitions and permission mappings are centralized in a single configuration
- JWT tokens have a short expiry (15 minutes) with refresh token rotation
- Audit log entries are written to a dedicated database table and are immutable
- Role changes for a user require admin action and are themselves audit-logged
