import { NextRequest, NextResponse } from "next/server";
import { substackFetch } from "@/lib/api/substackClient";
import { hasSession } from "@/lib/auth/session";
import type { Message, Author, QuotedMessage } from "@/lib/api/types";
import { randomUUID } from "crypto";

const BASE = "https://substack.com/api/v1/community/posts";
const MAX_PAGES = 50; // safety cap

export async function GET(request: NextRequest) {
  if (!(await hasSession())) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const postId = request.nextUrl.searchParams.get("postId");
  if (!postId) {
    return NextResponse.json({ error: "Missing ?postId= param" }, { status: 400 });
  }

  const allComments: Message[] = [];

  // Step 1: fetch initial batch (most recent N comments, asc order)
  const initialUrl = `${BASE}/${postId}/comments?order=asc&initial=true`;
  const initialBatch = await fetchCommentPage(initialUrl);
  allComments.push(...initialBatch);

  // Step 2: paginate backwards from the earliest comment we have
  // using order=desc&before={timestamp} to get older ones
  let pages = 0;
  let earliestTimestamp = earliestOf(allComments);

  while (earliestTimestamp && pages < MAX_PAGES) {
    const pageUrl = `${BASE}/${postId}/comments?order=desc&before=${encodeURIComponent(earliestTimestamp)}`;
    const batch = await fetchCommentPage(pageUrl);
    if (process.env.NODE_ENV !== "production") {
      console.log(`[replies:${postId}] page ${pages + 1}: got ${batch.length} comments, before=${earliestTimestamp}`);
    }
    if (batch.length === 0) break;
    allComments.push(...batch);
    const newEarliest = earliestOf(batch);
    if (!newEarliest || newEarliest >= earliestTimestamp) break;
    earliestTimestamp = newEarliest;
    pages++;
  }

  // Deduplicate by id and sort oldest→newest
  const seen = new Set<string>();
  const unique = allComments.filter((c) => {
    if (seen.has(c.id)) return false;
    seen.add(c.id);
    return true;
  });
  unique.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  if (process.env.NODE_ENV !== "production") {
    console.log(`[replies:${postId}] total: ${unique.length} (${pages + 1} pages)`);
  }

  return NextResponse.json({ data: unique });
}

export async function POST(request: NextRequest) {
  if (!(await hasSession())) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { postId, body, quoteId } = await request.json();
  if (!postId || !body?.trim()) {
    return NextResponse.json({ error: "Missing postId or body" }, { status: 400 });
  }

  const res = await substackFetch(`${BASE}/${postId}/comments`, {
    method: "POST",
    body: {
      id: randomUUID(),
      body: body.trim(),
      ...(quoteId ? { quote_id: quoteId } : {}),
    },
  });

  const json = await res.json();
  if (!res.ok) {
    return NextResponse.json({ error: json?.error ?? "Failed to post reply" }, { status: res.status });
  }
  return NextResponse.json({ ok: true, data: json });
}

async function fetchCommentPage(url: string): Promise<Message[]> {
  try {
    const res = await substackFetch(url);
    if (!res.ok) return [];
    const raw = await res.json();
    return normalizeComments(raw);
  } catch {
    return [];
  }
}

function earliestOf(messages: Message[]): string | null {
  if (messages.length === 0) return null;
  return messages.reduce(
    (min, m) => (m.createdAt < min ? m.createdAt : min),
    messages[0].createdAt
  );
}

function normalizeComments(raw: unknown): Message[] {
  if (!raw || typeof raw !== "object") return [];
  const obj = raw as Record<string, unknown>;

  for (const key of ["comments", "threads", "replies", "posts", "items"]) {
    if (Array.isArray(obj[key])) {
      return (obj[key] as unknown[]).map(normalizeItem).filter(Boolean) as Message[];
    }
  }
  if (Array.isArray(raw)) return raw.map(normalizeItem).filter(Boolean) as Message[];
  return [];
}

function normalizeItem(item: unknown): Message | null {
  if (!item || typeof item !== "object") return null;
  const t = item as Record<string, unknown>;
  const user = t.user as Record<string, unknown> | undefined;

  const pubRole = String(t.pub_roles ?? t.pubRole ?? t.pub_role ?? "");
  const quote = t.quote as Record<string, unknown> | undefined;
  // { comment: {...}, user: {...}, quote?: {...} }
  if (t.comment && typeof t.comment === "object") {
    return normalizeCommunityPost(t.comment as Record<string, unknown>, user, pubRole, quote);
  }
  // { communityPost: {...}, user: {...} }
  if (t.communityPost && typeof t.communityPost === "object") {
    return normalizeCommunityPost(t.communityPost as Record<string, unknown>, user, pubRole, quote);
  }

  // Flat
  const body = String(t.body ?? t.content ?? t.body_text ?? "").trim();
  if (!body) return null;
  const author: Author = {
    id: String(user?.id ?? t.user_id ?? "unknown"),
    name: String(user?.name ?? user?.handle ?? "Unknown"),
    photoUrl: user?.photo_url ? String(user.photo_url) : undefined,
    handle: user?.handle ? String(user.handle) : undefined,
  };
  return {
    id: String(t.id ?? Math.random().toString(36).slice(2)),
    body,
    author,
    createdAt: String(t.created_at ?? new Date().toISOString()),
    publicationId: String(t.publication_id ?? ""),
    parentId: (t.parent_id ?? t.parent_post_id) ? String(t.parent_id ?? t.parent_post_id) : undefined,
  };
}

const EMOJI_MAP: Record<string, string> = {
  thumbs_up: "👍", thumbs_down: "👎", upvote: "❤️", fire: "🔥", bullseye: "🎯", skull: "💀", shamrock: "☘️",
  rocket: "🚀", clapping_hands: "👏", raising_hands: "🙌", folded_hands: "🙏",
  face_with_monocle: "🧐", hot_beverage: "☕", thinking_face: "🤔", clown_face: "🤡",
  face_with_tears_of_joy: "😂", smiling_face_with_heart_eyes: "😍", face_with_open_mouth: "😮", rolling_on_the_floor_laughing: "🤣",
  partying_face: "🥳", eyes: "👀", flexed_biceps: "💪", brain: "🧠", "1st_place_medal": "🥇", "2nd_place_medal": "🥈", "3rd_place_medal": "🥉",
  money_bag: "💰", gem: "💎", star: "⭐", sparkles: "✨", double_exclamation_mark: "‼️",
  check_mark: "✅", cross_mark: "❌", warning: "⚠️", hundred_points: "💯", see_no_evil_monkey: "🙈", 
  chart_increasing: "📈", chart_decreasing: "📉", loudspeaker: "📢", beer_mug: "🍺", ok_hand: "👌",
  light_bulb: "💡", trophy: "🏆", crown: "👑", tada: "🎉", grinning_face_with_sweat: "😅", loudly_crying_face: "😭", beaming_face_with_smiling_eyes: "😁",
};

function toEmoji(name: string): string {
  return EMOJI_MAP[name] ?? name;
}

function normalizeCommunityPost(post: Record<string, unknown>, user?: Record<string, unknown>, pubRole = "", quote?: Record<string, unknown>): Message | null {
  const body = String(post.body ?? post.content ?? post.body_text ?? "").trim();
  const rawAttachments = (post.mediaAttachments ?? post.media_uploads ?? []) as Record<string, unknown>[];
  const hasAttachments = Array.isArray(rawAttachments) && rawAttachments.length > 0;
  if (!body && !hasAttachments) return null;
  const author: Author = {
    id: String(user?.id ?? post.user_id ?? "unknown"),
    name: String(user?.name ?? user?.handle ?? "Unknown"),
    photoUrl: user?.photo_url ? String(user.photo_url) : undefined,
    handle: user?.handle ? String(user.handle) : undefined,
  };

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

  // Extract quoted message if present
  let quotedMessage: QuotedMessage | undefined;
  if (quote) {
    const qComment = (quote.comment ?? quote) as Record<string, unknown>;
    const qUser = (quote.user ?? {}) as Record<string, unknown>;
    const qBody = String(qComment.body ?? "").trim();
    const qAttachments = (qComment.mediaAttachments ?? qComment.media_uploads ?? []) as Record<string, unknown>[];
    const qImages = Array.isArray(qAttachments)
      ? qAttachments.map((a) => ({ url: String(a.url) }))
      : [];
    quotedMessage = {
      id: String(qComment.id ?? ""),
      body: qBody,
      author: { name: String(qUser.name ?? qUser.handle ?? "Unknown") },
      ...(qImages.length > 0 ? { attachments: qImages } : {}),
    };
  }

  const rawReactions = post.reactions && typeof post.reactions === "object"
    ? post.reactions as Record<string, number>
    : {};
  const reactions = Object.entries(rawReactions)
    .filter(([, count]) => count > 0)
    .map(([name, count]) => ({ emoji: toEmoji(name), count }));

  return {
    id: String(post.id ?? Math.random().toString(36).slice(2)),
    body,
    author,
    createdAt: String(post.created_at ?? post.date ?? new Date().toISOString()),
    publicationId: String(post.publication_id ?? ""),
    parentId: (post.parent_id ?? post.parent_post_id) ? String(post.parent_id ?? post.parent_post_id) : undefined,
    isAuthor: pubRole === "author" || pubRole === "admin",
    ...(attachments.length > 0 ? { attachments } : {}),
    ...(quotedMessage ? { quotedMessage } : {}),
    ...(reactions.length > 0 ? { reactions } : {}),
  };
}
