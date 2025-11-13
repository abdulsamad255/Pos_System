// lib/api.ts

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${path}`;

  // Avoid crashing on server side where window isn't defined
  let token: string | null = null;
  if (typeof window !== "undefined") {
    token = window.localStorage.getItem("authToken");
  }

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let message = `Request failed with status ${res.status}`;
    try {
      const data = await res.json();
      if (data?.error) {
        message = data.error;
      }
    } catch {
      // ignore JSON parse error
    }
    throw new Error(message);
  }

  if (res.status === 204) {
    // No content
    return {} as T;
  }

  return (await res.json()) as T;
}
