export async function movieFetch(...args) {
  const response = await fetch(...args);
  if (!response.ok) throw new Error('Could not load movies. Please try again.');
  return response;
}
