import { NextRequest, NextResponse } from "next/server";
import { substackFetch } from "@/lib/api/substackClient";
import { hasSession } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  if (!(await hasSession())) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { commentId, reaction } = await request.json();
  if (!commentId || !reaction) {
    return NextResponse.json({ error: "Missing commentId or reaction" }, { status: 400 });
  }

  const res = await substackFetch(
    `https://substack.com/api/v1/community/comments/${commentId}/reaction`,
    { method: "POST", body: { reaction } }
  );

  const json = await res.json();
  if (!res.ok) {
    return NextResponse.json({ error: json?.error ?? "Failed to add reaction" }, { status: res.status });
  }
  return NextResponse.json({ ok: true });
}
