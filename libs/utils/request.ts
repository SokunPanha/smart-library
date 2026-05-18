/**
 * Strip null and undefined values from request params before sending to API.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function filterRequestParam<T>(params: T): T {
  return Object.fromEntries(
    Object.entries(params as Record<string, unknown>).filter(([, v]) => v !== null && v !== undefined)
  ) as T;
}

/**
 * Wraps a form onFinish handler: returns true on success so AntD/Drawer
 * knows to close. Re-throws so the caller can show an error message.
 */
export async function formSubmitWrap<T>(
  fn: (values: T) => Promise<void>,
  values: T
): Promise<boolean> {
  await fn(values);
  return true;
}

/**
 * Standard API fetch helper. Throws on non-ok responses with the server's
 * error message if available.
 */
export async function apiFetch<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error ?? `Request failed: ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
