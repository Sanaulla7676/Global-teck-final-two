import { configured, db, toArray, todayISO } from "../server/firebase.js";
import { authorized, deny } from "../server/auth.js";

export default async function handler(req, res) {
  if (!authorized(req)) return deny(res);
  const today = todayISO();

  if (!configured()) {
    return res.status(200).json({ configured: false, employees: [], attendance: [], today });
  }

  try {
    const database = db();

    // Load active employees
    const empSnap = await database.ref("employees").orderByChild("active").equalTo(true).once("value");
    const employees = toArray(empSnap).filter(e => e.active !== false).sort((a, b) =>
      (a.created_at || 0) < (b.created_at || 0) ? -1 : 1
    );

    // Load today's attendance
    const attSnap = await database.ref("attendance").orderByChild("attendance_date").equalTo(today).once("value");
    const attendance = toArray(attSnap);

    // Load payments
    const paySnap = await database.ref("payments").once("value");
    const payments = toArray(paySnap).sort((a, b) =>
      (b.payment_date || "").localeCompare(a.payment_date || "") || (b.created_at || 0) - (a.created_at || 0)
    );

    return res.status(200).json({ configured: true, employees, attendance, payments, today });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Database connection failed." });
  }
}
