export async function tmdbRequest(url, credential, fetcher = fetch) {
  const path = url.searchParams.get('path') || '';
  if (!/^(search\/movie|movie\/[1-9]\d*)$/.test(path)) return { status: 400, body: { error: 'Unsupported movie request.' } };
  if (!credential) return { status: 503, body: { error: 'Movie service is not configured.' } };
  const target = new URL('https://api.themoviedb.org/3/' + path);
  for (const key of ['query', 'language', 'page']) {
    const value = url.searchParams.get(key);
    if (value) target.searchParams.set(key, value.slice(0, 500));
  }
  const headers = { Accept: 'application/json' };
  if (credential.includes('.')) headers.Authorization = `Bearer ${credential}`;
  else target.searchParams.set('api_key', credential);
  try {
    const response = await fetcher(target, { headers, signal: AbortSignal.timeout(10000) });
    if (!response.ok) return { status: response.status === 404 ? 404 : 502, body: { error: 'Movie service request failed.' } };
    return { status: 200, body: await response.json() };
  } catch { return { status: 502, body: { error: 'Movie service is temporarily unavailable.' } }; }
}
export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed.' });
  const result = await tmdbRequest(new URL(req.url, 'http://localhost'), process.env.TMDB_API_KEY);
  if (result.status === 200) res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
  res.status(result.status).json(result.body);
}
