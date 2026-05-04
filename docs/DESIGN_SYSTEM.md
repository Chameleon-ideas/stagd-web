# Stagd Design System
*Extracted from Brand Guidelines PDF — May 2026*
*This is the canonical reference. When in doubt, check here first.*

---

## 1. COLOUR

### Foundations
| Name | Hex | Role |
|------|-----|------|
| Signal Yellow | `#FFDE0D` | Primary accent — e-stamp, price tags, active states, CTAs |
| Ink Black | `#111111` | Foundation — dark mode, high-impact moments |
| Pure White | `#FFFFFF` | Foundation — avoid as body background |

### Accent Colours (event categories)
| Name | Hex | Category |
|------|-----|----------|
| Poster Red | `#E63946` | Concert / Music |
| Sky Cyan | `#1CAEE5` | Workshop / Open / Class |
| Karachi Green | `#649839` | Community / Music (secondary) |
| Market Orange | `#FF5A1F` | Markets / Crafts / Photography |
| Civic Lime | `#D6F23B` | Outdoor / Daytime / Dance / Pottery |

### Neutrals / Surfaces
| Name | Hex | Role |
|------|-----|------|
| Cream | `#F4F1E6` | Primary background (light mode) |
| Paper | `#ECE6D5` | App/card background — preferred for warmth |
| Newsprint | `#E8E4D2` | Secondary surface |
| Mid Grey | `#666666` | Labels / metadata |

### Colour Role Rules
- **Signal Yellow**: NEVER as body text or background for long reading. Only functional markers.
- **Accent colours**: One accent per card. Never mix more than two in one composition.
- **Neutrals**: Cream and Paper are default backgrounds. Use Ink Black for dark mode and high-impact moments.
- **Pure white**: Avoid as body background — Paper is preferred for warmth.

### Fallback Poster — Colour by Event Type
| Type | Background |
|------|-----------|
| Concert / Music (gig) | Poster Red `#E63946` |
| Workshop / Class | Sky Cyan `#1CAEE5` |
| Market / Free (market) | Signal Yellow `#FFDE0D` |
| Film / Theatre | Ink Black `#111111` + yellow ghost numeral |
| Poetry | Cream `#F4F1E6` |
| Dance | Signal Yellow `#FFDE0D` |
| Photography | Market Orange `#FF5A1F` |
| Pottery | Civic Lime `#D6F23B` |
| Music (community) | Karachi Green `#649839` |

---

## 2. TYPOGRAPHY

Four typefaces. Each has a specific role. Do not swap them.

### Display — Anton
- Source: Google Fonts
- Weight: 400 (inherently bold)
- **USAGE: ALL-CAPS HEADLINES ONLY**
- Scale:
  - Hero / Event title: 80–120px
  - Section heading (Display): 48px
  - Card title / UI label (Subhead): 28px

### Body — DM Sans
- Source: Google Fonts
- Weights available: 300 · 400 · 500 · 600 · **700**
- Usage: Paragraphs, labels, buttons, navigation, meta
- Scale:
  - Large / Lead: 20px
  - Body (standard): **16px / 1.65 line-height**
  - Small / Card meta: **13px**
- **Buttons use DM Sans 700, uppercase**

### Editorial Serif — Playfair Display
- Source: Google Fonts
- Weights: 400–700 (normal + italic)
- **USAGE: SPARINGLY — editorial contrast only**
- Use for: pull quotes, artist feature intros, editorial moments, cultural context
- Never use for UI, navigation, or data

### Mono — JetBrains Mono
- Source: Google Fonts
- Weights: 400 · 500 · 700
- Usage: Labels, chips/tags, section labels, metadata, dates, specs, prices
- Tags/chips: **10px · 0.1em tracking · ALL CAPS**

### Type Pairing Examples
- Event card: Mono metadata (category, number) → Anton title → Mono date/venue
- Editorial feature: Mono label → Anton heading → Playfair Display italic lead
- Web feed card: Category badge (mono) → Anton title → Mono date+venue below

---

## 3. SHAPE & BORDERS

- **Border radius: 0px on everything** — cards, buttons, inputs, tags, chips, images
- The ONLY exception: Status stamps may use `border-radius: 2px` max (visually still square)
- **No drop shadows**
- **No blur effects**
- **No rounded corners on cover images**
- Rules (dividers): 1–1.5px solid, structural, flush to content grid — never floating

---

## 4. VISUAL DNA — Graphic Devices

Six recurring devices that define the brand. Use purposefully, not decoratively.

### 1. Diagonal Stripe
- 135° repeating line pattern
- Used as texture on fallback posters (no photo) and urgency overlay
- Stripe on event card with no image — the category colour IS the poster

### 2. Volume / Ghost Numbers
- Oversized numerals layered behind text at low opacity
- Used for editorial hierarchy (e.g., "04" ghost on Theatre fallback poster)
- Anton, large, same hue as background but slightly darker

### 3. Yellow Anchors
- Signal Yellow used as a functional marker: price chips, active dots ("NOW PLAYING"), CTAs
- Yellow chip = price, status, highlight — always square, always readable

### 4. Mono Metadata
- Data presented as design: flush-left, JetBrains Mono rows with thin ruled lines between
- Format: `SAT 2 MAY · 8 PM · T2F GARDEN`
- Use dot-separator (·) between metadata fields

### 5. Colour Field
- Full-bleed solid colour divisions — entire card is the colour
- Poster-inspired grid splits — multiple solid colour blocks in one composition
- No gradients within colour fields

### 6. Status Stamps
- Square-cornered label chips for state communication
- `FREE` — Signal Yellow fill, Ink Black text
- `TONIGHT` — outlined, cream text
- `SOLD OUT` — Poster Red fill, white text
- `LAST FEW` — outlined
- `NEW` — Signal Yellow fill, Ink Black text
- `PICK` — Signal Yellow fill, Ink Black text
- Font: JetBrains Mono, 10px, 0.1em tracking, ALL CAPS

---

## 5. IMAGE SYSTEM

### Four-Layer Rule (non-negotiable)
1. **Frame** — Fixed aspect ratio. Platform decides which. User never picks freely.
2. **Treatment** — Black gradient on bottom 50% of EVERY cover image. Non-negotiable.
3. **Furniture** — Yellow price chip, mono metadata, Anton title. Fixed positions (bottom-left on mobile, bottom-left on web).
4. **Fallback** — When no image: category colour + diagonal stripe + event type. NEVER a grey square.

### Six Aspect Ratios
| Ratio | Use | Dimensions |
|-------|-----|-----------|
| 3:4 | Event hero (primary) | 1080×1440 |
| 1:1 | Profile / square | 1080×1080 |
| 4:5 | Feed cards | 1080×1350 |
| 2:3 | List thumb | 800×1200 |
| 9:16 | Story / reel | 1080×1920 |
| **16:9** | **Web hero** | **1920×1080** |

### Three Image Treatments
1. **Editorial Gradient** (default, everywhere)
   - Black-to-transparent gradient on bottom 50%
   - Applied to ALL images, even dark ones
   - Type sits in the dark zone — always readable

2. **Brand Tint** (editorial features / Stagd Picks only)
   - Signal Yellow multiply over image
   - NEVER the default — reserved for editorial features
   - When used, the image becomes secondary

3. **Urgency / Status Overlay**
   - Diagonal stripe + 55% black flat
   - Used for: SOLD OUT, FREE (status moments)
   - Image becomes texture, not the focus

### Web-Specific Rules
- Aspect ratios: 16:9 hero, 4:3 thumbs, 4:5 feed cards
- Yellow chip: **top-left** on desktop (left-to-right reading order)
- Status badge: top-right (price chip) or top-left (type/status)
- Position type at bottom-left, status at top — always
- Feed layout: large featured card left + smaller thumbnails in right column

### Fallback Poster Rules
- Title auto-sizes: ≤2 words → 48px, 3–4 words → 36px, 5+ words → 24px
- Always Anton, always uppercase, always tight tracking
- Even with zero metadata, the fallback ships — title alone is enough
- Date, venue, price added progressively as user fills form

### DO / DON'T
✅ DO:
- Always crop to a brand aspect ratio
- Always apply the editorial gradient — even on dark images
- Strip EXIF and re-encode on upload
- Generate a fallback poster when no image is provided
- Position type at bottom-left, status at top, always
- Re-crop, don't re-stretch, when changing aspect

❌ DON'T:
- Show user images without the gradient overlay
- Allow free-form crops or aspect ratios
- Use grey placeholder squares — fallbacks always
- Round corners on cover images
- Add drop shadows or blur effects
- Place type without the dark gradient under it
- Stretch images to fit; always letterbox the fallback

---

## 6. LAYOUT PRINCIPLES

### Newsstand Grid
Cards are treated as magazine covers — self-contained, rectangular, event title dominating. Use full bleed; white space is earned, not defaulted to.

### Asymmetric Emphasis
Titles are oversized. Supporting information is deliberately smaller. There is always one element that commands attention — prevent visual equality at all costs.

### Ruled Lines
Rules (1–2px) separate content in a newspaper-style manner. They are structural, not decorative. Use flush to the content grid, never floating.

### Web Content Width
- Max content width: **1200px**
- Breakpoints: 640px · 1024px · 1280px
- Body text min: 16px
- Hero headline: 80–120px Anton

---

## 7. COMPONENTS

### Buttons
- All square corners (border-radius: 0)
- Font: **DM Sans 700, uppercase**
- Three variants:
  - **Primary**: Ink Black fill, white text (BOOK TICKET style)
  - **Accent**: Signal Yellow fill, Ink Black text (EXPLORE NOW style)
  - **Secondary/Outlined**: transparent fill, Ink Black border + text (SAVE EVENT style)
- Min touch target: 44×44px

### Tags & Chips
- **Square corners (border-radius: 0)** — NOT pill shape
- Font: JetBrains Mono, 10px, 0.1em tracking, ALL CAPS
- Category chip colours match accent system
- Status stamps: see Visual DNA section

### Form Inputs
- 1.5px border, square corners (0px radius)
- DM Sans 14px
- Focus: 2px yellow outline (offset)
- Placeholder: muted, DM Sans

### Event Card Structure
```
[Category badge · top-left]          [Price chip · top-right]
[Cover image with gradient overlay — full bleed]
[NO. XX · CATEGORY — mono, small]
[EVENT TITLE — Anton, large, white]
[DATE · TIME · VENUE — mono, small, white]
[Tier name — DM Sans]    [PKR PRICE — yellow chip]
```

---

## 8. MOTION

### Easing
- **Primary**: `cubic-bezier(0.16, 1, 0.3, 1)` — Expo Out
- Content comes in fast, settles confidently. Objects have weight.

### Duration
| Context | Duration |
|---------|---------|
| Micro UI (hover, tap feedback) | 240ms |
| Card entrance / list reveal | 320ms |
| Page transitions | 400ms |
| Max allowed | 500ms |

### Stagger
- Multiple cards/list items: stagger entrance by **40ms per item**
- Creates editorial rhythm without feeling mechanical

### Use For
- Page and screen transitions
- Card entrance / list reveal
- Loading / skeleton states
- Tap/press feedback (scale)

### Avoid
- Looping decorative animations
- Long, cinematic transitions (>600ms)
- Parallax for its own sake
- Motion that blocks content access

---

## 9. VOICE & TONE

Stagd speaks like a knowledgeable friend who actually goes out. Not corporate, not sycophantic, not try-hard.

| Principle | Rule |
|-----------|------|
| **In the know** | Context and trust. Don't over-explain. |
| **Direct** | Short sentences. Active voice. No jargon. |
| **Rooted** | Real place names, real community references. Karachi is home. |
| **Enthusiastic, not hype** | Describe; don't cheerlead. No "amazing", "epic", "must-see". |

### Format
✅ `"Sounds of Lyari · SAT 2 MAY · PKR 1,500 · T2F Garden"`
✅ `"Five nights worth showing up for."`
❌ `"🔥 AMAZING concert you CANNOT miss this weekend!!"`
❌ `"Discover incredible experiences near you!"`

---

## 10. PLATFORM SPECS — WEB

| Spec | Value |
|------|-------|
| Max content width | 1200px |
| Body text min | 16px |
| Line height (body) | 1.65 |
| Breakpoints | 640 · 1024 · 1280 |
| Hero headline | 80–120px Anton |
| Button radius | 0px |
| Focus ring | 2px Signal Yellow, offset |
| Image: web hero | 16:9 (1920×1080) |
| Image: feed cards | 4:5 |
| Image: thumbs | 4:3 |

---

*Stagd · Design System Reference · Chameleon Ideas · May 2026*
