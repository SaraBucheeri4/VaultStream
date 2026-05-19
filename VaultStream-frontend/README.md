# FINTECH_OS Design System

Visual language and component library for **FINTECH_OS · Core Engine** — the auth & monitoring platform for a digital bank's core infrastructure. Engineers, SREs, and security analysts use it to tail logs and watch real-time system metrics.

> Built from a set of Figma comps and the brand brief provided by the user.

---

## Source materials

| Source | Where |
|---|---|
| Brand & feature brief | Provided inline by user (May 2026) |
| Figma comps | Provided as 7 PNG references (`uploads/`) — Aside, Top NavBar (×2), Main Content (Logs), Main Content Canvas (Metrics), the brand sheet, and a combined screenshot |
| Codebase | _Not attached_ |

If you have access to FINTECH_OS's repo or the live Figma file, drop them into this project and we will refit the kit against the real components.

---

## Content fundamentals

- **Voice:** terse, technical, peer-engineer. *"Within safety threshold"* > *"You're all good!"*
- **Person:** **you** for actions ("Filter logs by correlation ID"), **we** for product behaviour ("We retain logs for 30 days"). Avoid "I".
- **Casing:** `Title Case` for page titles and section titles (per the Figma comps — "Live Stream", "System Logs & Activity", "Global Nodes"). `Sentence case` for body, hint text, button labels, and menu items.
- **All-caps:** only for log-level badges and stat-card labels (`REQUEST COUNT`, `ERROR`, `THROTTLED`), tracked at `+0.08–0.12em`.
- **Numerals:** always digits, never spelled out. Show units inline (`42ms`, `99.98%`, `1.2M /hr`). Compact `K`/`M` for large counts on dense cards; full digits with commas when the card is wide (`1,284,502`).
- **Timestamps:** mono, full ISO-ish (`2026-05-19 14:32:08.214`) in log tables; short (`12:42:15.002`) in activity feeds.
- **Emoji:** never. Status is conveyed by color, pill labels, and Lucide icons.
- **Empty states:** one line of explanation + one CTA.

---

## Visual foundations

### Palette — flat solid colors, no gradients
| Token | Hex | Use |
|---|---|---|
| `--primary`   | `#8B5CF6` | Primary action, brand, "Total Logs Today" value, active nav, Live segmented state, logo wordmark |
| `--secondary` | `#EC4899` | Error rate values, THROTTLED status, FAST pill, mid-load nodes |
| `--tertiary`  | `#22D3EE` | Active microservices count, SUCCESS / Real-time Connected / Live pills, healthy uptime |
| `--neutral`   | `#0F172A` | Canvas |

Each color has a 9-step scale (`50 → 900`). Use the 400 step for solid blocks and the 100 step for `--btn-inverted` backgrounds.

**No gradients.** Earlier iterations used a violet → pink → cyan gradient; this was removed because it's overused in fintech design. Charts use a single solid stroke; large numbers use a single solid color; the Deploy Node CTA is solid lavender (`--primary-300`). Soft alpha fades **into transparent** (used for chart-area fills) are not gradients in the design-system sense and are allowed.

### Typography
- **Brand display:** **Orbitron** (700) — geometric, tracked-out caps. Used for the FINTECH_OS wordmark, the "CORE ENGINE" product label, the DEPLOY NODE CTA, and the ADMIN pill. Loaded locally from `fonts/Orbitron-VariableFont_wght.ttf`.
- **Display + body:** Inter (400 / 500 / 600 / 700 / 800).
- **Label face:** Geist (600 / 700). Stat-card labels, table column headers, small uppercase eyebrows — anywhere Orbitron would be too loud.
- **Mono:** JetBrains Mono. Log timestamps, correlation IDs, latencies, event IDs.
- Negative letter-spacing (-0.6 → -1.2px) on headings ≥28px. Tabular numerals on every ticking value.

### Spacing & layout
- 4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48 — strict 4px grid.
- App: 60px top nav + 240px left sidebar + content column.
- Stat-card grids: 3 columns for the Logs view, 4 columns for the Metrics view. Gap = 14px.

### Surfaces
- **Card body:** `#131A2E` flat fill, 1px white-6% hairline border, 14–16px radius. No drop shadow on default state.
- **Hover:** lift 2px and brighten border to white-12%. No colored glow.
- **Inputs:** `#0F172A` darker fill, 1px line-2 border. Focused state: 1px primary-400 border + 3px rgba primary ring.
- **Page background:** flat `--bg-1` (`#0F172A`). The earlier radial aurora wash was removed.

### Motion
- Durations: 120ms (micro), 200ms (default), 360ms (page).
- Easing: `cubic-bezier(0.16, 1, 0.3, 1)` for entrances, `cubic-bezier(0.65, 0, 0.35, 1)` for state changes.
- Stat-card values tween smoothly via `useCounter` (cubic ease-out).
- Live indicators pulse: `scale(1) → scale(2.4)` + fade, 1.6s loop.
- No bounces, no spring overshoots, no scale transforms on stat cards.

### Borders & focus
- Default: 1px white-6%. Hover: white-10%. Focus: 1px primary-400 + 3px primary-18% outer ring.

---

## Iconography

We use **[Lucide](https://lucide.dev)** at 1.5px stroke, rounded line caps and joins, sizes 14 / 16 / 18 / 20 / 24. 33 icons are pre-staged in `assets/icons/`:

`activity`, `alert-octagon`, `alert-triangle`, `arrow-down-right`, `arrow-up-right`, `bell`, `box`, `bug`, `check`, `chevron-down`, `chevron-left`, `chevron-right`, `clock`, `code`, `cpu`, `database`, `download`, `eye`, `filter`, `globe`, `grid`, `help-circle`, `info`, `key-round`, `layers`, `line-chart`, `log-out`, `menu`, `more-horizontal`, `pause`, `play`, `refresh-cw`, `search`, `server`, `settings`, `shield-check`, `sliders`, `sparkles`, `stopwatch`, `users-round`, `wallet`, `x`, `zap`.

- Default icon color: `--fg-2`.
- Active nav / button color: `--primary-400` (solid — no gradient stroke).
- Stat-card icon tiles: 32–36px square, `#131A2E` fill, white-6% border, icon in `--fg-2`.

**No emoji. No unicode picto-substitutes** (✓, ✗, ★).

---

## Index

- `README.md` — this file
- `SKILL.md` — Claude-Code-compatible skill manifest
- `colors_and_type.css` — all design tokens (CSS custom properties + base typography)
- `assets/` — logo, logomark, 33 icon SVGs in `assets/icons/`
- `preview/` — per-card preview files registered to the Design System tab
- `ui_kits/auth-monitoring/` — Core Engine dashboard (the main product surface)
  - `index.html` — Full click-through with both Logs and Metrics views
  - `Icon.jsx`, `Shell.jsx`, `LogsView.jsx`, `MetricsView.jsx`, `styles.css`, `README.md`

---

## Caveats / known substitutions

- **Geist** is loaded from Google Fonts. If FINTECH_OS has the real Geist files, drop the `.woff2` into `fonts/`.
- **Orbitron** is loaded locally from `fonts/Orbitron-VariableFont_wght.ttf` (variable, 400–900). Used for the wordmark and brand-uppercase moments only.
- **Icons** are Lucide path data. Replace if you have a proprietary set.
- **Logomark "F_"** in `assets/logomark.svg` is a placeholder — drop in the real artwork.
- The dashboard's sidebar maps two of its items to our two real views (Analytics → Logs view, Logs → Metrics view) so the demo can show both. In production each item routes to a distinct surface.
