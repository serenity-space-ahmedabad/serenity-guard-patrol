// Shared helpers for guard app and admin dashboard
(function () {
  const cfg = window.SSP_CONFIG || {};
  const domain = (cfg.GUARD_EMAIL_DOMAIN && !cfg.GUARD_EMAIL_DOMAIN.startsWith("__"))
    ? cfg.GUARD_EMAIL_DOMAIN : "guards.serenityspace.in";

  const sb = (window.supabase && cfg.SUPABASE_URL && !cfg.SUPABASE_URL.startsWith("__"))
    ? window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY)
    : null;

  const MON = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const TZ = "Asia/Kolkata";

  // Parts of a date in India time regardless of the phone's own timezone setting
  function istParts(d) {
    const p = {};
    new Intl.DateTimeFormat("en-GB", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })
      .formatToParts(new Date(d)).forEach((x) => (p[x.type] = x.value));
    if (p.hour === "24") p.hour = "00";
    return p;
  }
  const fmtDate = (d) => { const p = istParts(d); return `${p.day}-${MON[+p.month - 1]}-${p.year}`; };
  const fmtTime = (d, sec) => { const p = istParts(d); return sec ? `${p.hour}:${p.minute}:${p.second}` : `${p.hour}:${p.minute}`; };
  const fmtDateTime = (d) => `${fmtDate(d)} ${fmtTime(d, true)}`;
  const isoDateIST = (d) => { const p = istParts(d); return `${p.year}-${p.month}-${p.day}`; };

  // Server clock: phone time is never trusted, only used to tick between server syncs
  let offset = 0;
  const syncServer = (serverIso) => { offset = new Date(serverIso).getTime() - Date.now(); };
  const serverNow = () => new Date(Date.now() + offset);

  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  function toast(msg, kind) {
    let t = document.getElementById("toast");
    if (!t) { t = document.createElement("div"); t.id = "toast"; document.body.appendChild(t); }
    t.textContent = msg; t.className = "show " + (kind || "");
    clearTimeout(t._h); t._h = setTimeout(() => (t.className = ""), 3500);
  }

  const FLAG_TEXT = {
    OLD_QR: "Old / copied QR used (fraud attempt)",
    UNKNOWN_QR: "Not a patrol QR",
    NOT_ON_ROUTE: "Checkpoint not in this round",
    DUPLICATE: "Already scanned",
    NO_MEDIA: "Photo/video missing",
    EXPIRED: "Took too long",
    NO_GPS: "GPS off",
    OUT_OF_ZONE: "Not at the checkpoint (GPS)",
    LOW_GPS: "Weak GPS",
    TOO_FAST: "Too quick from previous point",
    OUT_OF_ORDER: "Out of route order",
    OTHER_PHONE: "Different phone used",
    LATE: "After round time",
  };
  const FRAUD_FLAGS = ["OLD_QR", "UNKNOWN_QR", "OUT_OF_ZONE", "TOO_FAST", "OTHER_PHONE"];

  window.SSP = { sb, domain, fmtDate, fmtTime, fmtDateTime, isoDateIST, syncServer, serverNow, esc, toast,
                 FLAG_TEXT, FRAUD_FLAGS, guardEmail: (code) => `${code.trim().toLowerCase()}@${domain}` };
})();
