import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getDatabase } from "firebase-admin/database";

function init() {
  if (getApps().length) return;
  const sa = process.env.FIREBASE_SERVICE_ACCOUNT;
  const dbUrl = process.env.FIREBASE_DATABASE_URL;
  if (!sa || !dbUrl) return;
  initializeApp({
    credential: cert(JSON.parse(sa)),
    databaseURL: dbUrl,
  });
}

export function configured() {
  return Boolean(process.env.FIREBASE_SERVICE_ACCOUNT && process.env.FIREBASE_DATABASE_URL);
}

export function db() {
  init();
  return getDatabase();
}

// Helper: convert Firebase object-of-objects to array with keys as IDs
export function toArray(snapshot) {
  const val = snapshot.val();
  if (!val) return [];
  return Object.entries(val).map(([id, data]) => ({ id, ...data }));
}

// Helper: get today in IST
export function todayISO() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
}
