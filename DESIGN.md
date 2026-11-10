# Design System — CineLock (Canon: BookMyShow Craft Level)

<!-- impeccable:design-schema 1 -->

## Visual Strategy

**Canon executed at reference fidelity.** Familiar movie booking patterns (BookMyShow, Fandango) with zero invention. Every component, interaction, and state matches the category standard — then polished beyond it: smoother transitions, clearer states, faster perceived performance, zero layout shift.

**No quirk. No irony. No signature move that isn't standard.** The mechanism (seat locking) is exposed through standard patterns: color legend, countdown badge, toast notifications — not custom UI.

---

## Color

### Palette (Semantic Roles)

| Role | Light | Dark | Usage |
|---|---|---|---|
| `bg-primary` | `#FFFFFF` | `#121212` | Page background |
| `bg-secondary` | `#F5F5F5` | `#1E1E1E` | Cards, sheets, input backgrounds |
| `bg-tertiary` | `#EEEEEE` | `#2C2C2C` | Hover states, dividers |
| `text-primary` | `#1A1A1A` | `#FFFFFF` | Primary text, headings |
| `text-secondary` | `#555555` | `#BBBBBB` | Secondary text, metadata |
| `text-muted` | `#888888` | `#888888` | Placeholders, disabled |
| `brand-primary` | `#E50914` | `#FF1A1A` | Primary actions, links, focus (Netflix red — familiar, high contrast) |
| `brand-hover` | `#B80710` | `#FF4444` | Primary hover |
| `brand-light` | `#FFF0F0` | `#3A1A1A` | Primary backgrounds, badges |
| `success` | `#00A651` | `#00D46A` | Available seats, success states |
| `success-light` | `#E8F8F0` | `#1A3A2A` | Available seat backgrounds |
| `warning` | `#FF8C00` | `#FFB340` | Locked seats, pending, countdown |
| `warning-light` | `#FFF4E6` | `#3A2A1A` | Locked seat backgrounds |
| `danger` | `#E50914` | `#FF4444` | Booked seats, errors, destructive |
| `danger-light` | `#FFF0F0` | `#3A1A1A` | Booked seat backgrounds |
| `selected` | `#1A73E8` | `#4A9EFF` | User-selected seats (before lock) |
| `selected-light` | `#E8F0FE` | `#1A2A3A` | Selected seat backgrounds |
| `border` | `#DDDDDD` | `#3A3A3A` | Borders, dividers |
| `border-focus` | `#E50914` | `#FF1A1A` | Focus rings |

### State Color Legend (Seat Map)

| State | Fill | Border | Label | Icon |
|---|---|---|---|---|
| Available | `success-light` | `success` | "Available" | — |
| Selected (yours) | `selected-light` | `selected` (3px) | "Selected" | ✓ |
| Locked (other user) | `warning-light` | `warning` | "Locked 3:42" | 🔒 |
| Booked | `danger-light` | `danger` | "Booked" | 🎟 |
| Wheelchair | `bg-tertiary` | `border` | "WC" | ♿ |

---

## Typography

### Font Stack

```
--font-sans: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
--font-mono: "JetBrains Mono", "Fira Code", "SF Mono", Menlo, monospace;
```

### Type Scale

| Token | Size | Weight | Line Height | Use |
|---|---|---|---|---|
| `display` | 48px / 3rem | 700 | 1.1 | Hero movie title |
| `h1` | 32px / 2rem | 700 | 1.2 | Page titles |
| `h2` | 24px / 1.5rem | 600 | 1.3 | Section headers |
| `h3` | 20px / 1.25rem | 600 | 1.4 | Subsections, cards |
| `body-lg` | 18px / 1.125rem | 400 | 1.6 | Lead text |
| `body` | 16px / 1rem | 400 | 1.6 | Body text |
| `body-sm` | 14px / 0.875rem | 400 | 1.5 | Metadata, captions |
| `caption` | 12px / 0.75rem | 500 | 1.4 | Labels, badges |
| `mono` | 14px / 0.875rem | 400 | 1.6 | Booking refs, QR data, code |

---

## Spacing

### Base Unit: 8px

| Token | Value | Use |
|---|---|---|
| `space-1` | 4px | Tight gaps |
| `space-2` | 8px | Default gap |
| `space-3` | 12px | Form fields |
| `space-4` | 16px | Card padding |
| `space-5` | 24px | Section gaps |
| `space-6` | 32px | Page sections |
| `space-8` | 48px | Hero sections |
| `space-10` | 64px | Major breaks |

---

## Border Radius

| Token | Value | Use |
|---|---|---|
| `radius-sm` | 4px | Inputs, badges |
| `radius-md` | 8px | Buttons, cards |
| `radius-lg` | 12px | Sheets, modals |
| `radius-full` | 9999px | Pills, avatars |

---

## Shadows

| Token | Value | Use |
|---|---|---|
| `shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | Cards, inputs |
| `shadow-md` | `0 4px 12px rgba(0,0,0,0.08)` | Dropdowns, tooltips |
| `shadow-lg` | `0 12px 32px rgba(0,0,0,0.12)` | Modals, sheets |
| `shadow-focus` | `0 0 0 3px var(--brand-light)` | Focus rings |

---

## Components

### Button

```css
/* Variants: primary, secondary, ghost, danger */
/* Sizes: sm (32px), md (40px), lg (48px) */
/* States: default, hover, active, disabled, loading */
```

- **Primary:** `bg: brand-primary`, `text: white`, `hover: brand-hover`
- **Secondary:** `bg: bg-tertiary`, `text: text-primary`, `hover: border`
- **Ghost:** `bg: transparent`, `text: brand-primary`, `hover: brand-light`
- **Danger:** `bg: danger`, `text: white`, `hover: darker`

### Input

```css
/* States: default, hover, focus, error, disabled */
/* Sizes: sm (36px), md (44px), lg (52px) */
```

- Border: `border` → `border-focus` on focus
- Error: `border: danger`, `focus: danger-light` ring
- Label above, helper/error below

### Card

```css
bg: bg-primary
border: 1px solid border
radius: radius-lg
shadow: shadow-sm
padding: space-4
transition: shadow 150ms, transform 150ms
hover: shadow-md, translateY(-2px)
```

### Seat (SVG/Canvas)

```css
/* Size: 24px desktop, 20px tablet, 18px mobile (min touch 44px with padding) */
/* Shapes: circle (standard), rectangle (wheelchair) */
/* States: available, selected, locked, booked, disabled */
/* Animation: 150ms fill transition, 200ms scale on select */
```

- **Available:** `fill: success-light`, `stroke: success`, `cursor: pointer`
- **Selected:** `fill: selected-light`, `stroke: selected (3px)`, `scale: 1.1`
- **Locked:** `fill: warning-light`, `stroke: warning`, `cursor: not-allowed`, lock icon overlay
- **Booked:** `fill: danger-light`, `stroke: danger`, `cursor: not-allowed`, ticket icon overlay
- **Disabled:** `fill: bg-tertiary`, `stroke: border`, `cursor: not-allowed`

### Color Legend (Seat Map)

- Horizontal row of pills: `[● Available] [● Selected] [● Locked 4:32] [● Booked] [♿ WC]`
- Each pill: `bg: state-light`, `border: state`, `text: state`, `radius: radius-full`, `padding: 4px 12px`
- Locked pill shows live countdown (updates every second)

### Toast / Snackbar

- Bottom-right, stack up to 3
- Variants: success (green), warning (amber), error (red), info (blue)
- Auto-dismiss: 4s (success/info), 8s (warning), persistent (error)
- Action button for undo/retry

### Modal / Sheet

- Backdrop: `rgba(0,0,0,0.5)`, `backdrop-filter: blur(4px)`
- Slide up from bottom (mobile) / center fade (desktop)
- `radius-lg`, `shadow-lg`, `max-h: 90vh`, `overflow: auto`

### Loader

- Primary spinner: `border: 3px solid border`, `border-top-color: brand-primary`, `24px`, `spin 800ms linear`
- Skeleton: `bg: bg-tertiary`, `animation: pulse 1.5s ease-in-out infinite`

---

## Motion

| Interaction | Duration | Easing |
|---|---|---|
| Button press | 100ms | `cubic-bezier(0.4, 0, 0.2, 1)` |
| Card hover | 150ms | `cubic-bezier(0.4, 0, 0.2, 1)` |
| Seat select | 150ms | `cubic-bezier(0.34, 1.56, 0.64, 1)` (slight pop) |
| Seat state change | 200ms | `cubic-bezier(0.4, 0, 0.2, 1)` |
| Modal enter | 200ms | `cubic-bezier(0.34, 1.56, 0.64, 1)` |
| Modal exit | 150ms | `cubic-bezier(0.4, 0, 0.2, 1)` |
| Toast enter | 250ms | `cubic-bezier(0.34, 1.56, 0.64, 1)` |
| Page transition | 200ms | `cubic-bezier(0.4, 0, 0.2, 1)` |
| Countdown tick | 1000ms | `steps(1)` (discrete) |

**Reduced motion:** All transitions → 0ms, countdown updates without animation.

---

## Breakpoints

| Name | Width | Columns |
|---|---|---|
| `mobile` | < 640px | 4 |
| `tablet` | 640–1023px | 8 |
| `desktop` | 1024–1439px | 12 |
| `wide` | ≥ 1440px | 12 (max-width 1400px) |

---

## Seat Map Grid

- **Desktop:** 24px seats, 6px gap, max 26 cols (standard theater)
- **Tablet:** 20px seats, 5px gap
- **Mobile:** 18px seats, 4px gap, horizontal scroll with sticky row labels
- **Screen indicator:** Top bar "SCREEN THIS WAY ▼" centered
- **Aisle gaps:** Double gap (12px) where theater data indicates
- **Row labels:** Sticky left column (A, B, C...), 32px wide
- **Wheelchair spaces:** Rectangular (2× seat width), ♿ icon

---

## Accessibility

- **Contrast:** All state colors meet WCAG AA (4.5:1) on both light/dark backgrounds
- **Focus:** Visible focus ring on all interactive elements (`shadow-focus`)
- **Keyboard:** Seat map navigable with arrow keys, Enter/Space to select, Escape to clear
- **Screen reader:** Each seat has `aria-label="Row A, Seat 5, Available"`; live region for lock countdown
- **Color blind:** State distinguished by shape + icon + label, not color alone
- **Touch targets:** Minimum 44×44px (seat hit area includes padding)

---

## Dark Mode

- System preference (`prefers-color-scheme`) + manual toggle (persisted in localStorage)
- All semantic colors defined for both modes above
- Images/posters: `filter: brightness(0.9)` in dark mode
- Shadows use `rgba(0,0,0,0.3)` base in dark

---

## Implementation Notes

- **CSS Custom Properties** for all tokens (enables theming, dark mode)
- **Tailwind CSS** for utility-first implementation (config maps to tokens above)
- **React + TypeScript** components with strict prop types
- **SVG seat map** for crisp rendering at any zoom; Canvas fallback for 500+ seats
- **Polling** for lock state: 2s interval when user has active locks, 10s otherwise
- **Optimistic UI:** Select → immediate visual feedback → API → confirm/revert