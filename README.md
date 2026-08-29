# Berlin Christmas Markets Map

A web application for discovering and navigating the festive Christmas markets in Berlin.

## Features

- **Full-Screen Map:** View all Berlin Christmas markets at a glance.
- **Interactive Pins:** Locate markets with festive-themed markers.
- **Market Details:** Detailed popups featuring descriptions, addresses, operating dates, hours, and admission information.
- **Market List:** Browse all available markets via the integrated menu.
- **Operating Status:** Automatically highlights whether a market is currently open.
- **Geolocation:** Quickly locate yourself on the map with the 'Find Me' button.

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

The code is deployed to cloudflare workers and leverages wrangler for that. You can do that with the following command:

```bash
npm run build
```

