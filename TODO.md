# Stagd Web — Implementation Plan v1.1
_Last updated: 2026-05-10_

---

## Scope

This plan covers backend wiring, data integration, and feature completion for the web app.
**Portfolio page UI is out of scope for this version** — the ControlTemplate design is not being touched.

---

## Phase 1 — Schema Migrations

The database is missing tables and columns that the codebase already expects. Everything else depends on this being correct first.

| # | Migration | Details |
|---|-----------|---------|
| 1.1 | `projects` table | ControlTemplate relies on `profile.projects` — table doesn't exist yet |
| 1.2 | `portfolio_items.category` | Column missing from schema, used in types + mock data |
| 1.3 | `artist_profiles.detailed_bio` | Field missing, used in About overlay |
| 1.4 | `artist_profiles.featured_item_id` | FK to portfolio_items — pinned hero piece |
| 1.5 | `social_links` columns on `artist_profiles` | instagram, behance, website — typed in ArtistPublicProfile but not in DB |
| 1.6 | `follows` table | users → artists follow relationship, needed for follow system |
| 1.7 | `spots_remaining` on ticket_tiers | Derived value (capacity − sold tickets) via Postgres function + trigger |

---

## Phase 2 — Supabase Data Integration

Flip `MOCK_ENABLED = false` in `src/lib/api.ts` and fix all queries to match the real schema.

| # | Function | What changes |
|---|----------|-------------|
| 2.1 | `getArtistProfile` | Fix join — add projects, reviews, follower_count, social_links |
| 2.2 | `searchArtists` | Write proper Supabase select with discipline + city filters |
| 2.3 | `searchEvents` | Proper query with ticket_tiers join + spots_remaining |
| 2.4 | `getEvent` | Full event + tiers + organiser join |
| 2.5 | `getArtistEvents` | Query by organiser_id, filter status = live |
| 2.6 | `purchaseTicket` | Real INSERT into tickets + trigger spots_remaining decrement |
| 2.7 | `verifyTicket` | Real SELECT + UPDATE scanned_at, return `already_used` if already scanned |

---

## Phase 3 — Commission Submit

Wire `CommissionEnquiry.handleSubmit` to actually write to the DB.
Currently it's just a `setTimeout` — no data is saved.

- INSERT into `commissions` table with status `enquiry`
- Map the 4-step form fields to `brief_what`, `brief_budget`, `brief_timeline`
- Requires user to be logged in (commission table has `client_id NOT NULL`)
- On success → navigate to `/inbox?with=[artist_username]`

---

## Phase 4 — Follow System

| # | Task |
|---|------|
| 4.1 | `follows` migration (Phase 1.6) must be done first |
| 4.2 | Add `followArtist`, `unfollowArtist`, `isFollowing`, `getFollowerCount` to `api.ts` |
| 4.3 | Wire Follow button in ControlTemplate — currently renders but does nothing |
| 4.4 | Show live `follower_count` from DB in the specs panel |

---

## Phase 5 — Auth-Gated Follow Modal _(partial)_

When a logged-out user clicks Follow:
- Show a lightweight sign-up / log-in modal
- After auth completes, auto-apply the follow and close the modal
- Depends on Supabase Auth session being fully wired end-to-end

---

## Phase 6 — Ticket Verify Accuracy _(partial)_

- `spots_remaining` must be kept accurate via the trigger from Phase 1.7
- `verifyTicket` marks `scanned_at` and returns `already_used` on second scan
- Cannot fully test without Supabase instance confirming the trigger fires correctly

---

## Execution Order

```
Phase 1 (schema) → Phase 2 (Supabase) → Phase 3 (commission) → Phase 4 (follow) → Phase 5 → Phase 6
```

Phases 1 and 2 are blockers for everything else.
Phases 3 and 4 can be done in parallel once Phase 2 is complete.
Phases 5 and 6 are last — most dependent on auth and DB triggers being stable.

---

## Out of Scope (v1.1)

- Portfolio page UI rebuild to spec
- Safepay payment integration
- Push notifications
- Email delivery (commission confirm, guest enquiry)
- Reviews submission UI (display only)
