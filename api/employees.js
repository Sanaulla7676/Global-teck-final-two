import { configured, db, toArray } from "../server/firebase.js";
import { authorized, deny } from "../server/auth.js";
import { randomUUID } from "crypto";

export default async function handler(req, res) {
  if (!authorized(req)) return deny(res);
  if (!configured()) return res.status(503).json({ error: "Database is not configured." });

  try {
    const database = db();
    const id = req.query?.id;

    if (req.method === "POST") {
      const name = String(req.body?.name || "").trim();
      const role = String(req.body?.role || "Team member").trim() || "Team member";
      const photo = typeof req.body?.photoData === "string" ? req.body.photoData : null;

      if (!name) return res.status(400).json({ error: "Name is required." });
      if (photo && photo.length > 850000) return res.status(413).json({ error: "Photo is too large." });

      const newId = randomUUID();
      const employee = {
        name,
        role,
        photo_data: photo || null,
        active: true,
        created_at: Date.now(),
      };
      await database.ref(`employees/${newId}`).set(employee);
      return res.status(201).json({ id: newId, ...employee });
    }

    if (req.method === "PATCH" && id) {
      const name = typeof req.body?.name === "string" ? req.body.name.trim() : null;
      const role = typeof req.body?.role === "string" ? req.body.role.trim() : null;
      const photo = typeof req.body?.photoData === "string" ? req.body.photoData : null;
      const removePhoto = req.body?.removePhoto === true;

      const empRef = database.ref(`employees/${id}`);
      const snap = await empRef.once("value");
      if (!snap.exists()) return res.status(404).json({ error: "Employee not found." });

      const existing = snap.val();
      if (!existing.active) return res.status(404).json({ error: "Employee not found." });

      const updates = {};
      if (name) updates.name = name;
      if (role) updates.role = role;
      if (removePhoto) updates.photo_data = null;
      else if (photo) updates.photo_data = photo;

      await empRef.update(updates);
      const updated = { ...existing, ...updates };
      return res.status(200).json({ id, ...updated });
    }

    if (req.method === "DELETE" && id) {
      const empRef = database.ref(`employees/${id}`);
      const snap = await empRef.once("value");
      if (!snap.exists() || snap.val()?.active === false) {
        return res.status(404).json({ error: "Employee not found." });
      }
      await empRef.update({ active: false });
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Could not update team." });
  }
}
