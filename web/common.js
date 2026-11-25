// Tap feedback: the tapped button shows a spinner and dims; a bar runs at the top while the server is working.
(function () {
  const css = `
    button { transition: transform .08s ease, filter .15s ease, opacity .15s ease; }
    button:active { transform: scale(.96); }
    button.busy { position: relative; pointer-events: none; opacity: .78; filter: saturate(.75); }
    button.busy::after { content: ""; display: inline-block; width: .95em; height: .95em; margin-left: .55em; vertical-align: -.12em;
      border: .17em solid currentColor; border-right-color: transparent; border-radius: 50%; animation: sspspin .7s linear infinite; flex: none; }
    @keyframes sspspin { to { transform: rotate(360deg); } }
    #sspbar { position: fixed; left: 0; top: 0; height: 4px; width: 100%; z-index: 99999; pointer-events: none; display: none;
      background: linear-gradient(90deg, transparent, #38bdf8, #22c55e, transparent) no-repeat; background-size: 45% 100%; animation: sspbar 1s linear infinite; }
    @keyframes sspbar { from { background-position: -45% 0; } to { background-position: 145% 0; } }`;
  const st = document.createElement("style"); st.textContent = css; document.head.appendChild(st);
  const bar = document.createElement("div"); bar.id = "sspbar"; (document.body || document.documentElement).appendChild(bar);
  let inflight = 0;
  const clearBusy = () => document.querySelectorAll("button.busy").forEach((b) => b.classList.remove("busy"));
  const orig = window.fetch.bind(window);
  window.fetch = async (...a) => {
    inflight++; bar.style.display = "block";
    try { return await orig(...a); }
    finally { inflight--; if (!inflight) setTimeout(() => { if (!inflight) { bar.style.display = "none"; clearBusy(); } }, 250); }
  };
  document.addEventListener("click", (e) => {
    const b = e.target.closest && e.target.closest("button");
    if (!b || b.disabled || b.hasAttribute("data-nobusy")) return;
    navigator.vibrate?.(25);
    b.classList.add("busy");
    setTimeout(() => { if (!inflight) b.classList.remove("busy"); }, 700);   // instant actions
    setTimeout(() => b.classList.remove("busy"), 10000);                     // safety
  }, true);
  window.SSP_BUSY = { clear: clearBusy };
})();

// Shared helpers for guard app and admin dashboard
(function () {
  const cfg = window.SSP_CONFIG || {};
  const domain = (cfg.GUARD_EMAIL_DOMAIN && !cfg.GUARD_EMAIL_DOMAIN.startsWith("__"))
    ? cfg.GUARD_EMAIL_DOMAIN : "guards.serenityspace.in";

  const sb = (window.supabase && cfg.SUPABASE_URL && !cfg.SUPABASE_URL.startsWith("__"))
    ? window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY, {
        // Stay logged in on this phone: keep the session in the phone's storage and renew it automatically
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, storage: window.localStorage },
      })
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
    NO_QR: "QR not scanned – video + reason",
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

  // Ask the phone not to clear this app's saved data (keeps the login), and renew the login when the app comes back to the screen
  try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch (e) {}
  if (sb) document.addEventListener("visibilitychange", () => {
    try { document.hidden ? sb.auth.stopAutoRefresh() : sb.auth.startAutoRefresh(); } catch (e) {}
  });
  // Was someone logged in on this phone before? (used to avoid showing the login screen when only the internet is down)
  const hadLogin = () => Object.keys(localStorage).some((k) => /^sb-.*-auth-token$/.test(k));

  window.SSP = { hadLogin, sb, domain, fmtDate, fmtTime, fmtDateTime, isoDateIST, syncServer, serverNow, esc, toast,
                 FLAG_TEXT, FRAUD_FLAGS, guardEmail: (code) => `${code.trim().toLowerCase()}@${domain}` };
})();
