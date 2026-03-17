import { NextRequest, NextResponse } from "next/server";
import { substackFetch } from "@/lib/api/substackClient";
import { getChatCandidates, getPublicationCandidates } from "@/lib/api/config";
import { hasSession } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
  if (!(await hasSession())) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const subdomain = request.nextUrl.searchParams.get("pub") ?? "";
  const candidates = subdomain
    ? getChatCandidates(subdomain, subdomain)
    : getPublicationCandidates();

  const results = await Promise.all(
    candidates.map(async (url) => {
      try {
        const res = await substackFetch(url);
        let preview: unknown = null;
        try {
          const text = await res.text();
          preview = text.slice(0, 500);
          try { preview = JSON.parse(text); } catch { /* keep text */ }
        } catch { /* ignore */ }
        return { url, status: res.status, ok: res.ok, preview };
      } catch (err) {
        return { url, status: null, ok: false, error: String(err) };
      }
    })
  );

  return NextResponse.json({ subdomain: subdomain || null, results });
}
