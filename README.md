# Dayline Attendance SaaS

Mobile-first attendance tracker — real backend powered by **Firebase Realtime Database**.

## Features
- Morning attendance: Present / Absent / Leave
- Add, edit, and remove employees
- Employee photo upload with client-side resize
- Individual monthly attendance calendars
- Firebase Realtime Database persistence
- Optional owner PIN authentication
- Browser preview storage when Firebase is not configured

## Tech Stack
- **Frontend**: Single-file HTML/CSS/JS (zero build step)
- **Backend**: Vercel Serverless Functions (Node.js ESM)
- **Database**: Firebase Realtime Database (free Spark tier)

## Deploy to Vercel

### 1. Set up Firebase (one-time)
The Firebase project `deepak-att-saas` is already created with RTDB at:
`https://deepak-att-saas-default-rtdb.firebaseio.com`

### 2. Get environment variables
You need two environment variables for Vercel:

| Variable | Value |
|---|---|
| `FIREBASE_DATABASE_URL` | `https://deepak-att-saas-default-rtdb.firebaseio.com` |
| `FIREBASE_SERVICE_ACCOUNT` | Contents of `service-account.json` (minified, single line) |
| `OWNER_PIN` | *(optional)* A numeric PIN to protect the dashboard |

To get the minified service account JSON, run:
```powershell
(Get-Content service-account.json -Raw) -join '' | % { $_ -replace '\s+', ' ' }
```

### 3. Deploy
```bash
vercel --prod
```

In the Vercel dashboard, go to **Settings ? Environment Variables** and add the three variables above.

## Local Development
```bash
# Install dependencies
npm install

# Start local dev (static file server)
npm run dev
```

For local API testing with full Firebase backend, set `.env.local` (already created).
