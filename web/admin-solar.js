// Serenity Space — Solar tab for the committee (panel details, evening meter register, daily generation, Excel export)
const SOL_BLOCKS_COLS = "block,sr_no,panel_brand,panel_wp,panel_count,kw_installed,availability,area_served,extra_capacity_text,extra_capacity_kw,maintenance_required,meter_location,active,notes";
const NR_TEXT = { LOCKED: "🔒 Room locked", METER_FAULT: "⚠️ Meter not working", DISPLAY_OFF: "⚫ Display off", OTHER: "❓ Other" };
const SFLAG_TEXT = { LATE: "Late", NOT_READ: "Not read", FIRST: "First reading", LOWER: "Lower than before", HIGH: "Very high", ADMIN: "Entered by committee", CORRECTED: "Corrected", REENTERED: "Re-entered by guard" };
const n2 = (v, d = 2) => (v == null || isNaN(v) ? "" : Number(v).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: d }));
const monthKey = (iso) => iso.slice(0, 7);
const monthDays = (ym) => { const [y, m] = ym.split("-").map(Number); const n = new Date(y, m, 0).getDate(); return Array.from({ length: n }, (_, i) => `${ym}-${String(i + 1).padStart(2, "0")}`); };
const monthLabel = (ym) => new Date(ym + "-15T12:00:00+05:30").toLocaleString("en-IN", { month: "short", year: "2-digit" }).toUpperCase().replace(" ", "-");
let SOL = { month: null };

// Build the register: readings by block/date, generation = reading − previous reading (any earlier day, like the Excel)
function solarModel(blocks, readings, ym) {
  const days = monthDays(ym), codes = blocks.map((b) => b.block);
  const byBD = {}; readings.forEach((r) => (byBD[r.block + r.reading_date] = r));
  const cell = {}, gen = {}, check = {};
  codes.forEach((b) => {
    const list = readings.filter((r) => r.block === b && r.reading_kwh != null).sort((x, y) => (x.reading_date < y.reading_date ? -1 : 1));
    list.forEach((r, i) => {
      const p = list[i - 1];
      if (!p) return;
      const d = Number(r.reading_kwh) - Number(p.reading_kwh);
      if (d < 0) check[b + r.reading_date] = true; else gen[b + r.reading_date] = { v: +d.toFixed(2), gap: Math.round((new Date(r.reading_date) - new Date(p.reading_date)) / 864e5) };
    });
  });
  days.forEach((d) => codes.forEach((b) => (cell[b + d] = byBD[b + d] || null)));
  const rows = days.map((d) => {
    const g = codes.map((b) => gen[b + d] ? gen[b + d].v : null);
    const anyCheck = codes.some((b) => check[b + d]);
    const have = g.filter((x) => x != null).length;
    const total = have === codes.length ? +g.reduce((a, x) => a + x, 0).toFixed(2) : null;
    const anyData = codes.some((b) => cell[b + d]);
    const status = !anyData ? "" : anyCheck ? "CHECK" : have === codes.length ? "Complete" : "Pending";
    const readsAt = codes.map((b) => cell[b + d]?.read_at).filter(Boolean).sort();
    const who = [...new Set(codes.map((b) => cell[b + d]?.guards?.name || (cell[b + d]?.source === "admin" ? "Committee" : null)).filter(Boolean))];
    const remarks = codes.map((b) => { const c = cell[b + d]; if (!c) return null; const bits = [c.not_read_reason ? `${b}: ${NR_TEXT[c.not_read_reason].slice(2)}` : null, c.remarks && !c.not_read_reason ? `${b}: ${c.remarks}` : null]; return bits.filter(Boolean).join(", ") || null; }).filter(Boolean);
    return { d, g, total, status, anyCheck, time: readsAt.length ? readsAt[readsAt.length - 1] : null, who, remarks };
  });
  const blockTotal = codes.map((b, i) => +rows.reduce((a, r) => a + (r.g[i] || 0), 0).toFixed(2));
  const recordedTotal = +blockTotal.reduce((a, x) => a + x, 0).toFixed(2);
  const daysWithGen = codes.map((b, i) => rows.filter((r) => r.g[i] != null).length);
  return { days, codes, cell, gen, check, rows, blockTotal, recordedTotal, daysWithGen };
}

VIEWS.solar = async (m) => {
  const today = todayISO();
  SOL.month = SOL.month || monthKey(today);
  const ym = SOL.month, days = monthDays(ym);
  const from = addDays(days[0], -45), to = days[days.length - 1];
  const [blocks, readings, todayInfo] = await Promise.all([
    q(sb.from("solar_blocks").select(SOL_BLOCKS_COLS).order("sr_no")),
    q(sb.from("solar_readings").select("*, guards(name,code)").gte("reading_date", from).lte("reading_date", to).order("reading_date")),
    sb.rpc("solar_today").then((r) => r.data).catch(() => null),
  ]);
  const act = blocks.filter((b) => b.active !== false);
  const M = solarModel(act, readings, ym);
  SOL.last = { blocks, act, readings, M, ym };
  const kwTot = act.reduce((a, b) => a + Number(b.kw_installed || 0), 0);
  const genDays = M.rows.filter((r) => r.total != null);
  const avgDay = genDays.length ? genDays.reduce((a, r) => a + r.total, 0) / genDays.length : null;
  const yieldKw = avgDay != null && kwTot ? avgDay / kwTot : null;
  const tdone = todayInfo ? todayInfo.blocks.filter((b) => b.today).length : 0;
  const checks = M.rows.filter((r) => r.status === "CHECK").length;
  const pending = M.rows.filter((r) => r.status === "Pending" && r.d < today).length;

  m.innerHTML = `
    <div class="row" style="margin-bottom:14px">
      <div><label>Month</label><input type="month" id="smon" value="${ym}" max="${monthKey(today)}"></div>
      <button class="btn g" onclick="solarExport()">⬇️ Download Excel</button>
      <button class="btn s" onclick="solarPrint()">🖨️ Print</button>
      <span class="muted">Reading window ${todayInfo ? `${todayInfo.window_start}–${todayInfo.window_end}` : ""} · change in Settings</span></div>
    <div class="kpis">
      <div class="kpi"><div class="v">${n2(kwTot, 3)}</div><div class="l">kW installed · ${act.reduce((a, b) => a + (b.panel_count || 0), 0)} panels</div></div>
      <div class="kpi kg"><div class="v">${n2(M.recordedTotal, 1)}</div><div class="l">Units generated · ${monthLabel(ym)}</div></div>
      <div class="kpi"><div class="v">${avgDay == null ? "–" : n2(avgDay, 1)}</div><div class="l">Avg units / day (complete days)</div></div>
      <div class="kpi ${yieldKw == null ? "" : yieldKw >= 3.5 ? "kg" : yieldKw >= 2.5 ? "ka" : "kr"}"><div class="v">${yieldKw == null ? "–" : n2(yieldKw, 2)}</div><div class="l">Units per kW per day (normal 3.5–4.5)</div></div>
      <div class="kpi ${tdone === M.codes.length ? "kg" : "ka"}"><div class="v">${tdone}/${M.codes.length}</div><div class="l">Today's readings</div></div>
      <div class="kpi ${checks ? "kr" : ""}"><div class="v">${checks}</div><div class="l">Days marked CHECK</div></div>
      <div class="kpi ${pending ? "ka" : ""}"><div class="v">${pending}</div><div class="l">Past days still Pending</div></div>
    </div>
    ${todayInfo && ym === monthKey(today) ? solarTodayCard(todayInfo) : ""}
    <div class="card"><h3>Daily generation – all blocks (units)</h3>${solarChart(M)}</div>
    <div class="card"><h3>Meter Reading · ${monthLabel(ym)}</h3>
      <p class="help">Evening meter reading (kWh) entered by the guard with a meter photo. Click any cell to see the photo, correct it or fill a missing day.</p>
      ${solarReadingTable(M)}</div>
    <div class="card"><h3>Daily Generation · ${monthLabel(ym)}</h3>
      <p class="help">Units = today's reading − previous reading. <b>CHECK</b> = reading went down. Total only when all ${M.codes.length} blocks are present.</p>
      ${solarGenTable(M, act)}</div>
    <div class="card"><h3>Solar panel details</h3>${solarPanelTable(blocks)}</div>`;
  document.getElementById("smon").onchange = (e) => { if (e.target.value) { SOL.month = e.target.value; go("solar"); } };
};

function solarTodayCard(ti) {
  return `<div class="card"><h3>Today · ${fmtDate(ti.date + "T12:00:00+05:30")} ${ti.open ? (ti.late ? '<span class="chip missed">Window closed</span>' : '<span class="chip ok">Reading time</span>') : `<span class="chip">Opens ${ti.window_start}</span>`}</h3>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px">${ti.blocks.map((b) => {
      const t = b.today, st = !t ? (ti.late ? "missed" : "due") : t.kwh == null ? "partial" : "completed";
      const gen = t && t.kwh != null && b.prev_kwh != null ? Number(t.kwh) - Number(b.prev_kwh) : null;
      return `<div class="kpi" style="cursor:pointer" onclick="solarCell('${b.block}','${ti.date}')">
        <div style="display:flex;justify-content:space-between"><b style="font-size:20px">${b.block}</b><span class="chip ${st}">${!t ? (ti.late ? "Missing" : "Waiting") : t.kwh == null ? "Not read" : "Done"}</span></div>
        <div style="font-size:18px;font-weight:700;margin-top:4px">${t && t.kwh != null ? n2(t.kwh) : "–"}</div>
        <div class="muted">${gen != null ? `+${n2(gen, 1)} units` : t?.reason ? NR_TEXT[t.reason] : `${b.kw} kW`}</div>
        <div>${flagHtmlS(t?.flags)}</div></div>`;
    }).join("")}</div></div>`;
}
const flagHtmlS = (fl) => (fl || []).filter((f) => f !== "FIRST").map((f) => `<span class="flag ${["LOWER", "HIGH", "NOT_READ"].includes(f) ? "f" : ""}">${SFLAG_TEXT[f] || f}</span>`).join("");

function solarChart(M) {
  const W = 1000, H = 220, pad = 34, n = M.rows.length, bw = (W - pad - 8) / n;
  const vals = M.rows.map((r) => r.total != null ? r.total : r.g.reduce((a, x) => a + (x || 0), 0));
  const max = Math.max(10, ...vals) * 1.1;
  const y = (v) => H - 22 - (v / max) * (H - 40);
  const ticks = [0, max / 2, max].map((v) => `<line x1="${pad}" x2="${W}" y1="${y(v)}" y2="${y(v)}" stroke="#e2e8f0"/><text x="${pad - 4}" y="${y(v) + 4}" font-size="11" text-anchor="end" fill="#64748b">${Math.round(v)}</text>`).join("");
  const bars = M.rows.map((r, i) => {
    const v = vals[i]; if (!v && r.status !== "CHECK") return "";
    const c = r.status === "Complete" ? "#16a34a" : r.status === "CHECK" ? "#dc2626" : "#f59e0b";
    return `<rect x="${pad + i * bw + 2}" y="${y(v)}" width="${Math.max(2, bw - 4)}" height="${H - 22 - y(v)}" rx="2" fill="${c}"><title>${fmtDate(r.d + "T12:00:00+05:30")}: ${n2(v, 1)} units (${r.status})</title></rect>`;
  }).join("");
  const labels = M.rows.map((r, i) => (i % 2 === 0 ? `<text x="${pad + i * bw + bw / 2}" y="${H - 6}" font-size="10" text-anchor="middle" fill="#64748b">${+r.d.slice(8)}</text>` : "")).join("");
  return `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto">${ticks}${bars}${labels}</svg>
    <div class="muted" style="font-size:12px"><span style="color:#16a34a">■</span> Complete (all blocks) &nbsp; <span style="color:#f59e0b">■</span> Pending (some blocks missing – partial sum) &nbsp; <span style="color:#dc2626">■</span> CHECK</div>`;
}

function solarReadingTable(M) {
  const today = todayISO();
  return `<table style="min-width:900px"><thead><tr><th>Date</th>${M.codes.map((b) => `<th class="r">Block ${b}</th>`).join("")}<th>Reading time</th><th>Remarks / Signature</th></tr></thead><tbody>
    ${M.rows.filter((r) => r.d <= today).map((r) => `<tr><td style="white-space:nowrap">${fmtDate(r.d + "T12:00:00+05:30")}</td>${M.codes.map((b) => {
      const c = M.cell[b + r.d];
      const bad = M.check[b + r.d] || (c?.flags || []).some((f) => ["HIGH", "LOWER"].includes(f));
      const txt = !c ? `<span class="muted">–</span>` : c.reading_kwh == null ? `<span class="flag f" title="${esc(NR_TEXT[c.not_read_reason] || "")}">✕</span>` : n2(c.reading_kwh);
      return `<td class="r" style="cursor:pointer;white-space:nowrap;${bad ? "background:#fee2e2;" : c?.source === "admin" ? "background:#e0f2fe;" : ""}" onclick="solarCell('${b}','${r.d}')">${txt}${c?.photo_path && !c.photo_deleted ? `<sup title="meter photo" style="color:#0369a1"> ●</sup>` : ""}</td>`;
    }).join("")}<td>${r.time ? fmtTime(r.time) : ""}</td><td style="font-size:12px">${esc(r.who.join(", "))}${r.remarks.length ? `<div class="muted">${esc(r.remarks.join(" · "))}</div>` : ""}</td></tr>`).join("")}
  </tbody></table><p class="help" style="margin-top:8px"><span style="background:#fee2e2;padding:0 6px">red</span> = check this reading · <span style="background:#e0f2fe;padding:0 6px">blue</span> = entered/corrected by committee · ✕ = guard could not read · <span style="color:#0369a1">●</span> = meter photo</p>`;
}

function solarGenTable(M, act) {
  const today = todayISO();
  const kw = act.map((b) => Number(b.kw_installed));
  return `<table style="min-width:900px"><thead><tr><th>Date</th>${M.codes.map((b) => `<th class="r">Block ${b}</th>`).join("")}<th class="r">Total</th><th>Status</th></tr></thead><tbody>
    ${M.rows.filter((r) => r.d <= today).map((r) => `<tr><td style="white-space:nowrap">${fmtDate(r.d + "T12:00:00+05:30")}</td>${M.codes.map((b, i) => {
      const g = M.gen[b + r.d];
      return `<td class="r">${M.check[b + r.d] ? `<span class="flag f">CHECK</span>` : g ? `${n2(g.v, 1)}${g.gap > 1 ? `<sup class="muted" title="${g.gap} days since last reading"> ${g.gap}d</sup>` : ""}` : ""}</td>`;
    }).join("")}<td class="r"><b>${r.total != null ? n2(r.total, 1) : ""}</b></td><td>${r.status ? `<span class="chip ${r.status === "Complete" ? "ok" : r.status === "CHECK" ? "rejected" : "review"}">${r.status}</span>` : ""}</td></tr>`).join("")}
    <tr style="background:#f1f5f9;font-weight:700"><td>Recorded total</td>${M.blockTotal.map((v) => `<td class="r">${n2(v, 1)}</td>`).join("")}<td class="r">${n2(M.recordedTotal, 1)}</td><td></td></tr>
    <tr class="muted"><td>Units per kW per day</td>${M.blockTotal.map((v, i) => `<td class="r">${M.daysWithGen[i] && kw[i] ? n2(v / M.daysWithGen[i] / kw[i], 2) : ""}</td>`).join("")}<td></td><td></td></tr>
  </tbody></table>`;
}

function solarPanelTable(blocks) {
  const act = blocks.filter((b) => b.active !== false);
  const sum = (k) => act.reduce((a, b) => a + Number(b[k] || 0), 0);
  return `<table style="min-width:900px"><thead><tr><th>Sr</th><th>Block</th><th>Panel name</th><th class="r">Panel Wp</th><th class="r">No. of panels</th><th class="r">kW installed</th>
      <th>Availability</th><th>Area</th><th>Extra capacity feasible</th><th>Maintenance</th><th>Meter location</th><th></th></tr></thead><tbody>
    ${blocks.map((b) => `<tr style="${b.active === false ? "opacity:.5" : ""}"><td>${b.sr_no ?? ""}</td><td><b>${b.block}</b></td><td>${esc(b.panel_brand || "")}</td><td class="r">${b.panel_wp ?? ""}</td>
      <td class="r">${b.panel_count ?? ""}</td><td class="r">${n2(b.kw_installed, 3)}</td><td>${esc(b.availability || "")}</td><td>${esc(b.area_served || "")}</td>
      <td>${esc(b.extra_capacity_text || "")}</td><td>${b.maintenance_required ? '<span class="chip review">YES</span>' : '<span class="chip">NO</span>'}</td>
      <td>${esc(b.meter_location || "")}</td><td><button class="btn s xs" onclick="solarEditBlock('${b.block}')">Edit</button></td></tr>`).join("")}
    <tr style="background:#f1f5f9;font-weight:700"><td></td><td>Total</td><td></td><td></td><td class="r">${sum("panel_count")}</td><td class="r">${n2(sum("kw_installed"), 3)}</td>
      <td></td><td></td><td>${n2(sum("extra_capacity_kw"), 1)} KW</td><td>${act.filter((b) => b.maintenance_required).length} blocks</td><td></td><td></td></tr>
  </tbody></table><button class="btn s" style="margin-top:10px" onclick="solarEditBlock(null)">+ Add block</button>`;
}

function solarEditBlock(code) {
  const b = (SOL.last.blocks.find((x) => x.block === code)) || { block: "", sr_no: SOL.last.blocks.length + 1, availability: "YES", maintenance_required: false, active: true };
  const f = (k, l, type = "text", w = 160) => `<div><label>${l}</label><input id="sb_${k}" type="${type}" ${type === "number" ? 'step="any"' : ""} value="${esc(b[k] ?? "")}" style="width:${w}px"></div>`;
  modal(`<h2>${code ? `Block ${code} – panel details` : "Add block"}</h2>
    <div class="row">${code ? "" : f("block", "Block (letter)", "text", 90)}${f("sr_no", "Sr no", "number", 80)}${f("panel_brand", "Panel name")}${f("panel_wp", "Panel Wp", "number", 100)}
      ${f("panel_count", "No. of panels", "number", 110)}<div><label>kW installed</label><input id="sb_kw_installed" type="number" step="any" value="${b.kw_installed ?? ""}" style="width:110px"></div>
      ${f("availability", "Availability", "text", 100)}${f("area_served", "Area (supplies)")}${f("extra_capacity_text", "Extra capacity feasible", "text", 140)}
      ${f("extra_capacity_kw", "Extra capacity (kW number)", "number", 120)}
      <div><label>Maintenance required</label><select id="sb_maintenance_required"><option value="true" ${b.maintenance_required ? "selected" : ""}>YES</option><option value="false" ${b.maintenance_required ? "" : "selected"}>NO</option></select></div>
      ${f("meter_location", "Meter location (for guards)", "text", 260)}${f("notes", "Notes", "text", 260)}
      <div><label>In use</label><select id="sb_active"><option value="true" ${b.active !== false ? "selected" : ""}>Yes</option><option value="false" ${b.active === false ? "selected" : ""}>No (hide from guards)</option></select></div></div>
    <p class="help" style="margin-top:10px">Tip: kW installed = Panel Wp × No. of panels ÷ 1000 (filled automatically when empty).</p>
    <div class="row"><button class="btn" id="sbSave">Save</button><button class="btn s" onclick="closeModal()">Cancel</button></div>`);
  document.getElementById("sbSave").onclick = async () => {
    const v = (k) => document.getElementById("sb_" + k)?.value.trim();
    const num = (k) => (v(k) === "" || v(k) == null ? null : Number(v(k)));
    const row = { sr_no: num("sr_no"), panel_brand: v("panel_brand") || null, panel_wp: num("panel_wp"), panel_count: num("panel_count"),
      kw_installed: num("kw_installed"), availability: v("availability") || null, area_served: v("area_served") || null, extra_capacity_text: v("extra_capacity_text") || null,
      extra_capacity_kw: num("extra_capacity_kw"), maintenance_required: v("maintenance_required") === "true", meter_location: v("meter_location") || null,
      notes: v("notes") || null, active: v("active") === "true", updated_at: new Date().toISOString() };
    if (row.kw_installed == null && row.panel_wp && row.panel_count) row.kw_installed = +(row.panel_wp * row.panel_count / 1000).toFixed(3);
    if (row.extra_capacity_kw == null && row.extra_capacity_text) { const m = row.extra_capacity_text.match(/[\d.]+/); if (m) row.extra_capacity_kw = Number(m[0]); }
    if (code) await q(sb.from("solar_blocks").update(row).eq("block", code));
    else { const bl = (v("block") || "").toUpperCase(); if (!/^[A-Z]$/.test(bl)) return toast("Block must be one letter", "err"); await q(sb.from("solar_blocks").insert({ block: bl, ...row })); }
    closeModal(); toast("Saved"); go("solar");
  };
}

async function solarCell(block, date) {
  const r = (SOL.last.readings || []).find((x) => x.block === block && x.reading_date === date)
    || (await q(sb.from("solar_readings").select("*, guards(name,code)").eq("block", block).eq("reading_date", date).maybeSingle()));
  const hist = r ? await q(sb.from("solar_reading_history").select("*").eq("reading_id", r.id).order("changed_at")) : [];
  let img = "";
  if (r?.photo_path && !r.photo_deleted) {
    const { data } = await sb.storage.from("patrol-media").createSignedUrl(r.photo_path, 600);
    if (data?.signedUrl) img = `<img class="media" src="${data.signedUrl}" alt="meter photo">`;
  }
  const g = SOL.last.M.gen[block + date];
  modal(`<h2>Block ${block} · ${fmtDate(date + "T12:00:00+05:30")}</h2>
    ${r ? `<div class="grid2"><div>${img || `<div class="empty">No photo${r.photo_deleted ? " (deleted after retention period)" : ""}</div>`}</div><div>
      <table><tr><th>Reading</th><td><b style="font-size:20px">${r.reading_kwh != null ? n2(r.reading_kwh) + " kWh" : "Not read"}</b></td></tr>
      ${r.not_read_reason ? `<tr><th>Reason</th><td>${NR_TEXT[r.not_read_reason]}</td></tr>` : ""}
      <tr><th>Previous</th><td>${r.prev_kwh != null ? `${n2(r.prev_kwh)} (${fmtDate(r.prev_date + "T12:00:00+05:30")})` : "–"}</td></tr>
      <tr><th>Units</th><td>${g ? n2(g.v, 1) : SOL.last.M.check[block + date] ? '<span class="flag f">CHECK – reading went down</span>' : "–"}</td></tr>
      <tr><th>Entered by</th><td>${r.guards ? `${esc(r.guards.name)} (${esc(r.guards.code)})` : r.source === "admin" ? "Committee" : "–"}</td></tr>
      <tr><th>Server time</th><td>${fmtDateTime(r.read_at)}</td></tr>
      <tr><th>Flags</th><td>${flagHtmlS(r.flags) || "–"}</td></tr>
      ${r.remarks ? `<tr><th>Remarks</th><td>${esc(r.remarks)}</td></tr>` : ""}</table>
      ${hist.length ? `<h3 style="margin:14px 0 6px;font-size:14px">Change history</h3><table>${hist.map((h) => `<tr><td>${fmtDateTime(h.changed_at)}</td><td>${n2(h.old_kwh) || "–"} → ${n2(h.new_kwh) || "–"}</td><td class="muted">${esc(h.note || "")}</td></tr>`).join("")}</table>` : ""}
    </div></div>` : `<p class="muted">No reading for this day.</p>`}
    <div class="card" style="margin-top:14px;background:#f8fafc"><h3>${r ? "Correct this reading" : "Enter reading (committee)"}</h3>
      <div class="row"><div><label>Meter reading (kWh)</label><input id="scv" type="number" step="0.01" value="${r?.reading_kwh ?? ""}" style="width:160px"></div>
      <div><label>Note (why)</label><input id="scn" style="width:300px" placeholder="e.g. checked meter photo, guard typed wrong digit"></div>
      <button class="btn" id="scSave">Save</button>${r ? `<button class="btn d" id="scDel">Delete reading</button>` : ""}<button class="btn s" onclick="closeModal()">Close</button></div></div>`);
  document.getElementById("scSave").onclick = async () => {
    const v = document.getElementById("scv").value;
    if (v === "") return toast("Type the reading", "err");
    await q(sb.rpc("admin_set_solar_reading", { p_block: block, p_date: date, p_kwh: Number(v), p_note: document.getElementById("scn").value }));
    closeModal(); toast("Saved"); go("solar");
  };
  const del = document.getElementById("scDel");
  if (del) del.onclick = async () => {
    if (!confirm(`Delete Block ${block} reading of ${fmtDate(date + "T12:00:00+05:30")}?`)) return;
    await q(sb.rpc("admin_set_solar_reading", { p_block: block, p_date: date, p_kwh: null, p_note: document.getElementById("scn").value }));
    closeModal(); toast("Deleted"); go("solar");
  };
}

// ---------- Excel (same 3 sheets as the society's files) ----------
function loadXlsx() {
  return window.XLSX ? Promise.resolve() : new Promise((res, rej) => { const s = document.createElement("script"); s.src = "vendor/xlsx.mini.min.js"; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
}
async function solarExport() {
  await loadXlsx();
  const { blocks, act, M, ym } = SOL.last, today = todayISO();
  const wb = XLSX.utils.book_new();
  // 1. Panel details (SOLAR_PANEL_DETAIL_SS)
  const sum = (k) => act.reduce((a, b) => a + Number(b[k] || 0), 0);
  const p = [["SR. NO", "BLOCK", "EXISTING INSTALLED PANEL NAME", "PANEL WP", "NO. OF PANEL INSTALLED", "KW INSTALLED", "AVAILABILITY", "AREA", "Additional Panel Capacity is Feasible", "MAINTENANCE REQUIRED", "METER LOCATION"]];
  blocks.forEach((b) => p.push([b.sr_no, b.block, b.panel_brand, b.panel_wp, b.panel_count, Number(b.kw_installed), b.availability, b.area_served, b.extra_capacity_text, b.maintenance_required ? "YES" : "NO", b.meter_location || ""]));
  p.push(["", "TOTAL", "", "", sum("panel_count"), +sum("kw_installed").toFixed(3), "", "", `${sum("extra_capacity_kw")} KW`, "", ""]);
  const ws1 = XLSX.utils.aoa_to_sheet(p); ws1["!cols"] = [6, 8, 28, 10, 12, 12, 13, 16, 20, 14, 22].map((w) => ({ wch: w }));
  XLSX.utils.book_append_sheet(wb, ws1, "Panel Details");
  // 2. Meter Reading
  const vis = M.rows.filter((r) => r.d <= today);
  const mr = [["Serenity Space – Daily Solar Meter Reading (kWh)"], [`Month: ${monthLabel(ym)}`], [],
    ["Date", ...M.codes.map((b) => `Block ${b}`), "Reading time", "Remarks / Signature"]];
  vis.forEach((r) => mr.push([xlDate(r.d), ...M.codes.map((b) => { const c = M.cell[b + r.d]; return !c ? "" : c.reading_kwh == null ? `NOT READ (${(NR_TEXT[c.not_read_reason] || "").slice(2)})` : Number(c.reading_kwh); }),
    r.time ? fmtTime(r.time) : "", [r.who.join(", "), r.remarks.join("; ")].filter(Boolean).join(" – ")]));
  const ws2 = XLSX.utils.aoa_to_sheet(mr); ws2["!cols"] = [{ wch: 12 }, ...M.codes.map(() => ({ wch: 11 })), { wch: 12 }, { wch: 40 }];
  dateFmt(ws2, 4, vis.length);
  XLSX.utils.book_append_sheet(wb, ws2, "Meter Reading");
  // 3. Daily Generation
  const dg = [["Serenity Space – Daily Solar Generation (units)"], [`Month: ${monthLabel(ym)} · Units = current reading − previous reading. CHECK = reading went down.`], [],
    ["Date", ...M.codes.map((b) => `Block ${b}`), "Total", "Status"]];
  vis.forEach((r) => dg.push([xlDate(r.d), ...M.codes.map((b) => M.check[b + r.d] ? "CHECK" : M.gen[b + r.d] ? M.gen[b + r.d].v : ""), r.total ?? "", r.status]));
  dg.push(["Recorded total", ...M.blockTotal, M.recordedTotal, ""]);
  const ws3 = XLSX.utils.aoa_to_sheet(dg); ws3["!cols"] = [{ wch: 14 }, ...M.codes.map(() => ({ wch: 10 })), { wch: 10 }, { wch: 10 }];
  dateFmt(ws3, 4, vis.length);
  XLSX.utils.book_append_sheet(wb, ws3, "Daily Generation");
  XLSX.writeFile(wb, `Solar_Reading_${monthLabel(ym)}.xlsx`);
}
const xlDate = (iso) => { const [y, m, d] = iso.split("-").map(Number); return (Date.UTC(y, m - 1, d) - Date.UTC(1899, 11, 30)) / 864e5; };
function dateFmt(ws, startRow, n) { for (let i = 0; i < n; i++) { const a = XLSX.utils.encode_cell({ r: startRow + i, c: 0 }); if (ws[a]) ws[a].z = "dd-mmm-yyyy"; } }

function solarPrint() {
  const w = window.open("", "_blank");
  const cards = [...document.querySelectorAll("#main .card")].map((c) => c.outerHTML).join("");
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Solar ${monthLabel(SOL.last.ym)}</title><style>
    body{font:11px system-ui,sans-serif;margin:12px} table{border-collapse:collapse;width:100%;margin-bottom:12px} th,td{border:1px solid #cbd5e1;padding:3px 5px;text-align:left} .r{text-align:right}
    h3{margin:14px 0 6px} .help,.btn{display:none} .chip,.flag{font-weight:600} @page{size:landscape;margin:10mm}</style></head><body>
    <h2>Serenity Space – Solar report · ${monthLabel(SOL.last.ym)}</h2>${cards}<script>setTimeout(()=>print(),400)<\/script></body></html>`);
  w.document.close();
}
