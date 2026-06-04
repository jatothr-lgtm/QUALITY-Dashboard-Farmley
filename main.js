/* =====================================================================
   CONFIG & DATA
   ===================================================================== */
const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL;

// Mock data as fallback
const RAW_DATA = [
  { plant:"Indore",  gmp:89.6, complaints:40, rmir:21.52, rmad:3.36, training:100, unitsSold:3279891, complaintRate:12.2,  qualityScore:75.199, rating:"Good", month:"March", year:"2026" },
  { plant:"Purnia",  gmp:85.2, complaints:8,  rmir:0,     rmad:0,    training:50,  unitsSold:1331555, complaintRate:6.01,  qualityScore:65.002, rating:"Fair", month:"March", year:"2026" },
  { plant:"Kundli",  gmp:80,   complaints:0,  rmir:3,     rmad:1.5,  training:50,  unitsSold:0,       complaintRate:0,     qualityScore:61.75,  rating:"Fair", month:"March", year:"2026" },
  { plant:"UD",      gmp:67.4, complaints:4,  rmir:0,     rmad:0,    training:50,  unitsSold:769160,  complaintRate:5.2,   qualityScore:60.390, rating:"Fair", month:"March", year:"2026" },
  { plant:"Functional", gmp:85.2, complaints:0, rmir:0,   rmad:0,    training:50,  unitsSold:49320,   complaintRate:0,     qualityScore:63.8,   rating:"Fair", month:"March", year:"2026" },
  { plant:"Indore",  gmp:84.4, complaints:31, rmir:34.3, rmad:3.98, training:60, unitsSold:3867177, complaintRate:8.02, qualityScore:60.445, rating:"Fair", month:"April", year:"2026" },
  { plant:"Purnia",  gmp:81.8, complaints:14, rmir:0, rmad:0, training:100, unitsSold:1779823, complaintRate:7.87, qualityScore:77.023, rating:"Good", month:"April", year:"2026" },
  { plant:"Indore",  gmp:76.2, complaints:44, rmir:28.48, rmad:1.13, training:100, unitsSold:4420132, complaintRate:9.95, qualityScore:60.445, rating:"Fair", month:"May", year:"2026" }
];

const BENCHMARKS = {
  gmp:        { target:90,  weight:0.25, label:"GMP %",                    higher:true,  unit:"%" },
  complaintRate:{ target:15, weight:0.20, label:"Complaint Rate / Mn Packs", higher:false, unit:"" },
  rmir:       { target:5,   weight:0.20, label:"RM Inward Rejection %",    higher:false, unit:"%" },
  rmad:       { target:2,   weight:0.10, label:"RM Acceptance Deviation %", higher:false, unit:"%" },
  training:   { target:100, weight:0.25, label:"Training Conducted %",     higher:true,  unit:"%" },
};

const RATING_MAP = {
  "Excellent":"excellent","Very Good":"verygood","Good":"good","Fair":"fair","Poor":"poor"
};
const RATING_EMOJI = { Excellent:"🥇", "Very Good":"🥈", Good:"🥉", Fair:"⚠️", Poor:"🚨" };

let filteredData = [...RAW_DATA];

/* =====================================================================
   UTILITY
   ===================================================================== */
function getRatingClass(r) { return RATING_MAP[r] || "fair"; }
function getRatingColor(r) {
  const m = { Excellent:"var(--excellent)", "Very Good":"var(--verygood)", Good:"var(--good)", Fair:"var(--fair)", Poor:"var(--poor)" };
  return m[r] || "var(--fair)";
}
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
  const valid = arr.filter(r => r[key] !== undefined);
  return valid.length ? valid.reduce((s,r)=>s+r[key],0)/valid.length : 0;
}

/* =====================================================================
   FILTERS
   ===================================================================== */
function populateFilters() {
  const plantSel = document.getElementById("filter-plant");
  const monthSel = document.getElementById("filter-month");

  if (plantSel) {
    while (plantSel.options.length > 1) plantSel.remove(1);
    const plants = [...new Set(RAW_DATA.map(r => r.plant))].sort();
    plants.forEach(p => {
      const opt = document.createElement("option");
      opt.value = p; opt.textContent = p;
      plantSel.appendChild(opt);
    });
  }

  if (monthSel) {
    while (monthSel.options.length > 1) monthSel.remove(1);
    const monthYears = [...new Set(RAW_DATA.map(r => r.month && r.year ? `${r.month} ${r.year}` : null).filter(Boolean))];
    
    // Sort months simply based on their appearance or parse them if needed, here just basic string sort or keeping order
    monthYears.forEach(my => {
      const opt = document.createElement("option");
      opt.value = my; opt.textContent = my;
      monthSel.appendChild(opt);
    });
  }
}

function applyFilters() {
  const plant    = document.getElementById("filter-plant")?.value;
  const monthYr  = document.getElementById("filter-month")?.value;
  const gmpMin   = parseFloat(document.getElementById("filter-gmp")?.value) || 0;
  const cmpMax   = parseFloat(document.getElementById("filter-complaint")?.value);
  const rmirMax  = parseFloat(document.getElementById("filter-rmir")?.value);
  const rmadMax  = parseFloat(document.getElementById("filter-rmad")?.value);
  const trainMin = parseFloat(document.getElementById("filter-training")?.value) || 0;

  filteredData = RAW_DATA.filter(r => {
    if (plant && r.plant !== plant) return false;
    if (monthYr && `${r.month} ${r.year}` !== monthYr) return false;
    if (r.gmp < gmpMin) return false;
    if (!isNaN(cmpMax) && r.complaintRate > cmpMax) return false;
    if (!isNaN(rmirMax) && r.rmir > rmirMax) return false;
    if (!isNaN(rmadMax) && r.rmad > rmadMax) return false;
    if (r.training < trainMin) return false;
    return true;
  });
  renderAll();
}

window.resetFilters = function() {
  document.getElementById("filter-plant").value = "";
  document.getElementById("filter-month").value = "";
  ["filter-gmp","filter-complaint","filter-rmir","filter-rmad","filter-training"].forEach(id => document.getElementById(id).value = "");
  filteredData = [...RAW_DATA];
  renderAll();
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
    { label:"Avg Quality Score", value: avgScore.toFixed(1), unit:"pts", target:"Target: 70+",
      delta: avgScore >= 70 ? "▲ On Track" : "▼ Below Target",
      cls: avgScore >= 70 ? "delta-good" : "delta-bad", color: scoreColor(avgScore) },
    { label:"Avg GMP %", value: avgGMP.toFixed(1), unit:"%", target:"Target: 90%",
      delta: avgGMP >= 90 ? "✓ At Target" : `▼ ${(90-avgGMP).toFixed(1)}% gap`,
      cls: avgGMP >= 90 ? "delta-good" : avgGMP >= 80 ? "delta-warn" : "delta-bad", color: avgGMP >= 90 ? "var(--excellent)" : "var(--warn)" },
    { label:"Avg Complaint Rate", value: avgCmp.toFixed(1), unit:"/Mn", target:"Target: ≤15",
      delta: avgCmp <= 15 ? "✓ In Control" : `▲ ${(avgCmp-15).toFixed(1)} over`,
      cls: avgCmp <= 15 ? "delta-good" : "delta-warn", color: avgCmp <= 15 ? "var(--excellent)" : "var(--warn)" },
    { label:"Avg RM Inward Rej %", value: avg(filteredData,"rmir").toFixed(1), unit:"%", target:"Target: ≤5%",
      delta: avg(filteredData,"rmir") <= 5 ? "✓ In Control" : "▲ High",
      cls: avg(filteredData,"rmir") <= 5 ? "delta-good" : "delta-bad", color: avg(filteredData,"rmir") <= 5 ? "var(--excellent)" : "var(--danger)" },
    { label:"Avg Training %", value: avgTrain.toFixed(0), unit:"%", target:"Target: 100%",
      delta: avgTrain === 100 ? "✓ Complete" : `▼ ${(100-avgTrain).toFixed(0)}% gap`,
      cls: avgTrain === 100 ? "delta-good" : avgTrain >= 70 ? "delta-warn" : "delta-bad", color: avgTrain === 100 ? "var(--excellent)" : "var(--warn)" },
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
    const gmpSt  = kpiStatus(r.gmp, 90, true);
    const cmpSt  = kpiStatus(r.complaintRate, 15, false);
    const rmirSt = kpiStatus(r.rmir, 5, false);
    const trainSt = kpiStatus(r.training, 100, true);
    const pct = (r.qualityScore / 100 * 100).toFixed(0);
    const color = scoreColor(r.qualityScore);
    const rankCls = rank <= 3 ? `rank-${rank}` : 'rank-4';

    return `
    <div class="rank-card ${rankCls}">
      <div class="rank-number">${rank}</div>
      <div class="rank-badge badge-${getRatingClass(r.rating)}">${RATING_EMOJI[r.rating] || ''} ${r.rating}</div>
      <div class="plant-name">${r.plant} <span style="font-size:11px;color:var(--muted);font-weight:normal">${r.month?r.month:''}</span></div>
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
          <div class="kpi-val ${valClass(cmpSt)}">${r.complaintRate}</div>
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
    { key:"gmp",          label:"GMP %",                target:90,  higher:true,  color:"#3b82f6" },
    { key:"complaintRate",label:"Complaint Rate /Mn",   target:15,  higher:false, color:"#f97316" },
    { key:"rmir",         label:"RM Inward Rejection %",target:5,   higher:false, color:"#ef4444" },
    { key:"rmad",         label:"RM Acceptance Dev %",  target:2,   higher:false, color:"#8b5cf6" },
    { key:"training",     label:"Training %",            target:100, higher:true,  color:"#10b981" },
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
  const W = 460, H = 260, padL = 70, padR = 20, padT = 20, padB = 30;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;
  const barW = Math.min(50, (chartW / sorted.length) - 10);

  const maxScore = 100;
  const minScore = 50;
  const range = maxScore - minScore;
  const scaleY = v => padT + chartH - ((v - minScore) / range) * chartH;

  let paths = '';

  // Grid lines
  [60, 70, 80, 90, 100].forEach(v => {
    const y = scaleY(v);
    paths += `<line x1="${padL}" y1="${y}" x2="${W - padR}" y2="${y}" stroke="#1f2d45" stroke-width="1"/>`;
    paths += `<text x="${padL - 8}" y="${y + 4}" fill="#64748b" font-size="10" text-anchor="end">${v}</text>`;
  });

  // Target line at 70
  const ty = scaleY(70);
  paths += `<line x1="${padL}" y1="${ty}" x2="${W-padR}" y2="${ty}" stroke="#f59e0b" stroke-width="1.5" stroke-dasharray="4 3"/>`;
  paths += `<text x="${W-padR+4}" y="${ty+4}" fill="#f59e0b" font-size="9">Target</text>`;

  // Bars
  const step = chartW / sorted.length;
  sorted.forEach((r, i) => {
    const x = padL + i * step + (step - barW) / 2;
    const y = scaleY(r.qualityScore);
    const barH = scaleY(minScore) - y;
    const color = scoreColor(r.qualityScore);
    paths += `<rect x="${x}" y="${y}" width="${barW}" height="${barH}" rx="4" fill="${color}" opacity="0.85"/>`;
    paths += `<text x="${x + barW/2}" y="${y - 5}" fill="${color}" font-size="10" text-anchor="middle" font-weight="600">${r.qualityScore.toFixed(1)}</text>`;
    const labelY = H - padB + 14;
    paths += `<text x="${x + barW/2}" y="${labelY}" fill="#94a3b8" font-size="10" text-anchor="middle">${r.plant}</text>`;
  });

  svg.innerHTML = paths;
}

function renderHeatmap() {
  const el = document.getElementById("heatmap-table");
  if (!el) return;
  const sorted = [...filteredData].sort((a,b)=>b.qualityScore-a.qualityScore);
  const kpis = [
    { key:"gmp",           label:"GMP %",      target:90,  higher:true  },
    { key:"complaintRate", label:"Complaint/Mn", target:15, higher:false },
    { key:"rmir",          label:"RM Inward Rej %", target:5, higher:false },
    { key:"rmad",          label:"RM Accept Dev %", target:2, higher:false },
    { key:"training",      label:"Training %", target:100, higher:true  },
  ];

  let html = `<thead><tr>
    <th class="plant-col">Plant</th>
    <th>Quality Score</th>
    ${kpis.map(k=>`<th>${k.label}<br><span style="font-weight:400;color:var(--muted);font-size:9px">Target: ${k.target}</span></th>`).join('')}
  </tr></thead><tbody>`;

  sorted.forEach(r => {
    html += `<tr><td class="plant-name-cell">${r.plant} <span style="font-size:9px;color:var(--muted);font-weight:normal"><br>${r.month?r.month:''}</span></td>`;
    const sc = kpiStatus(r.qualityScore, 70, true);
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
    const worst = gmpFail.sort((a,b)=>a.gmp-b.gmp)[0];
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
    <th>#</th><th>Plant</th><th>Month</th><th>GMP %</th><th>Complaints</th>
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
      <td style="color:${r.gmp>=90?'var(--excellent)':'var(--danger)'}">${r.gmp}%</td>
      <td>${r.complaints}</td>
      <td>${r.unitsSold.toLocaleString()}</td>
      <td style="color:${r.complaintRate<=15?'var(--excellent)':'var(--danger)'}">${r.complaintRate}</td>
      <td style="color:${r.rmir<=5?'var(--excellent)':'var(--danger)'}">${r.rmir}%</td>
      <td style="color:${r.rmad<=2?'var(--excellent)':'var(--danger)'}">${r.rmad}%</td>
      <td style="color:${r.training===100?'var(--excellent)':'var(--warn)'}">${r.training}%</td>
      <td style="font-weight:700;color:${scoreColor(r.qualityScore)}">${r.qualityScore.toFixed(2)}</td>
      <td><span class="pill" style="${pillColors[rc]}">${RATING_EMOJI[r.rating] || ''} ${r.rating}</span></td>
    </tr>`;
  });

  html += '</tbody>';
  el.innerHTML = html;
}

function renderMonthlyTrend() {
  const svg = document.getElementById("monthly-trend-chart");
  if (!svg) return;
  const W = 460, H = 260, padL = 40, padR = 20, padT = 20, padB = 40;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;

  // Group filteredData by month-year
  const monthGroups = {};
  filteredData.forEach(r => {
    if(!r.month || !r.year) return;
    const my = `${r.month} ${r.year}`;
    if(!monthGroups[my]) monthGroups[my] = [];
    monthGroups[my].push(r.qualityScore);
  });

  const months = Object.keys(monthGroups);
  if (months.length === 0) {
    svg.innerHTML = `<text x="${W/2}" y="${H/2}" fill="#64748b" font-size="12" text-anchor="middle">No month data available</text>`;
    return;
  }

  const avgScores = months.map(m => monthGroups[m].reduce((a,b)=>a+b,0)/monthGroups[m].length);
  
  const minScore = 50, maxScore = 100, range = maxScore - minScore;
  const scaleY = v => padT + chartH - ((v - minScore) / range) * chartH;
  const stepX = months.length > 1 ? chartW / (months.length - 1) : chartW / 2;

  let paths = '';

  // Grid lines
  [60, 70, 80, 90, 100].forEach(v => {
    const y = scaleY(v);
    paths += `<line x1="${padL}" y1="${y}" x2="${W - padR}" y2="${y}" stroke="#1f2d45" stroke-width="1"/>`;
    paths += `<text x="${padL - 8}" y="${y + 4}" fill="#64748b" font-size="10" text-anchor="end">${v}</text>`;
  });

  // Target line
  const ty = scaleY(70);
  paths += `<line x1="${padL}" y1="${ty}" x2="${W-padR}" y2="${ty}" stroke="#f59e0b" stroke-width="1.5" stroke-dasharray="4 3"/>`;

  // Draw Line
  let d = '';
  months.forEach((m, i) => {
    const x = months.length > 1 ? padL + i * stepX : padL + stepX;
    const y = scaleY(avgScores[i]);
    d += (i === 0 ? 'M' : 'L') + ` ${x} ${y} `;
  });

  if(months.length > 0 && d) {
    paths += `<path d="${d}" fill="none" stroke="var(--excellent)" stroke-width="3"/>`;
  }

  // Draw points and labels
  months.forEach((m, i) => {
    const x = months.length > 1 ? padL + i * stepX : padL + stepX;
    const y = scaleY(avgScores[i]);
    paths += `<circle cx="${x}" cy="${y}" r="5" fill="var(--surface)" stroke="var(--excellent)" stroke-width="2"/>`;
    paths += `<text x="${x}" y="${y - 12}" fill="#f1f5f9" font-size="11" text-anchor="middle" font-weight="600">${avgScores[i].toFixed(1)}</text>`;
    paths += `<text x="${x}" y="${H - padB + 20}" fill="#94a3b8" font-size="10" text-anchor="middle">${m.split(' ')[0]}</text>`;
  });

  svg.innerHTML = paths;
}

function renderParameterComparison() {
  const svg = document.getElementById("parameter-compare-chart");
  const sel = document.getElementById("param-compare-select");
  if (!svg || !sel) return;

  const key = sel.value;
  const W = 460, H = 260, padL = 40, padR = 20, padT = 20, padB = 40;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;

  // We will compare plants. If "All Time" is selected, average across months.
  const plantGroups = {};
  filteredData.forEach(r => {
    if(!plantGroups[r.plant]) plantGroups[r.plant] = [];
    plantGroups[r.plant].push(r[key]);
  });

  const plants = Object.keys(plantGroups).sort();
  if (plants.length === 0) return;

  const avgVals = plants.map(p => plantGroups[p].reduce((a,b)=>a+b,0)/plantGroups[p].length);
  const maxVal = Math.max(...avgVals, BENCHMARKS[key]?.target || 0) * 1.1 || 100;
  const range = maxVal;
  const scaleY = v => padT + chartH - (v / range) * chartH;
  
  const barW = Math.min(40, (chartW / plants.length) - 10);
  const stepX = chartW / plants.length;

  let paths = '';

  // Grid
  [0, maxVal/2, maxVal].forEach(v => {
    const y = scaleY(v);
    paths += `<line x1="${padL}" y1="${y}" x2="${W - padR}" y2="${y}" stroke="#1f2d45" stroke-width="1"/>`;
    paths += `<text x="${padL - 8}" y="${y + 4}" fill="#64748b" font-size="10" text-anchor="end">${Math.round(v)}</text>`;
  });

  // Target
  if (BENCHMARKS[key]) {
    const ty = scaleY(BENCHMARKS[key].target);
    paths += `<line x1="${padL}" y1="${ty}" x2="${W-padR}" y2="${ty}" stroke="#f59e0b" stroke-width="1.5" stroke-dasharray="4 3"/>`;
  }

  plants.forEach((p, i) => {
    const x = padL + i * stepX + (stepX - barW) / 2;
    const y = scaleY(avgVals[i]);
    const barH = scaleY(0) - y;
    
    // Determine color based on target
    let color = "var(--accent2)";
    if(BENCHMARKS[key]) {
      const isGood = BENCHMARKS[key].higher ? avgVals[i] >= BENCHMARKS[key].target : avgVals[i] <= BENCHMARKS[key].target;
      color = isGood ? "var(--excellent)" : "var(--danger)";
    }

    paths += `<rect x="${x}" y="${y}" width="${barW}" height="${barH}" rx="4" fill="${color}" opacity="0.85"/>`;
    paths += `<text x="${x + barW/2}" y="${y - 5}" fill="${color}" font-size="10" text-anchor="middle" font-weight="600">${avgVals[i].toFixed(1)}</text>`;
    paths += `<text x="${x + barW/2}" y="${H - padB + 20}" fill="#94a3b8" font-size="9" text-anchor="middle" transform="rotate(-30 ${x + barW/2},${H - padB + 20})">${p}</text>`;
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
    console.warn('No Apps Script URL provided. Using mock data.');
    return;
  }

  try {
    const response = await fetch(`${APPS_SCRIPT_URL}?action=getData`);
    const json = await response.json();
    if (json.data) {
      // Update RAW_DATA array
      RAW_DATA.length = 0;
      json.data.forEach(d => RAW_DATA.push(d));
      filteredData = [...RAW_DATA];
      populateFilters();
      renderAll();
    }
  } catch(e) {
    console.error('Failed to fetch sheet data:', e);
  }
}

/* =====================================================================
   INIT
   ===================================================================== */
document.addEventListener('DOMContentLoaded', () => {
  ["filter-plant","filter-month","filter-gmp","filter-complaint","filter-rmir","filter-rmad","filter-training"].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener("change", applyFilters);
      el.addEventListener("input", applyFilters);
    }
  });

  const paramCompare = document.getElementById("param-compare-select");
  if(paramCompare) {
    paramCompare.addEventListener("change", renderParameterComparison);
  }

  populateFilters();
  renderAll();
  fetchFromSheet();
  
  // Auto-refresh data every 60 seconds to keep dashboard live
  setInterval(fetchFromSheet, 60000);
});
