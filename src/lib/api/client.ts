/**
 * The one HTTP client every API module uses.
 *
 * This used to be copy-pasted into all fifteen `src/lib/api/*.ts` files —
 * `API_BASE`, `api()`, `getMessage()` and `parseJson()` each duplicated
 * verbatim. That is why 401 handling had drifted: thirteen list endpoints
 * swallowed it and returned an empty result, the rest threw, and there was
 * nowhere central to put the fix.
 */

const API_BASE =
  (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_API_URL) || "";

/** An HTTP failure that still carries its status, so callers can branch on it. */
export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }

  /** 4xx: the request was wrong. Retrying it unchanged will not help. */
  get isClientError(): boolean {
    return this.status >= 400 && this.status < 500;
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }
}

/**
 * Called once whenever any request comes back 401.
 *
 * Registered by AuthProvider, which clears the cached session so the app's
 * existing redirect runs. Kept as a setter rather than an import to avoid a
 * cycle: every API module imports this file, and AuthProvider imports them.
 */
type UnauthorizedHandler = () => void;
let unauthorizedHandler: UnauthorizedHandler | null = null;

export function setUnauthorizedHandler(fn: UnauthorizedHandler | null): void {
  unauthorizedHandler = fn;
}

export function api(path: string, options: RequestInit = {}): Promise<Response> {
  const url = API_BASE ? `${API_BASE}${path}` : path;
  return fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    credentials: "include",
  });
}

export function getMessage(data: unknown): string {
  if (data && typeof data === "object") {
    const o = data as Record<string, unknown>;
    if (typeof o.message === "string") return o.message;
    if (Array.isArray(o.message)) return (o.message[0] as string) ?? "Bad request";
    if (typeof o.error === "string") return o.error;
    // Some endpoints return a validation array; surface the first entry.
    if (
      Array.isArray(o.errors) &&
      o.errors[0] &&
      typeof o.errors[0] === "object"
    ) {
      const first = (o.errors[0] as Record<string, unknown>).message;
      if (typeof first === "string") return first;
    }
  }
  return "Request failed";
}

export async function parseJson(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text.trim()) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { message: res.statusText || "Request failed" };
  }
}

/**
 * Throw for a non-OK response, notifying the app once on 401.
 *
 * Endpoints previously returned `[]` or `{ items: [], total: 0 }` on 401,
 * which rendered an expired session as a legitimately empty account: /home
 * said "Nothing on your plate", and an empty workspace list pushed existing
 * users into the create-your-first-workspace gate. An expired session is an
 * error, and is now reported as one.
 */
export function throwApiError(res: Response, data: unknown): never {
  if (res.status === 401) unauthorizedHandler?.();
  throw new ApiError(getMessage(data), res.status);
}

/** `api` + `parseJson` + `throwApiError` for the common case. */
export async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await api(path, options);
  const data = await parseJson(res);
  if (!res.ok) throwApiError(res, data);
  return data as T;
}
