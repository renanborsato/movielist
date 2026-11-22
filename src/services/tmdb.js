export async function movieFetch(url, options, fetcher = fetch) {
  let response;
  try { response = await fetcher(url, options); }
  catch (error) {
    if (error.name === 'AbortError') throw error;
    throw new Error('movie_network_error', { cause: error });
  }
  if (!response.ok) {
    throw new Error(response.status === 503 ? 'movie_unconfigured'
      : response.status === 404 ? 'movie_not_found'
      : response.status === 429 ? 'movie_rate_limit' : 'movie_service_error');
  }
  if (!response.headers.get('content-type')?.includes('application/json')) throw new Error('movie_service_error');
  return response;
}
