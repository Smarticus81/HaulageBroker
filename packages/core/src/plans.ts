import type { PlanCatalogEntry, PlanTier } from '@haulage/types';

/** docs/business-model.md §2 */
export const PLAN_CATALOG: PlanCatalogEntry[] = [
  {
    id: 'solo',
    name: 'Solo',
    price_per_truck_month: 0,
    included: ['1 truck', '25 loads a month', 'Document inbox', 'Invoicing', 'Compliance calendar', 'Living business plan'],
    autopilot_scope: 'suggest',
    limits: { trucks: 1, loads_per_month: 25 },
  },
  {
    id: 'fleet',
    name: 'Fleet',
    price_per_truck_month: 39,
    included: ['Unlimited loads', 'Driver capture app', 'Settlements', 'Copilot', 'Autopilot acts within your limits'],
    autopilot_scope: 'act',
    limits: { trucks: null, loads_per_month: null },
  },
  {
    id: 'autopilot',
    name: 'Autopilot',
    price_per_truck_month: 79,
    included: ['Everything in Fleet', 'Quick-pay routing', 'Custom policies', 'Audit exports', 'Priority support', 'Full autonomy within policy'],
    autopilot_scope: 'full',
    limits: { trucks: null, loads_per_month: null },
  },
];

export function planById(id: PlanTier): PlanCatalogEntry {
  return PLAN_CATALOG.find((p) => p.id === id) ?? PLAN_CATALOG[0];
}

export function monthlyPrice(plan: PlanTier, trucks: number): number {
  return planById(plan).price_per_truck_month * Math.max(trucks, 0);
}

/** Pick the plan the onboarding flow should suggest for a fleet size and stage. */
export function suggestPlan(trucks: number, wantsAutonomy: boolean): PlanTier {
  if (trucks <= 1 && !wantsAutonomy) return 'solo';
  if (trucks >= 6 || wantsAutonomy) return 'autopilot';
  return 'fleet';
}
