Here's the full spec. Hand this directly to your AI developer.

Stagd Artist Portfolio Page — Build Specification
URL & Routing
Every artist profile lives at stagd.app/[username]. This is a public, unauthenticated route. No login required to view. The page is server-side rendered and SEO-indexed with the artist's name, disciplines, and city in the page title and meta description. Format: Zara Hussain — Muralist, Photographer · Karachi · Stagd.

Page Structure
The page has six sections in order: Navigation, Hero, Identity, Content Navigation, Portfolio Grid, Reviews, Footer. The body background is #FFFFFF. No section has a drop shadow. No gradients anywhere on the page.

Navigation Bar
Fixed height 56px. Sticky — stays at the top as the user scrolls. Background #FFFFFF. Bottom border 1.5px solid #111111. Always visible.
Left: The Stagd wordmark. Small, font-size: 14px, letter-spacing: 3px, font-weight: 700, color #111. This is the only Stagd branding visible above the footer. It links to stagd.app.
Right: Two buttons sitting side by side. Follow button — outlined, border: 1.5px solid #111, border-radius: 100px, padding: 7px 20px, transparent background, font-size: 13px. Hire Me button — filled yellow #FFDE0D, same border-radius and padding, border: 1.5px solid #FFDE0D. Both buttons are always visible regardless of scroll position.
Follow button behaviour: If the viewer is logged in and already following this artist, the button reads "Following" and the border changes to #049839 green. Clicking it unfollows with a confirmation state. If not logged in, clicking Follow opens a lightweight modal prompting sign up or log in. After completing auth, they are returned to the profile and the follow is applied automatically.
Hire Me button behaviour: Described in full in the Hire Me section below.

Hero Section
Full browser width. No horizontal padding. No border-radius. Height is 65vh with a minimum of 480px and a maximum of 640px.
The hero displays the artist's pinned portfolio piece. The artist designates one item as their featured/hero piece from their portfolio management screen. This image fills the full width and height of the hero using object-fit: cover. The focal point defaults to center. In V2 the artist can set a custom focal point.
If the artist has not pinned a hero piece, the system uses their most recently uploaded portfolio item as default.
No text overlays on the hero. No gradient overlays. The image is the full content of this section.
If the pinned piece is a video, it autoplays muted and looped in the hero. No controls visible. No audio.

Identity Section
Padding: 48px 80px 0. White background. No border below this section — the tab bar below it provides the visual separator.
Layout: Two-column flex row, space-between, aligned to flex-start.
Left column:
Artist name in display typeface. font-size: 86px, font-weight: 900, line-height: 0.86, letter-spacing: -2px, text-transform: uppercase, color #111. Name breaks to two lines naturally — do not force single line.
Below the name, a flex row of discipline tags and city. Each discipline is a pill: background: #1CAEE5, color: #FFFFFF, font-size: 11px, font-weight: 600, padding: 4px 13px, border-radius: 100px. A mid-dot separator · in #cccccc sits between the last discipline tag and the city. City is plain text, font-size: 13px, color: #888. After the city, another mid-dot separator, then the artist's Stagd URL displayed as a link in color: #888, text-decoration: none. On hover the URL underlines.
If the artist has listed travel availability as true, a line reads "Open to travel" in font-size: 12px, color: #888 below the discipline row.
Right column:
Availability status on top. If available: text reads ● Available now, color: #049839, font-size: 13px, font-weight: 600, letter-spacing: 0.5px. The dot is the same green. If busy: ● Busy until [month], color: #888. If unavailable: ● Not taking work, color: #999. This is the first thing a client sees in this column — it sits at the top, before the rate.
Starting rate below that. If the artist has set a rate: From PKR [amount], displayed at font-size: 26px, font-weight: 700, color #111. If rates on request: text reads Rates on request at the same size, color #888. No PKR abbreviation expansion — it reads exactly as the artist entered it.
Stats row below the rate. Inline, font-size: 12.5px, color: #888. Format: ★ 4.9 &nbsp; 47 reviews · 2.3k followers · 38 projects. The rating number and review count link to the Reviews section on click (smooth scroll). Follower count and project count are static display.
If the artist has zero reviews, the rating row is hidden entirely. Do not show ★ 0.0 or No reviews yet — just omit it. Once the first review is submitted, the row appears.
Bio: Below the left/right columns, full width, max-width: 560px. The bio sits below the name and stats, before the tab bar. font-size: 14.5px, color: #666, line-height: 1.65. Maximum 150 characters enforced at input. No Read More truncation on desktop — the full bio always shows. padding-bottom: 28px.
Social links: After the bio, a row of icon-only social links. Instagram, Behance, and a globe icon for personal website. Icons at 16px. Color #888. On hover color #111. No text labels. No tooltips in V1. Open in new tab.

Content Navigation (Tab Bar)
Sticky. Sticks at top: 56px — directly below the main nav when scrolled. Height 50px. Background #FFFFFF. Border-bottom 1.5px solid #111111. Padding 0 80px. z-index: 99.
Four tabs: Work, Events, Reviews, About. Default active tab is Work.
Active tab styling: color: #111, border-bottom: 2.5px solid #FFDE0D. The yellow underline sits flush against the bottom border of the tab bar. Inactive tabs: color: #aaa, border-bottom: 2.5px solid transparent. Tab font-size: 13.5px, font-weight: 500. No background on active tab — just the underline.
Tab switching does not navigate to a new page. It shows/hides content sections below using display toggling. Smooth scroll to the content area on tab click.
Work tab (default): Shows the filter chips and portfolio grid.
Events tab: Shows the artist's upcoming events listed on Stagd. Each event is a card — cover image, event name, date, venue, price, Get Tickets button in yellow. If no events: a single line reads "No upcoming events" in color: #888. Past events are not shown on this tab in V1.
Reviews tab: Shows the reviews grid in full. Same content as the Reviews section at the bottom of the Work tab. Smooth scrolls to the reviews section rather than duplicating content — the tab just anchors there.
About tab: Shows the artist's extended bio (if they've written one beyond the 150-char short bio), disciplines in detail, rate card if they've set one, and travel availability. In V1 this is a simple text block. No custom layout.

Filter Chips
Visible only when the Work tab is active. Padding 22px 80px 18px. Flex row, gap 8px.
First chip is always "All." Additional chips are generated dynamically from the artist's discipline tags — only disciplines that have at least one portfolio item tagged to them appear as a filter chip. If an artist only has one discipline, no filter chips are shown (All is redundant).
Inactive chip: border: 1.5px solid #dddddd, border-radius: 100px, padding: 7px 18px, font-size: 13px, color: #888, transparent background.
Active chip: background: #FFDE0D, border: 1.5px solid #FFDE0D, color: #111, font-weight: 500. Only one chip active at a time.
Clicking a filter chip filters the masonry grid below to show only items tagged with that discipline. Items that do not match fade out — do not collapse the grid reflow in V1, just hide them with opacity: 0 and pointer-events: none to avoid layout jump. In V2 animate the reflow.

Portfolio Grid
Padding 0 80px 80px. CSS columns layout: columns: 3, column-gap: 6px. Items use break-inside: avoid, margin-bottom: 6px.
Featured piece: The artist's pinned/featured portfolio item always appears first in the grid. It renders at a taller height than standard pieces — this is the only piece the artist has explicit size control over. In the grid it behaves like any other piece but its natural image proportions are respected without forced height.
The artist can designate any portfolio item as featured from their dashboard. If none is set, the most recent item appears first. The featured piece displays in the first column, first row, and its height should be at minimum 380px to give it visual weight.
Grid items: Each portfolio item is a rectangular container. No fixed height — the image's natural aspect ratio determines the height. object-fit: cover is not used here — images display in their natural proportions. The container has overflow: hidden. No border-radius on grid items — they are flush rectangles with border-radius: 0.
Hover state on grid items: On hover, a solid #111111 overlay slides up from the bottom of the image covering approximately 30% of the item's height. This uses transform: translateY(100%) to translateY(0) with transition: transform 0.2s ease. Inside the overlay: the item title in color: #FFFFFF, font-size: 12.5px, font-weight: 500. Below that, the discipline tag and year in color: #FFDE0D, font-size: 11px, letter-spacing: 0.3px. No border-radius on this overlay.
Clicking a grid item: Opens a full-screen lightbox. The image fills the viewport. Left/right arrows to navigate between portfolio items. ESC to close. Artist name and item details in a bottom bar. In V1 no lightbox for video items — clicking a video item navigates to a dedicated piece page.
Load more: The grid initially renders the first 12 items. If the artist has more than 12 items, a "Load more work" button sits below the grid, centered. border: 1.5px solid #111, border-radius: 100px, padding: 10px 32px, transparent background. Clicking it appends the next 12 items to the grid without a page reload. No infinite scroll in V1.

Hire Me — Guest Enquiry Flow
This is the most important interaction on the page. It must work without a Stagd account.
When the Hire Me button is clicked (from either the nav or anywhere else on the page), a bottom sheet slides up from the bottom of the viewport. The page behind dims with a rgba(0,0,0,0.5) overlay. The bottom sheet has border-radius: 16px 16px 0 0, white background, and sits at a maximum height of 480px.
Bottom sheet contents:
A small drag handle bar at the top centre — width: 40px, height: 4px, background: #ddd, border-radius: 2px, margin: 12px auto.
Heading: "Get in touch with Zara" — the artist's first name is used. font-size: 20px, font-weight: 700, color #111. Below it: "Tell her what you're working on. She'll respond within 48 hours." in font-size: 14px, color: #666.
Four fields:
Your name — text input, required.
Your email — email input, required. This is where the enquiry confirmation and the artist's response will arrive.
What are you looking for? — a dropdown with options drawn from the artist's discipline tags, plus a generic "Something else" option. If the artist only has one discipline this field is skipped.
Tell me about your project — textarea, min-height: 100px, required. Placeholder: "What do you need, rough timeline, and any budget in mind."
Submit button: Full width, background: #FFDE0D, border-radius: 100px, height: 48px, font-size: 15px, font-weight: 600, color #111. Text reads "Send enquiry."
On submit:
Validate all required fields. If validation fails, red border #E24B4A on the failing field, no error toast.
If valid: the bottom sheet content is replaced with a confirmation state. Green circle with a tick — the same celebration moment as ticket confirmation. Text: "Sent to Zara." Subtext: "You'll hear back at [their email]. We've sent you a copy too." A single "Done" button closes the sheet.
Behind the scenes: the enquiry is created in the commissions table with status enquiry. The artist receives a push notification and email. The guest receives a confirmation email with the enquiry details. The guest email is stored on the commission record — if they later create a Stagd account with the same email, the commission history links to their account automatically.
No account wall. No "sign up to track your enquiry" prompt in V1. Just send and confirm.

Reviews Section
Visible at the bottom of the Work tab content, below the portfolio grid. Also anchored to the Reviews tab.
Section heading: "Reviews" in font-size: 22px, font-weight: 700. Below it: "★ 4.9 average across 47 projects" in font-size: 13px, color: #888. The star rating is calculated as a true average of all submitted ratings, rounded to one decimal place.
Grid: Two columns, gap: 12px.
Each review card: border: 1.5px solid #111, border-radius: 16px, padding: 22px. No shadow.
Inside each card: reviewer name, font-size: 14px, font-weight: 600. Star rating displayed as a pill — background: #111, color: #FFDE0D, font-size: 11px, padding: 4px 10px, border-radius: 100px. Review body text, font-size: 13.5px, color: #555, line-height: 1.6, maximum 150 characters as enforced at input. Below the body: project type, location, and year in font-size: 11px, color: #bbb, letter-spacing: 0.3px.
Initial load shows the 4 most recent reviews. If more exist, a "See all reviews" link below the grid in color: #888, text-decoration: underline. Clicking it expands to show all reviews inline — no new page.
Reviews are only submittable by clients who have a completed commission with this artist. The review prompt appears to the client after the commission is marked complete. Creatives cannot review themselves. Neither party can edit a submitted review in V1.

Footer
Background #111111. Padding 36px 80px. Three-column flex row, space-between, align-items center.
Left: STAG'D wordmark in white, font-size: 13px, letter-spacing: 3px, font-weight: 700.
Centre: Links — About, For Creatives, Events, Contact. font-size: 12px, color: #666, gap: 28px. On hover color: #aaa.
Right: stagd.app · Pakistan's creative economy platform. font-size: 11px, color: #444.

Responsive Behaviour
This spec covers desktop — 1024px and above. Below 1024px the mobile layout from the Figma brief takes over. The two layouts share no CSS — they are separate layout branches controlled by a single breakpoint media query. Do not attempt to make the desktop layout responsive — it degrades. The mobile layout is its own thing.

Performance Requirements
Artist profile pages are statically generated at build time and revalidated when the artist updates their profile. Image assets are served via Cloudflare CDN. The portfolio grid images are lazy-loaded below the fold. The hero image is eager-loaded — it is above the fold and must not flash. Core Web Vitals target: LCP under 2.5 seconds on a 4G mobile connection.