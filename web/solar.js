// Serenity Space Patrol — evening solar meter reading (guard side)
// Flow: ☀️ tile on home → 9 big block tiles → photo of meter → type reading on big number pad → save → next block.

const ST = {
  en: {
    title: "Solar meter reading", takeReading: "Take readings", doneOf: "{a} of {b} blocks done", readingAt: "Solar reading from {t}",
    allDoneToday: "Today's solar readings are complete", lateMsg: "Reading time is over – please finish now", block: "Block",
    prev: "Last reading", firstReading: "First reading for this block", step1: "Take a photo of the meter", retake: "Take again",
    photoOk: "Photo taken", step2: "Type the meter reading (kWh)", today: "Today's units", save: "Save reading",
    cantRead: "Could not read the meter", why: "Why could you not read it?", r_LOCKED: "Room locked", r_METER_FAULT: "Meter not working",
    r_DISPLAY_OFF: "Display off / blank", r_OTHER: "Something else", lowerWarn: "This is LOWER than the last reading! Please check the meter again.",
    lowerWhy: "If it is really lower, choose why:", lw_reset: "Meter changed / reset", lw_unsure: "Not sure", highWarn: "This looks too HIGH. Please check the digits again.",
    highOk: "Yes, it is correct", needPhoto: "First take a photo of the meter", needValue: "Type the reading", savedUnits: "Saved · +{u} units",
    saved: "Saved", allDone: "All 9 blocks done. Thank you!", home: "Home", allBlocks: "All blocks", notes: "Note (optional)",
    n_dust: "Dust on panels", n_water: "Water / dirt on meter", n_blur: "Display not clear", speak: "Speak", alreadySaved: "Already saved today – you can change it",
    committeeSaved: "Entered by committee", torch: "Light", shutter: "Take photo", photoHint: "Hold the phone close so the numbers are clear",
    sending: "Saving…", closed: "Solar reading starts at {t}", kw: "kW", units: "units",
  },
  hi: {
    title: "सोलर मीटर रीडिंग", takeReading: "रीडिंग लें", doneOf: "{a} / {b} ब्लॉक पूरे", readingAt: "सोलर रीडिंग {t} बजे से",
    allDoneToday: "आज की सोलर रीडिंग पूरी हो गई", lateMsg: "रीडिंग का समय निकल गया – जल्दी पूरा करें", block: "ब्लॉक",
    prev: "पिछली रीडिंग", firstReading: "इस ब्लॉक की पहली रीडिंग", step1: "मीटर की फोटो लें", retake: "फिर से लें",
    photoOk: "फोटो हो गई", step2: "मीटर की रीडिंग डालें (kWh)", today: "आज की बिजली", save: "रीडिंग सेव करें",
    cantRead: "रीडिंग नहीं ले पाए", why: "रीडिंग क्यों नहीं ले पाए?", r_LOCKED: "कमरा बंद है", r_METER_FAULT: "मीटर खराब है",
    r_DISPLAY_OFF: "डिस्प्ले बंद / खाली", r_OTHER: "कुछ और", lowerWarn: "यह पिछली रीडिंग से कम है! मीटर फिर से देखें।",
    lowerWhy: "अगर सच में कम है, तो कारण चुनें:", lw_reset: "मीटर बदला / रीसेट हुआ", lw_unsure: "पता नहीं", highWarn: "यह बहुत ज़्यादा लग रहा है। अंक फिर से देखें।",
    highOk: "हाँ, यह सही है", needPhoto: "पहले मीटर की फोटो लें", needValue: "रीडिंग डालें", savedUnits: "सेव हो गया · +{u} यूनिट",
    saved: "सेव हो गया", allDone: "सभी 9 ब्लॉक पूरे। धन्यवाद!", home: "होम", allBlocks: "सभी ब्लॉक", notes: "नोट (ज़रूरी नहीं)",
    n_dust: "पैनल पर धूल", n_water: "मीटर पर पानी / गंदगी", n_blur: "डिस्प्ले साफ नहीं", speak: "बोलें", alreadySaved: "आज सेव हो चुकी है – बदल सकते हैं",
    committeeSaved: "कमेटी ने डाली", torch: "लाइट", shutter: "फोटो लें", photoHint: "फोन पास रखें ताकि अंक साफ दिखें",
    sending: "सेव हो रहा है…", closed: "सोलर रीडिंग {t} बजे से शुरू होगी", kw: "kW", units: "यूनिट",
  },
  gu: {
    title: "સોલર મીટર રીડિંગ", takeReading: "રીડિંગ લો", doneOf: "{a} / {b} બ્લોક પૂર્ણ", readingAt: "સોલર રીડિંગ {t} વાગ્યાથી",
    allDoneToday: "આજનું સોલર રીડિંગ પૂર્ણ થયું", lateMsg: "રીડિંગનો સમય પૂરો થયો – જલ્દી પૂરું કરો", block: "બ્લોક",
    prev: "છેલ્લું રીડિંગ", firstReading: "આ બ્લોકનું પહેલું રીડિંગ", step1: "મીટરનો ફોટો લો", retake: "ફરી લો",
    photoOk: "ફોટો થઈ ગયો", step2: "મીટરનું રીડિંગ નાખો (kWh)", today: "આજની વીજળી", save: "રીડિંગ સેવ કરો",
    cantRead: "રીડિંગ લઈ શક્યા નહીં", why: "રીડિંગ કેમ ન લઈ શક્યા?", r_LOCKED: "રૂમ બંધ છે", r_METER_FAULT: "મીટર ખરાબ છે",
    r_DISPLAY_OFF: "ડિસ્પ્લે બંધ / ખાલી", r_OTHER: "બીજું કંઈક", lowerWarn: "આ છેલ્લા રીડિંગથી ઓછું છે! મીટર ફરી જુઓ.",
    lowerWhy: "જો ખરેખર ઓછું હોય, તો કારણ પસંદ કરો:", lw_reset: "મીટર બદલાયું / રીસેટ થયું", lw_unsure: "ખબર નથી", highWarn: "આ ખૂબ વધારે લાગે છે. આંકડા ફરી જુઓ.",
    highOk: "હા, આ સાચું છે", needPhoto: "પહેલા મીટરનો ફોટો લો", needValue: "રીડિંગ નાખો", savedUnits: "સેવ થયું · +{u} યુનિટ",
    saved: "સેવ થયું", allDone: "બધા 9 બ્લોક પૂર્ણ. આભાર!", home: "હોમ", allBlocks: "બધા બ્લોક", notes: "નોંધ (જરૂરી નથી)",
    n_dust: "પેનલ પર ધૂળ", n_water: "મીટર પર પાણી / ગંદકી", n_blur: "ડિસ્પ્લે સ્પષ્ટ નથી", speak: "બોલો", alreadySaved: "આજે સેવ થઈ ગયું છે – બદલી શકો છો",
    committeeSaved: "કમિટીએ નાખ્યું", torch: "લાઇટ", shutter: "ફોટો લો", photoHint: "ફોન નજીક રાખો જેથી આંકડા સ્પષ્ટ દેખાય",
    sending: "સેવ થઈ રહ્યું છે…", closed: "સોલર રીડિંગ {t} વાગ્યે શરૂ થશે", kw: "kW", units: "યુનિટ",
  },
};
const st = (k, v) => { let s = (ST[lang] && ST[lang][k]) || ST.en[k] || k; if (v) for (const x in v) s = s.replace(`{${x}}`, v[x]); return s; };

// Spoken sentences
Object.assign(SAY.en, {
  solarStart: "Solar meter reading. Start with the first block.", solarBlock: (b) => `Block ${b}. First take a photo of the meter, then type the reading.`,
  solarNext: (b) => `Saved. Now go to block ${b}.`, solarAllDone: "All solar readings are done. Thank you.",
  solarLower: "This reading is lower than the last one. Please check the meter again.", solarHigh: "This reading looks too high. Please check the digits again.",
  solarWhy: "Why could you not read the meter? Press a picture.",
});
Object.assign(SAY.hi, {
  solarStart: "सोलर मीटर रीडिंग। पहले ब्लॉक से शुरू करें।", solarBlock: (b) => `ब्लॉक ${b}। पहले मीटर की फोटो लें, फिर रीडिंग डालें।`,
  solarNext: (b) => `सेव हो गया। अब ब्लॉक ${b} पर जाइए।`, solarAllDone: "सारी सोलर रीडिंग पूरी हो गई। धन्यवाद।",
  solarLower: "यह रीडिंग पिछली से कम है। मीटर फिर से देखिए।", solarHigh: "यह रीडिंग बहुत ज़्यादा लग रही है। अंक फिर से देखिए।",
  solarWhy: "रीडिंग क्यों नहीं ले पाए? तस्वीर दबाइए।",
});
Object.assign(SAY.gu, {
  solarStart: "સોલર મીટર રીડિંગ. પહેલા બ્લોકથી શરૂ કરો.", solarBlock: (b) => `બ્લોક ${b}. પહેલા મીટરનો ફોટો લો, પછી રીડિંગ નાખો.`,
  solarNext: (b) => `સેવ થયું. હવે બ્લોક ${b} પર જાઓ.`, solarAllDone: "બધાં સોલર રીડિંગ પૂર્ણ થયાં. આભાર.",
  solarLower: "આ રીડિંગ છેલ્લા કરતાં ઓછું છે. મીટર ફરી જુઓ.", solarHigh: "આ રીડિંગ ખૂબ વધારે લાગે છે. આંકડા ફરી જુઓ.",
  solarWhy: "રીડિંગ કેમ ન લઈ શક્યા? ચિત્ર દબાવો.",
});

const NOT_READ = [["LOCKED", "🔒"], ["METER_FAULT", "⚠️"], ["DISPLAY_OFF", "⚫"], ["OTHER", "❓"]];
const NOTE_CHIPS = [["n_dust", "🧹"], ["n_water", "💧"], ["n_blur", "🌫️"]];
const fmtNum = (n) => (n == null ? "–" : Number(n).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 }));
const areaIcon = (a) => (/lift/i.test(a || "") ? "🚰🛗" : "🚰");
const blockName = (b) => `${st("block")} ${b}`;
const solarBlocks = () => home?.solar?.blocks || [];
const nextPendingBlock = (after) => {
  const list = solarBlocks(), i = list.findIndex((x) => x.block === after);
  return list.slice(i + 1).find((x) => !x.today) || list.find((x) => !x.today) || null;
};

// ---------- Home tile ----------
function solarTile() {
  const s = home?.solar;
  if (!s || !s.blocks || !s.blocks.length) return "";
  const done = s.blocks.filter((b) => b.today).length, total = s.blocks.length;
  if (!s.open) return `<div class="solarNote">☀️ ${st("readingAt", { t: s.window_start })}</div>`;
  if (done === total) return `<div class="solarNote ok">☀️ ✅ ${st("allDoneToday")}</div>`;
  return `<div class="solarTile ${s.late ? "late" : ""}">
    <div class="lbl">☀️ ${st("title")}</div>
    <div class="sgrid">${s.blocks.map((b) => `<span class="sb ${b.today ? "ok" : ""}">${b.today ? "✓" : b.block}</span>`).join("")}</div>
    <div class="cnt">${st("doneOf", { a: done, b: total })}</div>
    ${s.late ? `<div class="lateMsg">⏰ ${st("lateMsg")}</div>` : ""}
    <button class="big solarBtn" onclick="openSolar()"><span class="i">☀️</span>${st("takeReading")}</button></div>`;
}

// ---------- Block grid ----------
async function refreshSolar() {
  const { data, error } = await sb.rpc("solar_today");
  if (!error && data) { home.solar = data; SSP.syncServer(data.server_now); }
}
function solarShow(html) {
  hidePanels(); const p = $("solar"); p.style.display = "block"; p.scrollTop = 0; $("solarIn").innerHTML = html;
}
function closeSolar() { $("solar").style.display = "none"; SR = null; renderHome(); }

async function openSolar(fromSave) {
  if (!fromSave) await refreshSolar();
  const s = home.solar, list = s.blocks;
  if (!s.open) { toast(st("closed", { t: s.window_start })); return; }
  const done = list.filter((b) => b.today).length;
  solarShow(`<div class="shead"><button data-nobusy class="mid" onclick="closeSolar()">🏠 ${st("home")}</button>
      <div class="stitle">☀️ ${st("title")}<small>${st("doneOf", { a: done, b: list.length })}</small></div></div>
    ${done === list.length ? `<div class="status done"><div class="ico">🎉</div><h2>${st("allDone")}</h2></div>` : ""}
    <div class="bgrid">${list.map((b) => {
      const t = b.today;
      return `<button class="btile ${t ? (t.kwh == null ? "nr" : "ok") : ""}" onclick="openBlock('${b.block}')">
        <span class="bl">${b.block}</span>
        <span class="bs">${t ? (t.kwh == null ? "🚫" : "✓ " + fmtNum(t.kwh)) : `☀️ ${b.kw} ${st("kw")}`}</span></button>`;
    }).join("")}</div>
    ${s.late ? `<div class="warn" style="margin-top:12px">⏰ ${st("lateMsg")}</div>` : ""}`);
  if (!fromSave) say(done === list.length ? "solarAllDone" : "solarStart");
}

// ---------- One block ----------
let SR = null;
function openBlock(code) {
  const b = solarBlocks().find((x) => x.block === code);
  const t = b.today;
  SR = { b, photo: null, photoUrl: null, value: t && t.kwh != null ? String(Number(t.kwh)) : "", note: [], lowerWhy: null, highOk: false, reason: null };
  renderBlock();
  say("solarBlock", () => code);
}
function renderBlock(msg) {
  const { b } = SR, t = b.today;
  const v = SR.value === "" ? null : Number(SR.value);
  const days = b.prev_date ? Math.max(1, Math.round((new Date(home.solar.date) - new Date(b.prev_date)) / 864e5)) : 1;
  const diff = v != null && b.prev_kwh != null ? +(v - Number(b.prev_kwh)).toFixed(2) : null;
  const enough = b.prev_kwh != null && SR.value.split(".")[0].length >= String(Math.floor(Number(b.prev_kwh))).length;
  const lower = diff != null && diff < 0 && enough;
  const high = diff != null && diff > home.solar.max_per_kw * Number(b.kw) * days;
  const locked = t && t.source === "admin";
  solarShow(`<div class="shead"><button data-nobusy class="mid" onclick="openSolar(true)">⬅️ ${st("allBlocks")}</button>
      <div class="stitle">☀️ ${st("title")}</div></div>
    <div class="bhead"><div class="bigL">${b.block}</div><div><div class="bname">${blockName(b.block)}</div>
      <div class="binfo">☀️ ${b.kw} ${st("kw")} · ${areaIcon(b.area)} ${esc(LN(b.area || ""))}</div>
      ${b.meter_location ? `<div class="binfo">📍 ${esc(LN(b.meter_location))}</div>` : ""}</div></div>
    ${t ? `<div class="okbar">✓ ${t.source === "admin" ? st("committeeSaved") : st("alreadySaved")}</div>` : ""}
    <div class="prevbox">${b.prev_kwh != null ? `${st("prev")}: <b>${fmtNum(b.prev_kwh)}</b> <span>(${fmtDate(b.prev_date + "T12:00:00+05:30")})</span>` : st("firstReading")}</div>

    <div class="stepT">1️⃣ ${st("step1")}</div>
    ${SR.photoUrl ? `<div class="phrow"><img src="${SR.photoUrl}" class="thumb"><div><div style="color:var(--green);font-weight:800">✓ ${st("photoOk")}</div>
        <button class="btn ghost" style="margin-top:8px" onclick="meterPhoto()">🔄 ${st("retake")}</button></div></div>`
      : `<button class="big" style="background:var(--blue);color:#082f49;box-shadow:0 6px 0 #0369a1" onclick="meterPhoto()"><span class="i">📷</span>${st("step1")}</button>`}

    <div class="stepT">2️⃣ ${st("step2")}</div>
    <div class="numdisp ${lower ? "bad" : high ? "warnc" : ""}">${SR.value ? fmtNumTyped(SR.value) : "<span style='opacity:.35'>0</span>"}<small>kWh</small></div>
    ${diff != null && diff >= 0 ? `<div class="diff ${high ? "warnc" : "good"}">${st("today")}: <b>+${fmtNum(diff)}</b> ${st("units")}${days > 1 ? ` (${days} days)` : ""}</div>` : ""}
    ${lower ? `<div class="warn">⚠️ ${st("lowerWarn")}<div style="margin-top:8px">${st("lowerWhy")}</div>
        <div class="chips">${[["lw_reset", "🔄"], ["lw_unsure", "❓"]].map(([k, i]) => `<button data-nobusy class="chip2 ${SR.lowerWhy === k ? "on" : ""}" onclick="SR.lowerWhy='${k}';renderBlock()">${i} ${st(k)}</button>`).join("")}</div></div>` : ""}
    ${high ? `<div class="warn">⚠️ ${st("highWarn")}<div class="chips"><button data-nobusy class="chip2 ${SR.highOk ? "on" : ""}" onclick="SR.highOk=!SR.highOk;renderBlock()">✅ ${st("highOk")}</button></div></div>` : ""}
    <div class="keypad">${["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "⌫"].map((k) =>
      `<button data-nobusy class="key" onclick="keyPress('${k}')">${k}</button>`).join("")}</div>

    <div class="stepT">📝 ${st("notes")}</div>
    <div class="chips">${NOTE_CHIPS.map(([k, i]) => `<button data-nobusy class="chip2 ${SR.note.includes(k) ? "on" : ""}" onclick="toggleNote('${k}')">${i} ${st(k)}</button>`).join("")}</div>
    ${msg ? `<p style="color:#fca5a5;font-weight:800;text-align:center;font-size:18px">${esc(msg)}</p>` : ""}
    ${locked ? `<div class="okbar">🔒 ${st("committeeSaved")}</div>` : `<button class="big" onclick="saveSolar()"><span class="i">✅</span>${st("save")}</button>
    <button class="btn ghost" onclick="cantRead()">🚫 ${st("cantRead")}</button>`}`);
}
const fmtNumTyped = (s) => { const [i, d] = s.split("."); const ii = i ? Number(i).toLocaleString("en-IN") : "0"; return d !== undefined ? `${ii}.${d}` : ii; };
function keyPress(k) {
  let v = SR.value;
  if (k === "⌫") v = v.slice(0, -1);
  else if (k === ".") { if (!v.includes(".")) v = (v || "0") + "."; }
  else { if (v.includes(".") && v.split(".")[1].length >= 2) return; if (v.replace(".", "").length >= 9) return; v = v === "0" ? k : v + k; }
  navigator.vibrate?.(15);
  SR.value = v; SR.lowerWhy = null; SR.highOk = false;
  renderBlock();
}
function toggleNote(k) { SR.note = SR.note.includes(k) ? SR.note.filter((x) => x !== k) : [...SR.note, k]; renderBlock(); }

// Meter photo (live camera, server time burned in, torch for dark meter rooms)
async function meterPhoto() {
  const code = SR.b.block;
  $("solar").style.display = "none";
  S = { mode: "solar", stopped: false, phase: "photo", opts: {}, label: `SOLAR METER · BLOCK ${code}`,
        ch: { code: "SOLAR", guard_code: home.guard.code, expires_at: new Date(Date.now() + 15 * 60000).toISOString(), media_type: "photo" } };
  scanEl.style.display = "block"; scanEl.className = "manual";
  $("hint").textContent = st("photoHint"); $("mode").textContent = `☀️ ${blockName(code)}`; $("timer").textContent = "";
  $("cancelScan").textContent = "✖ " + t("cancel");
  $("cancelScan").onclick = () => { stopScan(); $("solar").style.display = "block"; $("cancelScan").onclick = defaultCancel; };
  $("noqrBtn").style.display = "none";
  try {
    S.stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } } });
  } catch (e) { stopScan(); $("solar").style.display = "block"; sayText(t("camErr")); return toast(t("camErr"), "err"); }
  vid.srcObject = S.stream; await vid.play();
  const W = 1080; cv.width = W; cv.height = Math.round(W * (vid.videoHeight || 1920) / (vid.videoWidth || 1080));
  drawLoop();
  const track = S.stream.getVideoTracks()[0];
  const torch = $("torchBtn"), shut = $("shutterBtn");
  let caps = {}; try { caps = track.getCapabilities ? track.getCapabilities() : {}; } catch (e) {}
  torch.style.display = caps.torch ? "block" : "none"; torch.textContent = "🔦 " + st("torch"); S.torchOn = false;
  torch.onclick = async () => { S.torchOn = !S.torchOn; try { await track.applyConstraints({ advanced: [{ torch: S.torchOn }] }); } catch (e) {} torch.classList.toggle("on", S.torchOn); };
  shut.style.display = "block"; shut.textContent = "📸 " + st("shutter");
  shut.onclick = () => {
    navigator.vibrate?.(80);
    cv.toBlob((blob) => {
      stopScan(); torch.style.display = "none"; shut.style.display = "none"; $("cancelScan").onclick = defaultCancel;
      if (SR.photoUrl) URL.revokeObjectURL(SR.photoUrl);
      SR.photo = blob; SR.photoUrl = URL.createObjectURL(blob);
      $("solar").style.display = "block"; renderBlock();
    }, "image/jpeg", 0.82);
  };
}
const defaultCancel = () => { stopScan(); window.speechSynthesis?.cancel(); };

async function uploadMeterPhoto() {
  if (!SR.photo) return null;
  const { data: { user } } = await sb.auth.getUser();
  const path = `${user.id}/solar/${home.solar.date}_${SR.b.block}_${Date.now()}.jpg`;
  for (let i = 0; i < 3; i++) {
    const { error } = await sb.storage.from("patrol-media").upload(path, SR.photo, { contentType: "image/jpeg", upsert: false });
    if (!error) return path;
    await new Promise((r) => setTimeout(r, 1500));
  }
  return null;
}

async function saveSolar() {
  const b = SR.b;
  if (home.solar.photo_required && !SR.photo) { sayText(st("needPhoto")); return renderBlock(st("needPhoto")); }
  if (SR.value === "" || isNaN(Number(SR.value))) { sayText(st("needValue")); return renderBlock(st("needValue")); }
  const v = Number(SR.value);
  const days = b.prev_date ? Math.max(1, Math.round((new Date(home.solar.date) - new Date(b.prev_date)) / 864e5)) : 1;
  const lower = b.prev_kwh != null && v < Number(b.prev_kwh);
  const high = b.prev_kwh != null && v - Number(b.prev_kwh) > home.solar.max_per_kw * Number(b.kw) * days;
  if (lower && !SR.lowerWhy) { say("solarLower"); return renderBlock(st("lowerWhy")); }
  if (high && !SR.highOk) { say("solarHigh"); return renderBlock(st("highWarn")); }
  const notes = [...(lower ? [ST.en[SR.lowerWhy]] : []), ...SR.note.map((k) => ST.en[k])].join("; ");
  showSolarSaving();
  const path = await uploadMeterPhoto();
  const { data, error } = await sb.rpc("submit_solar_reading", { p_block: b.block, p_kwh: v, p_reason: null, p_photo_path: path, p_remarks: notes || null });
  afterSolarSave(data, error);
}

function cantRead() {
  solarShow(`<div class="shead"><button data-nobusy class="mid" onclick="renderBlock()">⬅️ ${blockName(SR.b.block)}</button>
      <div class="stitle">🚫 ${st("cantRead")}</div></div>
    <h2>${st("why")}</h2>
    <div class="grid">${NOT_READ.map(([k, i]) => `<button class="choice" onclick="saveNotRead('${k}')"><span class="i">${i}</span>${st("r_" + k)}</button>`).join("")}</div>`);
  say("solarWhy");
}
async function saveNotRead(reason) {
  showSolarSaving();
  const path = await uploadMeterPhoto();
  const { data, error } = await sb.rpc("submit_solar_reading", { p_block: SR.b.block, p_kwh: null, p_reason: reason, p_photo_path: path, p_remarks: ST.en["r_" + reason] });
  afterSolarSave(data, error);
}
function showSolarSaving() { solarShow(`<div class="status wait" style="margin-top:40px"><div class="ico">⏳</div><h2>${st("sending")}</h2></div>`); }

async function afterSolarSave(data, error) {
  if (error) { sayText(error.message); return renderBlock(error.message); }
  navigator.vibrate?.(150);
  const saved = SR.b.block;
  await refreshSolar();
  const nxt = nextPendingBlock(saved);
  const gen = data.gen != null ? fmtNum(data.gen) : null;
  solarShow(`<div class="status done" style="margin-top:20px"><div class="ico">✅</div>
      <h2>${blockName(saved)}</h2><p>${gen != null ? st("savedUnits", { u: gen }) : st("saved")}</p></div>
    ${nxt ? `<div class="next"><div class="lbl">➡️ ${t("goNow")}</div><div class="ico" style="font-size:80px;font-weight:900">${nxt.block}</div>
        <div class="name">${blockName(nxt.block)}</div><div class="area">☀️ ${nxt.kw} ${st("kw")} · ${areaIcon(nxt.area)} ${esc(LN(nxt.area || ""))}</div>
        <button class="big" onclick="openBlock('${nxt.block}')"><span class="i">📷</span>${st("takeReading")}</button></div>`
      : `<div class="status done"><div class="ico">🎉</div><h2>${st("allDone")}</h2></div>`}
    <button class="btn ghost" onclick="openSolar(true)">☀️ ${st("allBlocks")}</button>
    <button class="btn ghost" onclick="closeSolar()">🏠 ${st("home")}</button>`);
  if (nxt) say("solarNext", () => nxt.block); else say("solarAllDone");
  SR = null;
}

// keep the solar screen in the chosen language when the guard switches language
const _rerender = rerender;
rerender = function () {
  if ($("solar").style.display === "block" && home?.solar) { SR ? renderBlock() : openSolar(true); return; }
  _rerender();
};
