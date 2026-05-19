export function filterRequestParam<T>(params: T): T {
  return Object.fromEntries(
    Object.entries(params as Record<string, unknown>).filter(([, v]) => v !== null && v !== undefined)
  ) as T;
}

export async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = body?.error;
    const msg = typeof err === "string" ? err : err ? JSON.stringify(err) : `Request failed: ${res.status}`;
    throw new Error(msg);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
