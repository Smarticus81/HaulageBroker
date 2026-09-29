# Haulage — Lean Business Model

Haulage is the autonomous back office for small and mid-size trucking carriers.
It replaces the "hire an office person at truck number four" step with software
that runs paperwork, billing, compliance and cash planning on autopilot.

This document is the source of truth for the commercial model and for the
**Business Plan engine** that both the web app (`packages/core`) and the API
(`services/business-plan-svc`) implement. The two implementations must produce
identical numbers for identical inputs; both are covered by tests against the
worked example at the bottom of this page.

## 1. Principles

| Principle | What it means in the product |
|---|---|
| Product-led, self-serve | No sales calls. A carrier goes from landing page to a running workspace in under ten minutes. |
| Voice-first onboarding | Onboarding is a guided conversation. The user can talk or type; the app speaks back. |
| Autopilot, not dashboards | The default posture is "the system did it, here is the receipt", not "here is a chart, go do something". |
| Per-truck pricing | One number the owner already thinks in. No seats, no per-document fees. |
| Living business plan | Every workspace has a plan that recomputes from real operating data, not a PDF written once. |

## 2. Plans

| Plan | Price | Included | Autopilot scope |
|---|---|---|---|
| Solo | $0 / month | 1 truck, 25 loads / month, inbox, invoicing, compliance calendar, business plan | Suggest only |
| Fleet | $39 / truck / month | Unlimited loads, driver capture app, settlements, copilot | Acts within policy limits |
| Autopilot | $79 / truck / month | Everything in Fleet, quick-pay routing, custom policies, audit exports, priority support | Full autonomy within policy limits |

Add-on revenue: quick-pay routing through a factoring partner earns a referral
share and never marks up the carrier's rate.

Plan identifiers used in code: `solo`, `fleet`, `autopilot`.

## 3. Onboarding profile

The voice-guided onboarding collects the fields below. Defaults are used for any
field the user skips so a plan can always be produced.

| Field | Type | Default | Prompt (spoken) |
|---|---|---|---|
| company_name | string | — | "What is the name of your trucking company?" |
| dot_number | string | — | "What is your DOT number? You can skip this." |
| mc_number | string | — | "And your MC number?" |
| stage | `starting` \| `operating` | operating | "Are you already hauling, or just getting started?" |
| trucks | int | 1 | "How many trucks do you run?" |
| trailers | int | trucks | "How many trailers?" |
| drivers | int | trucks | "How many drivers, including you if you drive?" |
| miles_per_truck_per_week | int | 2500 | "Roughly how many miles does each truck run per week?" |
| deadhead_pct | float 0-1 | 0.15 | "What share of your miles are empty? Fifteen percent is typical." |
| rate_per_loaded_mile | float | 2.35 | "What do you average per loaded mile?" |
| fuel_mpg | float | 6.5 | "What fuel economy do your trucks get?" |
| fuel_price | float | 3.85 | "What are you paying per gallon right now?" |
| driver_pay_per_mile | float | 0.62 | "What do you pay drivers per mile? If you drive, use what you pay yourself." |
| insurance_per_truck_month | float | 1400 | "What is insurance per truck per month?" |
| truck_payment_per_month | float | 2200 | "Truck payment per truck per month? Zero if paid off." |
| trailer_payment_per_month | float | 600 | "Trailer payment per trailer per month?" |
| maintenance_per_mile | float | 0.18 | "Maintenance budget per mile?" |
| tires_per_mile | float | 0.04 | "Tires per mile?" |
| tolls_permits_per_truck_month | float | 350 | "Tolls and permits per truck per month?" |
| overhead_per_month | float | 800 | "Office overhead per month: phone, software, parking?" |
| payment_terms_days | int | 35 | "How many days do brokers usually take to pay you?" |
| factoring_enabled | bool | false | "Do you factor your invoices?" |
| factoring_rate_pct | float | 3.0 | "What rate does your factor charge?" |
| factoring_advance_pct | float | 95 | "What percent do they advance up front?" |
| starting_cash | float | 15000 | "How much cash do you keep in the business account?" |
| doc_channels | string[] | ["email","photo"] | "How does paperwork reach you today? Email, text photos, broker portals?" |

## 4. Business Plan engine

All money is USD per month unless stated. `WEEKS_PER_MONTH = 52 / 12`.

### 4.1 Volume

```
total_miles   = trucks * miles_per_truck_per_week * WEEKS_PER_MONTH
loaded_miles  = total_miles * (1 - deadhead_pct)
revenue       = loaded_miles * rate_per_loaded_mile
```

### 4.2 Costs

```
fuel          = total_miles / fuel_mpg * fuel_price
driver_pay    = total_miles * driver_pay_per_mile
maintenance   = total_miles * (maintenance_per_mile + tires_per_mile)
variable      = fuel + driver_pay + maintenance

fixed         = trucks   * (insurance_per_truck_month + truck_payment_per_month + tolls_permits_per_truck_month)
              + trailers * trailer_payment_per_month
              + overhead_per_month

factoring_fee = factoring_enabled ? revenue * factoring_rate_pct / 100 : 0
total_cost    = fixed + variable + factoring_fee
```

### 4.3 Results

```
profit                = revenue - total_cost
margin_pct            = profit / revenue * 100
operating_ratio       = total_cost / revenue
revenue_per_mile      = revenue / total_miles          (all miles, not just loaded)
cost_per_mile         = total_cost / total_miles
contribution_per_mile = (revenue - variable - factoring_fee) / total_miles
break_even_miles      = fixed / contribution_per_mile   (per month; Infinity if contribution <= 0)
```

### 4.4 Cash

```
daily_revenue         = revenue / 30
if factoring_enabled:
    cash_gap_days     = 1 + payment_terms_days * (1 - factoring_advance_pct / 100)
else:
    cash_gap_days     = payment_terms_days
working_capital_need  = daily_revenue * cash_gap_days
runway_months         = starting_cash / max(total_cost, 1)   (months of costs covered by cash on hand)
```

### 4.5 Twelve-month projection

Utilization ramp: for `stage == "starting"` months 1-3 run at 60%, 80%, 100%;
for `operating` every month runs at 100%. Variable costs and factoring fees
scale with utilization; fixed costs do not.

Collections lag `lag = round(payment_terms_days / 30)` months. Without
factoring, month `m` collects `revenue[m - lag]` (zero when `m - lag < 1`).
With factoring, month `m` collects `revenue[m] * advance` plus
`revenue[m - lag] * (1 - advance)`, minus that month's factoring fee.

```
cash[0] = starting_cash
cash[m] = cash[m-1] + collections[m] - fixed - variable[m]
```

Each projection row exposes `month`, `revenue`, `costs`, `profit`,
`collections`, `cash`.

### 4.6 Health score (0-100)

```
margin_score   = clamp(margin_pct / 20, 0, 1) * 40       (20% margin scores full marks)
runway_score   = clamp(runway_months / 3, 0, 1) * 30      (3 months of costs in cash scores full marks)
deadhead_score = clamp((0.30 - deadhead_pct) / 0.20, 0, 1) * 15   (10% or less scores full marks)
util_score     = clamp(miles_per_truck_per_week / 2500, 0, 1) * 15
health         = round(margin_score + runway_score + deadhead_score + util_score)
```

### 4.7 Recommendations (deterministic, in this order)

| id | Condition | Message |
|---|---|---|
| thin_margin | margin_pct < 8 | Margin is thin. Every 5 cents per mile on rate adds `total_miles * 0.05` per month. |
| deadhead | deadhead_pct > 0.20 | Empty miles are above 20%. Cutting to 15% is worth `(deadhead_pct - 0.15) * total_miles * rate_per_loaded_mile` per month. |
| cash_gap | not factoring and starting_cash < working_capital_need | Cash on hand does not cover the payment gap. Quick-pay on the slowest customers closes it. |
| drop_factoring | factoring and margin_pct > 15 and starting_cash > working_capital_need * 2 | You can afford to stop factoring. That saves `factoring_fee` per month. |
| fuel | fuel / revenue > 0.30 | Fuel is over 30% of revenue. A fuel card with network discounts typically saves 8 to 12 percent. |
| healthy | none of the above fired | Fundamentals are healthy. Autopilot will focus on days-to-cash and compliance. |

`healthy` is only emitted when the list would otherwise be empty.

### 4.8 Worked example (test fixture)

Inputs: operating, 3 trucks, 3 trailers, 3 drivers, 2500 mi/wk, 15% deadhead,
$2.35/loaded mile, 6.5 mpg, $3.85/gal, $0.62 driver pay, $1400 insurance,
$2200 truck payment, $600 trailer payment, $0.18 maintenance, $0.04 tires,
$350 tolls, $800 overhead, 35-day terms, no factoring, $15,000 cash.

Expected (rounded to cents):

| Metric | Value |
|---|---|
| total_miles | 32,500.00 |
| loaded_miles | 27,625.00 |
| revenue | 64,918.75 |
| fuel | 19,250.00 |
| driver_pay | 20,150.00 |
| maintenance | 7,150.00 |
| variable | 46,550.00 |
| fixed | 14,450.00 |
| total_cost | 61,000.00 |
| profit | 3,918.75 |
| margin_pct | 6.04 |
| operating_ratio | 0.9396 |
| revenue_per_mile | 1.9975 |
| cost_per_mile | 1.8769 |
| contribution_per_mile | 0.5652 |
| break_even_miles | 25,566.52 |
| working_capital_need | 75,738.54 |
| runway_months | 0.2459 |
| health | 41 |
| recommendations | thin_margin, cash_gap |

## 5. Autopilot policies

A policy is a bounded permission the owner grants the system. Policies are the
only way Autopilot acts without a human click.

| key | Default | Meaning |
|---|---|---|
| auto_invoice_max_amount | 5000 | Send invoices automatically when the packet is complete and total is under this amount. |
| pod_chase_hours | 12 | Start chasing a missing POD this many hours after delivery. |
| pod_chase_cadence_hours | 24 | Repeat the chase this often. |
| quick_pay_min_days | 45 | Route invoices to quick-pay when the customer's terms exceed this. |
| compliance_alert_days | [30, 14, 7, 1] | Alert windows before expiry. |
| auto_link_confidence | 0.92 | Link a document to a load automatically above this confidence. |
| settlement_day | "friday" | Weekday settlements are generated. |
| quiet_hours | "21:00-06:00" | No notifications in this window. |

Autopilot emits an **event** for every action (`autopilot_events`), which is the
"receipt" the Today page shows. Events carry `kind`, `summary`, `entity_type`,
`entity_id`, `outcome` (`done` | `needs_you` | `skipped`) and `saved_minutes`,
the time estimate used for the "hours given back" metric.
