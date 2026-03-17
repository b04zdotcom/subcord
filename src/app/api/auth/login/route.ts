import { NextRequest, NextResponse } from "next/server";
import { SUBSTACK_ENDPOINTS } from "@/lib/api/config";
import { setSessionCookie } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required" },
      { status: 400 }
    );
  }

  let res: Response;
  try {
    res = await fetch(SUBSTACK_ENDPOINTS.login, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        Accept: "application/json",
      },
      body: JSON.stringify({
        email,
        password,
        redirect: "",
        for_pub: "",
        captcha_response: null,
      }),
    });
  } catch {
    return NextResponse.json(
      { error: "Could not reach Substack. Check your internet connection." },
      { status: 502 }
    );
  }

  if (!res.ok) {
    let message = "Invalid email or password";
    try {
      const body = await res.json();
      if (body.error) message = body.error;
    } catch {
      // ignore parse errors
    }
    return NextResponse.json({ error: message }, { status: res.status });
  }

  // Extract connect.sid from Set-Cookie header
  const setCookie = res.headers.get("set-cookie") ?? "";
  const sidMatch = setCookie.match(/connect\.sid=([^;]+)/);

  if (!sidMatch) {
    return NextResponse.json(
      {
        error:
          "Login succeeded but no session cookie was returned. Substack may have changed their auth flow.",
      },
      { status: 401 }
    );
  }

  await setSessionCookie(sidMatch[1]);
  return NextResponse.json({ ok: true });
}
