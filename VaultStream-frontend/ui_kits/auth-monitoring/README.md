# Auth & Monitoring Platform — UI Kit

Recreations of ARRAY Digital Bank's internal observability dashboard. **Hi-fidelity, mostly-cosmetic** React + plain CSS.

## What's in here

| File | Purpose |
|---|---|
| `index.html` | App shell + tab switcher (Logs ↔ Metrics) |
| `styles.css` | Imports `../../colors_and_type.css` then adds component classes |
| `Icon.jsx` | Inline Lucide-style SVG renderer + `<GradientDefs/>` |
| `Shell.jsx` | `<TopNav>`, `<Sidebar>` |
| `LogsView.jsx` | Live-streaming log table, filter bar, stat row, `<StatCard>`, `<LevelBadge>` |
| `MetricsView.jsx` | Animated charts (line + bar), `<MetricCard>`, `<HealthRow>`, smooth random walk series |

## Views

### View 1 — System logs & activity
- 4 glass stat cards with gradient values (Total logs, Error rate, Active services, Auth events/min)
- Real-time log table — timestamp · level · message · correlation ID · service
- Color-coded level badges (ERROR/WARN/INFO/DEBUG)
- Filter bar with gradient-border search, level toggles, service/time chips
- Pause / resume stream + Export CSV + Create alert actions

### View 2 — System performance metrics
- 4 stat cards (Requests/min, p95 latency, Error rate, Active sessions) — values animate via `useCounter`
- 1 large request-count line chart with gradient stroke + area fill
- Side-by-side response time (line) and error rate (bar) charts
- Active sessions chart at full width
- Health card with 4 services (status dots pulse green, glow on hover)

## Mock data

All numbers come from a tiny random-walk generator (`useSeries` in `MetricsView.jsx`). The logs view appends a new row every 900ms via `setInterval` while live mode is on.

## Switching between views

Click **System logs** ↔ **Performance** in either the top nav or the left sidebar. State lives in the root `App` component (`useState`). The active sidebar item lifts to the brand gradient via a left-edge accent bar.

## What's *not* implemented (this is a UI kit, not the product)

- No real API; no auth; no persistence.
- Filter chips are decorative for "service / time / more" — only level toggles actually filter.
- AI summary, Export CSV, and Create alert buttons are visual only.
- Tooltips, drill-in for an individual log row, region picker — out of scope.
