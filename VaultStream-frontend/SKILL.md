---
name: fintech-os-design
description: Use this skill to generate well-branded interfaces and assets for FINTECH_OS — the Core Engine auth & monitoring platform — either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components.
user-invocable: true
---

# FINTECH_OS Design — Skill manifest

Read **`README.md`** first — it covers brand voice, color rules, type, motion, iconography, and the explicit no-gradient policy.

Then explore:

- `colors_and_type.css` — every design token (CSS custom properties + base typography). Import this in any prototype: `@import url('path/to/colors_and_type.css');`
- `assets/` — `logo.svg`, `logomark.svg`, and 33 Lucide icons in `assets/icons/`
- `ui_kits/auth-monitoring/` — production-leaning React components for the Core Engine dashboard. Read its `README.md` for component coverage.
- `preview/` — small static cards demonstrating each token / component.

## Hard visual rules

1. **No gradients.** Solid colors only. The previous violet → pink → cyan gradient was retired. Single-color alpha fades into transparent (chart area fills) are allowed.
2. **Canvas is flat `#0F172A`.** No radial washes or aurora glows behind the app.
3. **Per-metric color.** Each stat card uses ONE accent for its big number (violet OR pink OR cyan), tied to what the metric means (volume → violet, error/load → pink, health → cyan).
4. **Cards are flat surfaces:** `#131A2E` background, 1px white-6% hairline border, 14–16px radius, no drop shadow at rest.
5. **Inter** for UI text, **Orbitron** for the wordmark / "CORE ENGINE" / "DEPLOY NODE" / "ADMIN" pill (all uppercase brand moments), **Geist** for general labels (stat labels, table headers, eyebrows), **JetBrains Mono** for log lines / timestamps / IDs. Tabular nums on every number that ticks.
6. **Icons are Lucide**, 1.5px stroke, rounded caps. Solid color stroke — never gradient.
7. **Motion**: 120 / 200 / 360ms, `cubic-bezier(0.16, 1, 0.3, 1)`. Fades + 4–8px translateY. No bounces, no spring overshoots.
8. **Copy** is terse, technical. Title Case for page/section titles; sentence case for body and buttons. Numerals always digits.

## When working on visual artifacts (slides, prototypes, mocks)

- Copy assets out of `assets/` into your output folder.
- Import `colors_and_type.css` and consume tokens via `var(--primary-400)` etc.
- Reuse the React components from `ui_kits/auth-monitoring/` where they apply.
- If the user asks for something outside the kit (settings, login, billing), build it using the existing tokens. Don't invent new colors or radii.

## When working on production code

- Re-implement the tokens in your stack (Tailwind theme, CSS-in-JS, etc.) — copy exact hex values from `colors_and_type.css`.
- The provided React components are reference implementations, not production code.

## If invoked with no other guidance

Ask the user **what they want to build** (a new screen, a slide deck, an internal dashboard?), then ask 4–6 clarifying questions about audience, surface, content, and which existing components they need to reuse. Act as the lead designer.
