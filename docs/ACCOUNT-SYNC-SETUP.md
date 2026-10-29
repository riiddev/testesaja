# SinauuEnglish account and Google Sheets sync

This setup reuses the already configured Google Apps Script Web App and the spreadsheet attached to it. It does not create a new spreadsheet.

## Request flow

- The main website's `/api/account` and `/api/progress` paths are rewritten in `vercel.json` to the existing Vercel API deployment that already has `SINAI_APPS_SCRIPT_URL` and the server-side `SINAI_API_KEY`.
- The backend handles password hashing, account creation, login/session tokens, and per-account learning snapshots. The browser does not receive the API key or Apps Script URL.
- Learning remains local-first, and account progress synchronizes while signed in and online.

## Important maintenance notes

- Keep the existing backend deployment and its environment variables available. The main site currently relies on that deployment as a backend proxy target.
- Do not copy `SINAI_API_KEY` into frontend JavaScript, HTML, README, or Git commits.
- If the backend is ever moved into the main Vercel project, configure the existing Apps Script URL and the matching API key securely in that project, test signup/login/progress sync, then remove the external rewrites. Do not rotate the Apps Script key without updating the server-side configuration that validates it.
- Password-reset email is not implemented yet. Before broad use, test a new account, a repeated email, wrong-password login, logout/login, and progress restoration from another device.
