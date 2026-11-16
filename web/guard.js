// Serenity Space Patrol — guard app (also the shared login screen for committee members)
// Designed for guards who may not read much: one big "next place" tile, pictures, and spoken instructions.

// ====================== TEXT ======================
const T = {
  en: {
    sub: "Guard Patrol", guardTab: "Guard", committeeTab: "Committee", pickGuard: "Select your name", pin: "6-digit PIN",
    login: "Log in", logout: "Log out", email: "Email", password: "Password", wrongLogin: "Wrong name or PIN",
    server: "Server time", phoneWarn: "This phone is not registered for you. Ask the committee to reset your phone.",
    gpsOff: "Location (GPS) is off. Please turn it on.",
    nextPlace: "GO TO", placeOf: "Place {a} of {b}", scanBtn: "Scan QR", hearAgain: "Hear again", qrProblem: "QR not working?",
    finishBy: "Finish by {t}", roundDone: "Round complete", nextRoundAt: "Next round at {t}", noRound: "No round now",
    allPlaces: "All places in this round", alertsOn: "Turn on alerts", alertsHelp: "Phone will ring when a round starts",
    alertsOk: "Alerts are on ✓", alertsBlocked: "Alerts are blocked. Allow notifications for this app in phone settings.",
    roundStarted: "🔔 Round started!", point: "Show the QR to the camera", keep: "Keep the QR in view, then slowly show the place around",
    up: "Sending…", check: "Checking…", ok: "Done!", review: "Saved – committee will check", bad: "Not accepted",
    goNow: "Now go to", tryAgain: "Try again", home: "Home", cancel: "Cancel", left: "left",
    camErr: "Camera not available. Allow camera for this app.", notOurs: "This is not a patrol QR",
    video: "VIDEO", photoM: "PHOTO", needVideo: "This place needs a VIDEO",
    whereAreYou: "Which place are you at?", yesHere: "Yes, I am here", otherPlace: "I am at another place",
    whyNoQr: "Why is the QR not working?", r_TORN: "QR torn / missing", r_DIRTY: "QR dirty / faded", r_DARK: "Too dark",
    r_CAMERA: "Camera problem", r_OTHER: "Something else", speakReason: "Speak the reason", listening: "Listening… speak now",
    typeHere: "Or type here", needNote: "Please tell the reason", next: "Next ➡️",
    recordPlace: "Now a 10-second video of this place will be recorded. Show the place and where the QR should be.",
    startVideo: "Start video", noQrTag: "NO QR",
    fl_OLD_QR: "This QR is no longer valid. The committee has been informed.", fl_UNKNOWN_QR: "This is not a Serenity Space patrol QR.",
    fl_NOT_ON_ROUTE: "This place is not part of this round.", fl_DUPLICATE: "This place is already done for this round.",
    fl_NO_MEDIA: "Photo/video did not send. Please try again.", fl_EXPIRED: "Took too long. Please try again.",
    fl_OUT_OF_ZONE: "You seem to be away from this place (GPS)", fl_NO_GPS: "GPS was off", fl_TOO_FAST: "Too quick after the previous place",
    fl_OTHER_PHONE: "A different phone was used", fl_LATE: "After the round time", fl_LOW_GPS: "Weak GPS", fl_OUT_OF_ORDER: "Not in route order",
  },
  hi: {
    sub: "गार्ड पेट्रोल", guardTab: "गार्ड", committeeTab: "कमेटी", pickGuard: "अपना नाम चुनें", pin: "6 अंकों का पिन",
    login: "लॉग इन", logout: "लॉग आउट", email: "ईमेल", password: "पासवर्ड", wrongLogin: "नाम या पिन गलत है",
    server: "सर्वर समय", phoneWarn: "यह फोन आपके नाम पर नहीं है। कमेटी से फोन रीसेट करवाएँ।",
    gpsOff: "लोकेशन (GPS) बंद है। कृपया चालू करें।",
    nextPlace: "यहाँ जाइए", placeOf: "जगह {a} / {b}", scanBtn: "QR स्कैन करें", hearAgain: "फिर सुनें", qrProblem: "QR नहीं चल रहा?",
    finishBy: "{t} बजे तक पूरा करें", roundDone: "राउंड पूरा हुआ", nextRoundAt: "अगला राउंड {t} बजे", noRound: "अभी कोई राउंड नहीं",
    allPlaces: "इस राउंड की सभी जगहें", alertsOn: "अलर्ट चालू करें", alertsHelp: "राउंड शुरू होने पर फोन में घंटी बजेगी",
    alertsOk: "अलर्ट चालू हैं ✓", alertsBlocked: "अलर्ट बंद हैं। फोन की सेटिंग में इस ऐप के नोटिफिकेशन चालू करें।",
    roundStarted: "🔔 राउंड शुरू हो गया!", point: "QR को कैमरे के सामने रखें", keep: "QR दिखाते रहें, फिर धीरे से आसपास की जगह दिखाएँ",
    up: "भेज रहे हैं…", check: "जाँच हो रही है…", ok: "हो गया!", review: "सेव हो गया – कमेटी जाँच करेगी", bad: "स्वीकार नहीं हुआ",
    goNow: "अब जाइए", tryAgain: "फिर से कोशिश करें", home: "होम", cancel: "रद्द करें", left: "बाकी",
    camErr: "कैमरा नहीं खुला। इस ऐप को कैमरा की अनुमति दें।", notOurs: "यह पेट्रोल QR नहीं है",
    video: "वीडियो", photoM: "फोटो", needVideo: "इस जगह के लिए वीडियो ज़रूरी है",
    whereAreYou: "आप किस जगह पर हैं?", yesHere: "हाँ, मैं यहाँ हूँ", otherPlace: "मैं दूसरी जगह पर हूँ",
    whyNoQr: "QR क्यों नहीं चल रहा?", r_TORN: "QR फटा / गायब", r_DIRTY: "QR गंदा / धुंधला", r_DARK: "बहुत अंधेरा",
    r_CAMERA: "कैमरा खराब", r_OTHER: "कुछ और", speakReason: "बोलकर बताइए", listening: "सुन रहे हैं… अब बोलिए",
    typeHere: "या यहाँ लिखें", needNote: "कृपया कारण बताइए", next: "आगे ➡️",
    recordPlace: "अब इस जगह का 10 सेकंड का वीडियो बनेगा। जगह और QR वाली जगह दिखाइए।",
    startVideo: "वीडियो शुरू करें", noQrTag: "QR नहीं",
    fl_OLD_QR: "यह QR अब मान्य नहीं है। कमेटी को सूचित कर दिया गया है।", fl_UNKNOWN_QR: "यह सेरेनिटी स्पेस का पेट्रोल QR नहीं है।",
    fl_NOT_ON_ROUTE: "यह जगह इस राउंड में शामिल नहीं है।", fl_DUPLICATE: "यह जगह इस राउंड में पहले ही हो चुकी है।",
    fl_NO_MEDIA: "फोटो/वीडियो नहीं गया। फिर से कोशिश करें।", fl_EXPIRED: "बहुत देर हो गई। फिर से कोशिश करें।",
    fl_OUT_OF_ZONE: "आप इस जगह से दूर लगते हैं (GPS)", fl_NO_GPS: "GPS बंद था", fl_TOO_FAST: "पिछली जगह के बाद बहुत जल्दी",
    fl_OTHER_PHONE: "दूसरे फोन का उपयोग हुआ", fl_LATE: "राउंड के समय के बाद", fl_LOW_GPS: "कमज़ोर GPS", fl_OUT_OF_ORDER: "रूट के क्रम में नहीं",
  },
  gu: {
    sub: "ગાર્ડ પેટ્રોલ", guardTab: "ગાર્ડ", committeeTab: "કમિટી", pickGuard: "તમારું નામ પસંદ કરો", pin: "6 અંકનો પિન",
    login: "લૉગ ઇન", logout: "લૉગ આઉટ", email: "ઈમેલ", password: "પાસવર્ડ", wrongLogin: "નામ અથવા પિન ખોટો છે",
    server: "સર્વર સમય", phoneWarn: "આ ફોન તમારા નામે નથી. કમિટી પાસે ફોન રીસેટ કરાવો.",
    gpsOff: "લોકેશન (GPS) બંધ છે. કૃપા કરીને ચાલુ કરો.",
    nextPlace: "અહીં જાઓ", placeOf: "જગ્યા {a} / {b}", scanBtn: "QR સ્કેન કરો", hearAgain: "ફરી સાંભળો", qrProblem: "QR ચાલતો નથી?",
    finishBy: "{t} વાગ્યા સુધી પૂરું કરો", roundDone: "રાઉન્ડ પૂરો થયો", nextRoundAt: "આગળનો રાઉન્ડ {t} વાગ્યે", noRound: "અત્યારે કોઈ રાઉન્ડ નથી",
    allPlaces: "આ રાઉન્ડની બધી જગ્યાઓ", alertsOn: "અલર્ટ ચાલુ કરો", alertsHelp: "રાઉન્ડ શરૂ થાય ત્યારે ફોનમાં ઘંટડી વાગશે",
    alertsOk: "અલર્ટ ચાલુ છે ✓", alertsBlocked: "અલર્ટ બંધ છે. ફોનના સેટિંગમાં આ એપના નોટિફિકેશન ચાલુ કરો.",
    roundStarted: "🔔 રાઉન્ડ શરૂ થઈ ગયો!", point: "QR ને કેમેરાની સામે રાખો", keep: "QR બતાવતા રહો, પછી ધીમે ધીમે આજુબાજુની જગ્યા બતાવો",
    up: "મોકલી રહ્યા છીએ…", check: "તપાસ થઈ રહી છે…", ok: "થઈ ગયું!", review: "સેવ થયું – કમિટી તપાસ કરશે", bad: "સ્વીકાર્યું નથી",
    goNow: "હવે જાઓ", tryAgain: "ફરી પ્રયત્ન કરો", home: "હોમ", cancel: "રદ કરો", left: "બાકી",
    camErr: "કેમેરા ખૂલ્યો નહીં. આ એપને કેમેરાની પરવાનગી આપો.", notOurs: "આ પેટ્રોલ QR નથી",
    video: "વીડિયો", photoM: "ફોટો", needVideo: "આ જગ્યા માટે વીડિયો જરૂરી છે",
    whereAreYou: "તમે કઈ જગ્યાએ છો?", yesHere: "હા, હું અહીં છું", otherPlace: "હું બીજી જગ્યાએ છું",
    whyNoQr: "QR કેમ ચાલતો નથી?", r_TORN: "QR ફાટેલો / ગાયબ", r_DIRTY: "QR ગંદો / ઝાંખો", r_DARK: "ખૂબ અંધારું",
    r_CAMERA: "કેમેરા ખરાબ", r_OTHER: "બીજું કંઈક", speakReason: "બોલીને જણાવો", listening: "સાંભળી રહ્યા છીએ… હવે બોલો",
    typeHere: "અથવા અહીં લખો", needNote: "કૃપા કરીને કારણ જણાવો", next: "આગળ ➡️",
    recordPlace: "હવે આ જગ્યાનો 10 સેકન્ડનો વીડિયો બનશે. જગ્યા અને QR વાળી જગ્યા બતાવો.",
    startVideo: "વીડિયો શરૂ કરો", noQrTag: "QR નથી",
    fl_OLD_QR: "આ QR હવે માન્ય નથી. કમિટીને જાણ કરવામાં આવી છે.", fl_UNKNOWN_QR: "આ સેરેનિટી સ્પેસનો પેટ્રોલ QR નથી.",
    fl_NOT_ON_ROUTE: "આ જગ્યા આ રાઉન્ડમાં સામેલ નથી.", fl_DUPLICATE: "આ જગ્યા આ રાઉન્ડમાં પહેલેથી થઈ ગઈ છે.",
    fl_NO_MEDIA: "ફોટો/વીડિયો ગયો નહીં. ફરી પ્રયત્ન કરો.", fl_EXPIRED: "ખૂબ મોડું થયું. ફરી પ્રયત્ન કરો.",
    fl_OUT_OF_ZONE: "તમે આ જગ્યાથી દૂર લાગો છો (GPS)", fl_NO_GPS: "GPS બંધ હતું", fl_TOO_FAST: "પાછલી જગ્યા પછી ખૂબ જલ્દી",
    fl_OTHER_PHONE: "બીજા ફોનનો ઉપયોગ થયો", fl_LATE: "રાઉન્ડના સમય પછી", fl_LOW_GPS: "નબળું GPS", fl_OUT_OF_ORDER: "રૂટના ક્રમમાં નથી",
  },
};
// Spoken sentences (simple, polite, short)
const SAY = {
  en: {
    login: "Choose your name. Then type your PIN.",
    goto: (p) => `Go to ${p}. Then press the green camera button.`,
    point: "Show the QR code to the camera.",
    rec: "Recording. Slowly show the place around you.",
    doneNext: (p) => `Done. Now go to ${p}.`,
    roundDone: "Round complete. Thank you.",
    review: "Saved. The committee will check.",
    roundStart: (p) => `Round started. Go to ${p}.`,
    noRound: (t) => (t ? `No round now. Next round at ${t}.` : "No round now."),
    where: "Which place are you at? Press the picture.",
    why: "Why is the QR not working? Press a picture.",
    note: "You can speak the reason. Press the microphone.",
    recordPlace: "Now record a video of this place. Press start video.",
  },
  hi: {
    login: "अपना नाम चुनिए। फिर पिन डालिए।",
    goto: (p) => `${p} पर जाइए। फिर हरा कैमरा बटन दबाइए।`,
    point: "QR कोड कैमरे के सामने रखिए।",
    rec: "रिकॉर्डिंग चालू है। धीरे से आसपास की जगह दिखाइए।",
    doneNext: (p) => `हो गया। अब ${p} पर जाइए।`,
    roundDone: "राउंड पूरा हुआ। धन्यवाद।",
    review: "सेव हो गया। कमेटी जाँच करेगी।",
    roundStart: (p) => `राउंड शुरू हो गया। ${p} पर जाइए।`,
    noRound: (t) => (t ? `अभी कोई राउंड नहीं है। अगला राउंड ${t} बजे।` : "अभी कोई राउंड नहीं है।"),
    where: "आप किस जगह पर हैं? तस्वीर दबाइए।",
    why: "QR क्यों नहीं चल रहा? तस्वीर दबाइए।",
    note: "आप बोलकर कारण बता सकते हैं। माइक बटन दबाइए।",
    recordPlace: "अब इस जगह का वीडियो बनाइए। वीडियो शुरू करें दबाइए।",
  },
  gu: {
    login: "તમારું નામ પસંદ કરો. પછી પિન નાખો.",
    goto: (p) => `${p} પર જાઓ. પછી લીલું કેમેરા બટન દબાવો.`,
    point: "QR કોડ કેમેરાની સામે રાખો.",
    rec: "રેકોર્ડિંગ ચાલુ છે. ધીમે ધીમે આજુબાજુની જગ્યા બતાવો.",
    doneNext: (p) => `થઈ ગયું. હવે ${p} પર જાઓ.`,
    roundDone: "રાઉન્ડ પૂરો થયો. આભાર.",
    review: "સેવ થઈ ગયું. કમિટી તપાસ કરશે.",
    roundStart: (p) => `રાઉન્ડ શરૂ થઈ ગયો. ${p} પર જાઓ.`,
    noRound: (t) => (t ? `અત્યારે કોઈ રાઉન્ડ નથી. આગળનો રાઉન્ડ ${t} વાગ્યે.` : "અત્યારે કોઈ રાઉન્ડ નથી."),
    where: "તમે કઈ જગ્યાએ છો? ચિત્ર દબાવો.",
    why: "QR કેમ ચાલતો નથી? ચિત્ર દબાવો.",
    note: "તમે બોલીને કારણ જણાવી શકો છો. માઇક બટન દબાવો.",
    recordPlace: "હવે આ જગ્યાનો વીડિયો બનાવો. વીડિયો શરૂ કરો દબાવો.",
  },
};
const REASONS = [["TORN", "🩹"], ["DIRTY", "🌫️"], ["DARK", "🌙"], ["CAMERA", "📵"], ["OTHER", "❓"]];

let lang = localStorage.getItem("ssp_lang") || "hi";
const t = (k, v) => { let s = (T[lang] && T[lang][k]) || T.en[k] || k; if (v) for (const x in v) s = s.replace(`{${x}}`, v[x]); return s; };
const { sb, esc, fmtDate, fmtTime, fmtDateTime, toast } = SSP;
const app = document.getElementById("app");
const pickL = (obj, f, l) => SSP_I18N.pick(obj, f, l || lang);
const LN = (txt, l) => SSP_I18N.localize(txt, l || lang);
const flagText = (f, l) => (T[l || lang] && T[l || lang]["fl_" + f]) || T.en["fl_" + f] || "";
const $ = (id) => document.getElementById(id);

// Picture for a place, from words in its English name
const ICONS = [[/gate|entrance|exit/i, "🚪"], [/park|basement|car|wheeler/i, "🅿️"], [/lift|lobby/i, "🛗"], [/pool|swim/i, "🏊"],
  [/garden|play|park\b/i, "🌳"], [/pump|water|tank/i, "💧"], [/terrace|roof/i, "🏢"], [/club|hall/i, "🏛️"], [/gym/i, "🏋️"],
  [/temple|mandir/i, "🛕"], [/meter|electric|dg|generator|panel|solar/i, "⚡"], [/garbage|waste/i, "🗑️"], [/shop/i, "🏪"],
  [/fire/i, "🧯"], [/cabin|security|guard/i, "💂"], [/block|wing|tower/i, "🏬"]];
const placeIcon = (c) => (ICONS.find(([re]) => re.test(`${c?.name || ""} ${c?.area || ""}`)) || [0, "📍"])[1];

// Phone id — server locks each guard to one phone
let deviceId = localStorage.getItem("ssp_device_id");
if (!deviceId) { deviceId = crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2) + Date.now(); localStorage.setItem("ssp_device_id", deviceId); }

let home = null, clockTimer = null, refreshTimer = null, openSeen = null, lastSpoken = "";

// ====================== VOICE ======================
let voiceOn = localStorage.getItem("ssp_voice") !== "0";
const VLANG = { en: "en-IN", hi: "hi-IN", gu: "gu-IN" };
let voices = [];
const loadVoices = () => { try { voices = speechSynthesis.getVoices() || []; } catch (e) {} };
if (window.speechSynthesis) { loadVoices(); speechSynthesis.onvoiceschanged = loadVoices; }
const voiceFor = (l) => voices.find((v) => v.lang.replace("_", "-").toLowerCase() === VLANG[l].toLowerCase())
  || voices.find((v) => v.lang.toLowerCase().startsWith(l));
let lastSay = null;
// key: SAY entry; arg(l): value for that language (e.g. place name in that language)
function say(key, arg) {
  lastSay = [key, arg];
  if (!voiceOn || !window.speechSynthesis) return;
  let l = lang;
  if (voices.length && !voiceFor(l)) l = (l === "gu" && voiceFor("hi")) ? "hi" : (voiceFor("en") ? "en" : l); // phone has no voice for this language
  const s = SAY[l][key]; const text = typeof s === "function" ? s(arg ? arg(l) : "") : s;
  sayText(text, l);
}
function sayText(text, l) {
  if (!voiceOn || !window.speechSynthesis || !text) return;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = VLANG[l || lang]; const v = voiceFor(l || lang); if (v) u.voice = v; u.rate = 0.92;
    speechSynthesis.speak(u);
  } catch (e) {}
}
const repeatSay = () => { if (lastSay) say(lastSay[0], lastSay[1]); };
function toggleVoice() { voiceOn = !voiceOn; localStorage.setItem("ssp_voice", voiceOn ? "1" : "0"); if (!voiceOn) window.speechSynthesis?.cancel(); rerender(); if (voiceOn) repeatSay(); }

function beep() {
  try {
    const a = new (window.AudioContext || window.webkitAudioContext)();
    [0, 0.5].forEach((d) => { const o = a.createOscillator(), g = a.createGain(); o.frequency.value = 880; o.connect(g); g.connect(a.destination);
      g.gain.setValueAtTime(0.35, a.currentTime + d); o.start(a.currentTime + d); o.stop(a.currentTime + d + 0.3); });
  } catch (e) {}
}

// ====================== GPS ======================
let gps = null, gpsDenied = false, gpsWatch = null;
function startGps() {
  if (gpsWatch !== null || !navigator.geolocation) return;
  gpsWatch = navigator.geolocation.watchPosition(
    (p) => { gps = { lat: p.coords.latitude, lng: p.coords.longitude, acc: p.coords.accuracy, at: Date.now() }; gpsDenied = false; },
    (e) => { if (e.code === 1) gpsDenied = true; },
    { enableHighAccuracy: true, maximumAge: 0, timeout: 30000 });
}
const freshGps = () => (gps && Date.now() - gps.at < 60000 ? gps : null);

// ====================== HEADER / LANGUAGE ======================
function tools(showVoice = true) {
  return `<div class="tools">${[["hi", "हिं"], ["gu", "ગુ"], ["en", "EN"]].map(([k, l]) =>
    `<button data-nobusy class="${k === lang ? "on" : ""}" onclick="setLang('${k}')">${l}</button>`).join("")}
    ${showVoice ? `<button data-nobusy onclick="toggleVoice()" title="voice">${voiceOn ? "🔊" : "🔇"}</button>` : ""}</div>`;
}
function setLang(k) {
  lang = k; localStorage.setItem("ssp_lang", k); document.documentElement.lang = k;
  lastSpoken = ""; rerender(); saveSubscription();
  if (!home) say("login");
}
function rerender() { home ? renderHome() : renderLogin(); }

// ====================== LOGIN ======================
let loginMode = location.hash === "#committee" ? "committee" : "guard";
let guardList = null;
async function loadGuardList() {
  try { const { data, error } = await sb.rpc("guard_login_list"); guardList = error ? [] : (data || []); } catch (e) { guardList = []; }
}
function renderLogin(msg) {
  const g = loginMode === "guard";
  if (g && guardList === null) { loadGuardList().then(() => renderLogin(msg)); }
  const last = localStorage.getItem("ssp_last_guard") || "";
  const guardField = guardList && guardList.length
    ? `<select id="code" class="sel"><option value="">— ${t("pickGuard")} —</option>${guardList.map((x) =>
        `<option value="${esc(x.code)}" ${x.code === last ? "selected" : ""}>👤 ${esc(LN(x.name))} (${esc(x.code)})</option>`).join("")}</select>`
    : `<input id="code" autocapitalize="characters" autocomplete="username" placeholder="G01" value="${esc(last)}">`;
  app.innerHTML = `
    <header><div class="brand">Serenity Space<small>${t("sub")}</small></div>${tools()}</header>
    <div class="seg"><button class="${g ? "on" : ""}" onclick="loginMode='guard';history.replaceState(null,'',location.pathname);renderLogin()">🛡️ ${t("guardTab")}</button>
      <button class="${g ? "" : "on"}" onclick="loginMode='committee';renderLogin()">🏢 ${t("committeeTab")}</button></div>
    <div class="card">
      ${g ? `<label>👤 ${t("pickGuard")}</label>${guardField}
             <label>🔢 ${t("pin")}</label><input id="pin" type="password" inputmode="numeric" maxlength="6" autocomplete="current-password" placeholder="● ● ● ● ● ●" style="letter-spacing:6px;text-align:center;font-size:26px">`
          : `<label>${t("email")}</label><input id="code" type="email" autocomplete="username">
             <label>${t("password")}</label><input id="pin" type="password" autocomplete="current-password">`}
      <button class="big" id="go"><span class="i">➡️</span>${t("login")}</button>
      ${g ? `<button data-nobusy class="link" style="display:block;margin:10px auto 0" onclick="say('login')">🔊 ${t("hearAgain")}</button>` : ""}
      ${msg ? `<p style="color:#fca5a5;text-align:center;font-size:18px;font-weight:700">${esc(msg)}</p>` : ""}
    </div>
    <div class="foot">Serenity Space Co-operative Housing Society</div>`;
  $("go").onclick = async () => {
    const id = $("code").value.trim(), pw = $("pin").value;
    if (!id || !pw) return;
    const email = g ? SSP.guardEmail(id) : id;
    const { error } = await sb.auth.signInWithPassword({ email, password: g ? pw.trim() : pw });
    if (error) { if (g) sayText(t("wrongLogin")); return renderLogin(g ? t("wrongLogin") : error.message); }
    if (g) localStorage.setItem("ssp_last_guard", id);
    boot();
  };
}
async function logout() { window.speechSynthesis?.cancel(); await sb.auth.signOut(); home = null; openSeen = null; lastSpoken = ""; renderLogin(); }

// ====================== HOME ======================
async function loadHome() {
  const { data, error } = await sb.rpc("guard_home", { p_device_id: deviceId });
  if (error) { toast(error.message, "err"); if (/not a guard|inactive/i.test(error.message)) { await sb.auth.signOut(); home = null; renderLogin(error.message); } return; }
  home = data; SSP.syncServer(data.server_now);
  detectNewRounds();
  if (!$("result").style.display || $("result").style.display === "none") renderHome();
}
const isComplete = (r) => r.checkpoints && r.checkpoints.length && r.checkpoints.every((c) => c.done);
const currentRound = () => (home?.rounds || []).find((r) => r.open_now && !isComplete(r));
const nextPlaceOf = (r) => (r?.checkpoints || []).find((c) => !c.done);
const routeName = (r, l) => { l = l || lang; return l === "en" ? r.route_name : (r["route_name_" + l] || LN(r.route_name, l)); };

function renderHome() {
  if (!home) return;
  const now = SSP.serverNow();
  const cur = currentRound();
  const doneOpen = (home.rounds || []).find((r) => r.open_now && isComplete(r));
  const upcoming = (home.rounds || []).find((r) => !r.open_now && new Date(r.due_start) > now);
  let main = "";
  if (cur) {
    const cp = nextPlaceOf(cur), list = cur.checkpoints, idx = list.indexOf(cp) + 1;
    main = `<div class="next">
        <div class="lbl">➡️ ${t("nextPlace")}</div><div class="step">${t("placeOf", { a: idx, b: list.length })}</div>
        <div class="ico">${placeIcon(cp)}</div>
        <div class="name">${esc(pickL(cp, "name"))}</div>
        ${cp.area ? `<div class="area">${esc(pickL(cp, "area"))}</div>` : ""}
        ${cp.media === "video" ? `<div class="vid">🎥 ${t("video")}</div>` : ""}
        <button class="big" onclick="startScan('${cur.id}')"><span class="i">📷</span>${t("scanBtn")}</button>
        <div class="row2">
          <button data-nobusy class="mid" onclick="repeatSay()"><span class="i">🔊</span>${t("hearAgain")}</button>
          <button class="mid warnb" onclick="openNoQr('${cur.id}')"><span class="i">⚠️</span>${t("qrProblem")}</button>
        </div>
        <div class="due">⏰ ${t("finishBy", { t: fmtTime(cur.due_end) })}</div>
      </div>
      <div class="dots">${list.map((c, i) => `<span class="dot ${c.done ? "ok" : c === cp ? "cur" : ""}">${c.done ? "✓" : i + 1}</span>`).join("")}</div>
      <details><summary>📋 ${t("allPlaces")} · ${esc(routeName(cur))}</summary><ol>${list.map((c) => `<li class="${c.done ? "ok" : ""}">
        <span class="n">${c.done ? "✓" : c.seq}</span><span>${placeIcon(c)} ${esc(pickL(c, "name"))}${c.media === "video" ? " 🎥" : ""}
        ${c.area ? `<br><span class="a">${esc(pickL(c, "area"))}</span>` : ""}</span></li>`).join("")}</ol></details>`;
    const key = `goto:${cur.id}:${cp.id}:${lang}`;
    if (lastSpoken !== key) { lastSpoken = key; say("goto", (l) => pickL(cp, "name", l)); }
    else lastSay = ["goto", (l) => pickL(cp, "name", l)];
  } else {
    const nt = upcoming ? fmtTime(upcoming.due_start) : "";
    main = doneOpen
      ? `<div class="status done"><div class="ico">✅</div><h2>${t("roundDone")}</h2>${nt ? `<p>⏰ ${t("nextRoundAt", { t: nt })}</p>` : ""}</div>`
      : `<div class="status wait"><div class="ico">😴</div><h2>${t("noRound")}</h2>${nt ? `<p>⏰ ${t("nextRoundAt", { t: nt })}</p>` : ""}</div>`;
    const key = `idle:${doneOpen ? doneOpen.id : ""}:${nt}:${lang}`;
    if (lastSpoken !== key) { lastSpoken = key; doneOpen ? say("roundDone") : say("noRound", () => nt); }
  }
  app.innerHTML = `
    <header><div class="brand">👤 ${esc(LN(home.guard.name))}<small>${esc(home.guard.code)} · ${t("sub")}</small></div>
      <button class="logoutBtn" onclick="logout()">⏻ ${t("logout")}</button></header>
    <div class="toolrow">${tools()}</div>
    <div class="clock"><div class="t" id="clk">${fmtTime(now, true)}</div><div class="d">${t("server")}<br>${fmtDate(now)}</div></div>
    ${home.device_ok ? "" : `<div class="warn">⚠️ ${t("phoneWarn")}</div>`}
    ${gpsDenied ? `<div class="warn">📍 ${t("gpsOff")}</div>` : ""}
    ${alertsTile()}
    ${main}`;
}

// New round opened since last check → ring, speak, banner, phone notification
function detectNewRounds() {
  const open = new Set((home.rounds || []).filter((r) => r.open_now && !isComplete(r)).map((r) => r.id));
  if (openSeen) {
    const fresh = (home.rounds || []).find((r) => open.has(r.id) && !openSeen.has(r.id));
    if (fresh) alertRound(fresh);
  }
  openSeen = open;
}
async function alertRound(r) {
  const cp = nextPlaceOf(r);
  beep(); navigator.vibrate?.([400, 200, 400, 200, 400]);
  const b = $("banner"); b.textContent = `${t("roundStarted")} ➡️ ${pickL(cp, "name")}`; b.style.display = "block";
  setTimeout(() => (b.style.display = "none"), 8000);
  lastSpoken = ""; setTimeout(() => say("roundStart", (l) => pickL(cp, "name", l)), 1200);
  if (document.hidden && window.Notification?.permission === "granted") {
    try { (await navigator.serviceWorker.ready).showNotification(t("roundStarted"), { body: `➡️ ${pickL(cp, "name")}`, tag: "round-" + r.id, vibrate: [400, 200, 400], requireInteraction: true }); } catch (e) {}
  }
}

// ====================== PUSH ALERTS ======================
const pushSupported = () => "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
function alertsTile() {
  if (!pushSupported()) return "";
  const p = Notification.permission;
  if (p === "granted" && localStorage.getItem("ssp_push_ok") === "1") return "";
  if (p === "denied") return `<div class="warn">🔕 ${t("alertsBlocked")}</div>`;
  return `<button class="alerts" onclick="enableAlerts()"><span class="i">🔔</span><span>${t("alertsOn")}<small>${t("alertsHelp")}</small></span></button>`;
}
const b64u = (s) => { const p = "=".repeat((4 - (s.length % 4)) % 4); const b = atob((s + p).replace(/-/g, "+").replace(/_/g, "/")); return Uint8Array.from(b, (c) => c.charCodeAt(0)); };
async function saveSubscription(create) {
  try {
    if (!pushSupported() || Notification.permission !== "granted" || !window.SSP_CONFIG?.VAPID_PUBLIC_KEY) return false;
    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub && create) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64u(SSP_CONFIG.VAPID_PUBLIC_KEY) });
    if (!sub || !home) return false;
    const j = sub.toJSON();
    const { error } = await sb.rpc("save_push_subscription", { p_endpoint: j.endpoint, p_p256dh: j.keys.p256dh, p_auth: j.keys.auth, p_lang: lang });
    if (!error) localStorage.setItem("ssp_push_ok", "1");
    return !error;
  } catch (e) { return false; }
}
async function enableAlerts() {
  const p = await Notification.requestPermission();
  if (p !== "granted") { toast(t("alertsBlocked"), "err"); sayText(t("alertsBlocked")); return renderHome(); }
  const ok = await saveSubscription(true);
  if (ok) { toast(t("alertsOk")); sb.functions.invoke("notify", { body: { kind: "test" } }).catch(() => {}); }
  renderHome();
}

// ====================== SCANNER ======================
const scanEl = $("scan"), vid = $("vid"), cv = $("cv");
const ctx = cv.getContext("2d");
const qrCv = document.createElement("canvas"), qrCtx = qrCv.getContext("2d", { willReadFrequently: true });
let S = null;

// mode "qr": read the QR; mode "manual": no QR — video of the place with reason (opts: {cp, reason, note})
async function startScan(roundId, mode = "qr", opts = {}) {
  hidePanels();
  startGps();
  const round = home.rounds.find((r) => r.id === roundId);
  const { data: ch, error } = await sb.rpc(mode === "manual" ? "start_manual" : "start_scan", { p_round_id: roundId });
  if (error) return toast(error.message, "err");
  SSP.syncServer(ch.server_now);
  const done = round.checkpoints.filter((c) => c.done).length;
  S = { ch, round, mode, opts, phase: mode === "manual" ? "ready" : "seek", qr: null, qrFrames: 0, stopped: false,
        label: `${done + 1}/${round.checkpoints.length}` };
  scanEl.style.display = "block"; scanEl.className = mode === "manual" ? "manual" : "";
  $("hint").textContent = mode === "manual" ? t("recordPlace") : t("point");
  $("cancelScan").textContent = "✖ " + t("cancel");
  const nb = $("noqrBtn"); nb.style.display = "none"; nb.textContent = "⚠️ " + t("qrProblem");
  nb.onclick = () => { const rid = S.round.id; stopScan(); openNoQr(rid); };
  if (mode === "qr") setTimeout(() => { if (S && !S.stopped && S.phase === "seek") nb.style.display = "block"; }, 6000);
  $("mode").textContent = ch.media_type === "video" ? `🎥 ${t("video")} ${ch.video_seconds}s` : `📸 ${t("photoM")}`;
  try { S.wake = await navigator.wakeLock?.request("screen"); } catch (e) {}
  try {
    S.stream = await navigator.mediaDevices.getUserMedia({ audio: false,
      video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } } });
  } catch (e) { stopScan(); sayText(t("camErr")); return toast(t("camErr"), "err"); }
  vid.srcObject = S.stream; await vid.play();
  const W = 720; cv.width = W; cv.height = Math.round(W * (vid.videoHeight || 1280) / (vid.videoWidth || 720));
  S.detector = ("BarcodeDetector" in window) ? new BarcodeDetector({ formats: ["qr_code"] }) : null;
  drawLoop();
  if (mode === "manual") {
    say("rec");
    countdown(3, () => startRecording());
  } else { say("point"); detectLoop(); }
}
function countdown(n, cb) {
  const c = $("count"); c.style.display = "grid";
  const tick = () => { if (!S || S.stopped) { c.style.display = "none"; return; }
    if (n === 0) { c.style.display = "none"; return cb(); } c.textContent = n; navigator.vibrate?.(60); n--; setTimeout(tick, 1000); };
  tick();
}

// Every frame: server time, one-time code, guard and place burned in
function drawLoop() {
  if (!S || S.stopped) return;
  const w = cv.width, h = cv.height;
  ctx.drawImage(vid, 0, 0, w, h);
  const now = SSP.serverNow(), g = freshGps();
  ctx.fillStyle = "rgba(0,0,0,.62)"; ctx.fillRect(0, 0, w, 96); ctx.fillRect(0, h - 44, w, 44);
  ctx.fillStyle = "#fff"; ctx.font = "bold 22px system-ui, sans-serif";
  ctx.fillText("SERENITY SPACE · PATROL", 14, 30);
  ctx.font = "bold 26px ui-monospace, monospace";
  ctx.fillText(fmtDateTime(now) + " IST", 14, 62);
  ctx.font = "bold 20px system-ui, sans-serif"; ctx.fillStyle = "#fde047";
  ctx.fillText(`CODE ${S.ch.code}  ·  ${S.ch.guard_code}  ·  ${S.label}`, 14, 88);
  ctx.fillStyle = "#fff"; ctx.font = "18px system-ui, sans-serif";
  ctx.fillText(g ? `GPS ±${Math.round(g.acc)} m` : "GPS …", 14, h - 15);
  if (S.mode === "manual") { ctx.fillStyle = "#fbbf24"; ctx.fillText(`NO QR · ${S.opts.cp?.name || ""} · ${S.opts.reason}`.slice(0, 48), 150, h - 15); }
  else if (S.qr) { ctx.fillStyle = "#4ade80"; ctx.fillText("QR ✓", w - 200, h - 15); }
  if (S.phase === "rec") { ctx.fillStyle = "#f87171"; ctx.fillText(`● REC ${Math.max(0, Math.ceil((S.recEnd - Date.now()) / 1000))}s`, w - 120, h - 15); }
  const left = Math.max(0, Math.round((new Date(S.ch.expires_at) - now) / 1000));
  $("timer").textContent = `⏱ ${Math.floor(left / 60)}:${String(left % 60).padStart(2, "0")} ${t("left")}`;
  requestAnimationFrame(drawLoop);
}

async function readQr() {
  if (S.detector) {
    try { const r = await S.detector.detect(vid); return r[0]?.rawValue || null; } catch (e) { S.detector = null; }
  }
  const sw = 480, shh = Math.round(sw * vid.videoHeight / vid.videoWidth) || 640;
  qrCv.width = sw; qrCv.height = shh; qrCtx.drawImage(vid, 0, 0, sw, shh);
  const img = qrCtx.getImageData(0, 0, sw, shh);
  return jsQR(img.data, sw, shh, { inversionAttempts: "dontInvert" })?.data || null;
}

async function detectLoop() {
  while (S && !S.stopped && (S.phase === "seek" || S.phase === "rec")) {
    const val = await readQr().catch(() => null);
    if (!S || S.stopped) return;
    if (val) {
      if (!val.startsWith("SSP1:")) { if (S.phase === "seek") $("hint").textContent = "⚠️ " + t("notOurs"); }
      else {
        if (S.phase === "rec" && val === S.qr) S.qrFrames++;
        if (S.phase === "seek") {
          S.qr = val; S.qrFrames = 1; navigator.vibrate?.(80); S.phase = "identify"; $("noqrBtn").style.display = "none";
          try {
            const { data: idr } = await sb.rpc("identify_qr", { p_challenge_id: S.ch.challenge_id, p_qr: val });
            if (idr && idr.media_type && idr.media_type !== S.ch.media_type) {
              S.ch.media_type = idr.media_type;
              $("mode").textContent = S.ch.media_type === "video" ? `🎥 ${t("video")} ${S.ch.video_seconds}s` : `📸 ${t("photoM")}`;
            }
          } catch (e) {}
          if (!S || S.stopped) return;
          if (S.ch.media_type === "video") { toast(t("needVideo")); say("rec"); startRecording(); }
          else { S.phase = "photo"; setTimeout(takePhoto, 350); }
        }
      }
    }
    await new Promise((r) => setTimeout(r, 180));
  }
}

function takePhoto() { cv.toBlob((b) => finish(b, "jpg", "image/jpeg"), "image/jpeg", 0.75); }

function startRecording() {
  S.phase = "rec"; scanEl.className = "rec" + (S.mode === "manual" ? " manual" : "");
  $("hint").textContent = t("keep");
  const types = ["video/webm;codecs=vp8", "video/webm", "video/mp4;codecs=avc1", "video/mp4"];
  const mime = types.find((m) => window.MediaRecorder && MediaRecorder.isTypeSupported(m)) || "";
  const rec = new MediaRecorder(cv.captureStream(15), mime ? { mimeType: mime, videoBitsPerSecond: 600000 } : {});
  const chunks = []; rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  rec.onstop = () => {
    if (!S || S.stopped) return;
    const type = (rec.mimeType || mime || "video/webm").split(";")[0];
    finish(new Blob(chunks, { type }), type === "video/mp4" ? "mp4" : "webm", type);
  };
  S.recEnd = Date.now() + S.ch.video_seconds * 1000;
  rec.start(1000);
  setTimeout(() => rec.state !== "inactive" && rec.stop(), S.ch.video_seconds * 1000);
}

function stopScan() {
  if (!S) return;
  S.stopped = true;
  S.stream?.getTracks().forEach((tr) => tr.stop());
  try { S.wake?.release(); } catch (e) {}
  scanEl.style.display = "none"; $("count").style.display = "none";
}
$("cancelScan").onclick = () => { stopScan(); window.speechSynthesis?.cancel(); };

async function finish(blob, ext, type) {
  const st = S; st.stopped = true; stopScan();
  showResult({ ico: "⏳", title: t("up") });
  const { data: { user } } = await sb.auth.getUser();
  const path = `${user.id}/${st.ch.challenge_id}.${ext}`;
  let upErr = null;
  for (let i = 0; i < 3; i++) {
    const { error } = await sb.storage.from("patrol-media").upload(path, blob, { contentType: type, upsert: false });
    upErr = error; if (!error || /exists/i.test(error.message)) { upErr = null; break; }
    await new Promise((r) => setTimeout(r, 1500));
  }
  showResult({ ico: "⏳", title: t("check") });
  const g = freshGps();
  const common = { p_challenge_id: st.ch.challenge_id, p_lat: g?.lat ?? null, p_lng: g?.lng ?? null, p_accuracy: g?.acc ?? null,
                   p_device_id: deviceId, p_media_path: upErr ? null : path, p_user_agent: navigator.userAgent };
  const { data, error } = st.mode === "manual"
    ? await sb.rpc("submit_manual", { ...common, p_checkpoint_id: st.opts.cp.id, p_reason: st.opts.reason, p_note: st.opts.note || null })
    : await sb.rpc("submit_scan", { ...common, p_qr: st.qr, p_qr_frames: st.qrFrames });
  if (error) { sayText(t("bad")); return showResult({ ico: "❌", title: t("bad"), sub: esc(error.message), retry: st.round.id }); }
  SSP.syncServer(data.server_time);
  navigator.vibrate?.(data.status === "rejected" ? [200, 100, 200] : 150);
  await loadHome();
  const round = home.rounds.find((r) => r.id === st.round.id) || st.round;
  const nxt = nextPlaceOf(round);
  const cpObj = (st.round.checkpoints || []).find((c) => c.name === data.checkpoint);
  const cpName = esc(cpObj ? pickL(cpObj, "name") : LN(data.checkpoint || ""));
  const hard = ["OLD_QR", "UNKNOWN_QR", "NOT_ON_ROUTE", "DUPLICATE", "NO_MEDIA", "EXPIRED"];
  if (data.status === "rejected") {
    const msg = flagText(data.flags.find((f) => hard.includes(f)) || "") || data.message;
    sayText(msg);
    return showResult({ ico: "❌", title: t("bad"), sub: esc(msg), retry: round.id });
  }
  const notes = data.flags.filter((f) => !["OUT_OF_ORDER", "NO_QR"].includes(f)).map((f) => flagText(f)).filter(Boolean).join(", ");
  const sub = `${placeIcon(cpObj)} ${cpName} · ${fmtTime(data.server_time, true)}${notes ? `<br>🟡 ${esc(notes)}` : ""}`;
  if (nxt) say("doneNext", (l) => pickL(nxt, "name", l));
  else say(data.status === "review" ? "review" : "roundDone");
  showResult({ ico: data.status === "ok" ? "✅" : "🟡", title: data.status === "ok" ? t("ok") : t("review"), sub, next: nxt, round, complete: !nxt });
}

// ====================== RESULT ======================
function showResult({ ico, title, sub = "", next = null, round = null, retry = null, complete = false }) {
  const el = $("result"); el.style.display = "block";
  const waiting = ico === "⏳";
  $("resultIn").innerHTML = `<div class="ico">${ico}</div><h2>${esc(title)}</h2><div class="sub">${sub}</div>
    ${next ? `<div class="next" style="margin-top:20px"><div class="lbl">➡️ ${t("goNow")}</div>
        <div class="ico">${placeIcon(next)}</div><div class="name">${esc(pickL(next, "name"))}</div>
        ${next.area ? `<div class="area">${esc(pickL(next, "area"))}</div>` : ""}
        <button class="big" onclick="startScan('${round.id}')"><span class="i">📷</span>${t("scanBtn")}</button>
        <div class="row2"><button data-nobusy class="mid" onclick="repeatSay()"><span class="i">🔊</span>${t("hearAgain")}</button>
          <button class="mid warnb" onclick="openNoQr('${round.id}')"><span class="i">⚠️</span>${t("qrProblem")}</button></div></div>` : ""}
    ${complete ? `<div class="status done" style="margin-top:20px"><div class="ico">🎉</div><h2>${t("roundDone")}</h2></div>` : ""}
    ${retry ? `<button class="big" onclick="startScan('${retry}')"><span class="i">🔁</span>${t("tryAgain")}</button>
               <button class="btn amber" onclick="openNoQr('${retry}')">⚠️ ${t("qrProblem")}</button>` : ""}
    ${waiting ? "" : `<button class="btn ghost" onclick="hidePanels();renderHome()">🏠 ${t("home")}</button>`}`;
}
function hidePanels() { $("result").style.display = "none"; $("flow").style.display = "none"; }

// ====================== QR NOT WORKING ======================
let NQ = null;
function openNoQr(roundId) {
  stopScan();
  const round = home.rounds.find((r) => r.id === roundId);
  NQ = { round, cp: nextPlaceOf(round), reason: null, note: "" };
  noQrPlace();
}
function flowShow(html) { $("result").style.display = "none"; const f = $("flow"); f.style.display = "block"; f.scrollTop = 0; $("flowIn").innerHTML = html; }
function noQrPlace(showAll) {
  const pending = NQ.round.checkpoints.filter((c) => !c.done);
  flowShow(`<h2>📍 ${t("whereAreYou")}</h2>
    ${!showAll && NQ.cp ? `<div class="next"><div class="ico">${placeIcon(NQ.cp)}</div><div class="name">${esc(pickL(NQ.cp, "name"))}</div>
        ${NQ.cp.area ? `<div class="area">${esc(pickL(NQ.cp, "area"))}</div>` : ""}
        <button class="big" onclick="noQrReason()"><span class="i">✅</span>${t("yesHere")}</button></div>
      ${pending.length > 1 ? `<button class="btn ghost" onclick="noQrPlace(true)">🔄 ${t("otherPlace")}</button>` : ""}`
    : pending.map((c) => `<button class="placeBtn" onclick="NQ.cp=NQ.round.checkpoints.find(x=>x.id==='${c.id}');noQrReason()">
        <span class="i">${placeIcon(c)}</span><span>${esc(pickL(c, "name"))}${c.area ? `<br><small style="color:var(--muted)">${esc(pickL(c, "area"))}</small>` : ""}</span></button>`).join("")}
    <button class="btn ghost" onclick="hidePanels();renderHome()">✖ ${t("cancel")}</button>`);
  say("where");
}
function noQrReason() {
  flowShow(`<h2>❓ ${t("whyNoQr")}</h2>
    <div class="grid">${REASONS.map(([k, i]) => `<button class="choice ${NQ.reason === k ? "sel" : ""}" onclick="NQ.reason='${k}';noQrNote()">
      <span class="i">${i}</span>${t("r_" + k)}</button>`).join("")}</div>
    <button class="btn ghost" onclick="noQrPlace()">⬅️ ${t("cancel")}</button>`);
  say("why");
}
let recog = null;
function noQrNote(err) {
  const R = window.SpeechRecognition || window.webkitSpeechRecognition;
  const reasonIcon = REASONS.find(([k]) => k === NQ.reason)[1];
  flowShow(`<h2>${reasonIcon} ${t("r_" + NQ.reason)}</h2>
    <div class="card" style="text-align:center">${placeIcon(NQ.cp)} <b style="font-size:20px">${esc(pickL(NQ.cp, "name"))}</b></div>
    ${R ? `<button data-nobusy class="mic" id="micBtn" onclick="toggleMic()">🎤 ${t("speakReason")}</button>` : ""}
    <label>✍️ ${t("typeHere")}</label><textarea id="noteTxt">${esc(NQ.note)}</textarea>
    ${err ? `<p style="color:#fca5a5;font-weight:700;text-align:center">${esc(err)}</p>` : ""}
    <button class="big" onclick="noQrGo()"><span class="i">🎥</span>${t("startVideo")}</button>
    <button class="btn ghost" onclick="noQrReason()">⬅️ ${t("cancel")}</button>`);
  if (R) say("note");
}
function toggleMic() {
  const R = window.SpeechRecognition || window.webkitSpeechRecognition;
  const btn = $("micBtn");
  if (recog) { try { recog.stop(); } catch (e) {} recog = null; btn.classList.remove("on"); btn.innerHTML = `🎤 ${t("speakReason")}`; return; }
  window.speechSynthesis?.cancel();
  recog = new R(); recog.lang = VLANG[lang]; recog.interimResults = false; recog.maxAlternatives = 1; recog.continuous = false;
  recog.onresult = (e) => { const txt = e.results[0][0].transcript; const ta = $("noteTxt"); ta.value = (ta.value ? ta.value + " " : "") + txt; NQ.note = ta.value; };
  recog.onend = () => { recog = null; const b = $("micBtn"); if (b) { b.classList.remove("on"); b.innerHTML = `🎤 ${t("speakReason")}`; } };
  recog.onerror = () => {};
  btn.classList.add("on"); btn.innerHTML = `🔴 ${t("listening")}`;
  try { recog.start(); } catch (e) { recog = null; }
}
function noQrGo() {
  NQ.note = ($("noteTxt")?.value || "").trim();
  if (NQ.reason === "OTHER" && !NQ.note) { sayText(t("needNote")); return noQrNote(t("needNote")); }
  if (recog) { try { recog.stop(); } catch (e) {} recog = null; }
  hidePanels();
  startScan(NQ.round.id, "manual", { cp: NQ.cp, reason: NQ.reason, note: NQ.note });
}

// ====================== START ======================
async function boot() {
  document.documentElement.lang = lang;
  if (!sb) { app.innerHTML = `<div class="foot">Setup pending: Supabase keys are not configured in config.js.</div>`; return; }
  const { data: { session } } = await sb.auth.getSession();
  if (!session) return renderLogin();
  const adm = await sb.rpc("is_admin");
  if (adm.data === true) return location.replace("admin.html");
  startGps();
  await loadHome();
  saveSubscription(false);
  clearInterval(clockTimer); clockTimer = setInterval(() => { const c = $("clk"); if (c) c.textContent = fmtTime(SSP.serverNow(), true); }, 1000);
  clearInterval(refreshTimer); refreshTimer = setInterval(() => { if ((!S || S.stopped) && $("flow").style.display !== "block") loadHome(); }, 30000);
}
document.addEventListener("visibilitychange", () => { if (!document.hidden && home && (!S || S.stopped)) loadHome(); });
if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
boot();
