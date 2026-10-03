# Changelog

Release notes for the Everyday adult mental-wellness learning program.

## [6.1.0] - 2026-10-03

### Changed

- Replaced the Adults 18+, Parents, Students 18+ and Employees 18+ landing-page card images with muted, looping, autoplaying videos (`adults.mp4`, `parents.mp4`, `students.mp4`, `employees.mp4`).
- Card videos use the same cover sizing as the previous images. The analytics opt-out tile and the program detail pages still use images.

## [6.0.0] - 2026-10-02

### Added

- Added reversible analytics opt-out and opt-in controls. Opting out removes the current browser from the server-side unique visitor count.
- Added an all-time unique-country total alongside the unique-browser count. Country totals use Vercel's two-letter country code and exclude unknown locations.
- Made the visitor badge navigate to the analytics opt-out tile.

### Changed

- Refreshed the hero video and opt-out tile image.
- Simplified the visitor badge and improved how analytics state is reflected in the interface.
- Extended `GET /api/visitors` to return `countries` with `count`; added `DELETE /api/visitors` for removing a browser registration.

### Compatibility and deployment

- Existing program routes and audio-preview behavior remain available.
- Visitor counting still requires `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` on the server.
- This release does not add enrollment, accounts, scheduling, payments, lesson delivery, quizzes, or certificates.

## [5.1.0] - 2026-10-02

- Release tag recorded; repository history contains no code changes specific to this tag.

## [5.0.0] - 2026-10-02

- Added a server-side unique-browser counter backed by Upstash Redis, with first-party browser IDs and privacy-conscious hashing.
- Finalized the landing-page tile audio controls.

## [4.0.0] - 2026-10-01

- Added sequential program-preview playback and associated landing-page presentation updates.

## [3.0.0] - 2026-10-01

- Added a mobile-specific hero video and responsive, horizontally navigable program tiles.

## [2.0.0] - 2026-10-01

- Refined the landing-page introduction with a timed reveal of the program tiles and a non-looping hero video.

## [1.0.0] - 2026-09-30

- Established the landing page with an autoplaying hero video and audio previews for the program tiles.