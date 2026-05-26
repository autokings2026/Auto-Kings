const API_BASE = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001'

type FetchOptions = RequestInit & { token?: string }

async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { token, ...init } = options

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Error de red' }))
    throw new Error((error as { message?: string }).message ?? `HTTP ${res.status}`)
  }

  return res.json() as Promise<T>
}

export const api = {
  get: <T>(path: string, token?: string) =>
    apiFetch<T>(path, { method: 'GET', token }),

  post: <T>(path: string, body: unknown, token?: string) =>
    apiFetch<T>(path, { method: 'POST', body: JSON.stringify(body), token }),

  put: <T>(path: string, body: unknown, token?: string) =>
    apiFetch<T>(path, { method: 'PUT', body: JSON.stringify(body), token }),

  patch: <T>(path: string, body: unknown, token?: string) =>
    apiFetch<T>(path, { method: 'PATCH', body: JSON.stringify(body), token }),

  delete: <T>(path: string, token?: string) =>
    apiFetch<T>(path, { method: 'DELETE', token }),
}
