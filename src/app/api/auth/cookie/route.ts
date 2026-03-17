import { NextRequest, NextResponse } from "next/server";
import { setSessionCookie } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  const { cookie } = await request.json();

  if (!cookie || typeof cookie !== "string" || cookie.trim().length < 10) {
    return NextResponse.json({ error: "Invalid cookie value" }, { status: 400 });
  }

  await setSessionCookie(cookie.trim());
  return NextResponse.json({ ok: true });
}
