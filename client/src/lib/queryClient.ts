import { QueryClient, QueryFunction } from "@tanstack/react-query";

export class ApiError extends Error {
  status: number;
  details?: any;
  bodyText?: string;
  constructor(status: number, message: string, details?: any, bodyText?: string) {
    super(`${status}: ${message}`);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
    this.bodyText = bodyText;
  }
  is(status: number) {
    return this.status === status;
  }
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const contentType = res.headers.get("content-type") || "";
    let message = res.statusText || "Request failed";
    let details: any = undefined;
    let bodyText: string | undefined = undefined;

    try {
      if (contentType.includes("application/json")) {
        const json = await res.json();
        details = json;
        if (typeof json?.message === "string" && json.message.trim().length > 0) {
          message = json.message;
        } else if (typeof json?.error === "string") {
          message = json.error;
        }
      } else {
        bodyText = await res.text();
        if (bodyText && bodyText.trim().length > 0) {
          message = bodyText;
        }
      }
    } catch {
      // ignore parse errors
    }

    throw new ApiError(res.status, message, details, bodyText);
  }
}

// CSRF token caching and retrieval
let csrfToken: string | null = null;
async function ensureCsrfToken(): Promise<string> {
  if (csrfToken) return csrfToken;
  const res = await fetch("/api/csrf-token", { credentials: "include" });
  await throwIfResNotOk(res);
  const data = await res.json();
  csrfToken = data?.csrfToken || null;
  if (!csrfToken) {
    throw new Error("Failed to obtain CSRF token");
  }
  return csrfToken;
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<any> {
  const upperMethod = method.toUpperCase();
  const needsCsrf = !["GET", "HEAD", "OPTIONS"].includes(upperMethod);

  const headers: Record<string, string> = {};
  if (data) headers["Content-Type"] = "application/json";
  if (needsCsrf && url !== "/api/csrf-token") {
    try {
      headers["x-csrf-token"] = await ensureCsrfToken();
    } catch (err) {
      // Let the request proceed; server will return a clear error if needed
    }
  }

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return await res.json();
  }
  return await res.text();
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      return await res.json();
    }
    return await res.text();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
