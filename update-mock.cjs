const fs = require('fs');

const data = [
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
  gmp:          { target:90,  weight:0.40, higher:true },
  complaintRate:{ target:5,   weight:0.25, higher:false },
  rmir:         { target:5,   weight:0.05, higher:false },
  rmad:         { target:2,   weight:0.05, higher:false },
  training:     { target:100, weight:0.25, higher:true }
};

data.forEach(row => {
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
  row.qualityScore = parseFloat(qs.toFixed(3));
  if (qs >= 90) row.rating = "Excellent";
  else if (qs >= 80) row.rating = "Very Good";
  else if (qs >= 70) row.rating = "Good";
  else if (qs >= 60) row.rating = "Fair";
  else row.rating = "Poor";
});

const output = `const RAW_DATA = [\n` + data.map(d => `  { plant:"${d.plant}", gmp:${d.gmp}, complaints:${d.complaints}, rmir:${d.rmir}, rmad:${d.rmad}, training:${d.training}, unitsSold:${d.unitsSold}, complaintRate:${d.complaintRate}, qualityScore:${d.qualityScore}, rating:"${d.rating}", month:"${d.month}", year:"${d.year}" }`).join(',\n') + `\n];`;

let code = fs.readFileSync('main.js', 'utf8');
const regexMock = /const RAW_DATA = \[\s*\{ plant:"Indore"[\s\S]*?\];/;
code = code.replace(regexMock, output);
fs.writeFileSync('main.js', code);
console.log("Updated mock data");
