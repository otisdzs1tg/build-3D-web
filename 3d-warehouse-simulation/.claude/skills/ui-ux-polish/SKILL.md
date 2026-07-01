---
name: ui-ux-polish
description: Use whenever creating, editing, or reviewing UI or styling in the build-3D-web frontend (App.jsx, App.css, or any new React component/CSS in frontend/src). Applies the project's design tokens (color, spacing, typography, motion) and compactness rules instead of ad-hoc styling or hardcoded hex/px values.
---

# UI/UX Polish — build-3D-web dashboard

Apply this skill any time you touch the project's UI (`frontend/src/App.jsx`, `frontend/src/App.css`,
or a new component). Goal: fix four specific issues already identified in the current UI —
inconsistent colors/contrast, unclear type hierarchy, uneven spacing/alignment, and choppy
animation/transitions — while keeping the dashboard **compact**, since the 3D canvas is the actual
content, not the control panels.

`App.css` currently has no framework (no Tailwind) — it's plain CSS with lightly-BEM'd class names
(`.control-panel`, `.coord-input`, `.start-btn`, etc.). This skill does NOT introduce Tailwind — it
standardizes the existing plain CSS using CSS custom properties (design tokens).

## Step 0 — always make sure the token block exists
Before writing any new CSS rule, check whether `App.css` already has a `:root { ... }` block at the
top. If not, create it first (using the exact token table below, derived from the real values already
in use — don't invent new values). After that, **every new or edited rule must use
`var(--token-name)`**, never a literal hex/rgba/px, unless the token doesn't exist yet — in that case
add a new token to `:root`, don't hand-write the value inline.

### Color tokens
The current code has three near-identical grays for secondary text (`#7a8da6`, `#8a9bb5`, `#6a7d96`) —
this is the actual source of "inconsistent colors". Collapse these down to at most two gray levels.

```css
:root {
  /* Backgrounds */
  --bg-canvas: #0f1923;
  --surface-1: rgba(15, 25, 40, 0.95);   /* panel background, gradient start */
  --surface-2: rgba(10, 18, 30, 0.98);   /* panel background, gradient end */
  --surface-inset: rgba(0, 0, 0, 0.3);   /* inputs, badges, recessed elements */

  /* Borders */
  --border-subtle: rgba(255, 255, 255, 0.06);
  --border-faint: rgba(255, 255, 255, 0.1);
  --border-accent: rgba(77, 136, 255, 0.25);

  /* Brand / status */
  --accent: #4d88ff;          /* primary blue — buttons, focus, highlights */
  --accent-strong: #3366dd;   /* gradient end for the primary button */
  --success: #22c55e;         /* "straight / fast", moving status */
  --warning: #f59e0b;         /* "turning / slow", idle status */
  --danger: #ef4444;          /* errors — use this instead of a bare alert() when upgrading error UI */

  /* Text — only 2 secondary levels, do not add a third */
  --text-primary: #ffffff;
  --text-secondary: #e0e8f0;
  --text-muted: #8a9bb5;      /* use everywhere for secondary labels/captions, replacing #7a8da6 and #6a7d96 */
}
```

### Spacing scale — 4px grid
Padding/margin currently use arbitrary values (16px, 18px, 14px, 12px, 20px...) that don't follow any
grid — this is the actual source of "uneven alignment". Every new spacing value must come from this
scale:

```css
:root {
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
}
```
Rule: within a single component, horizontal and vertical padding should differ by at most one step on
this scale (e.g. a section using `--space-4` horizontally should use `--space-3` or `--space-4`
vertically, never jump straight to `--space-6`).

### Typography scale — clear hierarchy
```css
:root {
  --font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif;

  --text-xs: 11px;    /* smallest meta / captions / small badges */
  --text-sm: 12px;    /* labels, status text */
  --text-base: 13px;  /* main panel body content */
  --text-md: 14px;    /* emphasis, buttons, inputs */
  --text-lg: 15px;    /* section headings / small H1 */

  --weight-regular: 400;
  --weight-medium: 600;
  --weight-bold: 700;
}
```
Hierarchy rule: top-level heading is always `--text-lg` + `--weight-bold`; section titles are always
`--text-xs` + `--weight-bold` + `text-transform: uppercase` + `letter-spacing` (matches the existing
pattern in `.section-title`); secondary body/labels are always `--text-sm` or `--text-base`, never bold.
Don't introduce a font size outside this scale.

If the project is fine loading an external font (Inter via Google Fonts/`@fontsource`), use it; if
keeping the bundle light matters more (in line with the "compact" goal), drop `'Inter'` from
`--font-family` and keep only `system-ui, -apple-system, 'Segoe UI', sans-serif` — don't add a font load.

### Motion / transitions — three levels only
Animation currently uses several disconnected durations (`0.15s`, `0.2s`, `0.3s`, `1.2s`) with no
shared system — this is the actual source of "choppy" feeling, since components don't move in sync
with each other. Use exactly three levels:

```css
:root {
  --ease-standard: cubic-bezier(0.4, 0, 0.2, 1);
  --transition-fast: 120ms var(--ease-standard);   /* hover, active, button presses */
  --transition-base: 200ms var(--ease-standard);   /* toggles, active mode-btn, focus rings */
  --transition-slow: 320ms var(--ease-standard);   /* panel open/close, fade in/out */
}
```
Keep the existing `@keyframes pulse` on `.status-dot.moving` (1.2s) as-is — it's a continuous status
animation, not an interaction transition, so don't fold it into the three tokens above.

## Compactness rules — the 3D canvas is the actual content, panels are just controls
- Keep the left control panel at roughly 260–280px width; if adding a new control, prefer **increasing
  density** (tightening spacing per the scale above) over **increasing panel area**.
- If a new UI section doesn't need to be visible at all times (e.g. advanced config, debug info), make
  it collapsible/accordion instead of always taking up space.
- When adding a new panel (minimap, bottom status bar, etc.), set an explicit budget: total HUD panel
  area should stay under roughly 30% of the viewport at any time, leaving the rest for the canvas.
- Don't add whitespace "for looks" unless it serves to group information — every gap must map to a
  value on the spacing scale, never an arbitrary one-off.

## Checklist before considering a UI change done
1. No hand-written hex/rgba colors in new CSS — everything goes through `var(--...)`.
2. No margin/padding/gap values outside the spacing scale.
3. Every new piece of text maps to one of the five type scale sizes, with weight matching its role
   (heading/label/body).
4. Every element with `:hover`/`:focus`/`:active`/a toggle uses one of the three transition tokens,
   never a custom duration.
5. Don't increase the overall height/width of an existing panel unless truly necessary — prefer
   compressing it instead.
6. Keep the existing Vietnamese copy and icon/emoji pattern used in the UI, unless explicitly asked to change it.
7. Don't switch to Tailwind or CSS-in-JS — this stays plain CSS in `App.css` (or a sibling `.css` file
   if a component gets split out later).
