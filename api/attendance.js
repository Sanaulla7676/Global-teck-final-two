import { configured, db, toArray } from "../server/firebase.js";
import { authorized, deny } from "../server/auth.js";
import { randomUUID } from "crypto";

export default async function handler(req, res) {
  if (!authorized(req)) return deny(res);
  if (!configured()) return res.status(503).json({ error: "Database is not configured.", attendance: [] });

  try {
    const database = db();

    if (req.method === "POST") {
      const employeeId = String(req.body?.employeeId || "");
      const date = String(req.body?.date || "");
      const status = String(req.body?.status || "");

      if (!employeeId || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !["present", "absent", "half_day", "leave"].includes(status)) {
        return res.status(400).json({ error: "Invalid attendance data." });
      }

      // Upsert: use composite key employeeId_date as the record key
      const recordKey = `${employeeId}_${date.replace(/-/g, "")}`;
      const record = {
        employee_id: employeeId,
        attendance_date: date,
        status,
        updated_at: Date.now(),
      };

      // Check if exists to preserve created_at
      const existing = await database.ref(`attendance/${recordKey}`).once("value");
      if (!existing.exists()) {
        record.created_at = Date.now();
      } else {
        record.created_at = existing.val().created_at || Date.now();
      }

      await database.ref(`attendance/${recordKey}`).set(record);
      return res.status(200).json({ id: recordKey, ...record });
    }

    if (req.method === "GET") {
      const employeeId = req.query?.employeeId;
      const from = req.query?.from;
      const to = req.query?.to;

      if (!employeeId || !from || !to) {
        return res.status(400).json({ error: "employeeId, from and to are required." });
      }

      // Query all attendance for this employee within date range
      const snap = await database.ref("attendance")
        .orderByChild("employee_id")
        .equalTo(employeeId)
        .once("value");

      const all = toArray(snap);
      const filtered = all.filter(r => r.attendance_date >= from && r.attendance_date <= to)
        .sort((a, b) => a.attendance_date < b.attendance_date ? -1 : 1);

      return res.status(200).json({ attendance: filtered });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Could not read or save attendance." });
  }
}
