/**
 * Haulage Business Plan engine.
 *
 * Pure, deterministic implementation of docs/business-model.md §4. The Python
 * service in services/business-plan-svc implements the same formulas; both are
 * tested against the worked example in §4.8.
 */
import type {
  BusinessPlan,
  OnboardingProfile,
  PlanResults,
  ProjectionMonth,
  Recommendation,
} from '@haulage/types';

export const WEEKS_PER_MONTH = 52 / 12;

export const DEFAULT_PROFILE: OnboardingProfile = {
  company_name: '',
  dot_number: '',
  mc_number: '',
  stage: 'operating',
  trucks: 1,
  trailers: 1,
  drivers: 1,
  miles_per_truck_per_week: 2500,
  deadhead_pct: 0.15,
  rate_per_loaded_mile: 2.35,
  fuel_mpg: 6.5,
  fuel_price: 3.85,
  driver_pay_per_mile: 0.62,
  insurance_per_truck_month: 1400,
  truck_payment_per_month: 2200,
  trailer_payment_per_month: 600,
  maintenance_per_mile: 0.18,
  tires_per_mile: 0.04,
  tolls_permits_per_truck_month: 350,
  overhead_per_month: 800,
  payment_terms_days: 35,
  factoring_enabled: false,
  factoring_rate_pct: 3.0,
  factoring_advance_pct: 95,
  starting_cash: 15000,
  doc_channels: ['email', 'photo'],
  voice_used: false,
  completed_at: null,
};

/** Fill a partial profile with spec defaults. Trailers/drivers default to truck count. */
export function withDefaults(partial: Partial<OnboardingProfile>): OnboardingProfile {
  const trucks = num(partial.trucks, DEFAULT_PROFILE.trucks);
  const merged: OnboardingProfile = { ...DEFAULT_PROFILE, ...stripNullish(partial), trucks };
  if (partial.trailers == null) merged.trailers = trucks;
  if (partial.drivers == null) merged.drivers = trucks;
  return merged;
}

function stripNullish<T extends object>(obj: T): Partial<T> {
  const out: Partial<T> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== null && v !== undefined && !(typeof v === 'number' && Number.isNaN(v))) {
      (out as Record<string, unknown>)[k] = v;
    }
  }
  return out;
}

function num(v: unknown, fallback: number): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);
const r2 = (v: number) => Math.round(v * 100) / 100;
const r4 = (v: number) => Math.round(v * 10000) / 10000;

interface Raw {
  totalMiles: number;
  loadedMiles: number;
  revenue: number;
  fuel: number;
  driverPay: number;
  maintenance: number;
  variable: number;
  fixed: number;
  factoringFee: number;
  totalCost: number;
  profit: number;
  marginPct: number;
  workingCapitalNeed: number;
  cashGapDays: number;
  runwayMonths: number;
}

function computeRaw(p: OnboardingProfile): Raw {
  const totalMiles = p.trucks * p.miles_per_truck_per_week * WEEKS_PER_MONTH;
  const loadedMiles = totalMiles * (1 - p.deadhead_pct);
  const revenue = loadedMiles * p.rate_per_loaded_mile;

  const fuel = p.fuel_mpg > 0 ? (totalMiles / p.fuel_mpg) * p.fuel_price : 0;
  const driverPay = totalMiles * p.driver_pay_per_mile;
  const maintenance = totalMiles * (p.maintenance_per_mile + p.tires_per_mile);
  const variable = fuel + driverPay + maintenance;

  const fixed =
    p.trucks * (p.insurance_per_truck_month + p.truck_payment_per_month + p.tolls_permits_per_truck_month) +
    p.trailers * p.trailer_payment_per_month +
    p.overhead_per_month;

  const factoringFee = p.factoring_enabled ? (revenue * p.factoring_rate_pct) / 100 : 0;
  const totalCost = fixed + variable + factoringFee;
  const profit = revenue - totalCost;
  const marginPct = revenue > 0 ? (profit / revenue) * 100 : 0;

  const dailyRevenue = revenue / 30;
  const cashGapDays = p.factoring_enabled
    ? 1 + p.payment_terms_days * (1 - p.factoring_advance_pct / 100)
    : p.payment_terms_days;
  const workingCapitalNeed = dailyRevenue * cashGapDays;
  const runwayMonths = p.starting_cash / Math.max(totalCost, 1);

  return {
    totalMiles, loadedMiles, revenue, fuel, driverPay, maintenance, variable, fixed,
    factoringFee, totalCost, profit, marginPct, workingCapitalNeed, cashGapDays, runwayMonths,
  };
}

export function computeResults(p: OnboardingProfile): PlanResults {
  const r = computeRaw(p);
  const tm = r.totalMiles;
  const revenuePerMile = tm > 0 ? r.revenue / tm : 0;
  const costPerMile = tm > 0 ? r.totalCost / tm : 0;
  const contributionPerMile = tm > 0 ? (r.revenue - r.variable - r.factoringFee) / tm : 0;
  const breakEvenMiles = contributionPerMile > 0 ? r.fixed / contributionPerMile : null;

  return {
    total_miles: r2(tm),
    loaded_miles: r2(r.loadedMiles),
    revenue: r2(r.revenue),
    fuel: r2(r.fuel),
    driver_pay: r2(r.driverPay),
    maintenance: r2(r.maintenance),
    variable: r2(r.variable),
    fixed: r2(r.fixed),
    factoring_fee: r2(r.factoringFee),
    total_cost: r2(r.totalCost),
    profit: r2(r.profit),
    margin_pct: r2(r.marginPct),
    operating_ratio: r.revenue > 0 ? r4(r.totalCost / r.revenue) : 0,
    revenue_per_mile: r4(revenuePerMile),
    cost_per_mile: r4(costPerMile),
    contribution_per_mile: r4(contributionPerMile),
    break_even_miles: breakEvenMiles === null ? null : r2(breakEvenMiles),
    working_capital_need: r2(r.workingCapitalNeed),
    cash_gap_days: r2(r.cashGapDays),
    runway_months: r4(r.runwayMonths),
  };
}

export function computeProjection(p: OnboardingProfile): ProjectionMonth[] {
  const r = computeRaw(p);
  const ramp = p.stage === 'starting' ? [0.6, 0.8, 1] : [];
  const utilization = (m: number) => (m <= ramp.length ? ramp[m - 1] : 1);
  const lag = Math.round(p.payment_terms_days / 30);
  const advance = p.factoring_advance_pct / 100;

  const revenueAt = (m: number) => (m < 1 ? 0 : r.revenue * utilization(m));
  const rows: ProjectionMonth[] = [];
  let cash = p.starting_cash;

  for (let m = 1; m <= 12; m++) {
    const u = utilization(m);
    const revenue = revenueAt(m);
    const variable = r.variable * u;
    const fee = r.factoringFee * u;
    const costs = r.fixed + variable + fee;
    const collections = p.factoring_enabled
      ? revenue * advance + revenueAt(m - lag) * (1 - advance) - fee
      : revenueAt(m - lag);
    cash = cash + collections - r.fixed - variable;
    rows.push({
      month: m,
      utilization: u,
      revenue: r2(revenue),
      costs: r2(costs),
      profit: r2(revenue - costs),
      collections: r2(collections),
      cash: r2(cash),
    });
  }
  return rows;
}

export function computeHealth(p: OnboardingProfile): number {
  const r = computeRaw(p);
  const marginScore = clamp(r.marginPct / 20, 0, 1) * 40;
  const runwayScore = clamp(r.runwayMonths / 3, 0, 1) * 30;
  const deadheadScore = clamp((0.3 - p.deadhead_pct) / 0.2, 0, 1) * 15;
  const utilScore = clamp(p.miles_per_truck_per_week / 2500, 0, 1) * 15;
  return Math.round(marginScore + runwayScore + deadheadScore + utilScore);
}

export function computeRecommendations(p: OnboardingProfile): Recommendation[] {
  const r = computeRaw(p);
  const out: Recommendation[] = [];

  if (r.marginPct < 8) {
    const impact = r.totalMiles * 0.05;
    out.push({
      id: 'thin_margin',
      title: 'Margin is thin',
      message: `Every 5 cents per mile on rate adds ${money(impact)} per month.`,
      impact_per_month: r2(impact),
    });
  }
  if (p.deadhead_pct > 0.2) {
    const impact = (p.deadhead_pct - 0.15) * r.totalMiles * p.rate_per_loaded_mile;
    out.push({
      id: 'deadhead',
      title: 'Empty miles are above 20%',
      message: `Cutting deadhead to 15% is worth ${money(impact)} per month.`,
      impact_per_month: r2(impact),
    });
  }
  if (!p.factoring_enabled && p.starting_cash < r.workingCapitalNeed) {
    out.push({
      id: 'cash_gap',
      title: 'Cash does not cover the payment gap',
      message: `You need about ${money(r.workingCapitalNeed)} to float ${Math.round(r.cashGapDays)} days of receivables. Quick-pay on the slowest customers closes it.`,
      impact_per_month: null,
    });
  }
  if (p.factoring_enabled && r.marginPct > 15 && p.starting_cash > r.workingCapitalNeed * 2) {
    out.push({
      id: 'drop_factoring',
      title: 'You can afford to stop factoring',
      message: `Dropping the factor saves ${money(r.factoringFee)} per month.`,
      impact_per_month: r2(r.factoringFee),
    });
  }
  if (r.revenue > 0 && r.fuel / r.revenue > 0.3) {
    const impact = r.fuel * 0.1;
    out.push({
      id: 'fuel',
      title: 'Fuel is over 30% of revenue',
      message: `A fuel card with network discounts typically saves 8 to 12 percent, about ${money(impact)} per month.`,
      impact_per_month: r2(impact),
    });
  }
  if (out.length === 0) {
    out.push({
      id: 'healthy',
      title: 'Fundamentals are healthy',
      message: 'Autopilot will focus on days-to-cash and compliance.',
      impact_per_month: null,
    });
  }
  return out;
}

export function computePlan(
  partial: Partial<OnboardingProfile>,
  generatedBy: BusinessPlan['generated_by'] = 'preview',
  now: Date = new Date(),
): BusinessPlan {
  const inputs = withDefaults(partial);
  return {
    generated_by: generatedBy,
    generated_at: now.toISOString(),
    inputs,
    results: computeResults(inputs),
    projection: computeProjection(inputs),
    recommendations: computeRecommendations(inputs),
    health: computeHealth(inputs),
  };
}

function money(v: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(v);
}
