import { redirect } from "next/navigation";
import { hasSession } from "@/lib/auth/session";

export default async function Home() {
  const authenticated = await hasSession();
  redirect(authenticated ? "/chat" : "/login");
}
