import { describe, expect, it } from 'vitest';
import {
  computeHealth,
  computePlan,
  computeProjection,
  computeRecommendations,
  computeResults,
  withDefaults,
} from '../src/businessPlan';

const worked = withDefaults({
  company_name: 'Acme Trucking LLC',
  stage: 'operating',
  trucks: 3,
  trailers: 3,
  drivers: 3,
});

describe('worked example (spec §4.8)', () => {
  const r = computeResults(worked);
  it('volume and revenue', () => {
    expect(r.total_miles).toBe(32500);
    expect(r.loaded_miles).toBe(27625);
    expect(r.revenue).toBe(64918.75);
  });
  it('costs', () => {
    expect(r.fuel).toBe(19250);
    expect(r.driver_pay).toBe(20150);
    expect(r.maintenance).toBe(7150);
    expect(r.variable).toBe(46550);
    expect(r.fixed).toBe(14450);
    expect(r.factoring_fee).toBe(0);
    expect(r.total_cost).toBe(61000);
  });
  it('results', () => {
    expect(r.profit).toBe(3918.75);
    expect(r.margin_pct).toBe(6.04);
    expect(r.operating_ratio).toBe(0.9396);
    expect(r.revenue_per_mile).toBe(1.9975);
    expect(r.cost_per_mile).toBe(1.8769);
    expect(r.contribution_per_mile).toBe(0.5652);
    expect(r.break_even_miles).toBe(25566.52);
  });
  it('cash', () => {
    expect(r.working_capital_need).toBe(75738.54);
    expect(r.cash_gap_days).toBe(35);
    expect(r.runway_months).toBe(0.2459);
  });
  it('health and recommendations', () => {
    expect(computeHealth(worked)).toBe(41);
    expect(computeRecommendations(worked).map((x) => x.id)).toEqual(['thin_margin', 'cash_gap']);
  });
});

describe('projection (spec §4.5)', () => {
  it('operating carrier runs at 100% and collects one month late on 35-day terms', () => {
    const rows = computeProjection(worked);
    expect(rows).toHaveLength(12);
    expect(rows.every((r) => r.utilization === 1)).toBe(true);
    expect(rows[0].collections).toBe(0);
    expect(rows[1].collections).toBe(64918.75);
    expect(rows[0].cash).toBe(15000 - 61000);
  });
  it('starting carrier ramps 60/80/100', () => {
    const rows = computeProjection({ ...worked, stage: 'starting' });
    expect(rows.slice(0, 4).map((r) => r.utilization)).toEqual([0.6, 0.8, 1, 1]);
    expect(rows[0].revenue).toBe(38951.25);
    expect(rows[0].costs).toBe(14450 + 46550 * 0.6);
  });
  it('factoring advances 95% in-month minus the fee', () => {
    const p = { ...worked, factoring_enabled: true };
    const rows = computeProjection(p);
    expect(rows[0].collections).toBeCloseTo(64918.75 * 0.95 - 64918.75 * 0.03, 2);
    expect(rows[1].collections).toBeCloseTo(64918.75 * 0.95 + 64918.75 * 0.05 - 64918.75 * 0.03, 2);
  });
});

describe('health (spec §4.6)', () => {
  it('caps at 100 and floors at 0', () => {
    expect(
      computeHealth(withDefaults({ trucks: 3, rate_per_loaded_mile: 4, deadhead_pct: 0.05, starting_cash: 1_000_000 })),
    ).toBe(100);
    expect(
      computeHealth(withDefaults({ trucks: 1, rate_per_loaded_mile: 0.5, deadhead_pct: 0.5, starting_cash: 0, miles_per_truck_per_week: 0 })),
    ).toBe(0);
  });
});

describe('recommendations (spec §4.7)', () => {
  it('emits healthy only when nothing else fires', () => {
    const p = withDefaults({ trucks: 2, rate_per_loaded_mile: 3.2, starting_cash: 200_000 });
    expect(computeRecommendations(p).map((x) => x.id)).toEqual(['healthy']);
  });
  it('drop_factoring fires for a healthy factoring carrier with 2x cash', () => {
    const p = withDefaults({ trucks: 2, rate_per_loaded_mile: 3.2, starting_cash: 200_000, factoring_enabled: true });
    expect(computeRecommendations(p).map((x) => x.id)).toEqual(['drop_factoring']);
  });
  it('orders thin_margin, deadhead, cash_gap, fuel', () => {
    const p = withDefaults({ trucks: 1, deadhead_pct: 0.3, starting_cash: 0 });
    expect(computeRecommendations(p).map((x) => x.id)).toEqual(['thin_margin', 'deadhead', 'cash_gap', 'fuel']);
  });
});

describe('safety', () => {
  it('zero trucks does not divide by zero', () => {
    const plan = computePlan({ trucks: 0 });
    expect(plan.results.revenue).toBe(0);
    expect(plan.results.break_even_miles).toBeNull();
    expect(plan.results.operating_ratio).toBe(0);
    expect(Number.isFinite(plan.health)).toBe(true);
    expect(JSON.stringify(plan)).not.toContain('null,null');
  });
  it('defaults trailers and drivers to truck count', () => {
    const p = withDefaults({ trucks: 4 });
    expect(p.trailers).toBe(4);
    expect(p.drivers).toBe(4);
  });
});
