# Appwrite setup

The connected MovieList project currently uses:

- Endpoint: `https://sfo.cloud.appwrite.io/v1`
- Project: `6afc84a5003505116823`
- TablesDB database: `6afc8986001d9a9e17d9`
- Table: `movie_lists`

The migration created this table and index in the existing empty database.

## Recreating the schema

Create a TablesDB database and a table named `movie_lists` with row security enabled. Grant only **create** to authenticated users at table level. Do not grant table-level read, update or delete access.

| Column | Type | Required | Maximum length |
| --- | --- | --- | --- |
| ownerId | String | Yes | 36 |
| title | String | Yes | 200 |
| movies | String (JSON) | Yes | 65535 |

Create a key index called `owner` on `ownerId`. `movies` contains an array of `{ movieId, rating }` objects. A list's row ID is its stable application ID.

Every row is created with read, update and delete permissions for its creator's user ID only. The browser uses the Appwrite session; no server API key is needed. The ownerId query is for filtering; row permissions enforce access control independently.

Enable email/password authentication. The app uses Appwrite's password requirements (minimum eight characters under the default policy). Register localhost and each deployed application hostname as Web platforms. Guests use browser storage and do not require anonymous Appwrite sessions.

The TMDB proxy runs on Vercel; no Appwrite Function deployment is needed. Set the TMDB credential in Vercel and in ignored `.env.local` for development.

## Limits

One row stores a complete list, up to the configured JSON size. Simultaneous changes to the same list from multiple tabs/devices use last-write-wins. Guest imports are retryable with stable row IDs; local data is not cleared on authentication or upload errors. If guest data is edited in another tab during an import, close the other tab and finish importing before making further changes.
