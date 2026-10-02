# Everyday adult mental-wellness learning program

A Vercel-ready website using the supplied cinematic images, finished hero video and four voice previews. The visitor counter uses a Vercel serverless function and an Upstash Redis database.

The landing page contains a compact project identity and one cinematic panel: the full hero video above four compact image cards. Cards use four columns on desktop, two at tablet widths and one on mobile. Descriptions are readable HTML text over the images, and the existing program pages remain available at the routes below.

## Deploy to your repository and Vercel

1. Upload the CONTENTS of this project to `gmanojisaac/adult-mental-wellness`. `package.json`, `vercel.json`, `src/` and `scripts/` must be at the repository root, not inside another folder. Keep the ZIP out of the repository.
2. In Vercel, Add New → Project → import that repository.
3. Framework preset: **Other**. Build command: **npm run build**. Output directory: **dist**. These settings are already included in `vercel.json`.
4. Deploy. Test all four program links and speaker buttons on the generated URL.

## Local preview

Requires Node.js 20 or later. Run `npm run dev` and open `http://localhost:3000`. Run `npm run build` to create `dist/`.

## Unique visitor counter

The top-left badge shows all-time unique browser profiles and all-time countries seen, excluding browsers that have opted out. The browser stores a random first-party ID in local storage; the `/api/visitors` function hashes that ID and stores it in an Upstash Redis set. On Vercel, a two-letter country code comes from the `x-vercel-ip-country` header; the app stores only that coarse country code, not an IP address or personal profile data. Local preview requests without that header do not add a country. Clearing local storage or using a private window creates a new browser ID and can increase the visitor count again. The fifth image tile can be used to opt out or back in; opting out removes the browser ID, while previously counted country codes remain as aggregate all-time totals.

Create an Upstash Redis database and configure `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` as server-side environment variables in the Vercel project. Set the same variables in the shell before running `npm run dev` to test locally. The badge remains hidden if the API is unavailable or the Redis variables are missing. Never expose the Redis token in browser code.

## Page routes

- `/` landing page
- `/programs/adults/` — 52 weeks, non-parent adults 18+
- `/programs/parents/` — 52 weeks, parents supporting minor children without diagnosing them
- `/programs/students/` — 4 weeks, students 18+
- `/programs/employees/` — 4 weeks, employees 18+

## Audio and video

The hero autoplays muted, loops, and uses contain sizing to keep the whole frame visible. Its central Unmute button turns on video sound and enables the card previews. If the browser blocks autoplay, the same button offers manual playback. Separate pause/play and mute controls remain available; native video controls are retained when JavaScript is unavailable.

Unmute the hero or select Enable audio previews to start narration after a 400ms mouse hover; moving away stops and resets it. Only one preview plays at once. Each card has an independent speaker button for touch and keyboard users: tap it, or focus it and press Enter or Space, to play or stop. A speaker button also enables previews. Mute audio previews stops and resets playback and cancels pending hover playback; Escape stops the current preview. Card links open the matching program overview. Starting a preview mutes the hero while its video keeps playing; unmuting the hero stops previews. Playback failures have an accessible message.

Assets live in `src/assets/`. Uploaded PNGs were converted into smaller WebP images; visual content was preserved. Supplied MP3 and MP4 files are unchanged. Card descriptions remain real HTML text.

## Scope of this first version

This is the landing page and four program overview pages. Enrollment, accounts, scheduling, payments, WhatsApp reminders, lesson delivery, quizzes and certificates require the separate progress-app implementation. No working enrollment/payment form is presented. The supplied hero video did not include a caption file; add verified captions and a transcript before public release. No credentials are included.
