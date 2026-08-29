# Berlin Christmas Markets Map

A web application for discovering Christmas markets in Berlin.

## Features

- **Full Screen Map:** Visualize all Christmas markets across Berlin.
- **Interactive Pins:** Markets are represented by "christmas" themed pins on the map.
- **Popups:** Click on a pin to reveal details about the specific market.
- **Burger Menu:** Access a list of all available markets.
- **Dates Open:** Highlight whether a market is currently open based on its operating dates.

## Development

This project uses [SvelteKit](https://kit.svelte.dev/).

### Prerequisites

- [mise](https://mise.jdx.dev/) installed.

### Tool Management

This project uses `mise` for managing development tools (Node.js, cloudflared), ensuring consistent environments.

```sh
# Install managed tools
mise install
```

### Setup

```sh
# Install dependencies
npm install

# Start development server
npm run dev
```

### Sharing Development Build (Cloudflare Tunnel)

To briefly share the local development build via a single command (which also displays a QR code in your terminal for easy mobile scanning):

```sh
npm run dev:tunnel
```

*Note: This command runs the development server and the tunnel concurrently.*




### Building

To create a production version:

```sh
npm run build
```

## Deployment

Configured for deployment to [Cloudflare Pages](https://pages.cloudflare.com/) using Wrangler.

### Testing and Quality

This project utilizes `vitest` for running tests and `husky`/`lint-staged` for pre-commit hooks.

#### Running Tests

```sh
# Run all tests
npm run test

# Run tests in watch mode
npm run test:run
```

#### Pre-commit Hooks

Pre-commit hooks are automatically set up during `npm install` via the `prepare` script. They ensure code is formatted and linted before every commit.

If you need to manually install or fix them:

```sh
npm run prepare
```

