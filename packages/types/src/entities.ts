// ─── Enums ───────────────────────────────────────────────────────────────────

export type UserRole =
  | 'admin'
  | 'backoffice'
  | 'billing'
  | 'compliance'
  | 'safety'
  | 'auditor'
  | 'driver_readonly';

export type CustomerType = 'shipper' | 'broker';

export type LoadStatus =
  | 'created'
  | 'docs_pending'
  | 'docs_received'
  | 'validation_failed'
  | 'ready_to_invoice'
  | 'invoiced'
  | 'closed';

export type DocumentType =
  | 'BOL'
  | 'POD'
  | 'RateConf'
  | 'Lumper'
  | 'ScaleTicket'
  | 'DetentionForm'
  | 'RepairReceipt'
  | 'FuelReceipt'
  | 'InsuranceCert'
  | 'CDL'
  | 'MedCard'
  | 'AnnualInspection'
  | 'DVIR'
  | 'Other';

export type ValidationStatus = 'pending' | 'valid' | 'invalid' | 'needs_review';

export type DocRequestStatus =
  | 'pending'
  | 'partially_fulfilled'
  | 'fulfilled'
  | 'overdue'
  | 'cancelled';

export type ComplianceSubjectType = 'driver' | 'truck' | 'trailer' | 'carrier';

export type ComplianceStatus =
  | 'active'
  | 'expiring_soon'
  | 'expired'
  | 'revoked'
  | 'pending_review';

export type ComplianceSeverity = 'critical' | 'high' | 'medium' | 'low';

export type PacketStatus =
  | 'incomplete'
  | 'ready_for_review'
  | 'approved'
  | 'exported'
  | 'rejected';

export type InvoiceStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'exported'
  | 'voided';

export type SettlementStatus =
  | 'draft'
  | 'review'
  | 'approved'
  | 'paid'
  | 'disputed';

export type TaskQueue =
  | 'billing'
  | 'compliance'
  | 'docs'
  | 'audit'
  | 'general';

export type TaskPriority = 'urgent' | 'high' | 'medium' | 'low';

export type TaskStatus = 'open' | 'in_progress' | 'completed' | 'cancelled';

export type ExceptionType =
  | 'missing_pod'
  | 'missing_rateconf'
  | 'invalid_pod'
  | 'mismatch_amount'
  | 'compliance_expired'
  | 'doc_unreadable'
  | 'missing_bol'
  | 'other';

export type ExceptionSeverity = 'critical' | 'high' | 'medium' | 'low';

export type ExceptionStatus = 'open' | 'investigating' | 'resolved' | 'dismissed';

export type TriggerType = 'event' | 'schedule';

export type AutomationRunStatus = 'success' | 'partial' | 'failed' | 'skipped';

export type ActorType = 'user' | 'system' | 'automation' | 'copilot';

export type MessageRole = 'user' | 'assistant' | 'system' | 'tool';

// ─── Base Entity ─────────────────────────────────────────────────────────────

export interface BaseEntity {
  id: string;
  org_id: string;
  created_at: string;
  updated_at: string;
}

// ─── Entity Interfaces ──────────────────────────────────────────────────────

export interface Organization extends BaseEntity {
  name: string;
  mc_number: string;
  dot_number: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  zip: string;
  phone: string;
  email: string;
  logo_url: string | null;
  settings: Record<string, unknown>;
  is_active: boolean;
}

export interface User extends BaseEntity {
  email: string;
  name: string;
  role: UserRole;
  avatar_url: string | null;
  is_active: boolean;
  last_login_at: string | null;
  preferences: Record<string, unknown>;
}

export interface Customer extends BaseEntity {
  name: string;
  type: CustomerType;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  billing_email: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  payment_terms_days: number;
  notes: string | null;
  is_active: boolean;
}

export interface CarrierProfile extends BaseEntity {
  mc_number: string;
  dot_number: string;
  ein: string | null;
  insurance_policy_number: string | null;
  insurance_expiry: string | null;
  authority_status: string;
  safety_rating: string | null;
  num_trucks: number;
  num_drivers: number;
  primary_contact_name: string | null;
  primary_contact_email: string | null;
  primary_contact_phone: string | null;
}

export interface LoadRecord extends BaseEntity {
  load_number: string;
  customer_id: string;
  driver_id: string | null;
  truck_id: string | null;
  trailer_id: string | null;
  status: LoadStatus;
  origin_city: string;
  origin_state: string;
  origin_zip: string;
  destination_city: string;
  destination_state: string;
  destination_zip: string;
  pickup_date: string;
  delivery_date: string | null;
  actual_pickup_date: string | null;
  actual_delivery_date: string | null;
  rate_amount: number;
  currency: string;
  weight_lbs: number | null;
  commodity: string | null;
  reference_numbers: Record<string, string>;
  special_instructions: string | null;
  accessorials: AccessorialCharge[];
}

export interface AccessorialCharge {
  type: string;
  description: string;
  amount: number;
}

export interface Document extends BaseEntity {
  load_id: string | null;
  doc_type: DocumentType;
  original_filename: string;
  storage_key: string;
  mime_type: string;
  file_size_bytes: number;
  uploaded_by: string;
  classification_confidence: number | null;
  validation_status: ValidationStatus;
  validation_errors: string[];
  extracted_data: Record<string, unknown>;
  page_count: number | null;
  thumbnail_url: string | null;
}

export interface DocumentRequest extends BaseEntity {
  load_id: string;
  doc_type: DocumentType;
  status: DocRequestStatus;
  requested_by: string;
  assigned_to: string | null;
  due_date: string | null;
  fulfilled_doc_id: string | null;
  notes: string | null;
  reminder_count: number;
  last_reminder_at: string | null;
}

export interface ComplianceArtifact extends BaseEntity {
  subject_type: ComplianceSubjectType;
  subject_id: string;
  artifact_type: string;
  status: ComplianceStatus;
  severity: ComplianceSeverity;
  effective_date: string;
  expiry_date: string | null;
  document_id: string | null;
  metadata: Record<string, unknown>;
  reviewed_by: string | null;
  reviewed_at: string | null;
  notes: string | null;
}

export interface ComplianceRule extends BaseEntity {
  name: string;
  description: string;
  subject_type: ComplianceSubjectType;
  artifact_type: string;
  severity: ComplianceSeverity;
  is_mandatory: boolean;
  renewal_days_before_expiry: number;
  auto_create_task: boolean;
  is_active: boolean;
}

export interface InvoicePacket extends BaseEntity {
  load_id: string;
  status: PacketStatus;
  document_ids: string[];
  missing_documents: DocumentType[];
  validation_errors: string[];
  reviewed_by: string | null;
  reviewed_at: string | null;
  notes: string | null;
}

export interface InvoiceDraft extends BaseEntity {
  packet_id: string;
  invoice_number: string;
  customer_id: string;
  load_id: string;
  status: InvoiceStatus;
  line_items: InvoiceLineItem[];
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  currency: string;
  due_date: string;
  approved_by: string | null;
  approved_at: string | null;
  exported_at: string | null;
  export_reference: string | null;
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
  type: string;
}

export interface SettlementPacket extends BaseEntity {
  period_start: string;
  period_end: string;
  driver_id: string | null;
  status: SettlementStatus;
  load_ids: string[];
  gross_amount: number;
  deductions: SettlementDeduction[];
  net_amount: number;
  currency: string;
  approved_by: string | null;
  approved_at: string | null;
  paid_at: string | null;
  notes: string | null;
}

export interface SettlementDeduction {
  type: string;
  description: string;
  amount: number;
}

export interface Task extends BaseEntity {
  queue: TaskQueue;
  priority: TaskPriority;
  status: TaskStatus;
  title: string;
  description: string | null;
  assigned_to: string | null;
  due_date: string | null;
  related_entity_type: string | null;
  related_entity_id: string | null;
  completed_at: string | null;
  completed_by: string | null;
  tags: string[];
}

export interface Exception extends BaseEntity {
  load_id: string | null;
  exception_type: ExceptionType;
  severity: ExceptionSeverity;
  status: ExceptionStatus;
  title: string;
  description: string;
  related_entity_type: string | null;
  related_entity_id: string | null;
  detected_by: ActorType;
  resolved_by: string | null;
  resolved_at: string | null;
  resolution_notes: string | null;
  auto_created_task_id: string | null;
}

export interface AutomationRule extends BaseEntity {
  name: string;
  description: string;
  trigger_type: TriggerType;
  trigger_config: Record<string, unknown>;
  conditions: Record<string, unknown>[];
  actions: Record<string, unknown>[];
  is_enabled: boolean;
  last_run_at: string | null;
  run_count: number;
  error_count: number;
}

export interface AutomationRun extends BaseEntity {
  rule_id: string;
  status: AutomationRunStatus;
  trigger_event: Record<string, unknown>;
  actions_executed: Record<string, unknown>[];
  error_message: string | null;
  duration_ms: number;
}

export interface AuditLog extends BaseEntity {
  actor_type: ActorType;
  actor_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  changes: Record<string, { old: unknown; new: unknown }>;
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<string, unknown>;
}

export interface CopilotConversation extends BaseEntity {
  user_id: string;
  title: string | null;
  context: Record<string, unknown>;
  is_active: boolean;
}

export interface CopilotMessage extends BaseEntity {
  conversation_id: string;
  role: MessageRole;
  content: string;
  tool_calls: Record<string, unknown>[] | null;
  tool_results: Record<string, unknown>[] | null;
  tokens_used: number | null;
  latency_ms: number | null;
}
