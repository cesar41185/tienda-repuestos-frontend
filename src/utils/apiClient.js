// Simple centralized fetch wrapper with Authorization token and JSON/error handling.
// Provides abort support via the passed options.

import API_URL from '../apiConfig';

export async function apiFetch(input, options = {}) {
  const { headers, ...rest } = options || {};
  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;

  // If input is relative (starts with /) prepend API_URL
  let url = input;
  if (typeof input === 'string' && input.startsWith('/')) {
    url = API_URL + input;
  }

  const finalHeaders = new Headers(headers || {});
  if (token && !finalHeaders.has('Authorization')) {
    finalHeaders.set('Authorization', `Token ${token}`);
  }

  // Default Accept JSON (not for FormData bodies)
  if (!finalHeaders.has('Accept')) finalHeaders.set('Accept', 'application/json');

  const resp = await fetch(url, { headers: finalHeaders, ...rest });
  return resp; // Caller decides how to parse (json/blob/etc.)
}

export async function apiFetchJson(input, options = {}) {
  const resp = await apiFetch(input, options);
  let data = null;
  try {
    data = await resp.json();
  } catch (e) {
    // ignore parse errors for non-JSON responses
  }
  if (!resp.ok) {
    const message = data && (data.detail || data.error || JSON.stringify(data));
    throw new Error(message || `Request failed ${resp.status}`);
  }
  return data;
}
