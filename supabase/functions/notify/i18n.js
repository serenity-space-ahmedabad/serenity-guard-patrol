// @ts-nocheck
// Copy of web/i18n.js for the server (keep in sync).
const window = {};
// Serenity Space Patrol — Hindi / Gujarati for names typed by the committee.
// Order: committee's own translation (name_hi / name_gu) → phrase/word dictionary →
// letters written phonetically in Devanagari / Gujarati script (never English letters).
(function () {
  // [hindi, gujarati]
  const PHRASES = {
    "main gate": ["मुख्य गेट", "મુખ્ય ગેટ"], "back gate": ["पिछला गेट", "પાછળનો ગેટ"],
    "side gate": ["साइड गेट", "સાઇડ ગેટ"], "front gate": ["सामने का गेट", "આગળનો ગેટ"],
    "night round": ["रात्रि राउंड", "રાત્રિ રાઉન્ડ"], "day round": ["दिन का राउंड", "દિવસનો રાઉન્ડ"],
    "full campus": ["पूरा परिसर", "સંપૂર્ણ પરિસર"], "lift lobby": ["लिफ्ट लॉबी", "લિફ્ટ લોબી"],
    "pump room": ["पंप रूम", "પંપ રૂમ"], "water tank": ["पानी की टंकी", "પાણીની ટાંકી"],
    "security cabin": ["सिक्योरिटी केबिन", "સિક્યુરિટી કેબિન"], "play area": ["खेल का मैदान", "રમતનું મેદાન"],
    "swimming pool": ["स्विमिंग पूल", "સ્વિમિંગ પૂલ"], "fire exit": ["फायर एग्ज़िट", "ફાયર એક્ઝિટ"],
    "meter room": ["मीटर रूम", "મીટર રૂમ"], "club house": ["क्लब हाउस", "ક્લબ હાઉસ"],
    "terrace door": ["छत का दरवाज़ा", "અગાસીનો દરવાજો"], "ground floor": ["ग्राउंड फ्लोर", "ગ્રાઉન્ડ ફ્લોર"],
    "first floor": ["पहली मंज़िल", "પહેલો માળ"], "parking area": ["पार्किंग क्षेत्र", "પાર્કિંગ વિસ્તાર"],
    "garbage area": ["कचरा क्षेत्र", "કચરા વિસ્તાર"], "dg set": ["डीजी सेट", "ડીજી સેટ"],
    "main road": ["मुख्य सड़क", "મુખ્ય રસ્તો"], "guard room": ["गार्ड रूम", "ગાર્ડ રૂમ"],
  };
  const WORDS = {
    main: ["मुख्य", "મુખ્ય"], gate: ["गेट", "ગેટ"], back: ["पिछला", "પાછળ"], front: ["सामने", "આગળ"],
    rear: ["पीछे", "પાછળ"], side: ["साइड", "સાઇડ"], entrance: ["प्रवेश", "પ્રવેશ"], exit: ["निकास", "બહાર નીકળો"],
    block: ["ब्लॉक", "બ્લોક"], wing: ["विंग", "વિંગ"], tower: ["टावर", "ટાવર"], lobby: ["लॉबी", "લોબી"],
    lift: ["लिफ्ट", "લિફ્ટ"], parking: ["पार्किंग", "પાર્કિંગ"], basement: ["बेसमेंट", "બેઝમેન્ટ"],
    ground: ["ग्राउंड", "ગ્રાઉન્ડ"], floor: ["फ्लोर", "ફ્લોર"], terrace: ["छत", "અગાસી"], roof: ["छत", "છત"],
    garden: ["बगीचा", "બગીચો"], pool: ["पूल", "પૂલ"], gym: ["जिम", "જિમ"], temple: ["मंदिर", "મંદિર"],
    shop: ["दुकान", "દુકાન"], shops: ["दुकानें", "દુકાનો"], office: ["ऑफिस", "ઓફિસ"], room: ["रूम", "રૂમ"],
    area: ["क्षेत्र", "વિસ્તાર"], road: ["रोड", "રોડ"], compound: ["कंपाउंड", "કમ્પાઉન્ડ"], campus: ["परिसर", "પરિસર"],
    round: ["राउंड", "રાઉન્ડ"], night: ["रात", "રાત"], day: ["दिन", "દિવસ"], morning: ["सुबह", "સવાર"],
    evening: ["शाम", "સાંજ"], full: ["पूरा", "સંપૂર્ણ"], test: ["टेस्ट", "ટેસ્ટ"], home: ["घर", "ઘર"],
    desk: ["डेस्क", "ડેસ્ક"], computer: ["कंप्यूटर", "કમ્પ્યુટર"], comp: ["कंप्यूटर", "કમ્પ્યુટર"],
    water: ["पानी", "પાણી"], tank: ["टंकी", "ટાંકી"], pump: ["पंप", "પંપ"], meter: ["मीटर", "મીટર"],
    generator: ["जनरेटर", "જનરેટર"], security: ["सिक्योरिटी", "સિક્યુરિટી"], cabin: ["केबिन", "કેબિન"],
    corridor: ["गलियारा", "કોરિડોર"], staircase: ["सीढ़ी", "દાદર"], stairs: ["सीढ़ियाँ", "દાદર"],
    east: ["पूर्व", "પૂર્વ"], west: ["पश्चिम", "પશ્ચિમ"], north: ["उत्तर", "ઉત્તર"], south: ["दक्षिण", "દક્ષિણ"],
    club: ["क्लब", "ક્લબ"], house: ["हाउस", "હાઉસ"], clubhouse: ["क्लब हाउस", "ક્લબ હાઉસ"],
    amenities: ["सुविधाएँ", "સુવિધાઓ"], play: ["खेल", "રમત"], children: ["बच्चों", "બાળકો"], kids: ["बच्चों", "બાળકો"],
    garbage: ["कचरा", "કચરો"], door: ["दरवाज़ा", "દરવાજો"], and: ["और", "અને"], hall: ["हॉल", "હોલ"],
    society: ["सोसाइटी", "સોસાયટી"], wall: ["दीवार", "દીવાલ"], boundary: ["बाउंड्री", "બાઉન્ડ્રી"],
    electric: ["बिजली", "વીજળી"], electrical: ["बिजली", "વીજળી"], panel: ["पैनल", "પેનલ"], fire: ["फायर", "ફાયર"],
    cctv: ["सीसीटीवी", "સીસીટીવી"], solar: ["सोलर", "સોલર"], visitor: ["विज़िटर", "વિઝિટર"], visitors: ["विज़िटर", "વિઝિટર"],
    two: ["दो", "બે"], wheeler: ["व्हीलर", "વ્હીલર"], four: ["चार", "ચાર"], car: ["कार", "કાર"],
    first: ["पहला", "પહેલો"], second: ["दूसरा", "બીજો"], third: ["तीसरा", "ત્રીજો"], top: ["ऊपर", "ઉપર"],
    left: ["बायाँ", "ડાબી"], right: ["दायाँ", "જમણી"], near: ["पास", "પાસે"], behind: ["पीछे", "પાછળ"],
    route: ["रूट", "રૂટ"], patrol: ["पेट्रोल", "પેટ્રોલ"], checkpoint: ["चेकपॉइंट", "ચેકપોઇન્ટ"],
    quick: ["जल्दी", "ઝડપી"], weekend: ["सप्ताहांत", "વીકએન્ડ"], special: ["विशेष", "વિશેષ"],
    serenity: ["सेरेनिटी", "સેરેનિટી"], space: ["स्पेस", "સ્પેસ"],
    // common names / surnames (phonetic rules get these slightly wrong)
    shah: ["शाह", "શાહ"], patel: ["पटेल", "પટેલ"], yadav: ["यादव", "યાદવ"], parmar: ["परमार", "પરમાર"],
    thakor: ["ठाकोर", "ઠાકોર"], thakur: ["ठाकुर", "ઠાકુર"], desai: ["देसाई", "દેસાઈ"], mehta: ["मेहता", "મહેતા"],
    joshi: ["जोशी", "જોશી"], trivedi: ["त्रिवेदी", "ત્રિવેદી"], pandya: ["पंड्या", "પંડ્યા"], prajapati: ["प्रजापति", "પ્રજાપતિ"],
    chauhan: ["चौहान", "ચૌહાણ"], rathod: ["राठोड़", "રાઠોડ"], solanki: ["सोलंकी", "સોલંકી"], vaghela: ["वाघेला", "વાઘેલા"],
    makwana: ["मकवाना", "મકવાણા"], chavda: ["चावड़ा", "ચાવડા"], jadeja: ["जडेजा", "જાડેજા"], raval: ["रावल", "રાવલ"],
    bhatt: ["भट्ट", "ભટ્ટ"], vyas: ["व्यास", "વ્યાસ"], dave: ["दवे", "દવે"], kumar: ["कुमार", "કુમાર"], singh: ["सिंह", "સિંહ"],
    sharma: ["शर्मा", "શર્મા"], verma: ["वर्मा", "વર્મા"], gupta: ["गुप्ता", "ગુપ્તા"], mishra: ["मिश्रा", "મિશ્રા"],
    tiwari: ["तिवारी", "તિવારી"], pandey: ["पांडे", "પાંડે"], dubey: ["दुबे", "દુબે"], chaudhary: ["चौधरी", "ચૌધરી"],
    rajput: ["राजपूत", "રાજપૂત"], khan: ["ख़ान", "ખાન"], modi: ["मोदी", "મોદી"], amin: ["अमीन", "અમીન"],
    dipesh: ["दीपेश", "દીપેશ"], kuldip: ["कुलदीप", "કુલદીપ"], ramesh: ["रमेश", "રમેશ"], suresh: ["सुरेश", "સુરેશ"],
    mahesh: ["महेश", "મહેશ"], rajesh: ["राजेश", "રાજેશ"], kamlesh: ["कमलेश", "કમલેશ"], biren: ["बिरेन", "બિરેન"],
    sachin: ["सचिन", "સચિન"], akash: ["आकाश", "આકાશ"], manan: ["मनन", "મનન"], rahul: ["राहुल", "રાહુલ"],
    ram: ["राम", "રામ"], raju: ["राजू", "રાજુ"], ravi: ["रवि", "રવિ"], vijay: ["विजय", "વિજય"], ajay: ["अजय", "અજય"],
  };
  const LETTERS_HI = { a:"ए", b:"बी", c:"सी", d:"डी", e:"ई", f:"एफ", g:"जी", h:"एच", i:"आई", j:"जे", k:"के", l:"एल", m:"एम",
    n:"एन", o:"ओ", p:"पी", q:"क्यू", r:"आर", s:"एस", t:"टी", u:"यू", v:"वी", w:"डब्ल्यू", x:"एक्स", y:"वाय", z:"ज़ेड" };
  const LETTERS_GU = { a:"એ", b:"બી", c:"સી", d:"ડી", e:"ઈ", f:"એફ", g:"જી", h:"એચ", i:"આઈ", j:"જે", k:"કે", l:"એલ", m:"એમ",
    n:"એન", o:"ઓ", p:"પી", q:"ક્યૂ", r:"આર", s:"એસ", t:"ટી", u:"યુ", v:"વી", w:"ડબલ્યુ", x:"એક્સ", y:"વાય", z:"ઝેડ" };

  // Phonetic Latin → Devanagari (Indian-name style). Longest match first.
  const VOW = [["aa","आ","ा"],["ai","ऐ","ै"],["au","औ","ौ"],["ee","ई","ी"],["ii","ई","ी"],["oo","ऊ","ू"],["ou","औ","ौ"],
               ["ea","ई","ी"],["a","अ",""],["e","ए","े"],["i","इ","ि"],["o","ओ","ो"],["u","उ","ु"]];
  const CON = [["chh","छ"],["ksh","क्ष"],["sh","श"],["ch","च"],["th","थ"],["ph","फ"],["kh","ख"],["gh","घ"],["bh","भ"],["dh","ध"],
               ["jh","झ"],["tt","ट"],["dd","ड"],["ck","क"],["gn","ग्न"],["k","क"],["g","ग"],["j","ज"],["t","त"],["d","द"],["n","न"],
               ["p","प"],["b","ब"],["m","म"],["y","य"],["r","र"],["l","ल"],["v","व"],["w","व"],["s","स"],["h","ह"],["f","फ"],
               ["z","ज़"],["x","क्स"],["q","क"],["c","क"]];
  const NASAL_BEFORE = /^(k|g|c|j|t|d|p|b|sh|s)/;

  function phonetic(word) {
    let out = "", i = 0, prevCon = false;
    const w = word.toLowerCase();
    while (i < w.length) {
      const rest = w.slice(i);
      let v = VOW.find(([k]) => rest.startsWith(k));
      if (v) {
        const last = i + v[0].length >= w.length;
        if (prevCon) out += (v[0] === "a" && last) ? "ा" : v[2];
        else out += v[1];
        i += v[0].length; prevCon = false;
        // nasal: vowel followed by n/m + consonant
        const r2 = w.slice(i);
        if ((r2[0] === "n" || r2[0] === "m") && r2.length > 1 && !/^[aeiouy]/.test(r2.slice(1)) && NASAL_BEFORE.test(r2.slice(1))) {
          out += "ं"; i += 1;
        }
        continue;
      }
      if (rest === "y" && prevCon) { out += "ी"; i += 1; prevCon = false; continue; }   // final y → ी (e.g. -ity)
      const c = CON.find(([k]) => rest.startsWith(k));
      if (c) {
        if (prevCon) out += "्";
        out += c[1]; i += c[0].length; prevCon = true;
        continue;
      }
      out += rest[0]; i += 1; prevCon = false;
    }
    return out;
  }
  const toGujarati = (s) => Array.from(s).map((ch) => {
    const cp = ch.codePointAt(0);
    if (cp === 0x093C) return "";                       // nukta has no Gujarati form
    if (cp >= 0x0900 && cp <= 0x097F) return String.fromCodePoint(cp + 0x180);
    return ch;
  }).join("");

  function wordOut(word, li) {
    const lw = word.toLowerCase();
    if (WORDS[lw]) return WORDS[lw][li];
    const letters = li === 0 ? LETTERS_HI : LETTERS_GU;
    // Block codes like E, B2, G-1103, CCTV-style abbreviations
    if (/^[a-z]$/i.test(word) || (/^[A-Z]{2,4}$/.test(word))) return Array.from(lw).map((ch) => letters[ch] || ch).join("");
    const m = word.match(/^([a-z])(\d+)$/i);
    if (m) return letters[m[1].toLowerCase()] + m[2];
    const dev = phonetic(word);
    return li === 0 ? dev : toGujarati(dev);
  }

  function localize(text, lang) {
    if (!text || lang === "en" || (lang !== "hi" && lang !== "gu")) return text || "";
    const li = lang === "hi" ? 0 : 1;
    const parts = String(text).split(/([A-Za-z]+\d*)/);           // keep separators/digits as-is
    const words = []; parts.forEach((p, idx) => { if (idx % 2 === 1) words.push(idx); });
    const out = parts.slice();
    for (let k = 0; k < words.length; k++) {
      // try 3- then 2-word phrases (only across plain spaces)
      let done = false;
      for (const n of [3, 2]) {
        if (k + n > words.length) continue;
        const idxs = words.slice(k, k + n);
        const seps = idxs.slice(0, -1).map((ix) => parts[ix + 1]);
        if (!seps.every((s) => /^ +$/.test(s))) continue;
        const key = idxs.map((ix) => parts[ix].toLowerCase()).join(" ");
        if (PHRASES[key]) {
          out[idxs[0]] = PHRASES[key][li];
          for (const ix of idxs.slice(1)) out[ix] = "";
          for (let s = idxs[0] + 1; s < idxs[idxs.length - 1]; s += 2) out[s] = "";
          k += n - 1; done = true; break;
        }
      }
      if (!done) out[words[k]] = wordOut(parts[words[k]], li);
    }
    return out.join("").replace(/&/g, li === 0 ? "और" : "અને").replace(/\s{2,}/g, " ").trim();
  }

  // Pick the committee's own translation if given, else auto
  const pick = (obj, field, lang) => {
    if (!obj) return "";
    if (lang === "hi" || lang === "gu") return obj[`${field}_${lang}`] || localize(obj[field], lang);
    return obj[field] || "";
  };

  window.SSP_I18N = { localize, pick };
})();
export const localize = window.SSP_I18N.localize;
export const pick = window.SSP_I18N.pick;
