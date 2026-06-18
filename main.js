/* =====================================================================
   CONFIG & DATA
   ===================================================================== */
const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL;

// Mock data as fallback (includes month/year)
const RAW_DATA = [
  { plant:"Indore",  gmp:89.6, complaints:40, rmir:21.52, rmad:3.36, training:100, unitsSold:3279891, complaintRate:12.2,  qualityScore:75.199, rating:"Good", month:"March", year:"2026" },
  { plant:"Purnia",  gmp:85.2, complaints:8,  rmir:0,     rmad:0,    training:50,  unitsSold:1331555, complaintRate:6.01,  qualityScore:65.002, rating:"Fair", month:"March", year:"2026" },
  { plant:"Kundli",  gmp:80,   complaints:0,  rmir:3,     rmad:1.5,  training:50,  unitsSold:0,       complaintRate:0,     qualityScore:61.75,  rating:"Fair", month:"March", year:"2026" },
  { plant:"UD",      gmp:67.4, complaints:4,  rmir:0,     rmad:0,    training:50,  unitsSold:769160,  complaintRate:5.2,   qualityScore:60.390, rating:"Fair", month:"March", year:"2026" },
  { plant:"Functional", gmp:85.2, complaints:0, rmir:0,   rmad:0,    training:50,  unitsSold:49320,   complaintRate:0,     qualityScore:63.8,   rating:"Fair", month:"March", year:"2026" },
  { plant:"Indore",  gmp:84.4, complaints:31, rmir:34.3, rmad:3.98, training:60, unitsSold:3867177, complaintRate:8.02, qualityScore:60.445, rating:"Fair", month:"April", year:"2026" },
  { plant:"Purnia",  gmp:81.8, complaints:14, rmir:0, rmad:0, training:100, unitsSold:1779823, complaintRate:7.87, qualityScore:77.023, rating:"Good", month:"April", year:"2026" },
  { plant:"Kundli",  gmp:85.2, complaints:0,  rmir:1.36, rmad:48.43, training:100, unitsSold:8140, complaintRate:0, qualityScore:71.185, rating:"Good", month:"April", year:"2026" },
  { plant:"UD",      gmp:59,   complaints:3,  rmir:0, rmad:0, training:50, unitsSold:815385, complaintRate:3.68, qualityScore:57.986, rating:"Poor", month:"April", year:"2026" },
  { plant:"Functional", gmp:90.7, complaints:0, rmir:0, rmad:0, training:100, unitsSold:38640, complaintRate:0, qualityScore:77.675, rating:"Good", month:"April", year:"2026" },
  { plant:"Indore",  gmp:76.2, complaints:44, rmir:28.48, rmad:1.13, training:100, unitsSold:4420132, complaintRate:9.95, qualityScore:70.232, rating:"Good", month:"May", year:"2026" },
  { plant:"Purnia",  gmp:82.4, complaints:8, rmir:0, rmad:0, training:100, unitsSold:1293468, complaintRate:6.18, qualityScore:76.837, rating:"Good", month:"May", year:"2026" },
  { plant:"Kundli",  gmp:91.2, complaints:2, rmir:27.22, rmad:7.45, training:100, unitsSold:539366, complaintRate:3.71, qualityScore:72.353, rating:"Good", month:"May", year:"2026" },
  { plant:"UD",      gmp:0, complaints:1, rmir:0, rmad:1, training:100, unitsSold:815884, complaintRate:1.23, qualityScore:55.145, rating:"Poor", month:"May", year:"2026" },
  { plant:"Functional", gmp:94.5, complaints:1, rmir:0, rmad:0, training:100, unitsSold:240129, complaintRate:4.16, qualityScore:79.458, rating:"Good", month:"May", year:"2026" }
];

const BENCHMARKS = {
  gmp:          { target:90,  weight:0.40, label:"GMP %",                    higher:true,  unit:"%" },
  complaintRate:{ target:5,   weight:0.25, label:"Complaint Rate / Mn Packs", higher:false, unit:""  },
  rmir:         { target:5,   weight:0.05, label:"RM Inward Rejection %",    higher:false, unit:"%" },
  rmad:         { target:2,   weight:0.05, label:"RM Acceptance Deviation %", higher:false, unit:"%" },
  training:     { target:100, weight:0.25, label:"Training Conducted %",     higher:true,  unit:"%" },
  qualityScore: { target:70,  weight:1,    label:"Quality Score",            higher:true,  unit:"pts" }
};

const RATING_MAP = {
  "Excellent":"excellent","Very Good":"verygood","Good":"good","Fair":"fair","Poor":"poor"
};
const RATING_EMOJI = { Excellent:"🥇", "Very Good":"🥈", Good:"🥉", Fair:"⚠️", Poor:"🚨" };

// Month ordering for correct chronological sort
const MONTH_ORDER = { January:1, February:2, March:3, April:4, May:5, June:6, July:7, August:8, September:9, October:10, November:11, December:12 };

let selectedMonth = null; // Will be set to latest month on init
let filteredData = [];

/* =====================================================================
   UTILITY
   ===================================================================== */
function getRatingClass(r) { return RATING_MAP[r] || "fair"; }
function scoreColor(s) {
  if (s >= 90) return "var(--excellent)";
  if (s >= 80) return "var(--verygood)";
  if (s >= 70) return "var(--good)";
  if (s >= 60) return "var(--fair)";
  return "var(--danger)";
}
function kpiStatus(val, target, higher) {
  if (higher) return val >= target ? "excellent" : val >= target * 0.9 ? "good" : val >= target * 0.75 ? "warn" : "bad";
  else        return val <= target ? "excellent" : val <= target * 1.5 ? "good" : val <= target * 2 ? "warn" : "bad";
}
function cellClass(status) {
  return { excellent:"cell-excellent", good:"cell-good", warn:"cell-warn", bad:"cell-bad" }[status] || "cell-warn";
}
function valClass(status) {
  return { excellent:"ok", good:"ok", warn:"warn", bad:"bad" }[status] || "warn";
}
function avg(arr, key) {
  const valid = arr.filter(r => r[key] !== undefined && r[key] !== null);
  return valid.length ? valid.reduce((s,r)=>s+r[key],0)/valid.length : 0;
}

function sortMonthsChronologically(monthYears) {
  return monthYears.sort((a, b) => {
    const [mA, yA] = a.split(' ');
    const [mB, yB] = b.split(' ');
    const yearDiff = parseInt(yA) - parseInt(yB);
    if (yearDiff !== 0) return yearDiff;
    return (MONTH_ORDER[mA] || 0) - (MONTH_ORDER[mB] || 0);
  });
}

function getAvailableMonths() {
  const monthYears = [...new Set(RAW_DATA.map(r => r.month && r.year ? `${r.month} ${r.year}` : null).filter(Boolean))];
  return sortMonthsChronologically(monthYears);
}

/* =====================================================================
   MONTH PILLS (replaces "All Time" dropdown)
   ===================================================================== */
function renderMonthPills() {
  const container = document.getElementById("month-pills");
  if (!container) return;

  const months = getAvailableMonths();
  if (months.length === 0) { container.innerHTML = '<span class="no-data">No data</span>'; return; }

  // Default to latest month if not set
  if (!selectedMonth || !months.includes(selectedMonth)) {
    selectedMonth = months[months.length - 1];
  }

  container.innerHTML = months.map(m => `
    <button class="month-pill ${m === selectedMonth ? 'active' : ''}" data-month="${m}">${m}</button>
  `).join('');

  container.querySelectorAll('.month-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedMonth = btn.dataset.month;
      container.querySelectorAll('.month-pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      applyFilters();
    });
  });
}

/* =====================================================================
   FILTERS
   ===================================================================== */
function populateFilters() {
  const plantSel = document.getElementById("filter-plant");
  const ratingSel = document.getElementById("filter-rating");

  if (plantSel) {
    const prev = plantSel.value;
    while (plantSel.options.length > 1) plantSel.remove(1);
    const plants = [...new Set(RAW_DATA.map(r => r.plant))].sort();
    plants.forEach(p => {
      const opt = document.createElement("option");
      opt.value = p; opt.textContent = p;
      plantSel.appendChild(opt);
    });
    plantSel.value = prev || "";
  }

  if (ratingSel) {
    const prev = ratingSel.value;
    while (ratingSel.options.length > 1) ratingSel.remove(1);
    const ratings = [...new Set(RAW_DATA.map(r => r.rating).filter(Boolean))];
    ["Excellent","Very Good","Good","Fair","Poor"].forEach(r => {
      if (ratings.includes(r)) {
        const opt = document.createElement("option");
        opt.value = r; opt.textContent = r;
        ratingSel.appendChild(opt);
      }
    });
    ratingSel.value = prev || "";
  }

  renderMonthPills();
}

function applyFilters() {
  const plant   = document.getElementById("filter-plant")?.value;
  const rating  = document.getElementById("filter-rating")?.value;
  const gmpMin  = parseFloat(document.getElementById("filter-gmp")?.value) || 0;
  const cmpMax  = parseFloat(document.getElementById("filter-complaint")?.value);
  const rmirMax = parseFloat(document.getElementById("filter-rmir")?.value);
  const rmadMax = parseFloat(document.getElementById("filter-rmad")?.value);
  const trainMin = parseFloat(document.getElementById("filter-training")?.value) || 0;

  filteredData = RAW_DATA.filter(r => {
    // Month filter
    if (selectedMonth && `${r.month} ${r.year}` !== selectedMonth) return false;
    if (plant && r.plant !== plant) return false;
    if (rating && r.rating !== rating) return false;
    if (r.gmp < gmpMin) return false;
    if (!isNaN(cmpMax) && r.complaintRate > cmpMax) return false;
    if (!isNaN(rmirMax) && r.rmir > rmirMax) return false;
    if (!isNaN(rmadMax) && r.rmad > rmadMax) return false;
    if (r.training < trainMin) return false;
    return true;
  });

  // Update period label
  document.getElementById("period-label").textContent = selectedMonth || "All Time";

  renderAll();
}

window.resetFilters = function() {
  document.getElementById("filter-plant").value = "";
  document.getElementById("filter-rating").value = "";
  ["filter-gmp","filter-complaint","filter-rmir","filter-rmad","filter-training"].forEach(id => document.getElementById(id).value = "");
  applyFilters();
};

/* =====================================================================
   RENDERERS
   ===================================================================== */
function renderKPIOverview() {
  const el = document.getElementById("kpi-overview");
  if (!el) return;
  const avgScore = avg(filteredData, "qualityScore");
  const avgGMP   = avg(filteredData, "gmp");
  const avgCmp   = avg(filteredData, "complaintRate");
  const avgRMIR  = avg(filteredData, "rmir");
  const avgTrain = avg(filteredData, "training");

  const tiles = [
    { label:"Avg Quality Score", value: avgScore.toFixed(1), unit:"pts", target:"Target: "+BENCHMARKS.qualityScore.target+"+",
      delta: avgScore >= BENCHMARKS.qualityScore.target ? "▲ On Track" : "▼ Below Target",
      cls: avgScore >= BENCHMARKS.qualityScore.target ? "delta-good" : "delta-bad", color: scoreColor(avgScore) },
    { label:"Avg GMP %", value: avgGMP.toFixed(1), unit:"%", target:"Target: "+BENCHMARKS.gmp.target+"%",
      delta: avgGMP >= BENCHMARKS.gmp.target ? "✓ At Target" : "▼ "+(BENCHMARKS.gmp.target-avgGMP).toFixed(1)+"% gap",
      cls: avgGMP >= BENCHMARKS.gmp.target ? "delta-good" : avgGMP >= (BENCHMARKS.gmp.target * 0.9) ? "delta-warn" : "delta-bad", color: avgGMP >= BENCHMARKS.gmp.target ? "var(--excellent)" : "var(--warn)" },
    { label:"Avg Complaint Rate", value: avgCmp.toFixed(1), unit:"/Mn", target:"Target: ≤"+BENCHMARKS.complaintRate.target,
      delta: avgCmp <= BENCHMARKS.complaintRate.target ? "✓ In Control" : "▲ "+(avgCmp-BENCHMARKS.complaintRate.target).toFixed(1)+" over",
      cls: avgCmp <= BENCHMARKS.complaintRate.target ? "delta-good" : "delta-warn", color: avgCmp <= BENCHMARKS.complaintRate.target ? "var(--excellent)" : "var(--warn)" },
    { label:"Avg RM Inward Rej %", value: avgRMIR.toFixed(1), unit:"%", target:"Target: ≤"+BENCHMARKS.rmir.target+"%",
      delta: avgRMIR <= BENCHMARKS.rmir.target ? "✓ In Control" : "▲ High",
      cls: avgRMIR <= BENCHMARKS.rmir.target ? "delta-good" : "delta-bad", color: avgRMIR <= BENCHMARKS.rmir.target ? "var(--excellent)" : "var(--danger)" },
    { label:"Avg Training %", value: avgTrain.toFixed(0), unit:"%", target:"Target: "+BENCHMARKS.training.target+"%",
      delta: avgTrain >= BENCHMARKS.training.target ? "✓ Complete" : "▼ "+(BENCHMARKS.training.target-avgTrain).toFixed(0)+"% gap",
      cls: avgTrain >= BENCHMARKS.training.target ? "delta-good" : avgTrain >= (BENCHMARKS.training.target * 0.7) ? "delta-warn" : "delta-bad", color: avgTrain >= BENCHMARKS.training.target ? "var(--excellent)" : "var(--warn)" },
  ];

  el.innerHTML = tiles.map(t => `
    <div class="kpi-tile">
      <div class="tile-label">${t.label}</div>
      <div class="tile-value" style="color:${t.color}">${t.value}<span style="font-size:13px;color:var(--muted);font-weight:400"> ${t.unit}</span></div>
      <div class="tile-target">${t.target}</div>
      <div class="tile-delta ${t.cls}">${t.delta}</div>
    </div>
  `).join('');
}

function renderRankings() {
  const sorted = [...filteredData].sort((a,b) => b.qualityScore - a.qualityScore);
  const el = document.getElementById("ranking-grid");
  if (!el) return;

  el.innerHTML = sorted.map((r, i) => {
    const rank = i + 1;
    const gmpSt  = kpiStatus(r.gmp, BENCHMARKS.gmp.target, true);
    const cmpSt  = kpiStatus(r.complaintRate, BENCHMARKS.complaintRate.target, false);
    const rmirSt = kpiStatus(r.rmir, BENCHMARKS.rmir.target, false);
    const trainSt = kpiStatus(r.training, BENCHMARKS.training.target, true);
    const pct = (r.qualityScore / 100 * 100).toFixed(0);
    const color = scoreColor(r.qualityScore);
    const rankCls = rank <= 3 ? `rank-${rank}` : 'rank-4';

    return `
    <div class="rank-card ${rankCls}">
      <div class="rank-number">${rank}</div>
      <div class="rank-badge badge-${getRatingClass(r.rating)}">${RATING_EMOJI[r.rating] || ''} ${r.rating}</div>
      <div class="plant-name">${r.plant}</div>
      <div class="quality-score" style="color:${color}">${r.qualityScore.toFixed(1)} <span>/ 100</span></div>
      <div class="gauge-wrap">
        <div class="gauge-bar">
          <div class="gauge-fill" style="width:${pct}%;background:${color}"></div>
        </div>
      </div>
      <div class="kpi-mini-grid">
        <div class="kpi-mini">
          <div class="kpi-label">GMP %</div>
          <div class="kpi-val ${valClass(gmpSt)}">${r.gmp}%</div>
        </div>
        <div class="kpi-mini">
          <div class="kpi-label">Complaint Rate</div>
          <div class="kpi-val ${valClass(cmpSt)}">${r.complaintRate.toFixed(1)}</div>
        </div>
        <div class="kpi-mini">
          <div class="kpi-label">RM Inward Rej</div>
          <div class="kpi-val ${valClass(rmirSt)}">${r.rmir}%</div>
        </div>
        <div class="kpi-mini">
          <div class="kpi-label">Training</div>
          <div class="kpi-val ${valClass(trainSt)}">${r.training}%</div>
        </div>
      </div>
    </div>`;
  }).join('');
}

function renderTargetVsActual() {
  const el = document.getElementById("target-vs-actual");
  if (!el) return;
  const kpis = [
    { key:"gmp",          label:"GMP %",                target:BENCHMARKS.gmp.target,  higher:true,  color:"#3b82f6" },
    { key:"complaintRate",label:"Complaint Rate /Mn",   target:BENCHMARKS.complaintRate.target,  higher:false, color:"#f97316" },
    { key:"rmir",         label:"RM Inward Rejection %",target:BENCHMARKS.rmir.target,   higher:false, color:"#ef4444" },
    { key:"rmad",         label:"RM Acceptance Dev %",  target:BENCHMARKS.rmad.target,   higher:false, color:"#8b5cf6" },
    { key:"training",     label:"Training %",            target:BENCHMARKS.training.target, higher:true,  color:"#10b981" },
  ];

  el.innerHTML = kpis.map(k => {
    const actualVal = avg(filteredData, k.key);
    const maxVal = Math.max(actualVal, k.target) * 1.1 || 100;
    const actualPct = Math.min(actualVal / maxVal * 100, 100);
    const targetPct = Math.min(k.target / maxVal * 100, 100);
    const onTarget = k.higher ? actualVal >= k.target : actualVal <= k.target;
    const barColor = onTarget ? k.color : "#ef4444";

    return `
    <div class="bar-row">
      <div class="bar-row-label">
        <span>${k.label}</span>
        <span class="val" style="color:${onTarget?'var(--excellent)':'var(--danger)'}">${actualVal.toFixed(1)} <span style="color:var(--muted);font-weight:400;font-size:11px">vs target ${k.target}</span></span>
      </div>
      <div class="bar-track">
        <div class="bar-actual" style="width:${actualPct}%;background:${barColor};opacity:0.85"></div>
        <div class="bar-target-marker" style="left:${targetPct}%"></div>
      </div>
    </div>`;
  }).join('');
}

function renderScoreBarChart() {
  const svg = document.getElementById("score-bar-chart");
  if (!svg) return;
  const sorted = [...filteredData].sort((a,b)=>b.qualityScore-a.qualityScore);
  if (sorted.length === 0) { svg.innerHTML = `<text x="230" y="130" fill="#64748b" font-size="12" text-anchor="middle">No data</text>`; return; }
  const W = 460, H = 260, padL = 70, padR = 20, padT = 20, padB = 30;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;
  const barW = Math.min(50, (chartW / sorted.length) - 10);
  const maxScore = 100, minScore = 50, range = maxScore - minScore;
  const scaleY = v => padT + chartH - ((v - minScore) / range) * chartH;

  let paths = '';
  [60, 70, 80, 90, 100].forEach(v => {
    const y = scaleY(v);
    paths += `<line x1="${padL}" y1="${y}" x2="${W - padR}" y2="${y}" stroke="#1f2d45" stroke-width="1"/>`;
    paths += `<text x="${padL - 8}" y="${y + 4}" fill="#64748b" font-size="10" text-anchor="end">${v}</text>`;
  });
  const ty = scaleY(70);
  paths += `<line x1="${padL}" y1="${ty}" x2="${W-padR}" y2="${ty}" stroke="#f59e0b" stroke-width="1.5" stroke-dasharray="4 3"/>`;
  paths += `<text x="${W-padR+4}" y="${ty+4}" fill="#f59e0b" font-size="9">Target</text>`;

  const step = chartW / sorted.length;
  sorted.forEach((r, i) => {
    const x = padL + i * step + (step - barW) / 2;
    const y = scaleY(r.qualityScore);
    const barH = scaleY(minScore) - y;
    const color = scoreColor(r.qualityScore);
    paths += `<rect x="${x}" y="${y}" width="${barW}" height="${barH}" rx="4" fill="${color}" opacity="0.85"/>`;
    paths += `<text x="${x + barW/2}" y="${y - 5}" fill="${color}" font-size="10" text-anchor="middle" font-weight="600">${r.qualityScore.toFixed(1)}</text>`;
    paths += `<text x="${x + barW/2}" y="${H - padB + 14}" fill="#94a3b8" font-size="10" text-anchor="middle">${r.plant}</text>`;
  });
  svg.innerHTML = paths;
}

function renderHeatmap() {
  const el = document.getElementById("heatmap-table");
  if (!el) return;
  const sorted = [...filteredData].sort((a,b)=>b.qualityScore-a.qualityScore);
  const kpis = [
    { key:"gmp",           label:"GMP %",      target:BENCHMARKS.gmp.target,  higher:true  },
    { key:"complaintRate", label:"Complaint/Mn", target:BENCHMARKS.complaintRate.target, higher:false },
    { key:"rmir",          label:"RM Inward Rej %", target:BENCHMARKS.rmir.target, higher:false },
    { key:"rmad",          label:"RM Accept Dev %", target:BENCHMARKS.rmad.target, higher:false },
    { key:"training",      label:"Training %", target:BENCHMARKS.training.target, higher:true  },
  ];

  let html = `<thead><tr>
    <th class="plant-col">Plant</th>
    <th>Quality Score</th>
    ${kpis.map(k=>`<th>${k.label}<br><span style="font-weight:400;color:var(--muted);font-size:9px">Target: ${k.target}</span></th>`).join('')}
  </tr></thead><tbody>`;

  sorted.forEach(r => {
    html += `<tr><td class="plant-name-cell">${r.plant}</td>`;
    const sc = kpiStatus(r.qualityScore, BENCHMARKS.qualityScore.target, true);
    html += `<td class="${cellClass(sc)}">${r.qualityScore.toFixed(1)}</td>`;
    kpis.forEach(k => {
      const st = kpiStatus(r[k.key], k.target, k.higher);
      const gap = k.higher
        ? (r[k.key] >= k.target ? `+${(r[k.key]-k.target).toFixed(1)}` : `${(r[k.key]-k.target).toFixed(1)}`)
        : (r[k.key] <= k.target ? `✓` : `+${(r[k.key]-k.target).toFixed(1)}`);
      html += `<td class="${cellClass(st)}" title="${k.label}: ${r[k.key]} vs target ${k.target}">${r[k.key]}<br><span style="font-size:9px;opacity:0.7">${gap}</span></td>`;
    });
    html += '</tr>';
  });
  html += '</tbody>';
  el.innerHTML = html;
}

function renderInsights() {
  const el = document.getElementById("insights-grid");
  if (!el) return;
  const sorted = [...filteredData].sort((a,b)=>b.qualityScore-a.qualityScore);
  const insights = [];

  if (sorted.length > 0) {
    const best = sorted[0];
    insights.push({ icon:"🏆", bg:"good-bg", title:`Top Performer: ${best.plant}`, text:`Leads with a Quality Score of ${best.qualityScore.toFixed(1)}, rated "${best.rating}".` });
  }

  const undertrained = filteredData.filter(r => r.training < 100);
  if (undertrained.length > 0) {
    insights.push({ icon:"📚", bg:"warn-bg", title:`Training Gap — ${undertrained.length} Plant(s)`, text:`${undertrained.map(r=>r.plant).join(', ')} need to complete training.` });
  }

  const gmpFail = filteredData.filter(r => r.gmp < 90);
  if (gmpFail.length > 0) {
    const worst = [...gmpFail].sort((a,b)=>a.gmp-b.gmp)[0];
    insights.push({ icon:"🏭", bg:"danger-bg", title:`GMP Alert: ${worst.plant}`, text:`${gmpFail.length} plant(s) below 90% target.` });
  }

  el.innerHTML = insights.map(ins => `
    <div class="insight-card">
      <div class="insight-icon ${ins.bg}">${ins.icon}</div>
      <div class="insight-body">
        <div class="insight-title">${ins.title}</div>
        <div class="insight-text">${ins.text}</div>
      </div>
    </div>`).join('');
}

function renderDataTable() {
  const el = document.getElementById("data-table");
  if (!el) return;
  const sorted = [...filteredData].sort((a,b)=>b.qualityScore-a.qualityScore);

  let html = `<thead><tr>
    <th>#</th><th>Plant</th><th>Month</th><th>Year</th><th>GMP %</th><th>Complaints</th>
    <th>Units Sold</th><th>Complaint Rate/Mn</th><th>RM Inward Rej %</th>
    <th>RM Accept Dev %</th><th>Training %</th><th>Quality Score</th><th>Rating</th>
  </tr></thead><tbody>`;

  sorted.forEach((r, i) => {
    const rc = getRatingClass(r.rating);
    const pillColors = {
      excellent:"background:rgba(16,185,129,0.15);color:#34d399",
      verygood:"background:rgba(59,130,246,0.15);color:#60a5fa",
      good:"background:rgba(245,158,11,0.15);color:#fbbf24",
      fair:"background:rgba(249,115,22,0.15);color:#fb923c",
      poor:"background:rgba(239,68,68,0.15);color:#f87171",
    };
    html += `<tr>
      <td style="color:var(--muted);font-weight:700">${i+1}</td>
      <td style="font-weight:700">${r.plant}</td>
      <td style="color:var(--muted)">${r.month || ''}</td>
      <td style="color:var(--muted)">${r.year || ''}</td>
      <td style="color:${r.gmp>=BENCHMARKS.gmp.target?'var(--excellent)':'var(--danger)'}">${r.gmp}%</td>
      <td>${r.complaints}</td>
      <td>${r.unitsSold.toLocaleString()}</td>
      <td style="color:${r.complaintRate<=BENCHMARKS.complaintRate.target?'var(--excellent)':'var(--danger)'}">${typeof r.complaintRate === 'number' ? r.complaintRate.toFixed(2) : r.complaintRate}</td>
      <td style="color:${r.rmir<=BENCHMARKS.rmir.target?'var(--excellent)':'var(--danger)'}">${r.rmir}%</td>
      <td style="color:${r.rmad<=BENCHMARKS.rmad.target?'var(--excellent)':'var(--danger)'}">${r.rmad}%</td>
      <td style="color:${r.training>=BENCHMARKS.training.target?'var(--excellent)':'var(--warn)'}">${r.training}%</td>
      <td style="font-weight:700;color:${scoreColor(r.qualityScore)}">${r.qualityScore.toFixed(2)}</td>
      <td><span class="pill" style="${pillColors[rc]}">${RATING_EMOJI[r.rating] || ''} ${r.rating}</span></td>
    </tr>`;
  });

  html += '</tbody>';
  el.innerHTML = html;
}

/* =====================================================================
   MONTHLY TREND CHART — plant-wise with multi-line support
   ===================================================================== */
const PLANT_COLORS = ["#10b981","#3b82f6","#f59e0b","#ef4444","#8b5cf6","#ec4899","#14b8a6","#f97316"];

function populateTrendPlantFilter() {
  const sel = document.getElementById("trend-plant-select");
  if (!sel) return;
  const prev = sel.value;
  while (sel.options.length > 1) sel.remove(1);
  const plants = [...new Set(RAW_DATA.map(r => r.plant))].sort();
  plants.forEach(p => {
    const opt = document.createElement("option");
    opt.value = p; opt.textContent = p;
    sel.appendChild(opt);
  });
  sel.value = prev || "";
}

function renderMonthlyTrend() {
  const svg = document.getElementById("monthly-trend-chart");
  const paramSel = document.getElementById("trend-param-select");
  const plantSel = document.getElementById("trend-plant-select");
  if (!svg || !paramSel) return;

  const W = 900, H = 320, padL = 55, padR = 160, padT = 25, padB = 50;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;

  const key = paramSel.value;
  const keyLabel = paramSel.options[paramSel.selectedIndex].text;
  const trendPlant = plantSel ? plantSel.value : "";

  // Use all RAW_DATA (ignore month filter) but respect rating filter
  const rating = document.getElementById("filter-rating")?.value;
  const trendData = RAW_DATA.filter(r => {
    if (rating && r.rating !== rating) return false;
    return true;
  });

  // Get all months sorted
  const allMonthsSet = new Set();
  trendData.forEach(r => { if (r.month && r.year) allMonthsSet.add(`${r.month} ${r.year}`); });
  const months = sortMonthsChronologically([...allMonthsSet]);

  if (months.length === 0) {
    svg.innerHTML = `<text x="${W/2}" y="${H/2}" fill="#64748b" font-size="12" text-anchor="middle">No trend data available</text>`;
    return;
  }

  // Determine which plants to show
  const plantsToShow = trendPlant
    ? [trendPlant]
    : [...new Set(trendData.map(r => r.plant))].sort();

  // Build per-plant monthly data
  const plantData = {};
  plantsToShow.forEach(p => {
    plantData[p] = {};
    months.forEach(m => { plantData[p][m] = []; });
  });
  trendData.forEach(r => {
    if (!r.month || !r.year) return;
    const my = `${r.month} ${r.year}`;
    if (plantData[r.plant] && plantData[r.plant][my]) {
      plantData[r.plant][my].push(r[key] || 0);
    }
  });

  // Calculate averages per plant per month
  const plantAvgs = {};
  let allVals = [];
  plantsToShow.forEach(p => {
    plantAvgs[p] = months.map(m => {
      const vals = plantData[p][m];
      const avg = vals.length > 0 ? vals.reduce((a,b) => a+b, 0) / vals.length : null;
      if (avg !== null) allVals.push(avg);
      return avg;
    });
  });

  if (allVals.length === 0) {
    svg.innerHTML = `<text x="${W/2}" y="${H/2}" fill="#64748b" font-size="12" text-anchor="middle">No data for selected filter</text>`;
    return;
  }

  // Dynamic scale
  const targetVal = BENCHMARKS[key] ? BENCHMARKS[key].target : 70;
  const yMin = 0;
  const yMax = Math.ceil(Math.max(Math.max(...allVals), targetVal * 1.1) / 10) * 10;
  const range = (yMax - yMin) || 100;
  const scaleY = v => padT + chartH - ((v - yMin) / range) * chartH;
  
  // Distribute groups within chartW, leaving margins on ends
  const stepX = months.length > 0 ? chartW / months.length : chartW;
  const getX = i => padL + (stepX / 2) + i * stepX;

  let paths = '';

  // Grid lines
  const gridCount = 5;
  for (let i = 0; i <= gridCount; i++) {
    const v = yMin + (range / gridCount) * i;
    const y = scaleY(v);
    paths += `<line x1="${padL}" y1="${y}" x2="${padL + chartW}" y2="${y}" stroke="#1f2d45" stroke-width="1"/>`;
    paths += `<text x="${padL - 8}" y="${y + 4}" fill="#64748b" font-size="10" text-anchor="end">${Math.round(v)}</text>`;
  }

  // Target line
  const ty = scaleY(targetVal);
  paths += `<line x1="${padL}" y1="${ty}" x2="${padL + chartW}" y2="${ty}" stroke="#f59e0b" stroke-width="1.5" stroke-dasharray="5 3"/>`;
  paths += `<text x="${padL + chartW + 6}" y="${ty + 4}" fill="#f59e0b" font-size="9">Target ${targetVal}</text>`;

  const numPlants = plantsToShow.length;
  // Calculate group width (max 70% of step, cap at 40px per plant)
  const groupWidth = Math.min(stepX * 0.7, numPlants * 40); 
  const barGap = numPlants > 1 ? 2 : 0;
  const barW = Math.max(2, (groupWidth / numPlants) - barGap);

  // Draw bars for each month
  months.forEach((m, i) => {
    const xBase = getX(i);
    const groupStartX = xBase - (groupWidth / 2);

    plantsToShow.forEach((plant, pi) => {
      const val = plantAvgs[plant][i];
      if (val === null) return;

      const color = PLANT_COLORS[pi % PLANT_COLORS.length];
      const x = groupStartX + pi * (barW + barGap);
      const y = scaleY(val);
      const yBase = scaleY(yMin);
      const barH = Math.max(0, yBase - y);

      const isSelected = m === selectedMonth;
      const opacity = isSelected ? 1 : 0.85;

      paths += `<rect x="${x}" y="${y}" width="${barW}" height="${barH}" rx="3" fill="${color}" opacity="${opacity}"/>`;

      // Show labels only in single-plant mode or if few plants
      if (plantsToShow.length <= 3) {
        paths += `<text x="${x + barW/2}" y="${y - 6}" fill="${color}" font-size="9" text-anchor="middle" font-weight="700">${val.toFixed(1)}</text>`;
      }
    });
  });

  // X-axis month labels
  months.forEach((m, i) => {
    const x = getX(i);
    const isSelected = m === selectedMonth;
    paths += `<text x="${x}" y="${H - padB + 18}" fill="${isSelected ? '#f59e0b' : '#94a3b8'}" font-size="10" text-anchor="middle" font-weight="${isSelected ? '700' : '400'}">${m.split(' ')[0]}</text>`;
    paths += `<text x="${x}" y="${H - padB + 30}" fill="#64748b" font-size="8" text-anchor="middle">${m.split(' ')[1]}</text>`;
  });

  // Legend (right side)
  const legendX = padL + chartW + 20;
  let legendY = padT + 20;
  paths += `<text x="${legendX}" y="${legendY}" fill="#94a3b8" font-size="9" font-weight="700" text-transform="uppercase">${keyLabel}</text>`;
  legendY += 18;
  plantsToShow.forEach((p, pi) => {
    const color = PLANT_COLORS[pi % PLANT_COLORS.length];
    paths += `<line x1="${legendX}" y1="${legendY - 4}" x2="${legendX + 18}" y2="${legendY - 4}" stroke="${color}" stroke-width="3" stroke-linecap="round"/>`;
    paths += `<circle cx="${legendX + 9}" cy="${legendY - 4}" r="3" fill="${color}"/>`;
    paths += `<text x="${legendX + 24}" y="${legendY}" fill="#e2e8f0" font-size="11">${p}</text>`;
    legendY += 20;
  });

  svg.innerHTML = paths;
}

/* =====================================================================
   PARAMETER COMPARISON BAR CHART
   ===================================================================== */
function renderParameterComparison() {
  const svg = document.getElementById("parameter-compare-chart");
  const sel = document.getElementById("param-compare-select");
  if (!svg || !sel) return;

  const key = sel.value;
  const W = 520, H = 280, padL = 50, padR = 20, padT = 20, padB = 45;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;

  const plantGroups = {};
  filteredData.forEach(r => {
    if (!plantGroups[r.plant]) plantGroups[r.plant] = [];
    plantGroups[r.plant].push(r[key] || 0);
  });

  const plants = Object.keys(plantGroups).sort();
  if (plants.length === 0) { svg.innerHTML = `<text x="${W/2}" y="${H/2}" fill="#64748b" font-size="12" text-anchor="middle">No data</text>`; return; }

  const avgVals = plants.map(p => plantGroups[p].reduce((a,b)=>a+b,0)/plantGroups[p].length);
  const targetVal = BENCHMARKS[key] ? BENCHMARKS[key].target : null;
  const maxVal = Math.max(...avgVals, targetVal || 0) * 1.15 || 100;
  const scaleY = v => padT + chartH - (v / maxVal) * chartH;

  const barW = Math.min(45, (chartW / plants.length) - 12);
  const stepX = chartW / plants.length;

  let paths = '';

  // Grid
  for (let i = 0; i <= 4; i++) {
    const v = (maxVal / 4) * i;
    const y = scaleY(v);
    paths += `<line x1="${padL}" y1="${y}" x2="${W - padR}" y2="${y}" stroke="#1f2d45" stroke-width="1"/>`;
    paths += `<text x="${padL - 8}" y="${y + 4}" fill="#64748b" font-size="10" text-anchor="end">${Math.round(v)}</text>`;
  }

  // Target line
  if (targetVal) {
    const ty = scaleY(targetVal);
    paths += `<line x1="${padL}" y1="${ty}" x2="${W-padR}" y2="${ty}" stroke="#f59e0b" stroke-width="1.5" stroke-dasharray="5 3"/>`;
    paths += `<text x="${W-padR+4}" y="${ty+4}" fill="#f59e0b" font-size="9">T:${targetVal}</text>`;
  }

  // Bars
  const barColors = ["#3b82f6","#8b5cf6","#10b981","#f97316","#ef4444","#ec4899","#14b8a6"];
  plants.forEach((p, i) => {
    const x = padL + i * stepX + (stepX - barW) / 2;
    const y = scaleY(avgVals[i]);
    const barH = scaleY(0) - y;

    let color = barColors[i % barColors.length];
    if (BENCHMARKS[key]) {
      const isGood = BENCHMARKS[key].higher ? avgVals[i] >= BENCHMARKS[key].target : avgVals[i] <= BENCHMARKS[key].target;
      color = isGood ? "#10b981" : "#ef4444";
    }

    paths += `<rect x="${x}" y="${y}" width="${barW}" height="${barH}" rx="5" fill="${color}" opacity="0.85"/>`;
    paths += `<text x="${x + barW/2}" y="${y - 6}" fill="${color}" font-size="10" text-anchor="middle" font-weight="700">${avgVals[i].toFixed(1)}</text>`;
    paths += `<text x="${x + barW/2}" y="${H - padB + 18}" fill="#94a3b8" font-size="10" text-anchor="middle">${p}</text>`;
  });

  svg.innerHTML = paths;
}


function renderAll() {
  renderKPIOverview();
  renderRankings();
  renderTargetVsActual();
  renderScoreBarChart();
  renderHeatmap();
  renderInsights();
  renderDataTable();
  renderMonthlyTrend();
  renderParameterComparison();
  document.getElementById("refresh-time").textContent = new Date().toLocaleTimeString();
}

/* =====================================================================
   DATA FETCHING
   ===================================================================== */
async function fetchFromSheet() {
  if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL === 'YOUR_APPS_SCRIPT_WEB_APP_URL') {
    console.warn('No Apps Script URL configured. Using mock data.');
    return;
  }

  console.log('[Dashboard] Fetching data from:', APPS_SCRIPT_URL);

  try {
    // Google Apps Script does a 302 redirect. We must follow it.
    // Adding a cache buster to ensure we get fresh data every time.
    const cacheBusterUrl = APPS_SCRIPT_URL + (APPS_SCRIPT_URL.includes('?') ? '&' : '?') + 't=' + Date.now();
    const response = await fetch(cacheBusterUrl, {
      method: 'GET',
      redirect: 'follow',
      cache: 'no-store',
      headers: { 
        'Accept': 'application/json',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });

    console.log('[Dashboard] Response status:', response.status, response.ok);

    if (!response.ok) {
      console.error('[Dashboard] HTTP error:', response.status, response.statusText);
      return;
    }

    const text = await response.text();
    console.log('[Dashboard] Response length:', text.length);

    let json;
    try {
      json = JSON.parse(text);
    } catch (parseErr) {
      console.error('[Dashboard] JSON parse error:', parseErr, 'Raw:', text.substring(0, 200));
      return;
    }

    console.log('[Dashboard] Parsed JSON keys:', Object.keys(json));

    // The API returns { status, data, benchmarks, ratings }
    const dataArr = json.data;
    const benchArr = json.benchmarks;
    
    // Update BENCHMARKS dynamically
    if (benchArr && Array.isArray(benchArr)) {
      benchArr.forEach(b => {
        let key = null;
        const kpi = String(b.kpi).toLowerCase();
        if (kpi.includes("gmp")) key = "gmp";
        else if (kpi.includes("complaint rate") || kpi.includes("complaint")) key = "complaintRate";
        else if (kpi.includes("inward") || kpi.includes("rmir")) key = "rmir";
        else if (kpi.includes("acceptance") || kpi.includes("deviation") || kpi.includes("rmad")) key = "rmad";
        else if (kpi.includes("training")) key = "training";
        
        if (key && BENCHMARKS[key]) {
           BENCHMARKS[key].target = parseFloat(b.target) || BENCHMARKS[key].target;
           const w = parseFloat(b.weightage) || 0;
           BENCHMARKS[key].weight = (w > 1) ? w / 100 : w;
        }
      });
    }

    if (dataArr && Array.isArray(dataArr) && dataArr.length > 0) {
      console.log('[Dashboard] Loaded', dataArr.length, 'records.');

      // Normalize data - ensure all expected fields exist
      const normalized = dataArr.map(d => {
        const row = {
          plant:         String(d.plant || '').trim(),
          gmp:           parseFloat(d.gmp) || 0,
          complaints:    parseInt(d.complaints) || 0,
          rmir:          parseFloat(d.rmir) || 0,
          rmad:          parseFloat(d.rmad) || 0,
          training:      parseFloat(d.training) || 0,
          unitsSold:     parseInt(d.unitsSold) || 0,
          complaintRate: parseFloat(d.complaintRate) || 0,
          month:         String(d.month || '').trim(),
          year:          String(d.year || '').trim()
        };

        // Recalculate Quality Score dynamically based on hardcoded BENCHMARKS parameters
        let qs = 0;
        ["gmp", "complaintRate", "rmir", "rmad", "training"].forEach(k => {
          const b = BENCHMARKS[k];
          const val = row[k];
          let kpiScore = 0;
          if (b.higher) {
            kpiScore = (b.target > 0) ? (val / b.target) * 100 : 0;
          } else {
            if (val <= b.target) kpiScore = 100;
            else kpiScore = (b.target / val) * 100;
          }
          if (kpiScore > 100) kpiScore = 100;
          if (kpiScore < 0) kpiScore = 0;
          qs += (kpiScore * b.weight);
        });
        
        row.qualityScore = qs;

        // Recalculate Rating based on new QS
        if (qs >= 90) row.rating = "Excellent";
        else if (qs >= 80) row.rating = "Very Good";
        else if (qs >= 70) row.rating = "Good";
        else if (qs >= 60) row.rating = "Fair";
        else row.rating = "Poor";

        return row;
      }).filter(d => d.plant.length > 0);

      console.log('[Dashboard] Normalized', normalized.length, 'records');
      console.log('[Dashboard] Months found:', [...new Set(normalized.map(r => `${r.month} ${r.year}`))]);

      RAW_DATA.length = 0;
      normalized.forEach(d => RAW_DATA.push(d));
      
      // Reset selectedMonth so it gets re-detected as latest
      selectedMonth = null;
      populateFilters();
      populateTrendPlantFilter();
      applyFilters();
    } else {
      console.warn('[Dashboard] No data array in response or empty. Keys:', Object.keys(json), 'data:', typeof dataArr);
    }
  } catch(e) {
    console.error('[Dashboard] Fetch error:', e.message || e);
  }
}

/* =====================================================================
   INIT
   ===================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  ["filter-plant","filter-rating","filter-gmp","filter-complaint","filter-rmir","filter-rmad","filter-training"].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener("change", applyFilters);
      el.addEventListener("input", applyFilters);
    }
  });

  const trendParam = document.getElementById("trend-param-select");
  if (trendParam) {
    trendParam.addEventListener("change", () => { renderMonthlyTrend(); });
  }

  const trendPlant = document.getElementById("trend-plant-select");
  if (trendPlant) {
    trendPlant.addEventListener("change", () => { renderMonthlyTrend(); });
  }

  const paramCompare = document.getElementById("param-compare-select");
  if (paramCompare) {
    paramCompare.addEventListener("change", () => { renderParameterComparison(); });
  }


  populateFilters();
  populateTrendPlantFilter();
  applyFilters();
  fetchFromSheet();

  // Auto-refresh every 60 seconds
  setInterval(fetchFromSheet, 60000);
});
