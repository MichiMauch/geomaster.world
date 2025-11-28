# Swiss Guesser - UI/UX Design Concept

## 1. Design System

### 1.1 Farbpalette

#### Primärfarben
| Name | Hex | Verwendung |
|------|-----|------------|
| Indigo Primary | `#4E5CFF` | CTAs, aktive Elemente, Links, Akzente |
| Indigo Light | `#6B77FF` | Hover-States, sekundäre Akzente |
| Indigo Dark | `#3A47CC` | Pressed-States |

#### Akzentfarben
| Name | Hex | Verwendung |
|------|-----|------------|
| Gold Accent | `#FFB03A` | Punkte, Scores, Achievements, Rankings |
| Gold Light | `#FFCC70` | Highlights bei Erfolg |
| Success | `#10B981` | Positive Feedback, korrekte Antworten |
| Error | `#EF4444` | Fehler, Timeout, negative States |

#### Hintergrund & Oberflächen (Dark Mode)
| Name | Hex | Verwendung |
|------|-----|------------|
| Background | `#0A0A0F` | Haupthintergrund |
| Surface-1 | `#12121A` | Cards, Container |
| Surface-2 | `#1A1A25` | Elevated Cards, Modals |
| Surface-3 | `#242432` | Inputs, interaktive Bereiche |
| Glass | `rgba(255,255,255,0.05)` | Glassmorphism-Elemente |
| Glass-Border | `rgba(255,255,255,0.1)` | Subtle Borders |

#### Text
| Name | Hex | Verwendung |
|------|-----|------------|
| Text Primary | `#FFFFFF` | Überschriften, wichtige Texte |
| Text Secondary | `#A0A0B0` | Body-Text, Labels |
| Text Muted | `#606070` | Placeholder, deaktivierte Elemente |

### 1.2 Typografie

```
Font Family: Inter (Variable Font)

Hierarchy:
- Display:    48px / 56px line-height / -0.02em / Bold (700)
- H1:         32px / 40px line-height / -0.02em / Bold (700)
- H2:         24px / 32px line-height / -0.01em / Semibold (600)
- H3:         20px / 28px line-height / -0.01em / Semibold (600)
- Body:       16px / 24px line-height / 0em / Regular (400)
- Body Small: 14px / 20px line-height / 0em / Regular (400)
- Caption:    12px / 16px line-height / 0.01em / Medium (500)
- Label:      11px / 14px line-height / 0.05em / Semibold (600) / UPPERCASE
```

### 1.3 Spacing System

```
Base Unit: 4px

Scale:
- xs:   4px
- sm:   8px
- md:   16px
- lg:   24px
- xl:   32px
- 2xl:  48px
- 3xl:  64px
- 4xl:  96px
```

### 1.4 Border Radius

```
- None:   0px      (Karten-Ecken bei voller Breite)
- sm:     4px      (kleine Buttons, Tags)
- md:     8px      (Inputs, kleine Cards)
- lg:     12px     (Cards, Container)
- xl:     16px     (Modals, große Cards)
- 2xl:    24px     (Hero-Sections)
- full:   9999px   (Pills, Avatare, runde Buttons)
```

### 1.5 Shadows & Elevation

```
Dark Mode Shadows (Glow-Effekte statt klassischer Schatten):

- Elevation-1: 0 0 20px rgba(78, 92, 255, 0.1)    // Subtle Glow
- Elevation-2: 0 0 40px rgba(78, 92, 255, 0.15)   // Card Glow
- Elevation-3: 0 0 60px rgba(78, 92, 255, 0.2)    // Modal Glow

Focus Ring:
- 0 0 0 2px #0A0A0F, 0 0 0 4px #4E5CFF

Score Glow (Gold):
- 0 0 30px rgba(255, 176, 58, 0.3)
```

### 1.6 Glassmorphism Spezifikation

```css
.glass-card {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
}

.glass-card-elevated {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.12);
}
```

### 1.7 Motion & Animation

```
Timing Functions:
- ease-smooth: cubic-bezier(0.4, 0, 0.2, 1)    // Standard
- ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1) // Playful
- ease-out:    cubic-bezier(0, 0, 0.2, 1)      // Exit

Durations:
- instant:  100ms  (Micro-interactions, Hover)
- fast:     200ms  (Buttons, Toggles)
- normal:   300ms  (Cards, Transitions)
- slow:     500ms  (Page Transitions, Modals)

Specific Animations:
- Score Pop:     300ms ease-bounce, scale 0.8 → 1.1 → 1
- Marker Drop:   400ms ease-bounce, translateY(-20px) → 0
- Card Entrance: 300ms ease-smooth, opacity + translateY(10px)
- Distance Line: 600ms ease-out, stroke-dashoffset animation
```

---

## 2. Komponenten-Spezifikationen

### 2.1 MapContainer

**Beschreibung:**
Vollbild-Kartenansicht als zentrales Spielelement. Nimmt den gesamten verfügbaren Platz ein, mit überlagerten UI-Elementen.

**Struktur:**
```
┌─────────────────────────────────────────┐
│  [RoundHeader - floating oben]          │
│                                         │
│                                         │
│           INTERAKTIVE KARTE             │
│        (Mapbox / Google Maps)           │
│                                         │
│                                         │
│  [ActionBar - floating unten]           │
└─────────────────────────────────────────┘
```

**Styling:**
- Karte: Dark-Themed Map Style (Mapbox Dark, oder custom)
- Keine sichtbaren Container-Borders
- UI-Elemente "schweben" über der Karte
- Gradient-Overlay am unteren Rand für bessere Lesbarkeit der ActionBar

**States:**
- Default: Karte bereit für Interaktion
- Marker gesetzt: Pulsierender Marker an Position
- Ergebnis: Linie von Guess zu korrekter Position

### 2.2 MarkerPlacement

**Beschreibung:**
Der Marker, den Spieler auf der Karte platzieren.

**Visual Design:**
```
      ╭─────╮
      │  ▼  │  ← Indigo Primary (#4E5CFF)
      ╰──┬──╯
         │
         ●      ← Schatten-Punkt
```

**Varianten:**
- **Player Marker (eigener Tipp):**
  - Farbe: Indigo Primary
  - Pulsierender Ring um Basis
  - Drop-Shadow mit Glow

- **Correct Location Marker:**
  - Farbe: Success Green
  - Stern/Pin-Icon
  - Sanftes Pulsieren

- **Other Player Marker (Multiplayer):**
  - Kleine Kreise mit Avatar-Initial
  - Halbtransparent
  - Erscheinen nach Reveal

**Animation:**
- Drop-In: 400ms bounce, von oben einfallen
- Pulsieren: Kontinuierlicher Scale-Pulse (1 → 1.1 → 1)

### 2.3 RoundHeader

**Beschreibung:**
Schwebendes Header-Element während des Spiels mit Ortsnamen und Rundeninfo.

**Layout (Mobile):**
```
┌──────────────────────────────────────┐
│ ← Zurück    Runde 2 • Ort 3/5    ⏱️  │
├──────────────────────────────────────┤
│                                      │
│       "Wo liegt Appenzell?"          │
│                                      │
│         Bisher: 127 km               │
└──────────────────────────────────────┘
```

**Styling:**
- Glassmorphism-Card
- Padding: 16px
- Border-Radius: 16px
- Position: fixed, top: 16px, left/right: 16px
- Z-Index: über Karte

**Elemente:**
- Back-Button: Ghost-Button, nur Icon
- Runden-Info: Caption, Text-Secondary
- Timer: Monospace, mit Icon, wird rot bei < 10s
- Ortsname: H2, Text-Primary, zentriert
- Bisherige Distanz: Body Small, Gold Accent

### 2.4 ScorePopup

**Beschreibung:**
Modal/Overlay das nach jedem Tipp erscheint und das Ergebnis zeigt.

**Layout:**
```
┌─────────────────────────────────────┐
│                                     │
│            ⭐ 847 km                │
│                                     │
│      ───────────────────────        │
│      Linie auf Mini-Map zeigt       │
│      Guess → Correct Location       │
│      ───────────────────────        │
│                                     │
│     [        Weiter         ]       │
│                                     │
└─────────────────────────────────────┘
```

**Styling:**
- Erscheint von unten (slide-up)
- Glassmorphism-Background
- Distanz in großer Display-Schrift
- Gold-Glow um Distanz-Zahl
- Mini-Map zeigt beide Punkte und Linie

**Animation Sequence:**
1. Overlay fades in (200ms)
2. Karte zoomt auf beide Punkte
3. Linie wird animiert gezeichnet (600ms)
4. Score "popt" rein (300ms bounce)
5. "Weiter"-Button fades in

### 2.5 ScoreboardTable

**Beschreibung:**
Ranglisten-Tabelle für Leaderboard-Ansicht.

**Layout:**
```
┌─────────────────────────────────────────┐
│  #   Spieler              Distanz       │
├─────────────────────────────────────────┤
│  🥇  Anna M.              234 km   ←─── │
│  🥈  Peter S.             456 km        │
│  🥉  Maria K.             512 km        │
│  4   Thomas B.            678 km        │
│  5   Lisa W.              891 km        │
│  ─────────────────────────────────────  │
│  8   Du                   1.204 km ←─── │ (highlighted)
└─────────────────────────────────────────┘
```

**Styling:**
- Container: Surface-1 mit Border
- Rows: Alternating subtle background
- Top 3: Medal-Emoji, leicht goldener Hintergrund
- Eigene Position: Highlighted mit Indigo-Border links
- Distanz: Monospace, rechtsbündig

**Features:**
- "Diese Woche" / "Gesamt" Toggle
- Sticky eigene Position am unteren Rand wenn nicht sichtbar
- Animierte Positionsänderungen

### 2.6 PlayerCard

**Beschreibung:**
Kompakte Spieler-Darstellung in Listen und Lobbies.

**Layout:**
```
┌─────────────────────────────────────┐
│  ┌────┐                             │
│  │ AM │  Anna Müller          Admin │
│  └────┘  anna@example.com           │
└─────────────────────────────────────┘
```

**Varianten:**
- **List Item:** Horizontal, kompakt
- **Lobby Card:** Größer, mit Ready-Status
- **Score Card:** Mit Distanz/Punkten

**Styling:**
- Avatar: Initials auf Indigo-Gradient, 40x40px, rounded-full
- Name: Body, Text-Primary
- Subtitle: Caption, Text-Secondary
- Status-Badge: Pill mit Icon

### 2.7 ActionBar (Submit/Next Button Area)

**Beschreibung:**
Fixer Bereich am unteren Bildschirmrand für Hauptaktionen.

**Layout:**
```
┌─────────────────────────────────────────┐
│                                         │
│   [        Tipp abgeben        ]        │
│                                         │
│          "Setze einen Marker"           │
│                                         │
└─────────────────────────────────────────┘
```

**Styling:**
- Fixed bottom
- Padding: 16px, safe-area-inset-bottom
- Gradient-Overlay zum Hintergrund
- Button: Full-width, 56px Höhe
- Hilfstext darunter wenn kein Marker gesetzt

**Button States:**
- Disabled: Wenn kein Marker gesetzt
- Loading: Spinner + "Wird gesendet..."
- Ready: Volle Farbe, bereit zum Klick

---

## 3. Seiten-Layouts

### 3.1 LoginPage

**Beschreibung:**
Einstiegsseite mit Branding und Login-Option.

**Layout:**
```
┌─────────────────────────────────────┐
│                                     │
│                                     │
│            🇨🇭                      │
│                                     │
│       SWISS GUESSER                 │
│                                     │
│  "Teste dein Wissen über die        │
│   Schweizer Geografie"              │
│                                     │
│                                     │
│   ┌─────────────────────────────┐   │
│   │  G  Mit Google anmelden     │   │
│   └─────────────────────────────┘   │
│                                     │
│                                     │
│                                     │
│  ─────────────────────────────────  │
│  Abstrakte Schweiz-Silhouette als   │
│  subtiler Hintergrund-Gradient      │
│  ─────────────────────────────────  │
│                                     │
└─────────────────────────────────────┘
```

**Besonderheiten:**
- Animierte Gradient-Wellen im Hintergrund (subtil)
- Logo mit leichtem Glow
- Zentriertes, minimales Layout
- Google-Button im Outlined-Style

### 3.2 HomePage (Gruppenübersicht)

**Beschreibung:**
Dashboard nach Login mit allen Gruppen des Users.

**Layout:**
```
┌─────────────────────────────────────┐
│  Swiss Guesser              [Menu]  │
├─────────────────────────────────────┤
│                                     │
│  Deine Gruppen                      │
│                                     │
│  ┌─────────────────────────────┐    │
│  │  Familie Müller        →    │    │
│  │  5 Orte/Runde • 4 Mitgl.    │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │  Büro Challenge        →    │    │
│  │  3 Orte/Runde • 8 Mitgl.    │    │
│  └─────────────────────────────┘    │
│                                     │
│                                     │
│  ─────── oder ───────               │
│                                     │
│  [+  Neue Gruppe erstellen    ]     │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ Code: [________] [Beitreten]│    │
│  └─────────────────────────────┘    │
│                                     │
└─────────────────────────────────────┘
```

**Grupenkarte Details:**
- Glassmorphism-Card
- Hover: Leichtes Lift + Glow
- Chevron-Icon rechts
- Aktive Spiel-Indikator (Badge)

### 3.3 JoinGroupPage

**Beschreibung:**
Seite zum Beitreten einer Gruppe via Einladungscode.

**Layout:**
```
┌─────────────────────────────────────┐
│  ← Zurück                           │
├─────────────────────────────────────┤
│                                     │
│         Gruppe beitreten            │
│                                     │
│  ┌─────────────────────────────┐    │
│  │                             │    │
│  │      [  _  _  _  _  _  ]    │    │  ← Code-Input (6 Felder)
│  │                             │    │
│  └─────────────────────────────┘    │
│                                     │
│     Gib den 6-stelligen Code        │
│     von deiner Einladung ein        │
│                                     │
│  ┌─────────────────────────────┐    │
│  │       Beitreten             │    │
│  └─────────────────────────────┘    │
│                                     │
└─────────────────────────────────────┘
```

**Besonderheiten:**
- OTP-Style Input (einzelne Felder)
- Auto-focus auf nächstes Feld
- Validierung mit Shake-Animation bei Fehler
- Success: Kurzer Konfetti-Effekt

### 3.4 LobbyPage (Gruppen-Detail)

**Beschreibung:**
Zentrale Seite einer Gruppe mit Spiel-Optionen und Mitgliedern.

**Layout:**
```
┌─────────────────────────────────────┐
│  ← Zurück          Familie Müller   │
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────────────┐    │
│  │  🎮  SPIELEN                │    │
│  │                             │    │
│  │  KW 48 • Runde 2 verfügbar  │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌──────────┐  ┌──────────────┐     │
│  │ 🏋️ Train │  │ 📊 Rangliste │     │
│  └──────────┘  └──────────────┘     │
│                                     │
│  ───────────────────────────────    │
│                                     │
│  Mitglieder (4)                     │
│                                     │
│  ┌─────────────────────────────┐    │
│  │ AM  Anna Müller      Admin  │    │
│  │ PS  Peter Schmidt    ✓ Rnd2 │    │
│  │ MK  Maria Koch       ✓ Rnd2 │    │
│  │ TB  Thomas Berg      Rnd1   │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌─────────────────────────────┐    │
│  │  🔗 Einladungslink kopieren │    │
│  └─────────────────────────────┘    │
│                                     │
└─────────────────────────────────────┘
```

**Admin-Features (nur für Admins sichtbar):**
- "Runde freigeben" Button
- "Spiel beenden" Button
- "Orte verwalten" Link

### 3.5 GamePage (Aktives Spiel)

**Beschreibung:**
Vollbild-Spielansicht während einer Runde.

**Layout:**
```
┌─────────────────────────────────────┐
│ ┌─────────────────────────────────┐ │
│ │ ←    Runde 2 • Ort 3/5    ⏱ 45 │ │
│ ├─────────────────────────────────┤ │
│ │      "Wo liegt Zermatt?"        │ │
│ │         Bisher: 127 km          │ │
│ └─────────────────────────────────┘ │
│                                     │
│                                     │
│                                     │
│          [ KARTE ]                  │
│                                     │
│          Marker bei Klick           │
│                                     │
│                                     │
│                                     │
│ ╔═════════════════════════════════╗ │
│ ║                                 ║ │
│ ║   [    Tipp abgeben     ]       ║ │
│ ║                                 ║ │
│ ╚═════════════════════════════════╝ │
└─────────────────────────────────────┘
```

**Interaktions-Flow:**
1. Spieler sieht Ortsname
2. Klickt auf Karte → Marker erscheint
3. Kann Marker verschieben
4. Klickt "Tipp abgeben"
5. ScorePopup erscheint

### 3.6 ResultPage (Runden-/Spielende)

**Beschreibung:**
Zusammenfassung nach Rundenende mit Leaderboard.

**Layout:**
```
┌─────────────────────────────────────┐
│                                     │
│       🎉 Runde 2 beendet!          │
│                                     │
│  ┌─────────────────────────────┐    │
│  │                             │    │
│  │     Deine Distanz:          │    │
│  │        ⭐ 234 km            │    │
│  │                             │    │
│  │     Platz 2 von 4           │    │
│  │                             │    │
│  └─────────────────────────────┘    │
│                                     │
│  Diese Runde:                       │
│  ┌─────────────────────────────┐    │
│  │  1. Anna M.        89 km    │    │
│  │  2. Du            234 km ←  │    │
│  │  3. Peter S.      345 km    │    │
│  │  4. Maria K.      567 km    │    │
│  └─────────────────────────────┘    │
│                                     │
│  [    Zur Gruppenübersicht    ]     │
│                                     │
└─────────────────────────────────────┘
```

**Variante "Spiel beendet":**
- Größeres Finale-Banner
- Gesamt-Leaderboard
- Konfetti-Animation bei Top 3

---

## 4. Interaktionen & Micro-Animations

### 4.1 Button-Interaktionen

```
Hover (Desktop):
- Background: +5% brightness
- Transform: translateY(-1px)
- Shadow: erhöht
- Duration: 100ms

Active/Pressed:
- Transform: scale(0.98)
- Background: -5% brightness
- Duration: 50ms

Focus:
- Focus-Ring erscheint
- Duration: instant
```

### 4.2 Card-Interaktionen

```
Hover:
- Transform: translateY(-2px)
- Shadow/Glow: erhöht
- Border: heller
- Duration: 200ms ease-smooth

Click:
- Transform: scale(0.99)
- Duration: 100ms
```

### 4.3 Score-Animation

```
Sequence beim Tipp-Ergebnis:

1. Karte zoomt sanft auf beide Punkte (600ms)
2. Linie wird gezeichnet:
   - stroke-dasharray: [length]
   - stroke-dashoffset: [length] → 0
   - Duration: 600ms ease-out
3. Score-Zahl:
   - Scale: 0.5 → 1.1 → 1
   - Opacity: 0 → 1
   - Duration: 300ms ease-bounce
   - Gold-Glow pulsiert kurz auf
```

### 4.4 Marker-Placement

```
Beim Setzen des Markers:

1. Marker fällt von oben ein:
   - translateY: -30px → 0
   - Duration: 400ms ease-bounce

2. Aufprall-Effekt:
   - Kleiner Kreis expandiert und fadet
   - Scale: 1 → 2
   - Opacity: 0.5 → 0
   - Duration: 300ms

3. Pulsierender Basis-Ring:
   - Scale: 1 → 1.2 → 1
   - Opacity: 0.5 → 0.2 → 0.5
   - Loop, 2s duration
```

### 4.5 Timer-Animation

```
Normal (>10s):
- Statische Anzeige
- Text-Secondary Farbe

Warning (<10s):
- Farbe wechselt zu Error-Red
- Sanftes Pulsieren
- Scale: 1 → 1.05 → 1 (1s loop)

Timeout:
- Shake-Animation
- Flash zu rot
- "Zeit abgelaufen!" erscheint
```

### 4.6 Page Transitions

```
Zwischen Seiten:

Exit:
- Opacity: 1 → 0
- Transform: translateX(0) → translateX(-10px)
- Duration: 200ms ease-out

Enter:
- Opacity: 0 → 1
- Transform: translateX(10px) → translateX(0)
- Duration: 300ms ease-smooth
```

---

## 5. Responsive Breakpoints

```
Mobile First Approach:

- xs:  < 480px   (kleine Phones)
- sm:  ≥ 480px   (große Phones)
- md:  ≥ 768px   (Tablets)
- lg:  ≥ 1024px  (kleine Desktops)
- xl:  ≥ 1280px  (große Desktops)
- 2xl: ≥ 1536px  (Wide Screens)
```

### Mobile-spezifische Anpassungen:

- **Touch Targets:** Minimum 44x44px
- **Bottom Navigation:** Safe-area für Notch/Home-Indicator
- **Karte:** Vollbild, UI floating
- **Inputs:** 16px font-size (verhindert iOS Zoom)

### Desktop-spezifische Anpassungen:

- **Karte:** Kann links sein, Sidebar rechts
- **Leaderboard:** Kann neben Karte angezeigt werden
- **Hover-States:** Aktiviert

---

## 6. Accessibility

### Farbkontraste
- Text auf Hintergründen: mindestens 4.5:1
- Große Texte: mindestens 3:1
- UI-Komponenten: mindestens 3:1

### Keyboard Navigation
- Alle interaktiven Elemente fokussierbar
- Logische Tab-Reihenfolge
- Sichtbare Focus-Indikatoren

### Screen Reader
- Semantisches HTML
- ARIA-Labels für Icons
- Live-Regions für Score-Updates

### Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 7. Zusammenfassung der Kern-Ästhetik

**Visual Identity:**
- Dark, elegant, modern
- Glassmorphism als Hauptelement
- Indigo als Brand-Farbe
- Gold für Gamification/Scores
- Minimale, dünne Linien
- Großzügiger Whitespace

**Feeling:**
- Premium & polished
- Spielerisch aber nicht kindisch
- Schnell & responsive
- Vertraut (GeoGuessr-Mechanik)
- Unique durch Dark Mode + Glass

**Inspirationen kombiniert:**
- GeoGuessr: Gameplay-Flow
- Figma: Interface-Klarheit
- Linear: Polish & Transitions
- Notion: Typografie & Spacing

---

*Dieses Konzept wartet auf Bestätigung. Bei "GO CODE" beginnt die technische Umsetzung mit Tailwind CSS und shadcn/ui Komponenten.*
