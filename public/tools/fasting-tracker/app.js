'use strict';
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

// ---------- storage ----------
const DEFAULTS = {
  fasts: [],                    // {start, end|null, goal} ms timestamps, goal hours
  weights: [],                  // {date:'YYYY-MM-DD', val}
  water: {},                    // {'YYYY-MM-DD': ml}
  measurements: [],             // {date, type, val}
  notes: [],                    // {ts, text}
  settings: { goal: 16, unit: 'kg', waterGoal: 2000, goalWeight: null },
};
let db = { ...DEFAULTS, ...JSON.parse(localStorage.getItem('ft-db') || '{}') };
db.settings = { ...DEFAULTS.settings, ...db.settings };
const save = () => localStorage.setItem('ft-db', JSON.stringify(db));

// ---------- helpers ----------
const DAY = 86400000;
const localDate = d => new Date(d).toLocaleDateString('sv'); // YYYY-MM-DD, local tz
const today = () => localDate(Date.now());
const toLocalInput = ts => { const d = new Date(ts); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16); };
const fmtDur = ms => {
  const h = Math.floor(ms / 3600000), m = Math.floor(ms % 3600000 / 60000), s = Math.floor(ms % 60000 / 1000);
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};
const fmtDay = ds => new Date(ds + 'T12:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
// day integer <-> 'YYYY-MM-DD', both anchored at UTC midnight so display is stable across timezones
const dayNum = ds => Math.round(new Date(ds + 'T00:00:00Z').getTime() / DAY);
const numDay = x => new Date(Math.round(x) * DAY).toISOString().slice(0, 10);
const toast = msg => { const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; document.body.appendChild(t); setTimeout(() => t.remove(), 3000); };
const activeFast = () => db.fasts.find(f => !f.end);

// ---------- fasting stages ----------
const STAGES = [
  [0, '🍽️', 'Fed state', 'Digesting: blood sugar and insulin rise as your last meal is processed.'],
  [4, '📉', 'Post-absorptive', 'Blood sugar falls back to baseline; insulin starts dropping.'],
  [8, '🔥', 'Glycogen burning', 'Liver glycogen fuels the body; fat burning begins ramping up.'],
  [12, '🥑', 'Ketosis begins', 'Glycogen runs low; the body switches to fat and makes ketones.'],
  [16, '♻️', 'Autophagy', 'Cellular cleanup accelerates — damaged components get recycled.'],
  [24, '💪', 'Growth hormone surge', 'HGH rises to preserve muscle; deep autophagy continues.'],
  [48, '🧬', 'Cell regeneration', 'Insulin sensitivity improves markedly; stem cell activity rises.'],
];
const stageAt = hrs => [...STAGES].reverse().find(s => hrs >= s[0]);

// ---------- tabs ----------
$$('nav button').forEach(b => b.onclick = () => {
  $$('nav button').forEach(x => x.classList.toggle('active', x === b));
  $$('main section').forEach(s => s.classList.toggle('active', s.id === 'tab-' + b.dataset.tab));
});

// ---------- timer ----------
const PRESETS = [['13:11', 13], ['16:8', 16], ['18:6', 18], ['20:4', 20], ['OMAD', 23], ['36h', 36]];
function renderPresets() {
  $('#presets').innerHTML = PRESETS.map(([n, h]) =>
    `<button class="chip ${db.settings.goal === h ? 'sel' : ''}" data-h="${h}">${n}</button>`).join('') +
    `<button class="chip" id="chip-custom">Custom</button>`;
  $$('#presets [data-h]').forEach(c => c.onclick = () => {
    db.settings.goal = +c.dataset.h;
    const f = activeFast(); if (f) f.goal = db.settings.goal;
    save(); renderPresets(); tick();
  });
  $('#chip-custom').onclick = () => {
    const h = parseFloat(prompt('Fasting goal in hours:', db.settings.goal));
    if (h > 0) { db.settings.goal = h; const f = activeFast(); if (f) f.goal = h; save(); renderPresets(); tick(); }
  };
}

const RING_C = 2 * Math.PI * 88;
$('#ring').setAttribute('stroke-dasharray', RING_C);
let celebrated = false;

function tick() {
  const f = activeFast();
  const btn = $('#fast-btn');
  if (!f) {
    $('#ring').setAttribute('stroke-dashoffset', RING_C);
    $('#ring-elapsed').textContent = `${db.settings.goal}h fast`;
    $('#ring-sub').textContent = 'tap start';
    btn.textContent = 'Start fast';
    $('#edit-start-card').hidden = true;
    $('#stage-now').innerHTML = `<span class="muted">Start a fast to see your body's stages.</span>`;
    return;
  }
  const elapsed = Date.now() - f.start;
  const goalMs = f.goal * 3600000;
  const pct = Math.min(elapsed / goalMs, 1);
  $('#ring').setAttribute('stroke-dashoffset', RING_C * (1 - pct));
  $('#ring').style.stroke = pct >= 1 ? 'var(--warn)' : 'var(--accent)';
  $('#ring-elapsed').textContent = fmtDur(elapsed);
  $('#ring-sub').textContent = pct >= 1
    ? `goal reached! +${fmtDur(elapsed - goalMs)}`
    : `${Math.round(pct * 100)}% of ${f.goal}h · ends ${new Date(f.start + goalMs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  btn.textContent = 'End fast';
  $('#edit-start-card').hidden = false;
  if (document.activeElement !== $('#edit-start')) $('#edit-start').value = toLocalInput(f.start);
  const st = stageAt(elapsed / 3600000);
  $('#stage-now').innerHTML = `<span class="emoji">${st[1]}</span><div><b>${st[2]}</b> <small>(from ${st[0]}h)</small><br><small>${st[3]}</small></div>`;
  if (pct >= 1 && !celebrated) { celebrated = true; toast(`🎉 ${f.goal}h goal reached!`); }
}

$('#fast-btn').onclick = () => {
  const f = activeFast();
  if (f) {
    f.end = Date.now();
    const hrs = (f.end - f.start) / 3600000;
    toast(hrs >= f.goal ? `🎉 Fast complete: ${hrs.toFixed(1)}h!` : `Fast ended at ${hrs.toFixed(1)}h`);
    celebrated = false;
  } else {
    db.fasts.push({ start: Date.now(), end: null, goal: db.settings.goal });
  }
  save(); tick(); renderHistory(); renderStreak(); refreshWelcome();
};
$('#edit-start').onchange = e => {
  const f = activeFast(); const t = new Date(e.target.value).getTime();
  if (f && t && t < Date.now()) { f.start = t; save(); tick(); }
};

$('#stage-list').innerHTML = STAGES.map(s =>
  `<li><span>${s[1]} <b>${s[0]}h+</b> ${s[2]}</span><span class="sub" style="flex:1;text-align:right">${s[3]}</span></li>`).join('');

// ---------- history & streak ----------
function renderHistory() {
  const done = db.fasts.filter(f => f.end).sort((a, b) => b.start - a.start);
  $('#fast-list').innerHTML = done.length ? done.map(f => {
    const hrs = (f.end - f.start) / 3600000;
    const met = hrs >= f.goal;
    return `<li><span>${met ? '✅' : '⭕'} <b>${hrs.toFixed(1)}h</b> <span class="sub">/ ${f.goal}h goal</span></span>
      <span class="sub">${new Date(f.start).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
      <button class="del" data-del-fast="${f.start}">✕</button></span></li>`;
  }).join('') : '<li class="sub">No completed fasts yet.</li>';
  $$('[data-del-fast]').forEach(b => b.onclick = () => {
    db.fasts = db.fasts.filter(f => f.start !== +b.dataset.delFast);
    save(); renderHistory(); renderStreak();
  });
}
$('#past-add').onclick = () => {
  const s = new Date($('#past-start').value).getTime(), e = new Date($('#past-end').value).getTime();
  if (!s || !e || e <= s) return toast('Pick a valid start & end');
  db.fasts.push({ start: s, end: e, goal: db.settings.goal });
  $('#past-start').value = $('#past-end').value = '';
  save(); renderHistory(); renderStreak(); refreshWelcome(); toast('Past fast logged');
};

function renderStreak() {
  const days = new Set(db.fasts.filter(f => f.end).map(f => localDate(f.end)));
  let streak = 0, d = new Date();
  if (!days.has(localDate(d))) d.setDate(d.getDate() - 1); // today not over yet
  while (days.has(localDate(d))) { streak++; d.setDate(d.getDate() - 1); }
  $('#streak').textContent = `🔥 ${streak} day streak`;
}

// ---------- weight & projection ----------
// least-squares fit over (day, weight); returns {slope per day, intercept} or null
function regression(pts) {
  if (pts.length < 2) return null;
  const n = pts.length;
  const mx = pts.reduce((a, p) => a + p[0], 0) / n, my = pts.reduce((a, p) => a + p[1], 0) / n;
  let num = 0, den = 0;
  for (const [x, y] of pts) { num += (x - mx) * (y - my); den += (x - mx) ** 2; }
  if (!den) return null;
  const slope = num / den;
  return { slope, intercept: my - slope * mx };
}

function renderWeight() {
  const unit = db.settings.unit;
  $$('.unit-lbl').forEach(e => e.textContent = unit);
  const ws = [...db.weights].sort((a, b) => a.date < b.date ? -1 : 1);

  $('#w-list').innerHTML = ws.length ? [...ws].reverse().slice(0, 30).map(w =>
    `<li><span><b>${esc(w.val)}</b> ${esc(unit)}</span><span class="sub">${fmtDay(w.date)}
     <button class="del" data-del-w="${w.date}">✕</button></span></li>`).join('')
    : '<li class="sub">No entries yet.</li>';
  $$('[data-del-w]').forEach(b => b.onclick = () => {
    db.weights = db.weights.filter(w => w.date !== b.dataset.delW); save(); renderWeight();
  });

  // projection: fit a line over the last 30 weigh-ins, forecast forward from today
  const pts = ws.map(w => [dayNum(w.date), w.val]);
  const fit = regression(pts.slice(-30));
  const PROJ_DAYS = 30;
  let projPts = [];
  if (fit) {
    const at = x => fit.intercept + fit.slope * x;
    const lastX = pts[pts.length - 1][0];
    const todayX = dayNum(today());
    const anchorX = Math.max(todayX, lastX);   // don't project into the past if last entry is stale
    const endX = anchorX + PROJ_DAYS;
    // draw the dashed line from the last real point through the forecast horizon
    for (let x = lastX; x <= endX; x += Math.max(1, (endX - lastX) / 8)) projPts.push([x, at(x)]);
    projPts.push([endX, at(endX)]);
    const wkRate = fit.slope * 7;
    let txt = `Trend: <b>${wkRate >= 0 ? '+' : ''}${wkRate.toFixed(2)} ${esc(unit)}/week</b>. ` +
      `In ${PROJ_DAYS} days: <b>~${at(endX).toFixed(1)} ${esc(unit)}</b>.`;
    const goal = db.settings.goalWeight;
    if (goal && fit.slope !== 0) {
      const daysToGoal = (goal - at(anchorX)) / fit.slope;
      if (daysToGoal > 0 && daysToGoal < 3650) {
        const when = new Date(numDay(anchorX + daysToGoal) + 'T12:00')
          .toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
        txt += ` At this rate you'll hit <b>${esc(goal)} ${esc(unit)}</b> around <b>${when}</b> 🎯`;
      } else {
        txt += ` Current trend is moving away from your ${esc(goal)} ${esc(unit)} goal.`;
      }
    }
    $('#w-proj').innerHTML = txt;
  } else {
    $('#w-proj').textContent = 'Log at least 2 weights to see your trend and projection.';
  }
  $('#w-chart').innerHTML = chartSVG(pts, projPts, db.settings.goalWeight);
}

function chartSVG(pts, projPts, goal) {
  if (pts.length < 2) return '<p class="muted">Chart appears after 2+ entries.</p>';
  const W = 320, H = 170, P = 28;
  const all = [...pts, ...projPts];
  const xs = all.map(p => p[0]), ys = all.map(p => p[1]).concat(goal ? [goal] : []);
  const x0 = Math.min(...xs), x1 = Math.max(...xs);
  let y0 = Math.min(...ys), y1 = Math.max(...ys);
  const pad = (y1 - y0) * 0.1 || 1; y0 -= pad; y1 += pad;
  const X = x => P + (x - x0) / (x1 - x0) * (W - 2 * P);
  const Y = y => P + (y1 - y) / (y1 - y0) * (H - 2 * P);
  const line = ps => ps.map(p => `${X(p[0]).toFixed(1)},${Y(p[1]).toFixed(1)}`).join(' ');
  const dots = pts.slice(-60).map(p => `<circle class="dot" cx="${X(p[0]).toFixed(1)}" cy="${Y(p[1]).toFixed(1)}" r="2.5"/>`).join('');
  const goalLine = goal ? `<line x1="${P}" x2="${W - P}" y1="${Y(goal)}" y2="${Y(goal)}" stroke="var(--muted)" stroke-dasharray="2 3"/>
    <text x="${W - P}" y="${Y(goal) - 3}" text-anchor="end">goal ${goal}</text>` : '';
  const fmt = x => fmtDay(numDay(x));
  return `<svg class="chart" viewBox="0 0 ${W} ${H}">
    <line class="axis" x1="${P}" y1="${H - P}" x2="${W - P}" y2="${H - P}"/>
    <text x="${P}" y="${H - P + 12}">${fmt(x0)}</text>
    <text x="${W - P}" y="${H - P + 12}" text-anchor="end">${fmt(x1)}</text>
    <text x="${P - 4}" y="${Y(y1 - pad) + 3}" text-anchor="end">${(y1 - pad).toFixed(1)}</text>
    <text x="${P - 4}" y="${Y(y0 + pad) + 3}" text-anchor="end">${(y0 + pad).toFixed(1)}</text>
    ${goalLine}
    <polyline class="hist" points="${line(pts)}"/>
    ${projPts.length ? `<polyline class="proj" points="${line(projPts)}"/>` : ''}
    ${dots}
  </svg>`;
}

$('#w-add').onclick = () => {
  const val = parseFloat($('#w-val').value), date = $('#w-date').value || today();
  if (!val) return toast('Enter a weight');
  db.weights = db.weights.filter(w => w.date !== date); // one entry per day
  db.weights.push({ date, val });
  $('#w-val').value = '';
  save(); renderWeight(); refreshWelcome(); toast('Weight logged');
};
$('#w-goal').onchange = e => { db.settings.goalWeight = parseFloat(e.target.value) || null; save(); renderWeight(); };

// ---------- water ----------
function renderWater() {
  const ml = db.water[today()] || 0, goal = db.settings.waterGoal;
  $('#water-num').textContent = `${ml} ml`;
  $('#water-goal-lbl').textContent = `of ${goal} ml`;
  $('#water-bar').style.width = Math.min(ml / goal * 100, 100) + '%';
}
$$('[data-water]').forEach(b => b.onclick = () => {
  db.water[today()] = Math.max(0, (db.water[today()] || 0) + +b.dataset.water);
  save(); renderWater();
});

// ---------- measurements (body + blood + electrolytes) ----------
const M_TYPES = ['Waist cm', 'Chest cm', 'Hips cm', 'Thigh cm', 'Arm cm', 'Body fat %',
  'Glucose mg/dL', 'Ketones mmol/L', 'BP systolic', 'BP diastolic', 'Sodium mg', 'Potassium mg', 'Magnesium mg'];
$('#m-type').innerHTML = M_TYPES.map(t => `<option>${t}</option>`).join('');
function renderMeasurements() {
  const ms = [...db.measurements].reverse().slice(0, 20);
  $('#m-list').innerHTML = ms.length ? ms.map((m, i) =>
    `<li><span><b>${esc(m.val)}</b> <span class="sub">${esc(m.type)}</span></span>
     <span class="sub">${fmtDay(m.date)} <button class="del" data-del-m="${db.measurements.length - 1 - i}">✕</button></span></li>`).join('')
    : '<li class="sub">Nothing logged yet.</li>';
  $$('[data-del-m]').forEach(b => b.onclick = () => {
    db.measurements.splice(+b.dataset.delM, 1); save(); renderMeasurements();
  });
}
$('#m-add').onclick = () => {
  const val = parseFloat($('#m-val').value);
  if (!val) return toast('Enter a value');
  db.measurements.push({ date: today(), type: $('#m-type').value, val });
  $('#m-val').value = '';
  save(); renderMeasurements();
};

// ---------- notes ----------
function renderNotes() {
  const ns = [...db.notes].reverse().slice(0, 20);
  $('#note-list').innerHTML = ns.map(n =>
    `<li><span style="flex:1">${esc(n.text)}</span>
     <span class="sub">${fmtDay(localDate(n.ts))} <button class="del" data-del-n="${n.ts}">✕</button></span></li>`).join('');
  $$('[data-del-n]').forEach(b => b.onclick = () => {
    db.notes = db.notes.filter(n => n.ts !== +b.dataset.delN); save(); renderNotes();
  });
}
$('#note-add').onclick = () => {
  const text = $('#note-text').value.trim();
  if (!text) return;
  db.notes.push({ ts: Date.now(), text });
  $('#note-text').value = '';
  save(); renderNotes();
};

// ---------- settings / backup ----------
$('#set-unit').value = db.settings.unit;
$('#set-unit').onchange = e => { db.settings.unit = e.target.value; save(); renderWeight(); }; // ponytail: unit is a label, no conversion
$('#set-water').value = db.settings.waterGoal;
$('#set-water').onchange = e => { db.settings.waterGoal = +e.target.value || 2000; save(); renderWater(); };
$('#export-btn').onclick = () => {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' }));
  a.download = `fasttrack-backup-${today()}.json`;
  a.click();
};
$('#import-btn').onclick = () => $('#import-file').click();
// coerce an untrusted parsed backup into a known-good shape; throws if it isn't one
function sanitizeBackup(d) {
  if (!d || typeof d !== 'object' || !Array.isArray(d.fasts) || !Array.isArray(d.weights)) throw new Error('bad file');
  const num = v => { const n = +v; return Number.isFinite(n) ? n : null; };
  const s = d.settings || {};
  return {
    fasts: d.fasts.filter(f => f && num(f.start) != null).map(f => ({
      start: +f.start, end: num(f.end), goal: num(f.goal) || 16,
    })),
    weights: d.weights.filter(w => w && typeof w.date === 'string' && num(w.val) != null)
      .map(w => ({ date: w.date.slice(0, 10), val: +w.val })),
    water: (d.water && typeof d.water === 'object' && !Array.isArray(d.water)) ? Object.fromEntries(
      Object.entries(d.water).filter(([, v]) => num(v) != null).map(([k, v]) => [String(k).slice(0, 10), +v])) : {},
    measurements: Array.isArray(d.measurements) ? d.measurements.filter(m => m && num(m.val) != null)
      .map(m => ({ date: String(m.date || '').slice(0, 10), type: String(m.type || '').slice(0, 40), val: +m.val })) : [],
    notes: Array.isArray(d.notes) ? d.notes.filter(n => n && num(n.ts) != null)
      .map(n => ({ ts: +n.ts, text: String(n.text || '').slice(0, 2000) })) : [],
    settings: {
      goal: num(s.goal) || 16,
      unit: s.unit === 'lb' ? 'lb' : 'kg',
      waterGoal: num(s.waterGoal) || 2000,
      goalWeight: num(s.goalWeight),
    },
  };
}
$('#import-file').onchange = async e => {
  const prev = db;
  try {
    db = sanitizeBackup(JSON.parse(await e.target.files[0].text()));
    renderAll();              // render first: if it throws, nothing was persisted
    save();
    toast('Data imported');
  } catch {
    db = prev; renderAll();   // roll back to the previous good state
    toast('Import failed: not a FastTrack backup');
  } finally {
    e.target.value = '';      // allow re-importing the same file
  }
};

// ---------- boot ----------
const refreshWelcome = () => { $('#welcome').hidden = db.fasts.length > 0 || db.weights.length > 0; };
function renderAll() {
  refreshWelcome();
  renderPresets(); tick(); renderHistory(); renderStreak();
  $('#w-date').value = today();
  $('#w-goal').value = db.settings.goalWeight ?? '';
  renderWeight(); renderWater(); renderMeasurements(); renderNotes();
}
renderAll();
setInterval(tick, 1000);
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');

// self-check: regression on a known line must recover slope/intercept
(() => {
  const f = regression([[0, 80], [1, 79.5], [2, 79], [3, 78.5]]);
  console.assert(f && Math.abs(f.slope + 0.5) < 1e-9 && Math.abs(f.intercept - 80) < 1e-9, 'regression self-check failed', f);
})();
