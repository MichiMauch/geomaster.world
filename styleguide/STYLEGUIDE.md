# GeoMaster World - Styleguide

## Design Philosophy
Dark mode gaming interface with neon aesthetics, glassmorphism effects, and smooth animations.

---

## Colors

### Primary (Cyan)
```css
--primary: #00D9FF
--primary-light: #5CE6FF
--primary-dark: #00A8C6
--primary-glow: rgba(0, 217, 255, 0.4)
```

### Accent (Orange)
```css
--accent: #FF6B35
--accent-light: #FF8F66
--accent-glow: rgba(255, 107, 53, 0.5)
```

### Semantic
```css
--success: #00FF88
--success-glow: rgba(0, 255, 136, 0.4)
--error: #FF3366
--error-glow: rgba(255, 51, 102, 0.5)
--warning: #FF6B35
```

### Surfaces (Dark Mode)
```css
--background: #0F1419
--surface-1: #1A1F26
--surface-2: #242B35
--surface-3: #2E3744
```

### Glass Effects
```css
--glass-bg: rgba(255, 255, 255, 0.03)
--glass-bg-elevated: rgba(255, 255, 255, 0.06)
--glass-border: rgba(255, 255, 255, 0.08)
--glass-border-elevated: rgba(255, 255, 255, 0.12)
```

### Text
```css
--text-primary: #FFFFFF
--text-secondary: #C8D3E0
--text-muted: #9FAFBF
```

---

## Typography

### Fonts
- **Headings:** Montserrat (font-heading)
- **Body:** Open Sans (font-sans)
- **Mono:** System monospace (font-mono)

### Scale
```css
.text-display   /* 48px/56px, -0.02em, 700 */
.text-h1        /* 32px/40px, -0.02em, 700 */
.text-h2        /* 24px/32px, -0.01em, 600 */
.text-h3        /* 20px/28px, -0.01em, 600 */
.text-body      /* 16px/24px, 400 */
.text-body-small /* 14px/20px, 400 */
.text-caption   /* 12px/16px, 0.01em, 500 */
.text-label     /* 11px/14px, 0.05em, 600, uppercase */
```

---

## Components

### Button (`@/components/ui/Button`)

**Variants:**
- `primary` - Cyan with glow, uppercase
- `secondary` - Surface background, border
- `ghost` - Transparent, text only
- `outline` - Border only
- `accent` - Orange with glow
- `success` - Green with glow
- `danger` - Red with glow
- `glass` - Glassmorphism

**Sizes:**
- `sm` - h-9, px-3, text-sm
- `md` - h-11, px-5, text-base (default)
- `lg` - h-14, px-8, text-lg
- `xl` - h-16, px-10, text-xl
- `icon` - h-11, w-11
- `icon-sm` - h-9, w-9
- `icon-lg` - h-14, w-14

**Props:**
- `isLoading` - Shows spinner
- `disabled` - Disabled state

```tsx
import { Button } from "@/components/ui/Button";

<Button variant="primary" size="md">Click me</Button>
<Button variant="accent" isLoading>Loading...</Button>
```

### Card (`@/components/ui/Card`)

**Variants:**
- `surface` - bg-surface-1, border
- `elevated` - bg-surface-2, shadow
- `glass` - Glassmorphism
- `glass-elevated` - Elevated glass
- `interactive` - Hover effects, cursor pointer
- `highlight` - Primary border, glow
- `ghost` - Transparent

**Padding:**
- `none`, `sm` (p-3), `md` (p-4), `lg` (p-6), `xl` (p-8)

```tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";

<Card variant="elevated" padding="lg">
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>Content here</CardContent>
</Card>
```

### Input (`@/components/ui/Input`)

**Sizes:** `sm`, `md`, `lg`
**Variants:** `default`, `error`, `success`

```tsx
import { Input } from "@/components/ui/Input";

<Input size="md" placeholder="Enter text" />
<Input variant="error" placeholder="Error state" />
```

### FloatingInput (`@/components/ui/FloatingInput`)

Input with animated floating label.

```tsx
import { FloatingInput } from "@/components/ui/FloatingInput";

<FloatingInput
  id="email"
  label="Email"
  type="email"
  value={value}
  onChange={(e) => setValue(e.target.value)}
  error="Error message"
/>
```

### Badge (`@/components/ui/Badge`)

**Variants:** `default`, `primary`, `accent`, `success`, `warning`, `error`, `outline`
**Sizes:** `sm`, `md`, `lg`

```tsx
import { Badge, MedalBadge } from "@/components/ui/Badge";

<Badge variant="success" size="md">Active</Badge>
<MedalBadge position={1} /> {/* Gold medal */}
```

### Avatar (`@/components/ui/Avatar`)

**Sizes:** `sm`, `md`, `lg`, `xl`, `2xl`

```tsx
import { Avatar, AvatarWithStatus } from "@/components/ui/Avatar";

<Avatar size="lg" name="John Doe" />
<Avatar size="lg" src="/avatar.jpg" name="John" />
<AvatarWithStatus size="lg" name="Online" status="online" />
```

**Status options:** `online`, `offline`, `away`, `ready`

### ToggleSwitch (`@/components/ui/ToggleSwitch`)

**Sizes:** `sm`, `md`, `lg`

```tsx
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";

<ToggleSwitch
  checked={isEnabled}
  onChange={() => setIsEnabled(!isEnabled)}
  size="md"
  disabled={false}
/>
```

---

## CSS Utility Classes

### Glass & Surface
```css
.glass-card              /* Glass background with blur */
.glass-card-elevated     /* Elevated glass */
.surface-card            /* Surface-1 background */
.surface-card-elevated   /* Surface-2 with shadow */
```

### Glows
```css
.glow-primary            /* Cyan box glow */
.glow-primary-lg         /* Large cyan glow */
.glow-accent             /* Orange glow */
.glow-success            /* Green glow */
.glow-error              /* Red glow */
```

### Text Glows
```css
.text-glow-primary       /* Cyan text shadow */
.text-glow-success       /* Green text shadow */
.text-glow-error         /* Red text shadow */
.text-glow-accent        /* Orange text shadow */
```

---

## Animations

### Entry Animations
```css
.animate-fade-in         /* Opacity 0 to 1 */
.animate-slide-up        /* Slide from bottom */
.animate-card-entrance   /* Card slide in */
.animate-score-pop       /* Scale bounce for scores */
.animate-marker-drop     /* Marker drop from top */
```

### Continuous
```css
.animate-pulse-ring      /* Pulsing ring effect */
.animate-shake           /* Error shake */
.animate-gradient        /* Gradient shift */
```

### Timer Animations
```css
.animate-timer-normal    /* Cyan pulse (normal) */
.animate-timer-warning   /* Orange pulse (≤10s) */
.animate-timer-critical  /* Red shake (≤5s) */
```

---

## Spacing

```css
--spacing-xs: 4px
--spacing-sm: 8px
--spacing-md: 16px
--spacing-lg: 24px
--spacing-xl: 32px
--spacing-2xl: 48px
--spacing-3xl: 64px
```

---

## Border Radius

```css
--radius-sm: 4px
--radius-md: 8px
--radius-lg: 12px
--radius-xl: 16px
--radius-2xl: 24px
--radius-full: 9999px
```

---

## Transitions

```css
--ease-smooth: cubic-bezier(0.4, 0, 0.2, 1)
--ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1)
--ease-out: cubic-bezier(0, 0, 0.2, 1)

--duration-instant: 100ms
--duration-fast: 200ms
--duration-normal: 300ms
--duration-slow: 500ms
```

---

## Tailwind Color Classes

All CSS variables are available as Tailwind classes:

```
bg-background, bg-surface-1, bg-surface-2, bg-surface-3
bg-primary, bg-primary-light, bg-primary-dark
bg-accent, bg-accent-light
bg-success, bg-error, bg-warning
bg-glass-bg, bg-glass-border

text-text-primary, text-text-secondary, text-text-muted
text-primary, text-accent, text-success, text-error

border-glass-border, border-glass-border-elevated
```

---

## Best Practices

1. **Use semantic colors** - success for positive, error for negative, warning for caution
2. **Prefer glass effects** for overlays and modals
3. **Use surface levels** for depth hierarchy (surface-1 → surface-2 → surface-3)
4. **Apply glows sparingly** - only for emphasis and interactive elements
5. **Use Montserrat for headings**, Open Sans for body text
6. **Animations should be subtle** - use duration-fast (200ms) for most interactions
7. **Maintain contrast** - text-primary on dark backgrounds, text-muted for secondary info
