import { ID, Permission, Query, Role } from 'appwrite';
import { account, tables, databaseId, tableId } from '../lib/appwrite';
import { importGuest, readGuest, writeGuest } from './guest';
let session;
export async function currentUser() {
  try { session = await account.get(); }
  catch (error) { if (error.code !== 401) throw error; session = null; }
  return session;
}
const permissions = owner => [Permission.read(Role.user(owner)), Permission.update(Role.user(owner)), Permission.delete(Role.user(owner))];
const encode = list => ({ ownerId: list.ownerId, title: list.title, movies: JSON.stringify(list.movies) });
const decode = row => ({ id: row.$id, ownerId: row.ownerId, title: row.title, movies: JSON.parse(row.movies) });
async function saveImported(list) {
  try {
    await tables.createRow({ databaseId, tableId, rowId: list.id, data: encode(list), permissions: permissions(list.ownerId) });
  } catch (error) {
    if (error.code !== 409) throw error;
    const existing = await tables.getRow({ databaseId, tableId, rowId: list.id });
    if (existing.ownerId !== list.ownerId) throw new Error('Could not import a guest list. Your local copy has been kept.');
    await tables.updateRow({ databaseId, tableId, rowId: list.id, data: encode(list) });
  }
}
export async function migrateGuest() {
  const user = await currentUser();
  if (!user) return;
  await importGuest(user.$id, saveImported);
}
export async function authenticate(email, password, name, signup = false) {
  if (signup) await account.create({ userId: ID.unique(), email, password, name });
  await account.createEmailPasswordSession({ email, password });
  await migrateGuest();
}
export async function logout() {
  await account.deleteSession({ sessionId: 'current' });
  session = null;
}
export async function getLists() {
  const user = await currentUser();
  if (!user) return readGuest().lists;
  const lists = [];
  let cursor;
  do {
    const result = await tables.listRows({ databaseId, tableId, queries: [Query.equal('ownerId', user.$id), Query.limit(100), ...(cursor ? [Query.cursorAfter(cursor)] : [])] });
    lists.push(...result.rows.map(decode));
    cursor = result.rows.length === 100 ? result.rows.at(-1).$id : null;
  } while (cursor);
  return lists;
}
export async function createList(title) {
  title = title.trim();
  if (!title || title.length > 200) throw new Error('Use a list title between 1 and 200 characters.');
  const user = await currentUser();
  const list = { id: ID.unique(), title, movies: [], ownerId: user?.$id };
  if (user) await tables.createRow({ databaseId, tableId, rowId: list.id, data: encode(list), permissions: permissions(user.$id) });
  else { const guest = readGuest(); guest.lists.push(list); writeGuest(guest); }
}
export async function changeList(id, transform) {
  const user = await currentUser();
  if (!user) {
    const guest = readGuest();
    guest.lists = guest.lists.flatMap(list => list.id === id ? [transform(list)].filter(Boolean) : [list]);
    writeGuest(guest);
    return;
  }
  const list = decode(await tables.getRow({ databaseId, tableId, rowId: id }));
  const next = transform(list);
  if (!next) await tables.deleteRow({ databaseId, tableId, rowId: id });
  else await tables.updateRow({ databaseId, tableId, rowId: id, data: encode(next) });
}
