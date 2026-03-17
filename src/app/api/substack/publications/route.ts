import { NextResponse } from "next/server";
import { getPublicationCandidates } from "@/lib/api/config";
import { substackFetch } from "@/lib/api/substackClient";
import { hasSession } from "@/lib/auth/session";
import type { Publication } from "@/lib/api/types";

export async function GET() {
  if (!(await hasSession())) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const candidates = getPublicationCandidates();
  const allPublications: Publication[] = [];
  let anyAuthFailure = false;

  await Promise.all(
    candidates.map(async (url) => {
      try {
        const res = await substackFetch(url);
        if (res.status === 401 || res.status === 403) { anyAuthFailure = true; return; }
        if (!res.ok) return;

        let raw: unknown;
        try { raw = await res.json(); } catch { return; }

        if (process.env.NODE_ENV !== "production") {
          const keys = raw && typeof raw === "object" ? Object.keys(raw as object) : raw;
          console.log(`[publications] ${url} → ${res.status} | keys: ${JSON.stringify(keys)}`);
          const firstItem = getFirstItem(raw);
          if (firstItem) {
            console.log(`[publications] first item keys:`, Object.keys(firstItem as object));
            console.log(`[publications] first item sample:`, JSON.stringify(firstItem).slice(0, 400));
          }
        }

        const pubs = normalizePublications(raw, url);
        allPublications.push(...pubs);
      } catch (err) {
        if (process.env.NODE_ENV !== "production") {
          console.log(`[publications] ${url} → ERROR: ${err}`);
        }
      }
    })
  );

  if (allPublications.length === 0) {
    if (anyAuthFailure) {
      return NextResponse.json({ error: "Session expired. Please log in again." }, { status: 401 });
    }
    return NextResponse.json(
      {
        error: "No publications found.",
        hint: "Check terminal logs for the raw response structure.",
        data: [],
      },
      { status: 502 }
    );
  }

  const merged = mergePublications(allPublications);

  return NextResponse.json({ data: merged });
}

function getFirstItem(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== "object") return null;
  if (Array.isArray(raw) && raw.length > 0) return raw[0] as Record<string, unknown>;
  const obj = raw as Record<string, unknown>;
  for (const key of ["posts", "items", "publications", "subscriptions", "chats"]) {
    if (Array.isArray(obj[key]) && (obj[key] as unknown[]).length > 0) {
      return (obj[key] as unknown[])[0] as Record<string, unknown>;
    }
  }
  return null;
}

function normalizePublications(raw: unknown, sourceUrl: string): Publication[] {
  if (!raw || typeof raw !== "object") return [];
  if (Array.isArray(raw)) return raw.map(normalizeSinglePub).filter(Boolean) as Publication[];

  const obj = raw as Record<string, unknown>;

  // activity/unread: { posts: [...] } where each item has a nested publication
  if (Array.isArray(obj.posts)) {
    return obj.posts.map((item) => extractPubFromActivity(item, sourceUrl)).filter(Boolean) as Publication[];
  }
  if (Array.isArray(obj.items)) {
    return obj.items.map((item) => extractPubFromActivity(item, sourceUrl)).filter(Boolean) as Publication[];
  }
  if (Array.isArray(obj.publications))
    return obj.publications.map(normalizeSinglePub).filter(Boolean) as Publication[];
  if (Array.isArray(obj.subscriptions))
    return obj.subscriptions.map(normalizeSinglePub).filter(Boolean) as Publication[];
  if (Array.isArray(obj.chats))
    return obj.chats.map(normalizeSinglePub).filter(Boolean) as Publication[];

  return [];
}

function extractPubFromActivity(item: unknown, sourceUrl: string): Publication | null {
  if (!item || typeof item !== "object") return null;
  const it = item as Record<string, unknown>;

  // Try nested publication objects
  const pub = it.publication ?? it.pub ?? it.community_publication ?? null;
  if (pub && typeof pub === "object") return normalizeSinglePub(pub);

  // The item itself might be a publication (e.g. /subscriptions endpoint)
  const result = normalizeSinglePub(it);
  if (process.env.NODE_ENV !== "production" && !result) {
    console.log(`[publications:${sourceUrl}] could not extract pub from:`, JSON.stringify(it).slice(0, 200));
  }
  return result;
}

function normalizeSinglePub(p: unknown): Publication | null {
  if (!p || typeof p !== "object") return null;
  const pub = p as Record<string, unknown>;

  const numericId = pub.id ?? pub.pub_id ?? pub.publication_id ?? pub.community_id ?? "";
  const subdomain = String(
    pub.subdomain ?? pub.custom_domain ?? pub.pub_subdomain ?? ""
  ).replace(/\.substack\.com$/, "");

  if (!numericId && !subdomain) return null;

  return {
    id: String(numericId || subdomain),
    name: String((pub.name ?? pub.pub_name ?? pub.title ?? subdomain) || "Unknown"),
    subdomain,
    logoUrl: String(pub.logo_url ?? pub.image_url ?? (pub.cover_photo_url ?? "")),
  };
}

// Merge publications from multiple endpoints: prefer entries with more fields filled in
function mergePublications(pubs: Publication[]): Publication[] {
  const byId = new Map<string, Publication>();
  const bySubdomain = new Map<string, Publication>();

  for (const pub of pubs) {
    // Merge by numeric ID
    if (/^\d+$/.test(pub.id)) {
      const existing = byId.get(pub.id);
      byId.set(pub.id, existing ? mergePub(existing, pub) : pub);
    }
    // Also index by subdomain
    if (pub.subdomain) {
      const existing = bySubdomain.get(pub.subdomain);
      bySubdomain.set(pub.subdomain, existing ? mergePub(existing, pub) : pub);
    }
  }

  // Build final list: use ID-keyed map first (has numeric IDs), fill in from subdomain map
  const result = new Map<string, Publication>();

  byId.forEach((pub) => {
    if (pub.subdomain) result.set(pub.subdomain, pub);
    else result.set(pub.id, pub);
  });

  // Add any subdomain-only publications not already included
  bySubdomain.forEach((pub, subdomain) => {
    if (!result.has(subdomain)) result.set(subdomain, pub);
  });

  const out: Publication[] = [];
  result.forEach((p) => {
    if (p.subdomain || p.name !== "Unknown") out.push(p);
  });
  return out;
}

function mergePub(a: Publication, b: Publication): Publication {
  return {
    id: /^\d+$/.test(a.id) ? a.id : b.id,
    name: a.name !== "Unknown" && a.name ? a.name : b.name,
    subdomain: a.subdomain || b.subdomain,
    logoUrl: a.logoUrl || b.logoUrl,
  };
}
