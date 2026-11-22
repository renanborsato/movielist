# MovieList

A React movie-list app with optional Appwrite accounts and movie data from TMDB. Migrated from the original React/Quarkus project; the original repositories remain unchanged.

## Features

- Create and delete lists; add/remove movies and rate them from 0 to 5 stars.
- Search movies and view their details/posters.
- English, Spanish and Portuguese; light/dark themes and color choices.
- Start as a guest with lists saved in this browser's localStorage.
- Email/password signup and login; import guest lists into the signed-in account.

Community, profile and settings pages remain placeholders, matching the original app. Profile settings require login.

## Local development

Requires Node.js 22 and npm.

1. Run `npm ci`.
2. Copy `.env.example` to `.env.local` and set `TMDB_API_KEY` to your TMDB v3 API key or read access token.
3. Set the public `VITE_APPWRITE_*` values for your project.
4. Run `npm run dev`. The development server includes the TMDB proxy.

Use `npm run build`, `npm run lint`, `npm test`, and `npm run test:ui` for verification. Service tests cover movie errors and preservation of guest data; interaction tests cover accessible selection, save retries, stale searches, and signed-in import recovery. `npm run preview` serves only the static build, so use the Vercel preview deployment to test production API routes.

## Deployment

Import this repository into Vercel as a Vite project, using the repository root and `dist` output. Add all `.env.example` variables to the appropriate Vercel environments. Never prefix TMDB or Appwrite server API keys with `VITE_`.

In Appwrite, enable email/password authentication and register `localhost` and the actual Vercel/custom domains as web platforms. See [Appwrite setup](appwrite/README.md). Vercel handles `/api/tmdb`; SPA rewrites support direct links to movie and login pages.

## Peer feedback refinements

Peer testing reported unclear movie-addition steps, movie-loading failures, and account-import errors. The refinement adds a shared, labelled search interface with instructions, loading and empty states, keyboard-operable result buttons, and retry controls. A failed save keeps the query and selection. Search requests are debounced and cancelled to prevent outdated results from reappearing.

Movie failures now distinguish network, unavailable-service, missing-movie, and rate-limit cases without showing upstream details. Detail pages and saved-title loading offer a retry. Import recovery has a dedicated signed-in view, maps permission/session/storage failures to helpful messages, and lets the user continue without importing. Failed uploads retain local lists; a list edited during an upload is also kept for retry. New messages are provided in English, Spanish, and Portuguese.

Production movie search was observed returning HTTP 503 with `Movie service is not configured`. These code changes improve recovery but cannot replace deployment configuration. Set `TMDB_API_KEY` privately in Vercel and redeploy; never put it in a `VITE_` variable or the portfolio. Then verify real search, movie addition, account import, and account privacy in the deployed app. Tests use controlled service responses; they do not establish that production credentials, permissions, or account imports work.

## Guest data

Guest identities are local IDs, not Appwrite accounts. Clearing browser site data removes guest lists. Account lists are private to their owner. Signup and login import guest lists using stable IDs; each local copy is removed only after its cloud write succeeds. Failed imports can be retried from Login without discarding remaining local lists. Logging out does not download account data into guest storage.

## Architecture

- `src/`: existing UI and styling, preserved during migration.
- `src/services/`: Appwrite authentication/lists, guest persistence and TMDB requests.
- `src/lib/`: Appwrite client.
- `api/tmdb.js`: restricted server-only TMDB proxy, also used by local Vite middleware.
- `appwrite/`: database setup and permissions.
- `tests/`: guest persistence, failure/retry and proxy boundary tests.

Movie data and images are supplied by TMDB. This product uses the TMDB API but is not endorsed or certified by TMDB. Before publishing, include the approved TMDB logo and required attribution in your About/Credits area according to TMDB's branding guidelines.
