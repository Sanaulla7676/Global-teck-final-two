# Dayline Attendance SaaS

Mobile-first attendance tracker for a small team.

## Includes
- Morning attendance: Here / Out / Leave
- Add, edit and remove employees
- Employee photo upload with client-side resize
- Individual monthly attendance calendars
- Neon PostgreSQL persistence
- Optional owner PIN authentication
- Browser preview storage when Neon is not configured

## Deploy
On Vercel, set DATABASE_URL to the Neon connection string. OWNER_PIN is optional.
The API lives in api/, so Vercel treats the files as serverless functions.