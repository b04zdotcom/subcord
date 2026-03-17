# Subcord

A Discord-like chat viewer for Substack publications. Browse, search, and reply to Substack community threads in a clean, familiar interface.

## What is Subcord?

Substack has a chat feature built into each publication, but no dedicated UI for browsing conversations across all the publications you follow. Subcord fixes that — it pulls your subscribed chats into one place with a sidebar, threaded view, search, and reply support.

## How it works

Subcord proxies Substack's private API through Next.js server-side API routes. Your session cookie is forwarded from the server to Substack on every request — it never touches the browser after you paste it in.

**Your cookie is:**
- Stored in an `httpOnly` server-side cookie (invisible to JavaScript)
- Never logged, saved to a database, or shared with anyone
- Only used to make requests to `substack.com` on your behalf

## Privacy & security

This app is fully open source. You can read every line of code that handles your session cookie:

- [`src/lib/auth/session.ts`](src/lib/auth/session.ts) — how the cookie is stored
- [`src/lib/api/substackClient.ts`](src/lib/api/substackClient.ts) — how it is forwarded to Substack
- [`src/app/api/auth/`](src/app/api/auth/) — login and logout routes

The deployed version is built directly from this repository's `main` branch with no modifications.

## Local setup

```bash
git clone https://github.com/b04zdotcom/subcord.git
cd subcord
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), paste your `substack.sid` cookie, and you're in.

**To get your `substack.sid` cookie:**
1. Sign in to [substack.com](https://substack.com) in your browser
2. Open DevTools (`F12` / `Cmd+Option+I`)
3. Go to `Application → Cookies → https://substack.com`
4. Copy the value of the `substack.sid` cookie

No environment variables are required. The app is stateless.

## Deployment

The live deployment is connected to the `main` branch of this GitHub repository. Every push to `main` triggers an automatic redeploy on Netlify. No secrets or environment variables are configured — the app needs none.

To deploy your own instance:
1. Fork this repo
2. Connect it to a new Netlify site
3. Set the build command to `npm run build` and publish directory to `.next`

## Stack

- [Next.js 14](https://nextjs.org/) (App Router)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Fuse.js](https://fusejs.io/) for client-side fuzzy search
- [lucide-react](https://lucide.dev/) for icons
