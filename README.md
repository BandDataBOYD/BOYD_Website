# Bring Out Yer Dead — website

Static site for bringoutyerdead.net. Plain HTML, CSS and JavaScript, no build step. Hosted on Cloudflare Pages.

- `index.html` — main page
- `epk/index.html` — hidden press kit (noindex), also reachable at /EPK via `_redirects`
- `css/site.css`, `js/site.js` — shared styles and scripts
- `img/` — photos, logo, stage plot
- Hosted on Cloudflare Pages (project `boyd-website`), auto-deploys from `main`
- Forms post to Cloudflare Pages Functions in `functions/api/`: signups go to the Brevo fan club list, contact messages are emailed via Brevo. Both need the `BREVO_API_KEY` secret set in the Cloudflare project.
- Setlists: `functions/api/setlists.js` pulls the latest setlists from setlist.fm every 6 hours. It needs the `SETLISTFM_API_KEY` secret; without it the page shows the fallback list in `js/site.js`.
