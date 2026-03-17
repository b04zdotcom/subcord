import { getSessionCookie } from "@/lib/auth/session";

interface FetchOptions {
  method?: "GET" | "POST";
  body?: Record<string, unknown>;
}

export async function substackFetch(
  url: string,
  options: FetchOptions = {}
): Promise<Response> {
  const sid = await getSessionCookie();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    Accept: "application/json",
    ...(sid ? { Cookie: `connect.sid=${sid}` } : {}),
  };

  return fetch(url, {
    method: options.method ?? "GET",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
  });
}

export async function substackFetchWithFallback(
  candidates: readonly string[] | string[],
  options?: FetchOptions
): Promise<{ response: Response; url: string } | null> {
  const tried: string[] = [];
  for (const url of candidates) {
    tried.push(url);
    try {
      const res = await substackFetch(url, options);
      if (res.ok) return { response: res, url };
    } catch {
      // network error, try next candidate
    }
  }
  return null;
}
