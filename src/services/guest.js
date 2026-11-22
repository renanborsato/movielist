export const GUEST_KEY = 'movielist.guest.v1';
export function readGuest(storage = localStorage) {
  const raw = storage.getItem(GUEST_KEY);
  if (raw) {
    let data;
    try { data = JSON.parse(raw); }
    catch { throw new Error('guest_data_error'); }
    if (!data?.id || !Array.isArray(data.lists)) throw new Error('guest_data_error');
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
    try { await save({ ...list, ownerId: userId }); }
    catch (error) {
      throw new Error(error.code === 401 ? 'import_session_error'
        : error.code === 403 ? 'import_permission_error'
        : error.code === 404 ? 'import_configuration_error'
        : error.code === 429 ? 'import_rate_limit' : 'auth_import_error', { cause: error });
    }
    const current = readGuest(storage);
    // Another tab may have edited this list during the upload. Keep newer data.
    const latest = current.lists.find(item => item.id === list.id);
    if (latest && JSON.stringify(latest) !== JSON.stringify(list)) throw new Error('import_changed_error');
    current.lists = current.lists.filter(item => item.id !== list.id);
    writeGuest(current, storage);
  }
}
