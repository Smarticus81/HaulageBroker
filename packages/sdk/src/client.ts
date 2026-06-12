import type {
  LoadRecord,
  Document,
  Exception,
  Task,
  DocumentRequest,
  ComplianceArtifact,
  InvoicePacket,
  InvoiceDraft,
  SettlementPacket,
  AutomationRule,
  AutomationRun,
  CopilotMessage,
  PaginatedResponse,
  LoadRecordFilters,
  CreateLoadRecord,
  UpdateLoadRecord,
  UploadDocumentResponse,
  ClassifyDocumentResponse,
  ExtractDocumentResponse,
  ValidateDocumentResponse,
  DocumentFilters,
  ExceptionFilters,
  ResolveExceptionRequest,
  TaskFilters,
  CreateTask,
  UpdateTask,
  DocumentRequestFilters,
  CreateDocumentRequest,
  ComplianceArtifactFilters,
  ExpiringComplianceResponse,
  InvoicePacketFilters,
  GenerateInvoicePacketResponse,
  ApproveInvoicePacketResponse,
  SettlementFilters,
  GenerateSettlementRequest,
  GenerateSettlementResponse,
  AutomationRunFilters,
  CreateAutomationRule,
  CopilotChatRequest,
  CopilotChatResponse,
  ConfirmActionResponse,
  ApiResponse,
} from '@carrier/types';

export interface CarrierClientConfig {
  baseUrl: string;
  token: string;
}

export class CarrierClient {
  private baseUrl: string;
  private token: string;

  constructor(config: CarrierClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.token = config.token;
  }

  // ─── Load Records ────────────────────────────────────────────────────────

  readonly loadRecords = {
    list: (filters?: LoadRecordFilters): Promise<PaginatedResponse<LoadRecord>> =>
      this._fetch('GET', '/api/loads', { params: filters }),

    get: (id: string): Promise<ApiResponse<LoadRecord>> =>
      this._fetch('GET', `/api/loads/${id}`),

    create: (data: CreateLoadRecord): Promise<ApiResponse<LoadRecord>> =>
      this._fetch('POST', '/api/loads', { body: data }),

    update: (id: string, data: UpdateLoadRecord): Promise<ApiResponse<LoadRecord>> =>
      this._fetch('PATCH', `/api/loads/${id}`, { body: data }),
  };

  // ─── Documents ───────────────────────────────────────────────────────────

  readonly documents = {
    list: (filters?: DocumentFilters): Promise<PaginatedResponse<Document>> =>
      this._fetch('GET', '/api/documents', { params: filters }),

    upload: (file: File | Blob, metadata: { load_id?: string; doc_type?: string; original_filename: string }): Promise<UploadDocumentResponse> => {
      const formData = new FormData();
      formData.append('file', file);
      if (metadata.load_id) formData.append('load_id', metadata.load_id);
      if (metadata.doc_type) formData.append('doc_type', metadata.doc_type);
      formData.append('original_filename', metadata.original_filename);
      return this._fetch('POST', '/api/documents/upload', { body: formData, isFormData: true });
    },

    classify: (id: string): Promise<ClassifyDocumentResponse> =>
      this._fetch('POST', `/api/documents/${id}/classify`),

    extract: (id: string): Promise<ExtractDocumentResponse> =>
      this._fetch('POST', `/api/documents/${id}/extract`),

    validate: (id: string): Promise<ValidateDocumentResponse> =>
      this._fetch('POST', `/api/documents/${id}/validate`),

    attachToLoad: (docId: string, loadId: string): Promise<ApiResponse<Document>> =>
      this._fetch('POST', `/api/documents/${docId}/attach`, { body: { load_id: loadId } }),
  };

  // ─── Exceptions ──────────────────────────────────────────────────────────

  readonly exceptions = {
    list: (filters?: ExceptionFilters): Promise<PaginatedResponse<Exception>> =>
      this._fetch('GET', '/api/exceptions', { params: filters }),

    resolve: (id: string, notes: string): Promise<ApiResponse<Exception>> =>
      this._fetch('POST', `/api/exceptions/${id}/resolve`, {
        body: { resolution_notes: notes } satisfies ResolveExceptionRequest,
      }),
  };

  // ─── Tasks ───────────────────────────────────────────────────────────────

  readonly tasks = {
    list: (filters?: TaskFilters): Promise<PaginatedResponse<Task>> =>
      this._fetch('GET', '/api/tasks', { params: filters }),

    create: (data: CreateTask): Promise<ApiResponse<Task>> =>
      this._fetch('POST', '/api/tasks', { body: data }),

    update: (id: string, data: UpdateTask): Promise<ApiResponse<Task>> =>
      this._fetch('PATCH', `/api/tasks/${id}`, { body: data }),

    complete: (id: string): Promise<ApiResponse<Task>> =>
      this._fetch('POST', `/api/tasks/${id}/complete`),
  };

  // ─── Document Requests ───────────────────────────────────────────────────

  readonly documentRequests = {
    list: (filters?: DocumentRequestFilters): Promise<PaginatedResponse<DocumentRequest>> =>
      this._fetch('GET', '/api/document-requests', { params: filters }),

    create: (data: CreateDocumentRequest): Promise<ApiResponse<DocumentRequest>> =>
      this._fetch('POST', '/api/document-requests', { body: data }),
  };

  // ─── Compliance ──────────────────────────────────────────────────────────

  readonly compliance = {
    getExpiring: (days: number): Promise<ExpiringComplianceResponse> =>
      this._fetch('GET', '/api/compliance/expiring', { params: { days } }),

    listArtifacts: (filters?: ComplianceArtifactFilters): Promise<PaginatedResponse<ComplianceArtifact>> =>
      this._fetch('GET', '/api/compliance/artifacts', { params: filters }),
  };

  // ─── Invoice Packets ─────────────────────────────────────────────────────

  readonly invoicePackets = {
    list: (filters?: InvoicePacketFilters): Promise<PaginatedResponse<InvoicePacket>> =>
      this._fetch('GET', '/api/invoice-packets', { params: filters }),

    generate: (loadId: string): Promise<GenerateInvoicePacketResponse> =>
      this._fetch('POST', '/api/invoice-packets/generate', { body: { load_id: loadId } }),

    approve: (id: string): Promise<ApproveInvoicePacketResponse> =>
      this._fetch('POST', `/api/invoice-packets/${id}/approve`),
  };

  // ─── Settlements ─────────────────────────────────────────────────────────

  readonly settlements = {
    list: (filters?: SettlementFilters): Promise<PaginatedResponse<SettlementPacket>> =>
      this._fetch('GET', '/api/settlements', { params: filters }),

    generate: (params: GenerateSettlementRequest): Promise<GenerateSettlementResponse> =>
      this._fetch('POST', '/api/settlements/generate', { body: params }),
  };

  // ─── Automations ─────────────────────────────────────────────────────────

  readonly automations = {
    listRules: (): Promise<PaginatedResponse<AutomationRule>> =>
      this._fetch('GET', '/api/automations/rules'),

    createRule: (data: CreateAutomationRule): Promise<ApiResponse<AutomationRule>> =>
      this._fetch('POST', '/api/automations/rules', { body: data }),

    enableRule: (id: string): Promise<ApiResponse<AutomationRule>> =>
      this._fetch('POST', `/api/automations/rules/${id}/enable`),

    disableRule: (id: string): Promise<ApiResponse<AutomationRule>> =>
      this._fetch('POST', `/api/automations/rules/${id}/disable`),

    listRuns: (filters?: AutomationRunFilters): Promise<PaginatedResponse<AutomationRun>> =>
      this._fetch('GET', '/api/automations/runs', { params: filters }),
  };

  // ─── Copilot ─────────────────────────────────────────────────────────────

  readonly copilot = {
    chat: (conversationId: string | undefined, message: string): Promise<CopilotChatResponse> =>
      this._fetch('POST', '/api/copilot/chat', {
        body: { conversation_id: conversationId, message } satisfies CopilotChatRequest,
      }),

    confirmAction: (actionId: string): Promise<ConfirmActionResponse> =>
      this._fetch('POST', `/api/copilot/actions/${actionId}/confirm`, {
        body: { action_id: actionId, confirmed: true },
      }),
  };

  // ─── Private Methods ─────────────────────────────────────────────────────

  private async _fetch<T>(
    method: string,
    path: string,
    options?: {
      params?: Record<string, unknown>;
      body?: unknown;
      isFormData?: boolean;
    }
  ): Promise<T> {
    let url = `${this.baseUrl}${path}`;

    if (options?.params) {
      const searchParams = new URLSearchParams();
      for (const [key, value] of Object.entries(options.params)) {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            for (const v of value) {
              searchParams.append(key, String(v));
            }
          } else {
            searchParams.set(key, String(value));
          }
        }
      }
      const qs = searchParams.toString();
      if (qs) {
        url += `?${qs}`;
      }
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.token}`,
    };

    let bodyPayload: string | FormData | undefined;

    if (options?.body) {
      if (options.isFormData) {
        bodyPayload = options.body as FormData;
      } else {
        headers['Content-Type'] = 'application/json';
        bodyPayload = JSON.stringify(options.body);
      }
    }

    const response = await fetch(url, {
      method,
      headers,
      body: bodyPayload,
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const error = new Error(
        errorBody.message || `API request failed: ${response.status} ${response.statusText}`
      );
      (error as any).status = response.status;
      (error as any).code = errorBody.code;
      (error as any).details = errorBody.details;
      throw error;
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json() as Promise<T>;
  }
}
