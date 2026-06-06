# MoodMemory Deployment Guide (Vercel)

## 1. Push to GitHub

Ensure your repository is pushed to GitHub (or GitLab/Bitbucket supported by Vercel).

## 2. Import project in Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import the MoodMemory repository
3. Framework preset: **Next.js**
4. Build command: `npm run build`
5. Output directory: default (`.next`)

## 3. Configure environment variables

In Vercel → Project → Settings → Environment Variables, add:

| Variable | Example |
|----------|---------|
| `AUTH_SECRET` | output of `openssl rand -base64 32` |
| `AUTH_URL` | `https://your-app.vercel.app` |
| `GOOGLE_CLIENT_ID` | from Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | from Google Cloud Console |
| `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` |

Apply to **Production**, **Preview**, and **Development** as needed.

## 4. Update Google OAuth redirect URIs

In Google Cloud Console → Credentials → OAuth client:

Add authorized redirect URI:

```
https://your-app.vercel.app/api/auth/callback/google
```

## 5. Deploy

Trigger a deployment from Vercel. After deploy:

1. Visit your production URL
2. Sign in with Google
3. Confirm Drive folder creation

## 6. Extension in production

After deployment:

1. Update extension default API URL by connecting through `/extension/connect` on production
2. Rebuild extension if needed: `npm run build:extension`
3. Load unpacked extension locally, or publish to Chrome Web Store

When users connect, the extension stores the production `apiUrl` automatically from the connect page origin.

## 7. Recommended Vercel settings

- **Node.js version**: 20.x
- **Region**: choose closest to your users
- Enable **Automatic HTTPS** (default)

## 8. Performance notes for large libraries

MoodMemory uses:

- Paginated image loading (48 per page)
- Lazy-loaded grid images
- Drive index file for fast search/list operations
- Private image preview caching (`Cache-Control: private, max-age=3600`)

For libraries approaching 10,000+ images, consider:

- Keeping index entries lean (already implemented)
- Future: incremental index shards (architecture-ready via version field)

## 9. Security checklist

- [ ] `AUTH_SECRET` is unique per environment
- [ ] Google OAuth credentials are restricted to your domain
- [ ] OAuth consent screen published (for external users)
- [ ] Drive scope limited to `drive.file` (app-created files only)

## 10. Custom domain (optional)

1. Add domain in Vercel project settings
2. Update `AUTH_URL` and `NEXT_PUBLIC_APP_URL`
3. Add new redirect URI in Google Cloud Console

## Monitoring

Use Vercel Analytics and runtime logs to monitor:

- `/api/extension/save` errors
- Google token refresh failures
- Drive API quota issues

Google Drive API quotas are generally sufficient for personal/small-team usage. Monitor in Google Cloud Console if scaling beyond early adopters.
