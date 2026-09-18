# Modular DS API Example Kit

An example Nuxt app for the [Modular DS public API](https://api.docs.modulards.com/). Each visitor enters their own API key, and every screen is backed by typed server routes that each make one request to the API. Use the [OpenAPI document](https://api.docs.modulards.com/openapi.json) as the reference for the full API; this app covers the operations listed below.

## What it covers

- **Sites, teams and tags**: list, filter, inspect, create, edit and delete; assign tags and mark favorites.
- **Connection**: download the connection plugin for a team, view manual connection data and verify a connection.
- **Site detail**: overview, uptime and inventory; maintenance mode, private note, cache clearing and service status; health checks, backups, TLS certificate, broken links and malware scans.
- **Portfolio**: uptime and vulnerabilities across all sites.
- **Manager**: plugin, theme and core inventories; sync, install, upgrade, activate, deactivate and uninstall; activity and version history.

Maintenance mode, cache clearing and Manager actions are applied asynchronously, so the app reports them as requested rather than done.

## API keys

Create a key in Modular DS under Settings > API > Create key. A read-only key opens every view; creating, editing and Manager actions need a read and write key. Those actions change real data in your account, so there is no sandbox.

The key is verified, then stored encrypted in an HttpOnly session cookie for seven days. The server uses it to call the API and never sends it back to the browser.

## How it works

- The browser only talks to the app's own `/api/**` routes, never to the Modular DS API directly, so the key stays on the server.
- Each route validates its input and makes a single API call, with no retries: a `429` stays visible until you retry. The API allows 120 requests per minute per key.
- `server/utils/modular/` holds a small `fetch` client and turns JSON:API responses into flat objects for the UI.
- The client refuses redirects, so the key is never forwarded to another host.

## Running it

Requires Node `^22.19.0 || ^24.11.0 || >=26.0.0` and pnpm.

```bash
pnpm install
cp .env.example .env
pnpm dev
```

Open `http://localhost:3000` and paste your key.

For a production build, set `NUXT_SESSION_PASSWORD` in `.env` to a secret of at least 32 characters (`openssl rand -hex 32`), then:

```bash
pnpm build
node --env-file=.env .output/server/index.mjs
```

To host it, use any platform that runs a Nuxt server, serve it over HTTPS and configure `NUXT_SESSION_PASSWORD` as a secret. A static host is not enough, because the API calls go through the server.

## Commands

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Start the development server |
| `pnpm build` | Build for production |
| `pnpm start` | Run the production build |
| `pnpm test` | Run the unit tests |
| `pnpm typecheck` | Type-check the project |
| `pnpm lint` | Lint the code |

## Stack

Nuxt 4, Vue 3, Nuxt UI 4, Tailwind CSS 4, TypeScript and Vitest.
