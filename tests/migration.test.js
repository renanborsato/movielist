import test from 'node:test';
import assert from 'node:assert/strict';
import { readGuest, writeGuest, importGuest } from '../src/services/guest.js';
import { tmdbRequest } from '../api/tmdb.js';
function storage() {
  const data = new Map();
  return { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };
}
test('guest identity and rated lists persist across reloads', () => {
  const local = storage();
  const guest = readGuest(local);
  guest.lists.push({ id: 'list1', title: 'Favorites', movies: [{ movieId: 550, rating: 4 }] });
  writeGuest(guest, local);
  assert.deepEqual(readGuest(local), guest);
});
test('failed import retains unsaved lists and retry does not repeat completed lists', async () => {
  const local = storage();
  const guest = readGuest(local);
  guest.lists = [{ id: 'one', movies: [] }, { id: 'two', movies: [{ movieId: 550, rating: 5 }] }];
  writeGuest(guest, local);
  const saved = [];
  await assert.rejects(importGuest('user1', async list => {
    if (list.id === 'two') throw new Error('offline');
    saved.push(list);
  }, local));
  assert.deepEqual(readGuest(local).lists.map(list => list.id), ['two']);
  await importGuest('user1', async list => saved.push(list), local);
  assert.deepEqual(saved.map(list => list.id), ['one', 'two']);
  assert.equal(saved[1].movies[0].rating, 5);
  assert.equal(saved[1].ownerId, 'user1');
  assert.deepEqual(readGuest(local).lists, []);
});
test('corrupted guest storage is retained instead of overwritten', () => {
  const local = storage();
  local.setItem('movielist.guest.v1', '{broken');
  assert.throws(() => readGuest(local));
  assert.equal(local.getItem('movielist.guest.v1'), '{broken');
});
test('TMDB proxy rejects arbitrary endpoints without making requests', async () => {
  let called = false;
  const result = await tmdbRequest(new URL('http://local/api/tmdb?path=https://evil.test'), 'secret', () => { called = true; });
  assert.equal(result.status, 400);
  assert.equal(called, false);
});
test('TMDB proxy forwards allowed parameters and keeps credentials server-side', async () => {
  const result = await tmdbRequest(new URL('http://local/api/tmdb?path=search/movie&query=Alien&language=pt-BR&api_key=attacker'), 'secret', async url => {
    assert.equal(url.origin, 'https://api.themoviedb.org');
    assert.equal(url.searchParams.get('api_key'), 'secret');
    assert.equal(url.searchParams.get('query'), 'Alien');
    return { ok: true, json: async () => ({ results: [{ id: 348 }] }) };
  });
  assert.equal(result.status, 200);
  assert.equal(JSON.stringify(result.body).includes('secret'), false);
});
test('TMDB upstream errors do not expose credentials or upstream messages', async () => {
  const result = await tmdbRequest(new URL('http://local/api/tmdb?path=movie/550'), 'secret', async () => { throw new Error('secret'); });
  assert.equal(result.status, 502);
  assert.equal(JSON.stringify(result.body).includes('secret'), false);
});
