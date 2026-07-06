const RAW_API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.trim() || "";
const IS_DEV = import.meta.env.DEV;
const API_URL = (RAW_API_URL || (IS_DEV ? "http://localhost:8080" : "")).replace(/\/+$/, "");

export const isApiConfigured = IS_DEV ? true : API_URL.length > 0;
export const apiMode: "dev-local" | "configured" | "missing" = IS_DEV
  ? (RAW_API_URL ? "configured" : "dev-local")
  : (API_URL ? "configured" : "missing");

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, message: string, body: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

const DEFAULT_TIMEOUT_MS = 15000;

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  if (!API_URL) {
    throw new ApiError(
      0,
      "VITE_API_URL no esta configurada. Define la variable de entorno en Vercel (Project Settings > Environment Variables) con el valor https://backendhacc-production.up.railway.app y haz redeploy.",
      null
    );
  }
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const url = `${API_URL}${cleanPath}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new ApiError(
        0,
        `Tiempo de espera agotado al conectar con ${API_URL}. Verifica que el backend este accesible.`,
        null
      );
    }
    throw new ApiError(
      0,
      `No se pudo conectar con ${API_URL}. ${err instanceof Error ? err.message : ""}`.trim(),
      null
    );
  } finally {
    window.clearTimeout(timeoutId);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    const message =
      (data && typeof data === "object" && "error" in (data as Record<string, unknown>)
        ? String((data as Record<string, unknown>).error)
        : `Error HTTP ${res.status}`);
    throw new ApiError(res.status, message, data);
  }

  return data as T;
}

export const api = {
  get: <T>(path: string) => apiRequest<T>(path, { method: "GET" }),
  post: <T>(path: string, body?: unknown) =>
    apiRequest<T>(path, { method: "POST", body: body ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: unknown) =>
    apiRequest<T>(path, { method: "PUT", body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    apiRequest<T>(path, { method: "PATCH", body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => apiRequest<T>(path, { method: "DELETE" }),
};

export { API_URL };
