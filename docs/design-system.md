# Haulage design system — "Signal"

The UI lives in `apps/web`. This page is the contract every screen follows.
Read it before touching a page; read `apps/web/src/app/app/page.tsx` (Today)
as the reference implementation.

## Mood

Warm bone paper by day, deep asphalt by night, one hot signal accent. It should
feel like a well-made instrument, not a SaaS template: quiet surfaces, hairline
borders, big tabular numbers, an editorial serif for titles, a mono face for
labels and data, and motion that settles like a spring rather than fading.

Never: pure white cards on a light grey page, blue-600 buttons, drop-shadow
cards with 8px radii, uppercase Inter headings, dashed grid lines, rainbow
chart palettes, emoji as icons, generic "dashboard" KPI rows with five equal
boxes and arrows.

## Tokens (all in `globals.css`, OKLCH, hand-tuned per theme)

| Token | Use |
|---|---|
| `bg`, `bg-deep` | page and rail backgrounds |
| `surface`, `surface-2`, `surface-3` | cards, nested wells, hover states |
| `surface-inverse` / `ink-inverse` | the one dark block on a page (callouts, primary CTA rows) |
| `ink`, `ink-2`, `ink-3`, `ink-4` | text hierarchy: title, body, labels, hints |
| `line`, `line-strong`, `line-soft` | hairlines. Never use grey borders |
| `signal` (+`-soft`, `-strong`, `-ink`) | the accent: primary buttons, active nav, ribbons, the orb |
| `good`, `warn`, `bad`, `info`, `mind` (+`-soft`) | status only. `mind` is reserved for Copilot / AI |
| `--series-1..6` | chart series, in that order, never cycled past 6 |

Tailwind classes: `bg-surface`, `text-ink-3`, `border-line`, `bg-signal-soft`,
`text-good`, and so on. Radii: `rounded-[10px]` controls, `rounded-[14px]`
wells, `rounded-[20px]` cards (the `surface` utility does this).

## Type

- `display` utility (Instrument Serif) for page titles and hero numbers'
  neighbours. Sentence case. Italic for a single emphasised word at most.
- Geist Sans for everything else. 13–15px body in the app.
- Geist Mono (`font-mono`) for eyebrows (`Eyebrow` component: 10.5px, uppercase,
  0.14em tracking), IDs, dates, money in tables. Always `tabular` on numbers.

## Components (`src/components/ui`)

Button (`primary | inverse | secondary | soft | ghost | danger | link`), Card /
CardHeader / CardBody / Eyebrow, Badge + StatusPill (maps status strings to
tones and human labels), Field / Input / Textarea / Select, Segmented, Tabs,
Switch, Kbd, StatTile (with NumberTicker + Sparkline), ProgressRing, Avatar,
EmptyState, Skeleton, Sheet (right or bottom drawer), Dialog, DataTable
(sortable, sticky header, `hideBelow` per column), Tooltip, toast(), AutopilotOrb.

Shell (`src/components/shell`): PageHeader (eyebrow + serif title + summary +
actions) opens every screen. `Section` groups. App-level: RouteRibbon (a load as
a route with a moving marker), EventRow (an Autopilot event).

Motion (`src/components/motion`): Reveal, Stagger + Item, NumberTicker. Use
Stagger/Item on grids of cards. Springs: `stiffness 400–500, damping 34–42`.

## Layout

- Page: `PageHeader` then a 12-column bento grid (`grid lg:grid-cols-12 gap-4`).
  Mix spans (8/4, 5/4/3) so the page has rhythm. One dark inverse block per page at most.
- Lists of records: `DataTable` inside a `Card`, filters in one row above using
  `Segmented` and `Input leading={<Search/>}`. Row click opens a `Sheet` or
  navigates to a detail route.
- Detail pages: header with the record's ID in mono + StatusPill, then 8/4 grid:
  main timeline / documents left, facts + money right.
- Mobile: single column, bottom tabs are provided by the shell; keep 16px gutters.
- Empty states use `EmptyState` with a verb-first title ("Nothing to chase").

## Charts

Follow the dataviz rules: one axis, thin marks, recessive grid, series colors
from `--series-n` in order, legends for ≥2 series, `ChartTooltip` for hover, no
value on every point. Status colors never appear as series. Sparklines for
trends in tiles; Recharts `AreaChart`/`BarChart` for real charts, height 200–260.

## Voice & copy

Short, plain, second person. Autopilot speaks in receipts: "Sent INV-1045 to
Pacific Coast ($1,450)". Decisions are framed as one verb per button ("Approve
$815", "Dispute", "Pay & renew"). No exclamation marks. No "Welcome back!".
