// Serenity Space Patrol — sends phone alerts to guards (round start / reminder).
// Called every minute by the database (patrol_notify_tick) with a shared secret header.
import webpush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2";
import { pick } from "./i18n.js";

const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false },
});
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { "Content-Type": "application/json" } });

const TXT: Record<string, Record<string, (p: string, t: string) => [string, string]>> = {
  start: {
    en: (p) => ["🔔 Round started", `Go to ${p}. Open the app and scan.`],
    hi: (p) => ["🔔 राउंड शुरू", `${p} पर जाइए। ऐप खोलकर स्कैन करें।`],
    gu: (p) => ["🔔 રાઉન્ડ શરૂ", `${p} પર જાઓ. એપ ખોલીને સ્કેન કરો.`],
  },
  remind: {
    en: (p, t) => ["⏰ Round not finished", `Finish by ${t}. Next: ${p}`],
    hi: (p, t) => ["⏰ राउंड बाकी है", `${t} तक पूरा करें। अगली जगह: ${p}`],
    gu: (p, t) => ["⏰ રાઉન્ડ બાકી છે", `${t} સુધી પૂરું કરો. આગળની જગ્યા: ${p}`],
  },
  solar: {
    en: (p) => ["☀️ Solar meter reading", `Time for the evening solar reading. ${p} blocks left.`],
    hi: (p) => ["☀️ सोलर मीटर रीडिंग", `शाम की सोलर रीडिंग का समय। ${p} ब्लॉक बाकी।`],
    gu: (p) => ["☀️ સોલર મીટર રીડિંગ", `સાંજના સોલર રીડિંગનો સમય. ${p} બ્લોક બાકી.`],
  },
  solar_remind: {
    en: (p, t) => ["⏰ Solar reading pending", `${p} blocks still left. Finish by ${t}.`],
    hi: (p, t) => ["⏰ सोलर रीडिंग बाकी", `अभी ${p} ब्लॉक बाकी हैं। ${t} तक पूरा करें।`],
    gu: (p, t) => ["⏰ સોલર રીડિંગ બાકી", `હજી ${p} બ્લોક બાકી છે. ${t} સુધી પૂરું કરો.`],
  },
  test: {
    en: () => ["🔔 Alerts are on", "You will get a ring when a round starts."],
    hi: () => ["🔔 अलर्ट चालू हैं", "राउंड शुरू होने पर घंटी बजेगी।"],
    gu: () => ["🔔 અલર્ટ ચાલુ છે", "રાઉન્ડ શરૂ થાય ત્યારે ઘંટડી વાગશે."],
  },
};
const hhmm = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(iso));

Deno.serve(async (req) => {
  try {
    const { data: rows } = await sb.from("app_secrets").select("key,value");
    const S = Object.fromEntries((rows ?? []).map((r) => [r.key, r.value]));
    const body = await req.json().catch(() => ({}));

    // Who may call: the database (shared secret), or a logged-in guard asking for a test alert to themselves
    let testGuard: string | null = null;
    if (req.headers.get("x-patrol-secret") !== S.notify_secret) {
      const jwt = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
      const { data: me } = await sb.auth.getUser(jwt);
      if (body.kind !== "test" || !me?.user) return json({ error: "unauthorized" }, 401);
      testGuard = me.user.id;
    }
    webpush.setVapidDetails(S.vapid_subject, S.vapid_public, S.vapid_private);

    let guardIds: string[] = [];
    let place: Record<string, unknown> | null = null;
    let dueEnd = "";
    let solarLeft = "";
    const isSolar = body.kind === "solar" || body.kind === "solar_remind";
    if (testGuard) {
      guardIds = [testGuard];
    } else if (isSolar) {
      // evening solar reading: alert every active guard
      solarLeft = String(Math.max(0, Number(body.total ?? 9) - Number(body.done ?? 0)));
      const { data: we } = await sb.from("app_settings").select("value").eq("key", "solar_window_end").maybeSingle();
      dueEnd = we?.value ?? "";
      guardIds = ((await sb.from("guards").select("id").eq("active", true)).data ?? []).map((g) => g.id);
    } else {
      const { data: r } = await sb.from("rounds").select("id, route_id, due_end, assigned_guard").eq("id", body.round_id).single();
      if (!r) return json({ error: "round not found" }, 404);
      dueEnd = r.due_end;
      const [{ data: rcs }, { data: done }] = await Promise.all([
        sb.from("route_checkpoints").select("seq, checkpoints(id, name, name_hi, name_gu, active)").eq("route_id", r.route_id).order("seq"),
        sb.from("scans").select("checkpoint_id").eq("round_id", r.id).neq("status", "rejected"),
      ]);
      const doneIds = new Set((done ?? []).map((d) => d.checkpoint_id));
      place = (rcs ?? []).map((x: any) => x.checkpoints).find((c: any) => c?.active && !doneIds.has(c.id)) ?? null;
      if (!place && body.kind === "remind") return json({ ok: true, skipped: "round complete" });
      if (r.assigned_guard) guardIds = [r.assigned_guard];
      else guardIds = ((await sb.from("guards").select("id").eq("active", true)).data ?? []).map((g) => g.id);
    }

    const { data: subs } = await sb.from("push_subscriptions").select("*").in("guard_id", guardIds.length ? guardIds : ["00000000-0000-0000-0000-000000000000"]);
    let sent = 0, failed = 0;
    for (const s of subs ?? []) {
      const lang = ["en", "hi", "gu"].includes(s.lang) ? s.lang : "en";
      const kind = TXT[body.kind] ? body.kind : "start";
      const [title, text] = isSolar ? TXT[kind][lang](solarLeft, dueEnd)
        : TXT[kind][lang](place ? pick(place, "name", lang) : "", dueEnd ? hhmm(dueEnd) : "");
      const payload = JSON.stringify({ title, body: text, tag: isSolar ? `solar-${kind}` : `round-${body.round_id ?? "test"}`, url: "./" });
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload,
          { TTL: 1800, urgency: "high" });
        sent++;
      } catch (e: any) {
        failed++;
        if (e?.statusCode === 404 || e?.statusCode === 410) await sb.from("push_subscriptions").delete().eq("id", s.id);
        console.log("push failed", e?.statusCode, e?.body);
      }
    }
    return json({ ok: true, sent, failed, guards: guardIds.length });
  } catch (e) {
    console.error(e);
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});
