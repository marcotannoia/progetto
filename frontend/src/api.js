export const API_URL = (import.meta.env.VITE_API_URL || 'https://api.ecotracker.it').replace(/\/$/, '');

export async function api(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    credentials: 'include',
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.errore || 'Operazione non riuscita.');
    error.status = response.status;
    throw error;
  }
  return data;
}
