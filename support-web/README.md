# Prisma Support web

Staff SPA for the existing support Django API (`support/server`). It follows **prisma-web** (Vite + TypeScript, axios + hooks), not a React Native web export of `support-app`.

## Run locally

```bash
cd support/support-web
cp .env.example .env
npm install
npm run dev
```

- App: [http://localhost:5174](http://localhost:5174)
- API default: `VITE_API_URL=http://localhost:8002` (support server, not the client API)
- Connection check: `/connection`

```bash
npm run typecheck
npm run lint
npm run build
```

Sign-in uses existing support staff accounts. There is no public signup.

## Session keys

prisma-web and support-web can share a browser. Tokens are namespaced:

| Key | Purpose |
| --- | --- |
| `prisma.support.access` | JWT access |
| `prisma.support.refresh` | JWT refresh |
| `prisma.support.user` | Cached `/me` payload |

Logout / failed refresh dispatches `prisma.support:session-cleared`.

## Layout

```
src/
  auth/          AuthProvider, context, route guards (split for Fast Refresh)
  lib/           axios client, storage, SUPPORT_API paths, format, load/notice
  store/api/     thin wrappers — same paths as support-app, no new endpoints
  types/         payloads ported from support-app
  app-hooks/     page flows (fetch + mutations + confirm dialogs)
  components/    AppShell, dialogs, StatusBanner, cards
  pages/
```

Call `SUPPORT_API` paths only (`src/lib/routes.ts`). Do not invent actions.

## Do not copy from support-app

Expo, RTK Query, React Native Paper, SecureStore, push tokens, geolocation, dark mode, or a public register screen.

## React constraints (eslint)

- Do not `setState({ loading })` inside `useEffect`. Key a `{ id, state }` cache so a param change shows loading during render.
- Do not call `Date.now()` during render (`react-hooks/purity`). Dashboard preview filtering runs in the fetch `.then`.
- A file that exports a component must not also export hooks/helpers (Fast Refresh).

## Phase status

| Phase | Scope | Status |
| --- | --- | --- |
| 0 | Contract freeze (`SUPPORT_API`) | Done |
| 1 | Scaffold / prisma-web design | Done |
| 2 | Auth | Done |
| 3 | Live dashboard | Done |
| 4 | Bookings (list, appointment, bulk) | Done |
| 5 | Customers (B2C / fleets / partners / vehicles) | Done |
| 6 | Crew | Done |
| 7 | Tickets + activities | Done |
| 8 | Vouchers | Done |
| 9 | Payouts + accounting | Done |
| 10 | Settings / profile / help / notifications | Done |
| 11 | Deploy (CORS, nginx, Docker) | Done |
| 12 | Polish | Done |

Dashboard already previews open tickets and links through to `/tickets/:id`. Empty list pages share `EmptyState` / `LoadingLine`. Desktop lists tighten at 1100px. Dialogs close on Escape. The shell skip-link, document titles, and Admin/Support role next to the email are web-only affordances — payouts and accounting stay visible to every signed-in staff role, matching the app.

## Deploy

The SPA is an nginx container. `VITE_API_URL` and `VITE_BASE` are Docker build args (Vite bakes them in).

| Env | URL | API |
| --- | --- | --- |
| Local | [http://localhost:5174](http://localhost:5174) | `http://localhost:8002` |
| Staging | `/desk/` on client nginx, or host `:8382` | `/support` (same origin) |
| Production | host `:8082` (put NPM / DNS in front) | `https://support.prismavalet.com` |

```bash
# Production stack (support repo)
docker compose up -d --build

# Staging stack
docker compose -f docker-compose-staging.yml up -d --build
```

Reload **client** staging nginx after pulling the `/desk/` location (`client/nginx/conf.d/default.conf`), or `/desk/` will 502 until that container reloads.

Password-reset emails use `SUPPORT_WEB_URL` (or `SUPPORT_WEB_BASE_URL`) → `{origin}/reset-password?token=`. If unset, they still use Django `/api/v1/auth/web-reset-password/`. Staging `.env.staging` should set `SUPPORT_WEB_URL` to the public `/desk` origin (no trailing slash). CORS also allows `localhost:5174` and the SPA origin when that env is set.

`index.html` and nginx send `noindex`. This is an internal portal.

## Support server

Dashboard and customer lists proxy through the support server (`CLIENT_API_URL` + `SUPPORT_INTERNAL_API_KEY` on that process). If those env vars are missing, list pages show a load error pointing at them.
