import type {
  LoadRecord,
  LoadStatus,
  DocumentType,
  ValidationStatus,
  Document,
  ExceptionType,
  ExceptionSeverity,
  ExceptionStatus,
  Exception,
  TaskQueue,
  TaskPriority,
  TaskStatus,
  Task,
  DocRequestStatus,
  DocumentRequest,
  ComplianceStatus,
  ComplianceSubjectType,
  ComplianceSeverity,
  ComplianceArtifact,
  PacketStatus,
  InvoicePacket,
  InvoiceDraft,
  InvoiceStatus,
  SettlementStatus,
  SettlementPacket,
  AutomationRule,
  AutomationRun,
  AutomationRunStatus,
  TriggerType,
  AccessorialCharge,
  ActorType,
  CopilotConversation,
  CopilotMessage,
} from './entities';

// ─── Pagination ──────────────────────────────────────────────────────────────

export interface PaginationParams {
  page?: number;
  per_page?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    per_page: number;
    total_items: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

// ─── Load Record Filters & Mutations ─────────────────────────────────────────

export interface LoadRecordFilters extends PaginationParams {
  status?: LoadStatus | LoadStatus[];
  customer_id?: string;
  driver_id?: string;
  pickup_date_from?: string;
  pickup_date_to?: string;
  delivery_date_from?: string;
  delivery_date_to?: string;
  origin_state?: string;
  destination_state?: string;
  load_number?: string;
  search?: string;
}

export interface CreateLoadRecord {
  load_number: string;
  customer_id: string;
  driver_id?: string | null;
  truck_id?: string | null;
  trailer_id?: string | null;
  origin_city: string;
  origin_state: string;
  origin_zip: string;
  destination_city: string;
  destination_state: string;
  destination_zip: string;
  pickup_date: string;
  delivery_date?: string | null;
  rate_amount: number;
  currency?: string;
  weight_lbs?: number | null;
  commodity?: string | null;
  reference_numbers?: Record<string, string>;
  special_instructions?: string | null;
  accessorials?: AccessorialCharge[];
}

export interface UpdateLoadRecord {
  status?: LoadStatus;
  driver_id?: string | null;
  truck_id?: string | null;
  trailer_id?: string | null;
  actual_pickup_date?: string | null;
  actual_delivery_date?: string | null;
  delivery_date?: string | null;
  rate_amount?: number;
  weight_lbs?: number | null;
  commodity?: string | null;
  reference_numbers?: Record<string, string>;
  special_instructions?: string | null;
  accessorials?: AccessorialCharge[];
}

// ─── Document Types ──────────────────────────────────────────────────────────

export interface UploadDocumentRequest {
  load_id?: string | null;
  doc_type?: DocumentType;
  file: File | Blob;
  original_filename: string;
}

export interface UploadDocumentResponse {
  document: Document;
  classification?: {
    predicted_type: DocumentType;
    confidence: number;
  };
}

export interface ClassifyDocumentResponse {
  document_id: string;
  predicted_type: DocumentType;
  confidence: number;
  alternatives: Array<{ type: DocumentType; confidence: number }>;
}

export interface ExtractDocumentResponse {
  document_id: string;
  extracted_data: Record<string, unknown>;
  confidence: number;
  fields_extracted: string[];
}

export interface ValidateDocumentResponse {
  document_id: string;
  validation_status: ValidationStatus;
  errors: string[];
  warnings: string[];
}

export interface DocumentFilters extends PaginationParams {
  load_id?: string;
  doc_type?: DocumentType | DocumentType[];
  validation_status?: ValidationStatus | ValidationStatus[];
  uploaded_by?: string;
  uploaded_from?: string;
  uploaded_to?: string;
  search?: string;
}

// ─── Exception Filters ───────────────────────────────────────────────────────

export interface ExceptionFilters extends PaginationParams {
  load_id?: string;
  exception_type?: ExceptionType | ExceptionType[];
  severity?: ExceptionSeverity | ExceptionSeverity[];
  status?: ExceptionStatus | ExceptionStatus[];
  detected_by?: ActorType;
  search?: string;
}

export interface ResolveExceptionRequest {
  resolution_notes: string;
}

// ─── Task Filters & Mutations ────────────────────────────────────────────────

export interface TaskFilters extends PaginationParams {
  queue?: TaskQueue | TaskQueue[];
  priority?: TaskPriority | TaskPriority[];
  status?: TaskStatus | TaskStatus[];
  assigned_to?: string;
  due_date_from?: string;
  due_date_to?: string;
  related_entity_type?: string;
  related_entity_id?: string;
  tags?: string[];
  search?: string;
}

export interface CreateTask {
  queue: TaskQueue;
  priority: TaskPriority;
  title: string;
  description?: string | null;
  assigned_to?: string | null;
  due_date?: string | null;
  related_entity_type?: string | null;
  related_entity_id?: string | null;
  tags?: string[];
}

export interface UpdateTask {
  priority?: TaskPriority;
  status?: TaskStatus;
  title?: string;
  description?: string | null;
  assigned_to?: string | null;
  due_date?: string | null;
  tags?: string[];
}

// ─── Document Request Filters & Mutations ────────────────────────────────────

export interface DocumentRequestFilters extends PaginationParams {
  load_id?: string;
  doc_type?: DocumentType | DocumentType[];
  status?: DocRequestStatus | DocRequestStatus[];
  assigned_to?: string;
  overdue?: boolean;
  search?: string;
}

export interface CreateDocumentRequest {
  load_id: string;
  doc_type: DocumentType;
  assigned_to?: string | null;
  due_date?: string | null;
  notes?: string | null;
}

// ─── Compliance Filters ──────────────────────────────────────────────────────

export interface ComplianceArtifactFilters extends PaginationParams {
  subject_type?: ComplianceSubjectType | ComplianceSubjectType[];
  subject_id?: string;
  artifact_type?: string;
  status?: ComplianceStatus | ComplianceStatus[];
  severity?: ComplianceSeverity | ComplianceSeverity[];
  expiring_within_days?: number;
  search?: string;
}

export interface ExpiringComplianceResponse {
  artifacts: ComplianceArtifact[];
  summary: {
    expired: number;
    expiring_within_7_days: number;
    expiring_within_30_days: number;
    expiring_within_60_days: number;
    expiring_within_90_days: number;
  };
}

// ─── Invoice Packet Filters & Mutations ──────────────────────────────────────

export interface InvoicePacketFilters extends PaginationParams {
  load_id?: string;
  status?: PacketStatus | PacketStatus[];
  customer_id?: string;
  created_from?: string;
  created_to?: string;
  search?: string;
}

export interface GenerateInvoicePacketRequest {
  load_id: string;
}

export interface GenerateInvoicePacketResponse {
  packet: InvoicePacket;
  draft: InvoiceDraft;
  warnings: string[];
}

export interface ApproveInvoicePacketResponse {
  packet: InvoicePacket;
  draft: InvoiceDraft;
}

// ─── Settlement Filters & Mutations ──────────────────────────────────────────

export interface SettlementFilters extends PaginationParams {
  driver_id?: string;
  status?: SettlementStatus | SettlementStatus[];
  period_from?: string;
  period_to?: string;
  search?: string;
}

export interface GenerateSettlementRequest {
  driver_id?: string | null;
  period_start: string;
  period_end: string;
  load_ids?: string[];
}

export interface GenerateSettlementResponse {
  settlement: SettlementPacket;
  warnings: string[];
}

// ─── Automation Filters & Mutations ──────────────────────────────────────────

export interface AutomationRunFilters extends PaginationParams {
  rule_id?: string;
  status?: AutomationRunStatus | AutomationRunStatus[];
  from_date?: string;
  to_date?: string;
}

export interface CreateAutomationRule {
  name: string;
  description: string;
  trigger_type: TriggerType;
  trigger_config: Record<string, unknown>;
  conditions: Record<string, unknown>[];
  actions: Record<string, unknown>[];
  is_enabled?: boolean;
}

// ─── Copilot Types ───────────────────────────────────────────────────────────

export interface CopilotChatRequest {
  conversation_id?: string;
  message: string;
  context?: Record<string, unknown>;
}

export interface CopilotAction {
  id: string;
  type: string;
  description: string;
  params: Record<string, unknown>;
  requires_confirmation: boolean;
}

export interface CopilotChatResponse {
  conversation_id: string;
  message: CopilotMessage;
  actions?: CopilotAction[];
  suggestions?: string[];
}

export interface ConfirmActionRequest {
  action_id: string;
  confirmed: boolean;
}

export interface ConfirmActionResponse {
  action_id: string;
  result: Record<string, unknown>;
  message: string;
}

// ─── Generic API Response ────────────────────────────────────────────────────

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ApiResponse<T> {
  data: T;
  meta?: Record<string, unknown>;
}
