const BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');
const DEFAULT_HEADERS = { 'ngrok-skip-browser-warning': 'true' };

async function parseJsonResponse(response) {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.toLowerCase().includes('application/json')) {
    const text = await response.text();
    throw new Error(`API Error: ${text.slice(0, 100)}`);
  }
  return response.json();
}

export async function apiFetch(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { ...DEFAULT_HEADERS, ...(options.headers || {}) },
  });
  const data = await parseJsonResponse(response);
  if (!response.ok) throw new Error(data?.error || data?.message || `Request Error`);
  return data;
}

export { BASE_URL, DEFAULT_HEADERS };