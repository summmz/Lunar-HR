# Lunar-HR — Setup Guide

## Quick Start (Local Development)

### 1. Install Dependencies

```bash
pnpm install
# or
npm install --legacy-peer-deps
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

| Variable | Description |
|---|---|
| `DATABASE_URL` | MySQL connection string |
| `JWT_SECRET` | Any long random string for signing session cookies |
| `VITE_GOOGLE_OAUTH_CLIENT_ID` | Google OAuth client ID (public) |
| `GOOGLE_OAUTH_CLIENT_SECRET` | Google OAuth client secret (server-only) |
| `BUILT_IN_FORGE_API_URL` | Base URL of any OpenAI-compatible LLM API |
| `BUILT_IN_FORGE_API_KEY` | API key for the LLM service |

### 3. Set Up the Database

```bash
pnpm db:push
```

### 4. Start the Dev Server

```bash
pnpm dev
```

The app will be available at `http://localhost:3000`.

---

## Setting Up Google OAuth

### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (e.g. `Lunar-HR`)

### Step 2: Enable the Google+ API

1. Go to **APIs & Services → Library**
2. Search for **Google+ API** and enable it

### Step 3: Create OAuth 2.0 Credentials

1. Go to **APIs & Services → Credentials**
2. Click **Create Credentials → OAuth client ID**
3. Configure the consent screen if prompted (External, add your email as test user)
4. Application type: **Web application**
5. Add Authorised redirect URI:
   - Development: `http://localhost:3000/api/oauth/google/callback`
   - Production: `https://yourdomain.com/api/oauth/google/callback`
6. Copy the **Client ID** → `VITE_GOOGLE_OAUTH_CLIENT_ID`
7. Copy the **Client Secret** → `GOOGLE_OAUTH_CLIENT_SECRET`

> **Important:** The redirect URI Google receives must exactly match what you register above.
> In production, set `APP_URL=https://yourdomain.com` in your environment so the server
> builds the redirect URI correctly behind a reverse proxy.

---

## LLM / HR Chatbot

The chatbot uses any OpenAI-compatible API. Set `BUILT_IN_FORGE_API_URL` and `BUILT_IN_FORGE_API_KEY` accordingly.

To change the model, edit the `model` field in `server/_core/llm.ts`.

---

## Production Build

```bash
pnpm build
pnpm start
```

---

## Making the First Admin

After first login via Google, the user is created with role `user` by default.
Promote them to admin directly in the database:

```sql
UPDATE users SET role = 'admin' WHERE email = 'you@example.com';
```
