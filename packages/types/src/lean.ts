// ─── Lean business model: plans, onboarding, business plan, autopilot ────────

export type PlanTier = 'solo' | 'fleet' | 'autopilot';

export interface PlanCatalogEntry {
  id: PlanTier;
  name: string;
  price_per_truck_month: number;
  included: string[];
  autopilot_scope: 'suggest' | 'act' | 'full';
  limits: { trucks: number | null; loads_per_month: number | null };
}

export interface Subscription {
  id: string;
  org_id: string;
  plan: PlanTier;
  truck_count: number;
  status: 'trialing' | 'active' | 'past_due' | 'cancelled';
  monthly_price: number;
  trial_ends_at: string | null;
  current_period_end: string | null;
}

export type BusinessStage = 'starting' | 'operating';
export type DocChannel = 'email' | 'photo' | 'portal' | 'paper' | 'eld';

export interface OnboardingProfile {
  company_name: string;
  dot_number: string;
  mc_number: string;
  stage: BusinessStage;
  trucks: number;
  trailers: number;
  drivers: number;
  miles_per_truck_per_week: number;
  deadhead_pct: number;
  rate_per_loaded_mile: number;
  fuel_mpg: number;
  fuel_price: number;
  driver_pay_per_mile: number;
  insurance_per_truck_month: number;
  truck_payment_per_month: number;
  trailer_payment_per_month: number;
  maintenance_per_mile: number;
  tires_per_mile: number;
  tolls_permits_per_truck_month: number;
  overhead_per_month: number;
  payment_terms_days: number;
  factoring_enabled: boolean;
  factoring_rate_pct: number;
  factoring_advance_pct: number;
  starting_cash: number;
  doc_channels: DocChannel[];
  voice_used: boolean;
  completed_at: string | null;
}

export interface PlanResults {
  total_miles: number;
  loaded_miles: number;
  revenue: number;
  fuel: number;
  driver_pay: number;
  maintenance: number;
  variable: number;
  fixed: number;
  factoring_fee: number;
  total_cost: number;
  profit: number;
  margin_pct: number;
  operating_ratio: number;
  revenue_per_mile: number;
  cost_per_mile: number;
  contribution_per_mile: number;
  break_even_miles: number | null;
  working_capital_need: number;
  cash_gap_days: number;
  runway_months: number;
}

export interface ProjectionMonth {
  month: number;
  utilization: number;
  revenue: number;
  costs: number;
  profit: number;
  collections: number;
  cash: number;
}

export type RecommendationId =
  | 'thin_margin'
  | 'deadhead'
  | 'cash_gap'
  | 'drop_factoring'
  | 'fuel'
  | 'healthy';

export interface Recommendation {
  id: RecommendationId;
  title: string;
  message: string;
  impact_per_month: number | null;
}

export interface BusinessPlan {
  id?: string;
  version?: number;
  generated_by: 'onboarding' | 'recompute' | 'autopilot' | 'preview';
  generated_at: string;
  inputs: OnboardingProfile;
  results: PlanResults;
  projection: ProjectionMonth[];
  recommendations: Recommendation[];
  health: number;
}

export type AutopilotMode = 'suggest' | 'act' | 'full';

export interface AutopilotPolicies {
  mode: AutopilotMode;
  auto_invoice_max_amount: number;
  pod_chase_hours: number;
  pod_chase_cadence_hours: number;
  quick_pay_min_days: number;
  compliance_alert_days: number[];
  auto_link_confidence: number;
  settlement_day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday';
  quiet_hours: string;
}

export type AutopilotOutcome = 'done' | 'needs_you' | 'skipped';

export type AutopilotEventKind =
  | 'invoice_sent'
  | 'pod_chased'
  | 'document_linked'
  | 'document_classified'
  | 'compliance_alert'
  | 'quick_pay_routed'
  | 'settlement_generated'
  | 'exception_raised'
  | 'rate_mismatch'
  | 'payment_received';

export interface AutopilotEvent {
  id: string;
  kind: AutopilotEventKind;
  summary: string;
  detail?: string;
  entity_type: 'load' | 'document' | 'invoice' | 'driver' | 'truck' | 'trailer' | 'settlement' | null;
  entity_id: string | null;
  outcome: AutopilotOutcome;
  saved_minutes: number;
  created_at: string;
}

export interface AutopilotSummary {
  mode: AutopilotMode;
  events_7d: number;
  needs_you: number;
  saved_minutes_7d: number;
  saved_minutes_30d: number;
}
