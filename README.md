# 🌙 Lunar-HR

A full-stack HR management platform with an AI-powered chatbot assistant. Built with React, Express, tRPC, Drizzle ORM, and MySQL — deployable to Vercel or Railway.

**Live demo:** [lunar-hr.vercel.app](https://lunar-hr.vercel.app)

---

## Features

- **Employee Management** — manage employee records, roles, and departments
- **AI HR Chatbot** — powered by any OpenAI-compatible LLM (OpenAI, Anthropic, etc.)
- **Google OAuth** — sign in with Google, JWT session management
- **Role-based Access** — `admin` and `user` roles with protected routes
- **Type-safe API** — end-to-end type safety via tRPC + Zod
- **Database Migrations** — Drizzle ORM with MySQL, schema push + migrate workflow
- **Charts & Dashboards** — Recharts-powered data visualizations

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, TailwindCSS v4, shadcn/ui, Radix UI |
| Routing | Wouter |
| State / Data | TanStack Query, tRPC |
| Backend | Express.js, tRPC server |
| Database | MySQL + Drizzle ORM |
| Auth | Google OAuth 2.0 + JWT (jose) |
| AI | Any OpenAI-compatible API |
| Deployment | Vercel (frontend) / Railway (full-stack) |
| Language | TypeScript (93.9%) |

---

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (`npm i -g pnpm`)
- A running MySQL database

### 1. Clone the repo

```bash
git clone https://github.com/summmz/Lunar-HR.git
cd Lunar-HR
```

### 2. Install dependencies

```bash
pnpm install
# or
npm install --legacy-peer-deps
```

### 3. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

| Variable | Description |
|---|---|
| `DATABASE_URL` | MySQL connection string |
| `JWT_SECRET` | A long random string for signing session JWTs |
| `VITE_GOOGLE_OAUTH_CLIENT_ID` | Google OAuth client ID (public) |
| `GOOGLE_OAUTH_CLIENT_SECRET` | Google OAuth client secret (server-only) |
| `BUILT_IN_FORGE_API_URL` | Base URL of any OpenAI-compatible LLM API |
| `BUILT_IN_FORGE_API_KEY` | API key for the LLM service |
| `APP_URL` | Your public domain (leave blank for local dev) |

### 4. Set up the database

```bash
pnpm db:push
```

### 5. Start the dev server

```bash
pnpm dev
```

The app will be available at `http://localhost:3000`.

---

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/) and create a project
2. Enable the **Google+ API** under APIs & Services → Library
3. Create an **OAuth 2.0 Client ID** (Web application type)
4. Add the authorised redirect URI:
   - Development: `http://localhost:3000/api/oauth/google/callback`
   - Production: `https://yourdomain.com/api/oauth/google/callback`
5. Copy the Client ID → `VITE_GOOGLE_OAUTH_CLIENT_ID`
6. Copy the Client Secret → `GOOGLE_OAUTH_CLIENT_SECRET`

> **Note:** The redirect URI registered in Google Cloud must exactly match the one your server generates. In production, set `APP_URL` to your full domain.

---

## LLM / HR Chatbot

The chatbot works with any OpenAI-compatible API. Set `BUILT_IN_FORGE_API_URL` and `BUILT_IN_FORGE_API_KEY` in your environment.

To change the model, edit the `model` field in `server/_core/llm.ts`.

Examples:
- **OpenAI:** `BUILT_IN_FORGE_API_URL=https://api.openai.com`
- **Anthropic:** `BUILT_IN_FORGE_API_URL=https://api.anthropic.com` (use a `claude-*` model name)

---

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start development server (client + server with hot reload) |
| `pnpm build` | Build client (Vite) + server (esbuild) for production |
| `pnpm start` | Start production server |
| `pnpm db:push` | Generate and run database migrations |
| `pnpm test` | Run tests with Vitest |
| `pnpm check` | TypeScript type check |
| `pnpm format` | Format code with Prettier |

---

## Project Structure

```
Lunar-HR/
├── client/          # React frontend (Vite)
├── server/          # Express + tRPC backend
├── shared/          # Shared types and schemas
├── drizzle/         # Database migration files
├── .env.example     # Environment variable template
├── drizzle.config.ts
├── vite.config.ts
├── railway.toml     # Railway deployment config
└── vercel.json      # Vercel deployment config
```

---

## Deployment

### Vercel

The repo includes a `vercel.json`. Connect the repo to Vercel and set all environment variables in the Vercel dashboard.

### Railway

A `railway.toml` is included. Connect the repo to Railway and configure environment variables in your Railway service settings.

---

## First Admin User

After first login via Google OAuth, your account is created with role `user`. Promote yourself to admin directly in the database:

```sql
UPDATE users SET role = 'admin' WHERE email = 'you@example.com';
```

---

## License

MIT
