"use client";
import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ChevronDown, ChevronUp } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const [tab, setTab] = useState<"cookie" | "password">("cookie");

  // Cookie auth state
  const [cookieValue, setCookieValue] = useState("");
  const [cookieError, setCookieError] = useState<string | null>(null);
  const [cookieLoading, setCookieLoading] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);

  // Password auth state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwLoading, setPwLoading] = useState(false);

  async function handleCookieSubmit(e: FormEvent) {
    e.preventDefault();
    setCookieError(null);
    setCookieLoading(true);
    try {
      const res = await fetch("/api/auth/cookie", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cookie: cookieValue }),
      });
      const json = await res.json();
      if (!res.ok) {
        setCookieError(json.error ?? "Invalid cookie");
      } else {
        router.push("/chat");
      }
    } catch {
      setCookieError("Network error. Please try again.");
    } finally {
      setCookieLoading(false);
    }
  }

  async function handlePasswordSubmit(e: FormEvent) {
    e.preventDefault();
    setPwError(null);
    setPwLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (!res.ok) {
        setPwError(json.error ?? "Login failed");
      } else {
        router.push("/chat");
      }
    } catch {
      setPwError("Network error. Please try again.");
    } finally {
      setPwLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-discord-tertiary px-4">
      <div className="w-full max-w-lg bg-discord-secondary rounded-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="text-center px-8 pt-8 pb-6">
          <h1 className="text-2xl font-bold text-discord-text-primary mb-1">
            Subcord
          </h1>
          <p className="text-discord-text-muted text-sm">
            Connect your Substack account
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-discord-border">
          <button
            onClick={() => setTab("cookie")}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              tab === "cookie"
                ? "text-discord-text-primary border-b-2 border-discord-accent"
                : "text-discord-text-muted hover:text-discord-text-secondary"
            }`}
          >
            Session Cookie
          </button>
          <button
            onClick={() => setTab("password")}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              tab === "password"
                ? "text-discord-text-primary border-b-2 border-discord-accent"
                : "text-discord-text-muted hover:text-discord-text-secondary"
            }`}
          >
            Email & Password
          </button>
        </div>

        <div className="px-8 py-6">
          {/* Cookie tab */}
          {tab === "cookie" && (
            <div className="space-y-4">
              {/* Collapsible instructions */}
              <div className="bg-discord-tertiary rounded-lg overflow-hidden">
                <button
                  onClick={() => setShowInstructions((v) => !v)}
                  className="w-full flex items-center justify-between px-4 py-3 text-sm text-discord-text-secondary hover:text-discord-text-primary transition-colors"
                >
                  <span className="font-medium">How to get your session cookie</span>
                  {showInstructions ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>

                {showInstructions && (
                  <ol className="px-4 pb-4 space-y-2 text-xs text-discord-text-muted list-decimal list-inside leading-relaxed">
                    <li>
                      Open{" "}
                      <span className="text-discord-accent font-mono">substack.com</span>{" "}
                      in your browser and sign in normally
                    </li>
                    <li>
                      Open DevTools:{" "}
                      <span className="font-mono text-discord-text-secondary">
                        F12
                      </span>{" "}
                      (Windows) or{" "}
                      <span className="font-mono text-discord-text-secondary">
                        Cmd+Option+I
                      </span>{" "}
                      (Mac)
                    </li>
                    <li>
                      Go to{" "}
                      <span className="font-mono text-discord-text-secondary">
                        Application → Cookies → https://substack.com
                      </span>
                    </li>
                    <li>
                      Find the cookie named{" "}
                      <span className="font-mono text-discord-text-secondary bg-discord-border px-1 rounded">
                        substack.sid
                      </span>{" "}
                      and copy its value
                    </li>
                    <li>Paste it below</li>
                  </ol>
                )}
              </div>

              <form onSubmit={handleCookieSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-discord-text-secondary mb-1.5">
                    substack.sid cookie value
                  </label>
                  <input
                    type="text"
                    value={cookieValue}
                    onChange={(e) => setCookieValue(e.target.value)}
                    required
                    autoFocus
                    className="w-full bg-discord-input text-discord-text-primary rounded px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-discord-accent placeholder-discord-text-muted font-mono"
                    placeholder="s%3A..."
                  />
                </div>

                {cookieError && (
                  <p className="text-discord-danger text-sm bg-discord-danger/10 rounded px-3 py-2">
                    {cookieError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={cookieLoading || !cookieValue.trim()}
                  className="w-full bg-discord-accent hover:bg-discord-accent-hover text-white font-semibold rounded py-2.5 text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {cookieLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Verifying…
                    </>
                  ) : (
                    "Connect"
                  )}
                </button>
              </form>
            </div>
          )}

          {/* Password tab */}
          {tab === "password" && (
            <div className="space-y-4">
              <div className="bg-discord-tertiary rounded px-3 py-2.5 text-xs text-discord-text-muted">
                Note: Substack may require a CAPTCHA during programmatic login. If this
                fails, use the Session Cookie method instead.
              </div>

              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-discord-text-secondary mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                    className="w-full bg-discord-input text-discord-text-primary rounded px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-discord-accent placeholder-discord-text-muted"
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-discord-text-secondary mb-1.5">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full bg-discord-input text-discord-text-primary rounded px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-discord-accent placeholder-discord-text-muted"
                    placeholder="••••••••"
                  />
                </div>

                {pwError && (
                  <p className="text-discord-danger text-sm bg-discord-danger/10 rounded px-3 py-2">
                    {pwError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={pwLoading}
                  className="w-full bg-discord-accent hover:bg-discord-accent-hover text-white font-semibold rounded py-2.5 text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {pwLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Signing in…
                    </>
                  ) : (
                    "Sign in"
                  )}
                </button>
              </form>
            </div>
          )}
        </div>

        <div className="px-8 pb-6 space-y-2 text-center">
          <p className="text-discord-text-muted text-xs">
            Your session cookie is stored in an httpOnly server cookie and is never logged, shared, or saved to a database.
          </p>
          <p className="text-discord-text-muted text-xs">
            Subcord is open source —{" "}
            <a
              href="https://github.com/b04zdotcom/subcord"
              target="_blank"
              rel="noopener noreferrer"
              className="text-discord-accent hover:underline"
            >
              view the code on GitHub
            </a>
            {" "}to see exactly how your data is handled.
          </p>
        </div>
      </div>
    </div>
  );
}
