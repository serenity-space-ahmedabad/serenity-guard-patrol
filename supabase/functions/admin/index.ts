// Serenity Space Guard Patrol — admin-only server actions
// Actions: create_guard, set_pin, create_admin, cleanup_media
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

const URL_ = Deno.env.get("SUPABASE_URL")!;
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GUARD_DOMAIN = Deno.env.get("GUARD_EMAIL_DOMAIN") ?? "guards.serenityspace.in";

export const guardEmail = (code: string) => `${code.trim().toLowerCase()}@${GUARD_DOMAIN}`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const admin = createClient(URL_, SERVICE, { auth: { persistSession: false } });

    // Who is calling? Must be an admin.
    const jwt = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
    const { data: me } = await admin.auth.getUser(jwt);
    if (!me?.user) return json({ error: "Not logged in" }, 401);
    const { data: isAdm } = await admin.from("admins").select("user_id").eq("user_id", me.user.id).maybeSingle();
    if (!isAdm) return json({ error: "Admins only" }, 403);

    const body = await req.json();
    const pinOk = (p: string) => /^\d{6}$/.test(p ?? "");

    switch (body.action) {
      case "create_guard": {
        const code = String(body.code ?? "").trim().toUpperCase();
        if (!/^[A-Z0-9-]{2,12}$/.test(code)) return json({ error: "Guard code: 2–12 letters/numbers, e.g. G01" }, 400);
        if (!body.name) return json({ error: "Name is required" }, 400);
        if (!pinOk(body.pin)) return json({ error: "PIN must be exactly 6 digits" }, 400);
        const { data, error } = await admin.auth.admin.createUser({
          email: guardEmail(code), password: body.pin, email_confirm: true,
          user_metadata: { role: "guard", code },
        });
        if (error) return json({ error: error.message }, 400);
        const { error: e2 } = await admin.from("guards").insert({
          id: data.user.id, code, name: body.name, phone: body.phone ?? null, agency: body.agency ?? null,
        });
        if (e2) { await admin.auth.admin.deleteUser(data.user.id); return json({ error: e2.message }, 400); }
        return json({ ok: true, id: data.user.id });
      }

      case "set_pin": {
        if (!pinOk(body.pin)) return json({ error: "PIN must be exactly 6 digits" }, 400);
        const { error } = await admin.auth.admin.updateUserById(body.guard_id, { password: body.pin });
        if (error) return json({ error: error.message }, 400);
        return json({ ok: true });
      }

      case "create_admin": {
        if (!body.email || String(body.password ?? "").length < 8)
          return json({ error: "Email and a password of at least 8 characters are required" }, 400);
        const { data, error } = await admin.auth.admin.createUser({
          email: body.email, password: body.password, email_confirm: true,
        });
        if (error) return json({ error: error.message }, 400);
        await admin.from("admins").upsert({ user_id: data.user.id, name: body.name ?? body.email });
        return json({ ok: true });
      }

      case "cleanup_media": {
        const { data: s } = await admin.from("app_settings").select("value").eq("key", "media_retention_days").single();
        const days = Number(s?.value ?? 30);
        const cutoff = new Date(Date.now() - days * 86400000).toISOString();
        let removed = 0;
        for (let i = 0; i < 50; i++) {
          const { data: rows } = await admin.from("scans").select("id, media_path")
            .lt("scanned_at", cutoff).eq("media_deleted", false).not("media_path", "is", null).limit(100);
          if (!rows?.length) break;
          await admin.storage.from("patrol-media").remove(rows.map((r) => r.media_path));
          await admin.from("scans").update({ media_deleted: true }).in("id", rows.map((r) => r.id));
          removed += rows.length;
        }
        return json({ ok: true, removed, older_than_days: days });
      }

      default:
        return json({ error: "Unknown action" }, 400);
    }
  } catch (e) {
    return json({ error: String(e?.message ?? e) }, 500);
  }
});
