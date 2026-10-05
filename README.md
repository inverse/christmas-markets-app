# Berlin Christmas Markets Map

A web application for discovering and navigating the festive Christmas markets in Berlin.

## Features

- **Full-Screen Map:** View all Berlin Christmas markets at a glance.
- **Interactive Pins:** Locate markets with festive-themed markers.
- **Market Details:** Detailed popups featuring descriptions, addresses, operating dates, hours, and admission information.
- **Market List:** Browse all available markets via the integrated menu.
- **Operating Status:** Automatically highlights whether a market is currently open.
- **Geolocation:** Quickly locate yourself on the map with the 'Find Me' button.
- **Installable:** Add the map to your home screen for a full-screen, app-like experience.
- **Night Mode:** Follows your system theme by default, with a day/night switch in the menu that darkens the map and every panel.
- **Shareable Links:** Every market has its own URL, and the browser Back button closes the open panel rather than leaving the app.
- **Social Share Cards:** Links unfurl in Slack, iMessage and social posts with a branded 1200×630 preview image.

## Getting Started

### Prerequisites

This project uses [mise](https://mise.jdx.dev/) to manage development tools (Node.js, etc.), ensuring consistent environments.

Install managed tools:

```bash
mise install
```

### Setup

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

## Development

To briefly share your local development build via a secure tunnel (which also displays a QR code in your terminal for easy mobile scanning):

```sh
npm run dev:tunnel
```

## Testing

The project uses [vitest](https://vitest.dev/) for testing. Pre-commit hooks (`husky`/`lint-staged`) are automatically set up during `npm install` to ensure code quality before every commit.

Run all tests:

```bash
npm run test
```

## Deployment

The code is deployed to Cloudflare Pages with the SvelteKit `adapter-cloudflare`
and leverages wrangler for that:

```bash
npm run publish:web
```

## Edge Caching

A `_headers` file in the project root sets Cloudflare Pages cache headers for
the deployed assets:

| Path | Cache-Control | Notes |
|---|---|---|
| `/manifest.json`, `/robots.txt` | `public, max-age=86400` | 1 day at the edge |
| `/_app/immutable/*` | `public, max-age=31536000, immutable` | Filenames are content-hashed; never rename them manually |
| `/icons/*` | `public, max-age=604800` | 7 days; filenames are NOT hashed |

### Updating an icon

Icon filenames are unversioned, so a changed icon may serve stale for up to 7
days. Either accept the delay, rename the file (and update `static/manifest.json`
and `app.html` references), or purge the cache early (below).

### Social share image

`static/icons/og-image.png` is the 1200×630 card that Open Graph and X render
when the app is shared. Its editable source is
`static/icons/og-image-raw.svg`, which embeds the Playfair Display and Inter
woff2 files as base64 so it renders identically offline, with no font CDN.

The tags that point at it live in `src/routes/+layout.svelte`. They build the
absolute URL from the request origin (see `src/routes/+layout.ts`) rather than
hardcoding a host, so dev tunnels and production emit identical markup. This
matters: crawlers fetch `og:image` out of band and cannot resolve a relative
one, so a bare `/icons/og-image.png` yields no card at all.

To restyle the card, edit the raw SVG and re-render it to PNG at 1200×630 -
either a 1:1 browser screenshot at that viewport, or a headless Chromium
`page.screenshot` with `clip: { width: 1200, height: 630 }` and
`deviceScaleFactor: 1`.

Crawlers cache share images far longer than browsers cache the asset, so a
refreshed card may not appear on a re-share. Re-test with a cache-busting
query string (`/icons/og-image.png?v=2`), or the Facebook Sharing Debugger and
LinkedIn Post Inspector.

### Purging the edge cache early

Dashboard method:

1. Go to https://dash.cloudflare.com -> **inberlin.fyi**
2. **Caching** -> **Configuration** -> **Purge Cache**
3. Choose **Custom Purge** -> **By URL**, list the full URLs, e.g.
   `https://inberlin.fyi/icons/icon-512.png`
4. Purge. Takes effect within ~30 seconds.

API equivalent (needs a zone API token):

```bash
curl -X POST "https://api.cloudflare.com/client/v4/zones/f53e898ab37f83e72970929246100047/purge_cache" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"files":["https://inberlin.fyi/icons/icon-512.png","https://inberlin.fyi/manifest.json"]}'
```

Note: purging clears Cloudflare's edge copy. Browser caches hold their own copy,
so users with an already-cached icon still see the old one until its `max-age`
runs out - renaming the file is the only way to bypass that.
