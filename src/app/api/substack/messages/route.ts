import { NextRequest, NextResponse } from "next/server";
import { getChatCandidates } from "@/lib/api/config";
import { substackFetch } from "@/lib/api/substackClient";
import { hasSession } from "@/lib/auth/session";
import type { Message, Thread, Author } from "@/lib/api/types";

async function substackFetchWithFallbackVerbose(
  candidates: string[],
  subdomain: string
): Promise<{ response: Response; url: string; status: number } | null> {
  for (const url of candidates) {
    try {
      const res = await substackFetch(url);
      if (process.env.NODE_ENV !== "production") {
        console.log(`[messages:${subdomain}] ${url} → ${res.status}`);
      }
      if (res.ok) return { response: res, url, status: res.status };
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        console.log(`[messages:${subdomain}] ${url} → ERROR: ${err}`);
      }
    }
  }
  return null;
}

export async function GET(request: NextRequest) {
  if (!(await hasSession())) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const subdomain = request.nextUrl.searchParams.get("pub") ?? "";
  const numericId = request.nextUrl.searchParams.get("id") ?? subdomain;

  if (!subdomain && !numericId) {
    return NextResponse.json({ error: "Missing ?pub= param" }, { status: 400 });
  }

  const candidates = getChatCandidates(numericId, subdomain);
  const result = await substackFetchWithFallbackVerbose(candidates, subdomain);

  if (!result) {
    return NextResponse.json(
      {
        error: `No chat endpoint responded for "${subdomain}" (id=${numericId}).`,
        hint: "Update SUBSTACK_ENDPOINTS.chatMessages in src/lib/api/config.ts with the correct URL.",
        triedEndpoints: candidates,
        data: [],
      },
      { status: 502 }
    );
  }

  let raw: unknown;
  try {
    raw = await result.response.json();
  } catch {
    return NextResponse.json(
      { error: "Substack returned non-JSON response", data: [] },
      { status: 502 }
    );
  }

  const threads = normalizeThreads(raw, subdomain);
  // Sort oldest first so newest appears at the bottom
  threads.sort((a, b) => new Date(a.post.createdAt).getTime() - new Date(b.post.createdAt).getTime());

  return NextResponse.json({
    data: threads,
    endpoint: result.url,
    count: threads.length,
  });
}

function normalizeThreads(raw: unknown, publicationId: string): Thread[] {
  if (!raw || typeof raw !== "object") return [];
  const obj = raw as Record<string, unknown>;

  if (Array.isArray(obj.threads)) {
    return obj.threads.map((t) => normalizeThread(t, publicationId)).filter(Boolean) as Thread[];
  }
  return [];
}

function normalizeThread(thread: unknown, publicationId: string): Thread | null {
  if (!thread || typeof thread !== "object") return null;
  const t = thread as Record<string, unknown>;

  const postRaw = t.communityPost as Record<string, unknown> | undefined;
  const user = t.user as Record<string, unknown> | undefined;
  const pubRole = String(t.pubRole ?? t.pub_role ?? "");
  if (!postRaw) return null;

  const post = normalizeCommunityPost(postRaw, user, publicationId, pubRole);
  if (!post) return null;

  const replies: Message[] = Array.isArray(t.replies)
    ? t.replies
        .map((r: unknown) => {
          if (!r || typeof r !== "object") return null;
          const reply = r as Record<string, unknown>;
          const rPost = reply.communityPost as Record<string, unknown> | undefined;
          const rUser = reply.user as Record<string, unknown> | undefined;
          return rPost ? normalizeCommunityPost(rPost, rUser, publicationId) : null;
        })
        .filter(Boolean) as Message[]
    : [];

  // Sort replies oldest first
  replies.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  return { post, replies };
}

function normalizeCommunityPost(
  post: Record<string, unknown>,
  user: Record<string, unknown> | undefined,
  publicationId: string,
  pubRole = ""
): Message | null {
  const body = String(post.body ?? post.content ?? post.body_text ?? "").trim();

  const rawAttachments = (post.mediaAttachments ?? post.media_uploads ?? []) as Record<string, unknown>[];
  const attachments = Array.isArray(rawAttachments)
    ? rawAttachments
        .filter((a) => {
          const ct = String(a.contentType ?? a.content_type ?? a.type ?? "");
          return ct.startsWith("image") || /\.(jpg|jpeg|png|gif|webp)$/i.test(String(a.url ?? ""));
        })
        .map((a) => ({
          url: String(a.url),
          contentType: a.contentType ? String(a.contentType) : undefined,
          width: a.width ? Number(a.width) : undefined,
          height: a.height ? Number(a.height) : undefined,
        }))
    : [];

  if (!body && attachments.length === 0) return null;

  const author: Author = {
    id: String(user?.id ?? post.user_id ?? "unknown"),
    name: String(user?.name ?? user?.handle ?? "Unknown"),
    photoUrl: user?.photo_url ? String(user.photo_url) : undefined,
    handle: user?.handle ? String(user.handle) : undefined,
  };

  const isAuthor = pubRole === "author" || pubRole === "admin";

  return {
    id: String(post.id ?? Math.random().toString(36).slice(2)),
    body,
    author,
    createdAt: String(post.created_at ?? post.date ?? new Date().toISOString()),
    publicationId,
    parentId: post.parent_post_id ? String(post.parent_post_id) : undefined,
    isAuthor,
    ...(attachments.length > 0 ? { attachments } : {}),
  };
}

