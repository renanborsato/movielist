export const GUEST_KEY = 'movielist.guest.v1';
export function readGuest(storage = localStorage) {
  const raw = storage.getItem(GUEST_KEY);
  if (raw) {
    const data = JSON.parse(raw);
    if (!data.id || !Array.isArray(data.lists)) throw new Error('Guest data could not be read. Your saved data has been kept.');
    return data;
  }
  const data = { id: crypto.randomUUID(), lists: [] };
  storage.setItem(GUEST_KEY, JSON.stringify(data));
  return data;
}
export function writeGuest(data, storage = localStorage) {
  storage.setItem(GUEST_KEY, JSON.stringify(data));
}
// Remove each local list only after a confirmed cloud write. Retrying uses stable IDs.
export async function importGuest(userId, save, storage = localStorage) {
  const guest = readGuest(storage);
  for (const list of [...guest.lists]) {
    await save({ ...list, ownerId: userId });
    const current = readGuest(storage);
    current.lists = current.lists.filter(item => item.id !== list.id);
    writeGuest(current, storage);
  }
}
