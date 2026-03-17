import { cookies } from "next/headers";

const COOKIE_NAME = "substack_sid";

export async function getSessionCookie(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(COOKIE_NAME)?.value;
}

export async function setSessionCookie(sid: string): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, sid, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function hasSession(): Promise<boolean> {
  const sid = await getSessionCookie();
  return !!sid;
}
