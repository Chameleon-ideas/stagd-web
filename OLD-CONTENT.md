# Old Content Extraction - Artist Portfolio Page

## Layout Structure
- **Navigation**: Sticky header (standard).
- **Split Layout**:
    - **Left Column (35%)**: Fixed editorial info.
        - Avatar (Square, 56x56).
        - Status/Location metadata.
        - Artist Name (Display font, large).
        - Bio (Body font).
        - Stats (Projects, Followers, Rating).
        - Upcoming Event Card.
    - **Right Column (65%)**: Horizontal scroll showcase.
        - Full-height portfolio images.
        - Mono overlay with Category and Title.
- **Floating Actions**: Message and Hire buttons.

## Extracted Content (Mock/Template Data)
- **Profile Fields**:
    - `full_name`: Artist's full name.
    - `avatar_url`: Square avatar image.
    - `bio`: Short bio (max 150 chars).
    - `city`: Location.
    - `project_count`: Number of projects.
    - `follower_count`: Number of followers.
    - `review_average`: Rating.
- **Events**:
    - `title`, `starts_at`, `venue_name`, `city`.
- **Portfolio Items**:
    - `image_url`, `title`, `category`.

## Visual Design
- **Colors**: Uses CSS variables (`--bg`, `--text`, `--border-color`, `--color-yellow`, `--color-ink`).
- **Typography**: Uses display, body, and mono fonts.
- **Aesthetic**: Brutalist, editorial, mono-style overlays.
