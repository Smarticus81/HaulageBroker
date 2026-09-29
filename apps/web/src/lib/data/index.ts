/**
 * Demo dataset. One coherent fleet ("Acme Trucking", 3 trucks) so every screen
 * agrees with every other screen. Dates are relative to now so the demo never
 * goes stale. Real deployments swap this for the API via src/lib/api.ts.
 */
import type { AutopilotEvent, AutopilotPolicies, OnboardingProfile } from '@haulage/types';

const now = new Date();
export const daysAgo = (d: number, h = 9) => {
  const x = new Date(now);
  x.setDate(x.getDate() - d);
  x.setHours(h, (d * 17) % 60, 0, 0);
  return x.toISOString();
};
export const daysAhead = (d: number) => daysAgo(-d);
const iso = (d: string) => d.slice(0, 10);

// ─── People & equipment ──────────────────────────────────────────────────────
export interface Driver { id: string; name: string; phone: string; truckId: string; homeBase: string; hiredAt: string; payPerMile: number }
export interface Truck { id: string; unit: string; year: number; make: string; model: string; vin: string; odometer: number; driverId: string | null }
export interface Trailer { id: string; unit: string; type: 'Dry van' | 'Reefer' | 'Flatbed'; year: number }
export interface Customer { id: string; name: string; type: 'broker' | 'shipper'; termsDays: number; apEmail: string; avgDaysToPay: number; loads90d: number; revenue90d: number; quickPay: boolean }

export const drivers: Driver[] = [
  { id: 'drv_1', name: 'Marcus Reed', phone: '(469) 555-0142', truckId: 'trk_1', homeBase: 'Dallas, TX', hiredAt: '2023-03-14', payPerMile: 0.64 },
  { id: 'drv_2', name: 'Elena Vasquez', phone: '(214) 555-0198', truckId: 'trk_2', homeBase: 'Fort Worth, TX', hiredAt: '2024-01-08', payPerMile: 0.62 },
  { id: 'drv_3', name: 'Tomas Okafor', phone: '(972) 555-0177', truckId: 'trk_3', homeBase: 'Waco, TX', hiredAt: '2024-09-02', payPerMile: 0.6 },
];

export const trucks: Truck[] = [
  { id: 'trk_1', unit: '101', year: 2022, make: 'Freightliner', model: 'Cascadia', vin: '3AKJHHDR8NSMA1041', odometer: 312_440, driverId: 'drv_1' },
  { id: 'trk_2', unit: '102', year: 2021, make: 'Kenworth', model: 'T680', vin: '1XKYD49X1MJ402318', odometer: 401_120, driverId: 'drv_2' },
  { id: 'trk_3', unit: '103', year: 2023, make: 'Volvo', model: 'VNL 860', vin: '4V4NC9EH7PN301877', odometer: 188_902, driverId: 'drv_3' },
];

export const trailers: Trailer[] = [
  { id: 'trl_1', unit: 'T-51', type: 'Dry van', year: 2020 },
  { id: 'trl_2', unit: 'T-52', type: 'Dry van', year: 2021 },
  { id: 'trl_3', unit: 'T-53', type: 'Reefer', year: 2022 },
];

export const customers: Customer[] = [
  { id: 'cus_1', name: 'Global Freight Solutions', type: 'broker', termsDays: 30, apEmail: 'ap@globalfreight.com', avgDaysToPay: 34, loads90d: 41, revenue90d: 86_420, quickPay: true },
  { id: 'cus_2', name: 'Midwest Manufacturing', type: 'shipper', termsDays: 45, apEmail: 'payables@midwestmfg.com', avgDaysToPay: 52, loads90d: 18, revenue90d: 47_900, quickPay: false },
  { id: 'cus_3', name: 'Pacific Coast Logistics', type: 'broker', termsDays: 30, apEmail: 'invoices@pclogistics.com', avgDaysToPay: 29, loads90d: 27, revenue90d: 61_300, quickPay: true },
  { id: 'cus_4', name: 'Redline Brokerage', type: 'broker', termsDays: 60, apEmail: 'ap@redlinebrk.com', avgDaysToPay: 71, loads90d: 9, revenue90d: 22_150, quickPay: false },
];

// ─── Loads ───────────────────────────────────────────────────────────────────
export type LoadStatus = 'created' | 'in_transit' | 'delivered' | 'docs_pending' | 'validation_failed' | 'ready_to_invoice' | 'invoiced' | 'paid';
export type DocType = 'RateConf' | 'BOL' | 'POD' | 'Lumper' | 'ScaleTicket' | 'FuelReceipt' | 'DetentionForm';
export const REQUIRED_DOCS: DocType[] = ['RateConf', 'BOL', 'POD'];

export interface Stop { city: string; state: string; at: string; kind: 'pickup' | 'delivery' }
export interface Load {
  id: string;
  number: string;
  customerId: string;
  driverId: string;
  truckId: string;
  trailerId: string;
  status: LoadStatus;
  origin: string;
  destination: string;
  miles: number;
  rate: number;
  accessorials: number;
  commodity: string;
  weightLbs: number;
  ref: string;
  pickupAt: string;
  deliverAt: string;
  deliveredAt: string | null;
  docs: DocType[];
}

const L = (
  n: number,
  customerId: string,
  driverId: string,
  status: LoadStatus,
  origin: string,
  destination: string,
  miles: number,
  rate: number,
  pickupDaysAgo: number,
  transitDays: number,
  docs: DocType[],
  commodity = 'General freight',
  accessorials = 0,
): Load => {
  const truckId = drivers.find((d) => d.id === driverId)!.truckId;
  const trailerId = `trl_${truckId.slice(-1)}`;
  const delivered = ['delivered', 'docs_pending', 'validation_failed', 'ready_to_invoice', 'invoiced', 'paid'].includes(status);
  return {
    id: `ld_${n}`,
    number: `LD-${2000 + n}`,
    customerId,
    driverId,
    truckId,
    trailerId,
    status,
    origin,
    destination,
    miles,
    rate,
    accessorials,
    commodity,
    weightLbs: 28_000 + ((n * 3571) % 16_000),
    ref: `${customerId === 'cus_1' ? 'GFS' : customerId === 'cus_2' ? 'MMC' : customerId === 'cus_3' ? 'PCL' : 'RLB'}-${4100 + n * 7}`,
    pickupAt: daysAgo(pickupDaysAgo, 7),
    deliverAt: daysAgo(pickupDaysAgo - transitDays, 14),
    deliveredAt: delivered ? daysAgo(pickupDaysAgo - transitDays, 15) : null,
    docs,
  };
};

export const loads: Load[] = [
  L(41, 'cus_1', 'drv_1', 'in_transit', 'Dallas, TX', 'Atlanta, GA', 781, 2_140, 1, 2, ['RateConf'], 'Packaged consumer goods'),
  L(40, 'cus_3', 'drv_2', 'in_transit', 'Laredo, TX', 'Phoenix, AZ', 1_012, 2_690, 1, 2, ['RateConf', 'BOL'], 'Auto parts'),
  L(39, 'cus_2', 'drv_3', 'created', 'Waco, TX', 'Kansas City, MO', 612, 1_580, -1, 1, ['RateConf'], 'Steel coil'),
  L(38, 'cus_1', 'drv_3', 'docs_pending', 'Houston, TX', 'Memphis, TN', 586, 1_640, 3, 1, ['RateConf', 'BOL'], 'Paper products'),
  L(37, 'cus_4', 'drv_1', 'docs_pending', 'Oklahoma City, OK', 'Denver, CO', 681, 1_890, 4, 1, ['RateConf'], 'Building materials', 150),
  L(36, 'cus_3', 'drv_2', 'validation_failed', 'El Paso, TX', 'Albuquerque, NM', 266, 890, 4, 1, ['RateConf', 'BOL', 'POD'], 'Produce', 75),
  L(35, 'cus_1', 'drv_1', 'ready_to_invoice', 'Dallas, TX', 'Nashville, TN', 664, 1_870, 6, 1, ['RateConf', 'BOL', 'POD'], 'Beverages'),
  L(34, 'cus_2', 'drv_3', 'ready_to_invoice', 'San Antonio, TX', 'Chicago, IL', 1_209, 3_120, 7, 2, ['RateConf', 'BOL', 'POD', 'Lumper'], 'Machinery', 250),
  L(33, 'cus_3', 'drv_2', 'invoiced', 'Tucson, AZ', 'Los Angeles, CA', 484, 1_450, 9, 1, ['RateConf', 'BOL', 'POD'], 'Electronics'),
  L(32, 'cus_1', 'drv_1', 'invoiced', 'Birmingham, AL', 'Dallas, TX', 646, 1_720, 10, 1, ['RateConf', 'BOL', 'POD', 'FuelReceipt'], 'Textiles'),
  L(31, 'cus_4', 'drv_3', 'invoiced', 'Little Rock, AR', 'St. Louis, MO', 351, 1_010, 12, 1, ['RateConf', 'BOL', 'POD'], 'Pet food'),
  L(30, 'cus_2', 'drv_2', 'paid', 'Chicago, IL', 'Dallas, TX', 925, 2_390, 18, 2, ['RateConf', 'BOL', 'POD'], 'Machinery'),
  L(29, 'cus_1', 'drv_1', 'paid', 'Dallas, TX', 'Houston, TX', 239, 720, 20, 1, ['RateConf', 'BOL', 'POD'], 'Retail'),
  L(28, 'cus_3', 'drv_3', 'paid', 'Phoenix, AZ', 'Dallas, TX', 1_067, 2_710, 22, 2, ['RateConf', 'BOL', 'POD', 'ScaleTicket'], 'Produce'),
  L(27, 'cus_1', 'drv_2', 'paid', 'Memphis, TN', 'Dallas, TX', 452, 1_260, 25, 1, ['RateConf', 'BOL', 'POD'], 'Paper products'),
  L(26, 'cus_2', 'drv_1', 'paid', 'Kansas City, MO', 'Fort Worth, TX', 548, 1_490, 28, 1, ['RateConf', 'BOL', 'POD'], 'Steel coil'),
];

export const customerById = (id: string) => customers.find((c) => c.id === id)!;
export const driverById = (id: string) => drivers.find((d) => d.id === id)!;
export const truckById = (id: string) => trucks.find((t) => t.id === id)!;
export const loadById = (id: string) => loads.find((l) => l.id === id || l.number === id);
export const missingDocs = (l: Load) => REQUIRED_DOCS.filter((d) => !l.docs.includes(d));

// ─── Documents ───────────────────────────────────────────────────────────────
export type DocStatus = 'valid' | 'needs_review' | 'invalid' | 'pending';
export interface Doc {
  id: string;
  filename: string;
  type: DocType | 'Unknown' | 'InsuranceCert' | 'CDL' | 'MedCard';
  loadId: string | null;
  source: 'email' | 'photo' | 'portal' | 'driver_app';
  uploadedBy: string;
  uploadedAt: string;
  status: DocStatus;
  confidence: number;
  pages: number;
  extracted: Record<string, string>;
  issues?: string[];
}

export const documents: Doc[] = [
  { id: 'doc_101', filename: 'IMG_4471.jpg', type: 'POD', loadId: 'ld_38', source: 'photo', uploadedBy: 'Tomas Okafor', uploadedAt: daysAgo(0, 8), status: 'needs_review', confidence: 0.71, pages: 1, extracted: { Receiver: 'Memphis DC 4', 'Delivered': iso(daysAgo(2)), Signature: 'present', 'Load #': 'unreadable' }, issues: ['Load number not legible', 'Photo is skewed'] },
  { id: 'doc_100', filename: 'RC_PCL-4380.pdf', type: 'RateConf', loadId: 'ld_40', source: 'email', uploadedBy: 'Autopilot', uploadedAt: daysAgo(0, 7), status: 'valid', confidence: 0.98, pages: 2, extracted: { Broker: 'Pacific Coast Logistics', Rate: '$2,690.00', Pickup: 'Laredo, TX', Delivery: 'Phoenix, AZ', 'Ref #': 'PCL-4380' } },
  { id: 'doc_99', filename: 'BOL_LD2040_signed.pdf', type: 'BOL', loadId: 'ld_40', source: 'driver_app', uploadedBy: 'Elena Vasquez', uploadedAt: daysAgo(1, 11), status: 'valid', confidence: 0.96, pages: 1, extracted: { Shipper: 'Nuevo Laredo Parts SA', Weight: '31,200 lbs', Pieces: '18 pallets' } },
  { id: 'doc_98', filename: 'POD_2036.pdf', type: 'POD', loadId: 'ld_36', source: 'email', uploadedBy: 'Autopilot', uploadedAt: daysAgo(2, 16), status: 'invalid', confidence: 0.93, pages: 1, extracted: { Receiver: 'ABQ Produce Terminal', Amount: '$815.00', Notes: 'Rate on POD differs from rate confirmation' }, issues: ['Amount differs from rate confirmation by $75.00 (8.4%)'] },
  { id: 'doc_97', filename: 'lumper_2034.jpg', type: 'Lumper', loadId: 'ld_34', source: 'photo', uploadedBy: 'Tomas Okafor', uploadedAt: daysAgo(3, 19), status: 'valid', confidence: 0.9, pages: 1, extracted: { Vendor: 'Chicago Unload Svc', Amount: '$250.00' } },
  { id: 'doc_96', filename: 'scan_0093.pdf', type: 'Unknown', loadId: null, source: 'email', uploadedBy: 'Autopilot', uploadedAt: daysAgo(3, 9), status: 'needs_review', confidence: 0.42, pages: 3, extracted: {}, issues: ['Could not classify. Looks like a detention log or a repair invoice.'] },
  { id: 'doc_95', filename: 'POD_LD2035.pdf', type: 'POD', loadId: 'ld_35', source: 'driver_app', uploadedBy: 'Marcus Reed', uploadedAt: daysAgo(4, 15), status: 'valid', confidence: 0.97, pages: 1, extracted: { Receiver: 'Nashville Bev Co', Signature: 'present' } },
  { id: 'doc_94', filename: 'RC_RLB-4359.pdf', type: 'RateConf', loadId: 'ld_37', source: 'email', uploadedBy: 'Autopilot', uploadedAt: daysAgo(5, 8), status: 'valid', confidence: 0.99, pages: 2, extracted: { Broker: 'Redline Brokerage', Rate: '$1,890.00', Detention: '$50/hr after 2h' } },
  { id: 'doc_93', filename: 'BOL_2034.pdf', type: 'BOL', loadId: 'ld_34', source: 'driver_app', uploadedBy: 'Tomas Okafor', uploadedAt: daysAgo(6, 10), status: 'valid', confidence: 0.95, pages: 2, extracted: { Shipper: 'Alamo Machine Works', Weight: '41,880 lbs' } },
  { id: 'doc_92', filename: 'insurance_cert_2026.pdf', type: 'InsuranceCert', loadId: null, source: 'email', uploadedBy: 'Autopilot', uploadedAt: daysAgo(8, 12), status: 'valid', confidence: 0.99, pages: 4, extracted: { Carrier: 'Great West Casualty', Liability: '$1,000,000', Cargo: '$100,000', Expires: iso(daysAhead(212)) } },
  { id: 'doc_91', filename: 'fuel_pilot_0912.jpg', type: 'FuelReceipt', loadId: 'ld_32', source: 'photo', uploadedBy: 'Marcus Reed', uploadedAt: daysAgo(9, 20), status: 'valid', confidence: 0.88, pages: 1, extracted: { Vendor: 'Pilot #442', Gallons: '148.2', Total: '$570.57' } },
  { id: 'doc_90', filename: 'POD_2033.pdf', type: 'POD', loadId: 'ld_33', source: 'driver_app', uploadedBy: 'Elena Vasquez', uploadedAt: daysAgo(9, 13), status: 'valid', confidence: 0.96, pages: 1, extracted: { Receiver: 'LA Electronics Hub', Signature: 'present' } },
];
export const docById = (id: string) => documents.find((d) => d.id === id);

// ─── Money ───────────────────────────────────────────────────────────────────
export type InvoiceStatus = 'draft' | 'sent' | 'quick_pay' | 'overdue' | 'paid';
export interface Invoice { id: string; number: string; loadId: string; customerId: string; amount: number; status: InvoiceStatus; issuedAt: string; dueAt: string; paidAt: string | null; expectedAt: string; channel: 'email' | 'portal' | 'factor' }

export const invoices: Invoice[] = [
  { id: 'inv_1', number: 'INV-1045', loadId: 'ld_33', customerId: 'cus_3', amount: 1_450, status: 'sent', issuedAt: daysAgo(8), dueAt: daysAhead(22), paidAt: null, expectedAt: daysAhead(21), channel: 'email' },
  { id: 'inv_2', number: 'INV-1044', loadId: 'ld_32', customerId: 'cus_1', amount: 1_720, status: 'sent', issuedAt: daysAgo(9), dueAt: daysAhead(21), paidAt: null, expectedAt: daysAhead(25), channel: 'portal' },
  { id: 'inv_3', number: 'INV-1043', loadId: 'ld_31', customerId: 'cus_4', amount: 1_010, status: 'quick_pay', issuedAt: daysAgo(11), dueAt: daysAhead(49), paidAt: null, expectedAt: daysAhead(1), channel: 'factor' },
  { id: 'inv_4', number: 'INV-1042', loadId: 'ld_30', customerId: 'cus_2', amount: 2_390, status: 'paid', issuedAt: daysAgo(16), dueAt: daysAhead(29), paidAt: daysAgo(1), expectedAt: daysAgo(1), channel: 'email' },
  { id: 'inv_5', number: 'INV-1041', loadId: 'ld_29', customerId: 'cus_1', amount: 720, status: 'paid', issuedAt: daysAgo(19), dueAt: daysAhead(11), paidAt: daysAgo(3), expectedAt: daysAgo(3), channel: 'portal' },
  { id: 'inv_6', number: 'INV-1040', loadId: 'ld_28', customerId: 'cus_3', amount: 2_710, status: 'paid', issuedAt: daysAgo(20), dueAt: daysAhead(10), paidAt: daysAgo(5), expectedAt: daysAgo(5), channel: 'email' },
  { id: 'inv_7', number: 'INV-1039', loadId: 'ld_27', customerId: 'cus_1', amount: 1_260, status: 'paid', issuedAt: daysAgo(24), dueAt: daysAhead(6), paidAt: daysAgo(6), expectedAt: daysAgo(6), channel: 'portal' },
  { id: 'inv_8', number: 'INV-1038', loadId: 'ld_26', customerId: 'cus_2', amount: 1_490, status: 'overdue', issuedAt: daysAgo(48), dueAt: daysAgo(3), paidAt: null, expectedAt: daysAhead(4), channel: 'email' },
];

export interface Settlement { id: string; driverId: string; periodStart: string; periodEnd: string; loads: string[]; miles: number; gross: number; deductions: { label: string; amount: number }[]; net: number; status: 'draft' | 'review' | 'approved' | 'paid' }
export const settlements: Settlement[] = [
  { id: 'stl_1', driverId: 'drv_1', periodStart: iso(daysAgo(7)), periodEnd: iso(daysAgo(1)), loads: ['ld_35', 'ld_37'], miles: 1_345, gross: 860.8, deductions: [{ label: 'Fuel advance', amount: 150 }], net: 710.8, status: 'review' },
  { id: 'stl_2', driverId: 'drv_2', periodStart: iso(daysAgo(7)), periodEnd: iso(daysAgo(1)), loads: ['ld_36', 'ld_40'], miles: 1_278, gross: 792.36, deductions: [], net: 792.36, status: 'review' },
  { id: 'stl_3', driverId: 'drv_3', periodStart: iso(daysAgo(7)), periodEnd: iso(daysAgo(1)), loads: ['ld_34', 'ld_38'], miles: 1_795, gross: 1_077, deductions: [{ label: 'Lumper reimbursement', amount: -250 }], net: 1_327, status: 'draft' },
  { id: 'stl_4', driverId: 'drv_1', periodStart: iso(daysAgo(14)), periodEnd: iso(daysAgo(8)), loads: ['ld_32', 'ld_29'], miles: 885, gross: 566.4, deductions: [], net: 566.4, status: 'paid' },
];

// ─── Compliance ──────────────────────────────────────────────────────────────
export type ComplianceStatus = 'active' | 'expiring_soon' | 'expired';
export interface ComplianceItem { id: string; subjectType: 'driver' | 'truck' | 'trailer' | 'carrier'; subjectId: string; subjectName: string; type: string; expiresAt: string; status: ComplianceStatus; evidenceDocId: string | null; autoRenew: boolean }
const ci = (id: string, subjectType: ComplianceItem['subjectType'], subjectId: string, subjectName: string, type: string, daysOut: number, evidenceDocId: string | null = null, autoRenew = false): ComplianceItem => ({
  id, subjectType, subjectId, subjectName, type, expiresAt: iso(daysAhead(daysOut)), status: daysOut < 0 ? 'expired' : daysOut <= 30 ? 'expiring_soon' : 'active', evidenceDocId, autoRenew,
});
export const compliance: ComplianceItem[] = [
  ci('cmp_1', 'driver', 'drv_1', 'Marcus Reed', 'Medical card', 9, null),
  ci('cmp_2', 'truck', 'trk_2', 'Truck 102', 'Annual inspection', 14, null),
  ci('cmp_3', 'driver', 'drv_2', 'Elena Vasquez', 'CDL', 26, null),
  ci('cmp_4', 'trailer', 'trl_1', 'Trailer T-51', 'Registration', -4, null),
  ci('cmp_5', 'carrier', 'org', 'Acme Trucking', 'Liability insurance', 212, 'doc_92', true),
  ci('cmp_6', 'carrier', 'org', 'Acme Trucking', 'UCR registration', 94, null, true),
  ci('cmp_7', 'carrier', 'org', 'Acme Trucking', 'IFTA Q3 filing', 31, null, true),
  ci('cmp_8', 'driver', 'drv_3', 'Tomas Okafor', 'Medical card', 301, null),
  ci('cmp_9', 'driver', 'drv_3', 'Tomas Okafor', 'MVR review', 122, null, true),
  ci('cmp_10', 'truck', 'trk_1', 'Truck 101', 'Annual inspection', 188, null),
  ci('cmp_11', 'truck', 'trk_3', 'Truck 103', 'Annual inspection', 243, null),
  ci('cmp_12', 'driver', 'drv_1', 'Marcus Reed', 'Drug & alcohol (random pool)', 77, null, true),
  ci('cmp_13', 'trailer', 'trl_3', 'Trailer T-53', 'Reefer PM service', 41, null),
  ci('cmp_14', 'carrier', 'org', 'Acme Trucking', '2290 HVUT', 158, null, true),
];

// ─── Autopilot ───────────────────────────────────────────────────────────────
export const policies: AutopilotPolicies = {
  mode: 'act',
  auto_invoice_max_amount: 5000,
  pod_chase_hours: 12,
  pod_chase_cadence_hours: 24,
  quick_pay_min_days: 45,
  compliance_alert_days: [30, 14, 7, 1],
  auto_link_confidence: 0.92,
  settlement_day: 'friday',
  quiet_hours: '21:00-06:00',
};

const ev = (id: number, daysBack: number, hour: number, kind: AutopilotEvent['kind'], summary: string, outcome: AutopilotEvent['outcome'], saved: number, entity_type: AutopilotEvent['entity_type'] = null, entity_id: string | null = null, detail?: string): AutopilotEvent => ({
  id: `ev_${id}`, kind, summary, detail, entity_type, entity_id, outcome, saved_minutes: saved, created_at: daysAgo(daysBack, hour),
});

export const autopilotEvents: AutopilotEvent[] = [
  ev(1, 0, 8, 'document_classified', 'Classified a photo from Tomas as a POD for LD-2038, but the load number is not legible', 'needs_you', 4, 'document', 'doc_101', 'Confidence 71%, below your 92% auto-link threshold. Confirm the load and Autopilot will finish the packet.'),
  ev(2, 0, 7, 'document_linked', 'Linked rate confirmation PCL-4380 to LD-2040', 'done', 6, 'load', 'ld_40', 'Matched on reference number and lane. Confidence 98%.'),
  ev(3, 0, 6, 'pod_chased', 'Texted Marcus for the POD on LD-2037 (delivered 3 days ago, no POD yet)', 'done', 5, 'load', 'ld_37', 'Third reminder. Next one in 24 hours unless a POD arrives.'),
  ev(4, 1, 17, 'rate_mismatch', 'POD amount for LD-2036 is $75 under the rate confirmation', 'needs_you', 0, 'load', 'ld_36', 'Rate confirmation says $890.00, the POD shows $815.00. Approve the lower amount or dispute with Pacific Coast.'),
  ev(5, 1, 15, 'invoice_sent', 'Sent INV-1045 to Pacific Coast Logistics for LD-2033 ($1,450)', 'done', 18, 'invoice', 'inv_1', 'Packet complete (RateConf, BOL, POD). Under your $5,000 auto-send limit.'),
  ev(6, 1, 9, 'compliance_alert', 'Marcus Reed’s medical card expires in 9 days. Booked a reminder and drafted the clinic request', 'done', 8, 'driver', 'drv_1'),
  ev(7, 2, 11, 'quick_pay_routed', 'Routed INV-1043 (Redline Brokerage, 60-day terms) to quick-pay', 'done', 10, 'invoice', 'inv_3', 'Redline averages 71 days to pay. Quick-pay lands tomorrow for a 2.5% fee ($25.25).'),
  ev(8, 2, 9, 'payment_received', 'Midwest Manufacturing paid INV-1042 ($2,390). Matched and closed LD-2030', 'done', 6, 'invoice', 'inv_4'),
  ev(9, 3, 16, 'settlement_generated', 'Drafted Friday settlements for all 3 drivers', 'done', 45, 'settlement', 'stl_1', 'Two are ready for review. Tomas’ is waiting on the LD-2038 POD.'),
  ev(10, 3, 9, 'exception_raised', 'Could not classify scan_0093.pdf from Global Freight’s email', 'needs_you', 0, 'document', 'doc_96'),
  ev(11, 4, 13, 'document_linked', 'Linked lumper receipt ($250) to LD-2034 and added it to the invoice', 'done', 7, 'load', 'ld_34'),
  ev(12, 4, 8, 'pod_chased', 'Requested POD from Tomas for LD-2038 via SMS', 'done', 5, 'load', 'ld_38'),
  ev(13, 5, 10, 'compliance_alert', 'Trailer T-51 registration expired. Opened the renewal and pre-filled the form', 'needs_you', 12, 'trailer', 'trl_1', 'Needs a card on file to pay the $118 fee.'),
  ev(14, 5, 8, 'invoice_sent', 'Sent INV-1044 to Global Freight Solutions for LD-2032 ($1,720)', 'done', 18, 'invoice', 'inv_2'),
  ev(15, 6, 14, 'document_classified', 'Classified and filed 4 fuel receipts from Marcus', 'done', 12, 'document', 'doc_91'),
  ev(16, 6, 9, 'payment_received', 'Global Freight paid INV-1041 ($720) two days early', 'done', 4, 'invoice', 'inv_5'),
];

export const autopilotSummary = () => {
  const week = autopilotEvents.filter((e) => new Date(e.created_at) > new Date(Date.now() - 7 * 864e5));
  return {
    mode: policies.mode,
    events_7d: week.length,
    needs_you: autopilotEvents.filter((e) => e.outcome === 'needs_you').length,
    saved_minutes_7d: week.reduce((a, e) => a + e.saved_minutes, 0),
    saved_minutes_30d: Math.round(week.reduce((a, e) => a + e.saved_minutes, 0) * 4.1),
  };
};

// ─── Audit ───────────────────────────────────────────────────────────────────
export interface AuditEntry { id: string; at: string; actor: string; actorType: 'user' | 'autopilot' | 'copilot' | 'system'; action: string; entity: string; entityId: string; changes?: Record<string, { from: string; to: string }>; ip?: string }
export const audit: AuditEntry[] = [
  { id: 'au_1', at: daysAgo(0, 8), actor: 'Autopilot', actorType: 'autopilot', action: 'document.classified', entity: 'document', entityId: 'doc_101', changes: { type: { from: 'Unknown', to: 'POD' }, confidence: { from: '—', to: '0.71' } } },
  { id: 'au_2', at: daysAgo(0, 7), actor: 'Autopilot', actorType: 'autopilot', action: 'document.linked', entity: 'document', entityId: 'doc_100', changes: { load: { from: 'none', to: 'LD-2040' } } },
  { id: 'au_3', at: daysAgo(1, 15), actor: 'Autopilot', actorType: 'autopilot', action: 'invoice.sent', entity: 'invoice', entityId: 'inv_1', changes: { status: { from: 'draft', to: 'sent' } } },
  { id: 'au_4', at: daysAgo(1, 14), actor: 'Alicia Moreno', actorType: 'user', action: 'policy.updated', entity: 'autopilot_policy', entityId: 'pol_1', changes: { auto_invoice_max_amount: { from: '2500', to: '5000' } }, ip: '73.14.201.9' },
  { id: 'au_5', at: daysAgo(2, 11), actor: 'Autopilot', actorType: 'autopilot', action: 'invoice.quick_pay_routed', entity: 'invoice', entityId: 'inv_3', changes: { channel: { from: 'email', to: 'factor' } } },
  { id: 'au_6', at: daysAgo(2, 9), actor: 'System', actorType: 'system', action: 'payment.matched', entity: 'invoice', entityId: 'inv_4', changes: { status: { from: 'sent', to: 'paid' } } },
  { id: 'au_7', at: daysAgo(3, 16), actor: 'Autopilot', actorType: 'autopilot', action: 'settlement.drafted', entity: 'settlement', entityId: 'stl_1' },
  { id: 'au_8', at: daysAgo(3, 10), actor: 'Copilot', actorType: 'copilot', action: 'load.note_added', entity: 'load', entityId: 'ld_36', changes: { note: { from: '', to: 'Asked PCL about the $75 discrepancy' } } },
  { id: 'au_9', at: daysAgo(4, 9), actor: 'Alicia Moreno', actorType: 'user', action: 'auth.login', entity: 'user', entityId: 'usr_1', ip: '73.14.201.9' },
  { id: 'au_10', at: daysAgo(5, 8), actor: 'Autopilot', actorType: 'autopilot', action: 'invoice.sent', entity: 'invoice', entityId: 'inv_2', changes: { status: { from: 'draft', to: 'sent' } } },
  { id: 'au_11', at: daysAgo(6, 14), actor: 'Marcus Reed', actorType: 'user', action: 'document.uploaded', entity: 'document', entityId: 'doc_91', ip: '166.170.22.4' },
  { id: 'au_12', at: daysAgo(7, 9), actor: 'Alicia Moreno', actorType: 'user', action: 'onboarding.completed', entity: 'organization', entityId: 'org_1', changes: { plan: { from: 'none', to: 'fleet' } }, ip: '73.14.201.9' },
];

// ─── Workspace ───────────────────────────────────────────────────────────────
export const demoProfile: OnboardingProfile = {
  company_name: 'Acme Trucking',
  dot_number: '3391027',
  mc_number: 'MC-1094412',
  stage: 'operating',
  trucks: 3,
  trailers: 3,
  drivers: 3,
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
  factoring_rate_pct: 3,
  factoring_advance_pct: 95,
  starting_cash: 15000,
  doc_channels: ['email', 'photo'],
  voice_used: true,
  completed_at: daysAgo(7, 9),
};

export const demoUser = { id: 'usr_1', name: 'Alicia Moreno', email: 'alicia@acmetrucking.com', role: 'owner' as const };

// Weekly cash series for the last 12 weeks (thousands), shared by Today and Money.
export const cashSeries = [11.2, 9.8, 12.4, 14.1, 12.9, 15.6, 17.2, 16.1, 18.9, 17.4, 19.8, 21.3];
export const revenueSeries = [12.1, 13.4, 11.9, 14.8, 15.2, 13.7, 16.4, 15.9, 17.1, 16.2, 18.4, 17.9];
