# GiftLists

A mobile-first gift list app built with Next.js, Tailwind CSS, PostgreSQL, and MikroORM.

## Features

- **Registration & login** — simple username/password auth (no email verification)
- **Public wishlists** — each user gets a public list of gifts they want (name required, URL and price optional)
- **Private gift idea lists** — plan surprises for others; only visible to the list owner
- **AI gift suggestions** — daily Gemini tips based on each person's wishlist (Czech)
- **Price filtering** — filter items by min/max price on any list view
- **Modern UI** — responsive, mobile-first design

## Getting started

### 1. Start PostgreSQL

```bash
npm run db:up
```

### 2. Configure environment

Copy `.env.example` to `.env.local` and adjust if needed:

```bash
cp .env.example .env.local
```

Required variables:

- `DATABASE_URL` — PostgreSQL connection string
- `AUTH_SECRET` — at least 32 characters (used for session tokens)

Optional (AI suggestions):

- `GEMINI_API_KEY` — Google Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey)
- `CRON_SECRET` — shared secret for the daily refresh endpoint (`/api/cron/ai-suggestions`)

### 3. Install dependencies & run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Run `npm run db:schema` before first use and after schema changes on deploy.

```bash
npm run db:schema
```

## Routes

| Route | Description |
|-------|-------------|
| `/` | Home — browse public wishlists |
| `/register` | Create an account |
| `/login` | Log in |
| `/dashboard` | Manage your wishlist and private lists |
| `/wishlist/[username]` | Public wishlist for a user (includes daily AI tips) |
| `/dashboard/lists/[id]` | Private gift idea list (owner only) |
| `/api/cron/ai-suggestions` | Daily refresh of AI tips (requires `CRON_SECRET`) |

## AI gift suggestions

Suggestions are generated with Gemini from each person's public wishlist and cached in the database. The public wishlist page only reads the cache (no Gemini on page load).

A daily job refreshes stale tips (`Europe/Prague` calendar day, or when wishlist items change). Gemini calls retry with exponential backoff until they succeed.

Trigger manually:

```bash
# HTTP (Bearer or ?secret=)
curl -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/ai-suggestions

# Or CLI (useful for host crontab / Coolify / etc.)
npm run ai:refresh
```

On Vercel, `vercel.json` schedules the endpoint daily at 05:00 UTC.
## Tech stack

- [Next.js 16](https://nextjs.org/)
- [Tailwind CSS 4](https://tailwindcss.com/)
- [PostgreSQL](https://www.postgresql.org/)
- [MikroORM](https://mikro-orm.io/)
- [Google Gen AI / Gemini](https://ai.google.dev/)
- [jose](https://github.com/panva/jose) (JWT sessions)
- [bcryptjs](https://github.com/dcodeIO/bcrypt.js) (password hashing)
