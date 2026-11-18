# Migration verification

- Production build, ESLint and six focused automated tests pass.
- Browser smoke test: create a guest list, reload, search TMDB, add Alien, set a four-star rating.
- Connected Appwrite database: movie_lists table, owner index and row security created; no existing users or lists were imported.
- Web platforms already include localhost and movielist-renan.vercel.app.
- Real email/password signup, cloud import, cross-user access and Vercel production deployment have not been exercised end to end.
- npm audit reports four high-severity findings through picomatch and Vite's development tooling. npm audit fix leaves them unresolved; the registry's latest picomatch is 4.0.7, which the advisory lists as affected. Review GHSA-fc5q-39xc-vjpf when a patched dependency becomes available. The dev server is bound to localhost.
