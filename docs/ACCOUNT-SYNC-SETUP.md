# SinauuEnglish account and cloud-sync setup

This feature uses Supabase Auth + a private Postgres row per account. The browser sends only the public anon/publishable key; **never use a Supabase service-role/secret key in the frontend or Vercel VITE variables**. Row Level Security (RLS) enforces that a signed-in user can read or change only the row whose user_id matches their authenticated ID.

## 1. Create a free Supabase project

1. Sign in to https://supabase.com/dashboard and create a project on the Free plan.
2. Open Project Settings → API (or the project Connect panel) and copy the Project URL and public anon/publishable key.
3. Open SQL Editor and run the complete file supabase/migrations/20261029000000_create_user_learning_states.sql from this repository.

Supabase Free is listed at $0/month and currently includes two active projects, 500 MB database, and up to 50,000 monthly active users; free projects may pause after one week of inactivity. Check current limits at https://supabase.com/pricing.

## 2. Add Vercel environment variables

In Vercel → project sinauuenglish → Settings → Environment Variables, add these two variables for Production and Preview:

- VITE_SUPABASE_URL = your Supabase Project URL, e.g. https://YOUR_PROJECT_REF.supabase.co
- VITE_SUPABASE_ANON_KEY = your public anon/publishable key

These are browser-visible public settings, not secrets. The SQL RLS policies are the security boundary. Do not add a service-role/secret key here.

For local development, copy .env.example to .env.local and fill the same two values. Redeploy after adding variables; Vite embeds VITE variables at build time.

## 3. Configure email authentication

In Supabase Authentication → URL Configuration:
- Site URL: https://sinauuenglish.vercel.app
- Add redirect URLs: https://sinauuenglish.vercel.app/belajar.html and the matching Vercel preview URLs you use.

Keep email confirmation enabled for public sign-ups. Check the Auth email provider/SMTP limits: default provider rate limits may be restrictive for public use. Set a production-quality SMTP provider before inviting a large audience; it is optional for initial testing.

## 4. Test end to end

1. Redeploy Vercel.
2. Open https://sinauuenglish.vercel.app/belajar.html, tap Masuk / Daftar, and create an account with an email you can access.
3. Confirm the email if required, then sign in. The current device's local vocabulary, grammar, activity, matching, and HABIT progress are merged with the cloud state.
4. Open the same app on a second device/browser and sign into the same account. It should load the same cloud progress; changes sync after a short delay while online and on foreground/focus.
5. Use Sinkronkan sekarang to request a sync immediately.

If configuration is missing, local learning still works and the account dialog explains what remains to be configured. User data is not uploaded until a user is signed in and cloud sync is configured.

## 5. Install the app

The site now includes a web app manifest and a service worker for installability and shell caching. On Android/Chrome, use the browser's Install app or Add to Home screen action. On iPhone, open the site in Safari → Share → Add to Home Screen. A PWA is installable from the website; it is not an Android APK or an App Store/Play Store listing.

## Design and data notes

- The current account UI uses email + password and email verification/reset flows.
- The learning database remains local-first; cloud sync requires internet, merges timestamps and evidence/history arrays, and retries after reconnect/focus. The SQL table stores a single account snapshot to keep the schema small.
- Mastery criteria and content-draft labels are unchanged.
- Supabase free-service limits and Vercel hosting/account constraints are provider limits, not guarantees of indefinite availability.
