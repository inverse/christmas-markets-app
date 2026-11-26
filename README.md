# Berlin Christmas Markets Map

A web application for discovering and navigating the festive Christmas markets in Berlin.

## Features

- **Full-Screen Map:** View all Berlin Christmas markets at a glance.
- **Interactive Pins:** Locate markets with festive-themed markers.
- **Tours & Experiences:** Bookable festive tours, cruises and workshops (via GetYourGuide affiliate links) appear as berry pins on the map and as a scrollable strip in the menu.
- **Market Details:** Detailed popups featuring descriptions, addresses, operating dates, hours, and admission information.
- **Market List:** Browse all available markets via the integrated menu.
- **Operating Status:** Automatically highlights whether a market is open today; planned dates use the same status logic.
- **Plan a Visit:** Pick a date in the menu to see which markets are open that day; map icons and list statuses follow the chosen date. The date is kept in the URL (`?date=YYYY-MM-DD`) so plans can be shared; **Back to today** returns to the live view.
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

## Operations

Edge caching, social share image regeneration, and cache purging live in
[docs/runbook.md](docs/runbook.md) - not needed for development.
