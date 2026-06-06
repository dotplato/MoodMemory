# MoodMemory

A personal inspiration library and visual memory system. Save images from anywhere on the web with one click, store them in your own Google Drive, and browse a beautiful searchable collection.

## Features

- One-click image saving via Chrome extension (hover button + context menu)
- Google Drive as primary storage — no external database
- Pinterest-style masonry dashboard
- Collections, tags, notes, and full-text search
- Command palette (`⌘K` / `Ctrl+K`)
- Dark mode with persisted preference
- AI-ready metadata architecture (not yet implemented)

## Quick start

```bash
npm install
cp .env.example .env.local
# Fill in Google OAuth credentials and AUTH_SECRET
npm run dev
```

See [SETUP.md](./SETUP.md) for full setup instructions including the Chrome extension.

See [DEPLOYMENT.md](./DEPLOYMENT.md) for Vercel deployment.

## Tech stack

- Next.js 16 · TypeScript · Tailwind CSS · shadcn/ui
- NextAuth (Google OAuth)
- Google Drive API
- Chrome Extension (Manifest V3)

## Project structure

```
app/                  Next.js routes & API
components/           UI components
extension/            Chrome extension source
lib/
  actions/            Server actions
  auth.ts             NextAuth config
  drive/              Google Drive service layer
  ai/                 Future AI hooks (placeholder)
  types/              Shared TypeScript types
```

## What you need from Google Cloud

1. OAuth 2.0 Client ID (Web application)
2. Google Drive API enabled
3. Scope: `https://www.googleapis.com/auth/drive.file`

Copy credentials into `.env.local` — see [.env.example](./.env.example).
