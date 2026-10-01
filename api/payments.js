import { configured, db, toArray, todayISO } from "../server/firebase.js";
import { authorized, deny } from "../server/auth.js";
import { randomUUID } from "crypto";

export default async function handler(req, res) {
  if (!authorized(req)) return deny(res);
  if (!configured()) return res.status(503).json({ error: "Database is not configured.", payments: [] });

  try {
    const database = db();
    const id = req.query?.id;

    if (req.method === "GET") {
      const date = req.query?.date;
      const employeeId = req.query?.employeeId;
      const from = req.query?.from;
      const to = req.query?.to;

      let ref = database.ref("payments");
      const snap = await ref.once("value");
      let list = toArray(snap);

      if (date) {
        list = list.filter(p => p.payment_date === date);
      } else if (from && to) {
        list = list.filter(p => p.payment_date >= from && p.payment_date <= to);
      }

      if (employeeId) {
        list = list.filter(p => p.employee_id === employeeId);
      }

      // Sort newest date first
      list.sort((a, b) => (b.payment_date || "").localeCompare(a.payment_date || "") || (b.created_at || 0) - (a.created_at || 0));

      return res.status(200).json({ payments: list });
    }

    if (req.method === "POST") {
      const amount = Number(req.body?.amount);
      const paymentDate = String(req.body?.payment_date || req.body?.date || todayISO()).trim();
      const employeeId = req.body?.employee_id || req.body?.employeeId || null;
      const employeeName = String(req.body?.employee_name || req.body?.employeeName || "General").trim();
      const notes = String(req.body?.notes || req.body?.description || "").trim();

      if (isNaN(amount) || amount <= 0) {
        return res.status(400).json({ error: "Please enter a valid payment amount." });
      }

      if (!/^\d{4}-\d{2}-\d{2}$/.test(paymentDate)) {
        return res.status(400).json({ error: "Invalid payment date format (YYYY-MM-DD)." });
      }

      const newId = randomUUID();
      const payment = {
        amount,
        payment_date: paymentDate,
        employee_id: employeeId,
        employee_name: employeeName,
        notes,
        created_at: Date.now(),
      };

      await database.ref(`payments/${newId}`).set(payment);
      return res.status(201).json({ id: newId, ...payment });
    }

    if (req.method === "DELETE" && id) {
      const payRef = database.ref(`payments/${id}`);
      const snap = await payRef.once("value");
      if (!snap.exists()) {
        return res.status(404).json({ error: "Payment record not found." });
      }
      await payRef.remove();
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Could not process payment request." });
  }
}
