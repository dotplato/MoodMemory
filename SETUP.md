# MoodMemory Setup Guide

MoodMemory is a Next.js app with Google OAuth, Google Drive storage, and a Chrome extension for one-click image saving.

## Prerequisites

- Node.js 20+
- npm
- Google Cloud project with Drive API enabled
- Chrome browser (for the extension)

## 1. Install dependencies

```bash
npm install
```

## 2. Configure environment

```bash
cp .env.example .env.local
```

Fill in:

- `AUTH_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `AUTH_URL` and `NEXT_PUBLIC_APP_URL`

See [.env.example](./.env.example) for details.

## 3. Run the web app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## 4. Sign in

1. Click **Get started**
2. Sign in with Google
3. Grant Google Drive access when prompted
4. MoodMemory creates this folder structure in your Drive on first login:

```
MoodMemory/
├── images/
├── metadata/
├── collections/
└── moodmemory-index.json
```

## 5. Build & install the Chrome extension

```bash
npm run build:extension
```

Then in Chrome:

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the `extension/dist` folder

## 6. Connect the extension

1. Sign in to MoodMemory in the browser
2. Go to **Settings → Extension** in the app
3. Click **Send to extension**

Alternatively, open the extension popup and click **Connect account**.

## 7. Save your first image

Browse any website, hover an image, and click **Save** — or right-click an image and choose **Save to MoodMemory**.

Saved images appear instantly in `/dashboard`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | TypeScript check |
| `npm run build:extension` | Build Chrome extension |

## Architecture overview

- **Frontend**: Next.js App Router, shadcn/ui, Tailwind CSS
- **Auth**: NextAuth v5 with Google OAuth
- **Storage**: Google Drive (images + JSON metadata/index)
- **Extension**: Chrome MV3 (context menu + hover save button)
- **Search**: Client-side filtering over the Drive index (AI-ready metadata fields included)

## Troubleshooting

### "Unauthorized" when saving from extension
- Reconnect via Settings → Extension
- Ensure `AUTH_URL` matches your running app URL

### Google Drive permission errors
- Re-authenticate and accept Drive scope
- Confirm Drive API is enabled in Google Cloud

### Images fail to save from some websites
- Some sites block hotlinking or require referrer headers
- Try right-click save instead of hover save

## Next steps

- Deploy to Vercel: see [DEPLOYMENT.md](./DEPLOYMENT.md)
- Replace extension placeholder icons in `extension/dist/icons/`
