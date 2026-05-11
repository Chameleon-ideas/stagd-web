# Stag'd Web — Project Status Report
_Generated: 2026-05-12_

---

## TL;DR

The original Implementation Plan v1.1 is **fully complete**. The codebase has gone significantly beyond it — the full 5-stage commissions workflow (which was out of scope in v1.1) has been built, including proposals, payment tracking, invoicing, completion handshake, and reviews. The project is in a feature-complete state for its core loop. What remains is integration work: a real payment gateway, email/push delivery, the guest enquiry path, and a few missing DB migration files.

---

## Implementation Plan v1.1 — Status by Phase

### Phase 1 — Schema Migrations ✅ COMPLETE

| # | Migration | Status | Notes |
|---|-----------|--------|-------|
| 1.1 | `projects` table | ✅ Done | API + UI fully wired |
| 1.2 | `portfolio_items.category` | ✅ Done | In types, API, and UI |
| 1.3 | `artist_profiles.detailed_bio` | ✅ Done | Migration `20260510000000` |
| 1.4 | `artist_profiles.featured_item_id` | ✅ Done | Migration `20260510000000`, FK to portfolio_items |
| 1.5 | Social links columns (instagram, behance, website) | ✅ Done | In `updateArtistProfile` and types |
| 1.6 | `follows` table | ✅ Done | API functions + FollowAuthModal UI wired |
| 1.7 | `spots_remaining` via function + trigger | ✅ Done | DB function `get_spots_remaining()` + view in migration |

---

### Phase 2 — Supabase Data Integration ✅ COMPLETE

`MOCK_ENABLED` was removed entirely — all calls are live against Supabase.

| # | Function | Status |
|---|----------|--------|
| 2.1 | `getArtistProfile` | ✅ Full join: projects, reviews, follower_count, social_links, bank details |
| 2.2 | `searchArtists` | ✅ Discipline + city filters |
| 2.3 | `searchEvents` | ✅ With ticket_tiers join + spots_remaining |
| 2.4 | `getEvent` | ✅ Full event + tiers + organiser, supports UUID or slug |
| 2.5 | `getArtistEvents` | ✅ Queries by organiser_id, filters live status |
| 2.6 | `purchaseTicket` | ✅ Real INSERT + QR generation |
| 2.7 | `verifyTicket` | ✅ SELECT + UPDATE scanned_at, returns `already_used` on second scan |

---

### Phase 3 — Commission Submit ✅ COMPLETE (+ enhanced)

The original plan was just a basic INSERT. What was actually built:

- `submitCommission()` — real DB write, status `enquiry`
- `uploadBriefReference()` — reference image upload to Supabase Storage
- On success navigates to `/messages?with=[username]` (plan said `/inbox` — functionally the same)
- Multi-step form: discipline → deliverable → details (deadline, duration, budget, PKR input) → reference image → confirm

**Gap:** Commission currently requires a logged-in user (`if (!user) return`). The portfolio page spec describes a guest enquiry flow (name + email fields, no account required). This is not implemented.

---

### Phase 4 — Follow System ✅ COMPLETE

| # | Task | Status |
|---|------|--------|
| 4.1 | `follows` migration | ✅ Done |
| 4.2 | `followArtist`, `unfollowArtist`, `isFollowing`, `getFollowerCount` in api.ts | ✅ Done |
| 4.3 | Follow button wired in profile — FollowAuthModal | ✅ Done |
| 4.4 | Live `follower_count` from DB | ✅ Done |

---

### Phase 5 — Auth-Gated Follow Modal ✅ COMPLETE

`FollowAuthModal.tsx` exists and is wired into `ProfileClient.tsx`. Shows sign-up/log-in prompt for logged-out users. Auth callback preserves return URL.

---

### Phase 6 — Ticket Verify Accuracy ✅ COMPLETE

- `spots_remaining` is a computed DB view (not a stored column), always accurate
- `verifyTicket` marks `scanned_at` and returns `already_used` on second scan
- Door scanner page (`/scanner`) is fully built with live QR decoding

---

## Features Built Beyond the v1.1 Plan

These were either out of scope in v1.1 or not mentioned at all.

### Full 5-Stage Commissions Workflow
The spec described this as net-new work not yet built. It is now fully implemented:

| Stage | Feature | Components |
|-------|---------|------------|
| 1 | Brief submission (enquiry) | `CommissionEnquiry.tsx`, `BriefCard.tsx` |
| 2 | Proposal negotiation | `ProposalCard.tsx`, `ProposalForm.tsx`, sendProposal / acceptProposal / declineProposal |
| 3 | Payment tracking | `updatePaymentStatus` — unpaid → partially_paid → fully_paid |
| 4 | Delivery + completion handshake | `requestCompletion` / `confirmCompletion` / `rejectCompletion` |
| 5 | Post-completion review | `submitCommissionReview` — only available after status = completed |

### Commission Infrastructure
- **Invoice generation** — `sendInvoice()`, writes to `invoices` table with auto-numbered invoice IDs
- **Payment status log** — every payment status change is logged to `payment_status_log`
- **System messages** — commission status transitions post system messages into the thread automatically
- **Proposal versioning** — proposals have a `version` field, old proposals become `superseded` when a new one is sent
- **Artist bank details** — `bank_account_title`, `bank_name`, `bank_account_number`, `bank_iban` stored on artist profile

### Real-Time Messaging
- Full inbox at `/messages` with left/center/right pane layout
- Real-time via Supabase `postgres_changes` + broadcast channels
- File attachments: images (jpg, png, gif, webp, svg), audio (mp3, wav, ogg, flac, m4a), video (mp4, mov, webm) — up to 20MB
- Hide/soft-delete conversations per user
- Report user from within a thread

### Events Platform (Beyond Basic)
- **Event draft management** — saveDraftEvent, publishEvent, cancelEvent, getMyDraftEvents
- **Event URL slugs** — `/events/[slug]` in addition to `/events/[id]` (migration `20260512000000`)
- **Event reviews** — `submitEventReview`, `EventReviewsSection` component
- **Share button** — `ShareButton.tsx` on event pages
- **Attendee count** — live display on event page
- **Organiser bar** — `OrganizerBar.tsx` with artist profile context

### Portfolio Management
- **Drag-and-drop reordering** — projects and project items via `@dnd-kit`
- **Lightbox** — full-screen image viewer with left/right navigation, owner-only edit mode
- **Two portfolio templates** — `ControlTemplate` (primary) and `ZineTemplate` (alt layout)
- **Project system** — artists group portfolio items into named projects with cover image, discipline, location, year
- **Batch linking** — `linkPortfolioItemToProject` links existing items to a project

### Auth & Profiles
- **FollowAuthModal** — auth gate with return URL preservation
- **ISR** — profile pages revalidate every 60 seconds (`export const revalidate = 60`)
- **Admin client lookup** — server-side username resolution bypasses RLS for public profile pages

---

## What Is Genuinely Left

### P0 — Gaps in Current Features

| Item | Detail |
|------|--------|
| **Guest enquiry flow** | Portfolio page spec requires commission submission without an account (name + email fields, no auth). Current `CommissionEnquiry.tsx` hard-requires `user` from `useAuth()`. |
| **Missing DB migrations** | `available_from`, `invoice_auto_send`, `bank_account_title/name/number/iban`, `invoices` table, `payment_status_log` table are all used in `api.ts` and `route.ts` but have **no migration file** in `supabase/migrations/`. The columns must exist in the live DB but can't be reproduced from the migration history. Write migrations for these. |

### P1 — Integrations Not Built

| Item | Detail |
|------|--------|
| **Payment gateway** | `updatePaymentStatus` manually flags payment but no actual money moves. Safepay was listed in the spec. The invoices table is ready; it needs a payment initiation step. |
| **Email delivery** | Spec: artist gets email on new enquiry, guest gets confirmation copy. Not implemented — `sendInvoice` writes a record but doesn't send email. No email provider is wired. |
| **Push notifications** | Spec: artist receives push notification on new commission. Not implemented anywhere. |

### P2 — Portfolio Page vs. Spec Gaps

The portfolio page build spec (`docs/Stagd Artist Portfolio Page — Build Specification.md`) was listed as out of scope in v1.1 but describes the target design precisely. Current state of `ProfileClient.tsx` needs a spec audit against these items:

| Spec Item | Likely Status |
|-----------|--------------|
| Hero image (65vh, featured_item_id, eager-load) | Partial — `featured_item_id` field exists, verify it's used as hero |
| Filter chips (discipline-based, "All" + per-discipline) | Unknown — needs ProfileClient audit |
| Portfolio grid (CSS columns, 3-col, no border-radius, hover overlay) | Unknown |
| Load more (initial 12, append next 12 on click) | Unknown |
| Availability callout in identity section | Unknown |
| "From PKR" rate display | Unknown |
| Stats row (rating, reviews, followers, projects) — hide if 0 reviews | Unknown |
| Social links row (globe icon only — no brand icons) | Unknown |
| Events tab showing upcoming events | Likely done — getArtistEvents is fetched server-side |
| Reviews tab anchor scroll | Unknown |
| About tab with detailed_bio | Unknown |
| Footer spec (dark background, 3-column) | Unknown — Footer.tsx exists |
| Mobile layout (separate layout below 1024px) | Not started — desktop only confirmed |

### P3 — Out of Scope But Noted

| Item | Note |
|------|------|
| Reviews submission prompt | Spec: review prompt appears to client after commission completed. Backend ready (`submitCommissionReview` requires `completed` status). UI prompt after `confirmCompletion` — verify this exists in messages flow. |
| Video lightbox / dedicated piece page | Spec: clicking a video item goes to a dedicated page. Not built per spec. |
| Custom hero focal point (V2) | Spec explicitly defers to V2. |
| Grid reflow animation on filter (V2) | Spec explicitly defers to V2. |

---

## File Map — Key Locations

| Area | Path |
|------|------|
| Commission brief modal | `src/components/portfolio/CommissionEnquiry.tsx` |
| Brief display (in thread) | `src/components/commissions/BriefCard.tsx` |
| Proposal card | `src/components/commissions/ProposalCard.tsx` |
| Proposal form | `src/components/commissions/ProposalForm.tsx` |
| Messages / full workflow | `src/app/messages/page.tsx` |
| All DB write ops | `src/app/api/db/route.ts` |
| Data access layer | `src/lib/api.ts` |
| Type definitions | `src/lib/types.ts` |
| Profile page (server) | `src/app/profile/[username]/page.tsx` |
| Profile page (client) | `src/app/profile/[username]/ProfileClient.tsx` |
| Follow button w/ auth gate | `src/components/portfolio/FollowAuthModal.tsx` |
| Portfolio template | `src/components/portfolio/ControlTemplate.tsx` |
| DB migrations | `supabase/migrations/` |

---

## Commission Status State Machine

```
enquiry → in_discussion → in_progress → delivered → completed
                ↕ (proposal negotiation loop)
              cancelled (from any state)
```

Payment states run in parallel: `unpaid → partially_paid → fully_paid`

---

_Report generated from codebase audit on 2026-05-12._
