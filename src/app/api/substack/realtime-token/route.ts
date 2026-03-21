import { NextRequest, NextResponse } from "next/server";
import { substackFetch } from "@/lib/api/substackClient";
import { hasSession } from "@/lib/auth/session";

async function getUserId(): Promise<string | null> {
  try {
    const res = await substackFetch("https://substack.com/api/v1/me");
    if (!res.ok) return null;
    const json = await res.json() as Record<string, unknown>;
    const id = json.id ?? json.user_id;
    return id != null ? String(id) : null;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  if (!(await hasSession())) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const publicationId = request.nextUrl.searchParams.get("publicationId");
  if (!publicationId) {
    return NextResponse.json({ error: "Missing ?publicationId= param" }, { status: 400 });
  }

  const userId = await getUserId();
  const channelParts = [
    ...(userId ? [`user:${userId}`] : []),
    `chat:${publicationId}:only_paid`,
  ];
  const channels = channelParts.join(",");

  const res = await substackFetch(
    `https://substack.com/api/v1/realtime/token?channels=${encodeURIComponent(channels)}`
  );

  if (!res.ok) {
    return NextResponse.json({ error: "Failed to get realtime token" }, { status: res.status });
  }

  const json = await res.json();
  return NextResponse.json(json);
}
