import test from 'node:test';
import assert from 'node:assert/strict';
import { movieFetch } from '../src/services/tmdb.js';
import { importGuest, readGuest, writeGuest } from '../src/services/guest.js';
import { tmdbRequest } from '../api/tmdb.js';

test('an unconfigured movie proxy returns 503 without contacting TMDB', async () => {
  const result = await tmdbRequest(new URL('http://local/api/tmdb?path=search/movie&query=Alien'), '', () => { throw new Error('Must not contact TMDB'); });
  assert.equal(result.status, 503);
});
test('TMDB rate limiting is preserved for the retry message', async () => {
  const result = await tmdbRequest(new URL('http://local/api/tmdb?path=movie/348'), 'secret', async () => ({ ok: false, status: 429 }));
  assert.equal(result.status, 429);
});

for (const [status, message] of [[503, 'movie_unconfigured'], [404, 'movie_not_found'], [429, 'movie_rate_limit'], [502, 'movie_service_error']]) {
  test(`movie HTTP ${status} produces an actionable safe error`, async () => {
    await assert.rejects(movieFetch('/api/tmdb', {}, async () => new Response('private upstream details', { status })), { message });
  });
}
test('network failures are distinguished from service errors and cancellations', async () => {
  await assert.rejects(movieFetch('/api/tmdb', {}, async () => { throw new TypeError('offline'); }), { message: 'movie_network_error' });
  await assert.rejects(movieFetch('/api/tmdb', {}, async () => { throw new DOMException('aborted', 'AbortError'); }), { name: 'AbortError' });
});
test('a misrouted HTML response cannot be treated as movie data', async () => {
  await assert.rejects(movieFetch('/api/tmdb', {}, async () => new Response('<html>SPA</html>', { headers: { 'Content-Type': 'text/html' } })), { message: 'movie_service_error' });
});
test('valid JSON movie data remains available', async () => {
  const response = await movieFetch('/api/tmdb', {}, async () => Response.json({ results: [{ id: 348, title: 'Alien' }] }));
  assert.equal((await response.json()).results[0].title, 'Alien');
});

function localLists() {
  const values = new Map();
  const storage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
  const guest = readGuest(storage);
  guest.lists = [{ id: 'one', title: 'Favorites', movies: [{ movieId: 348, rating: 5 }] }];
  writeGuest(guest, storage);
  return storage;
}
for (const [code, message] of [[401, 'import_session_error'], [403, 'import_permission_error'], [404, 'import_configuration_error'], [429, 'import_rate_limit'], [500, 'auth_import_error']]) {
  test(`import failure ${code} retains rated lists and returns a recovery message`, async () => {
    const storage = localLists();
    const original = readGuest(storage);
    await assert.rejects(importGuest('user', async () => { throw Object.assign(new Error('private detail'), { code }); }, storage), { message });
    assert.deepEqual(readGuest(storage), original);
  });
}
test('an edit made during an upload is preserved locally for retry', async () => {
  const storage = localLists();
  await assert.rejects(importGuest('user', async () => {
    const guest = readGuest(storage);
    guest.lists[0].movies.push({ movieId: 550, rating: 4 });
    writeGuest(guest, storage);
  }, storage), { message: 'import_changed_error' });
  assert.equal(readGuest(storage).lists[0].movies.length, 2);
  await importGuest('user', async list => assert.equal(list.movies.length, 2), storage);
  assert.equal(readGuest(storage).lists.length, 0);
});
