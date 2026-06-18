const data = [
  { plant:"Indore",  gmp:89.6, complaints:40, rmir:21.52, rmad:3.36, training:100, unitsSold:3279891, complaintRate:12.2,  qualityScore:75.199, rating:"Good", month:"March", year:"2026" },
  { plant:"Purnia",  gmp:85.2, complaints:8,  rmir:0,     rmad:0,    training:50,  unitsSold:1331555, complaintRate:6.01,  qualityScore:65.002, rating:"Fair", month:"March", year:"2026" },
  { plant:"Kundli",  gmp:80,   complaints:0,  rmir:3,     rmad:1.5,  training:50,  unitsSold:0,       complaintRate:0,     qualityScore:61.75,  rating:"Fair", month:"March", year:"2026" },
  { plant:"UD",      gmp:67.4, complaints:4,  rmir:0,     rmad:0,    training:50,  unitsSold:769160,  complaintRate:5.2,   qualityScore:60.390, rating:"Fair", month:"March", year:"2026" },
  { plant:"Functional", gmp:85.2, complaints:0, rmir:0,   rmad:0,    training:50,  unitsSold:49320,   complaintRate:0,     qualityScore:63.8,   rating:"Fair", month:"March", year:"2026" }
];

const BENCHMARKS = {
  gmp:          { target:90,  weight:0.25, higher:true },
  complaintRate:{ target:15,  weight:0.20, higher:false },
  rmir:         { target:5,   weight:0.20, higher:false },
  rmad:         { target:2,   weight:0.10, higher:false },
  training:     { target:100, weight:0.25, higher:true }
};

data.forEach(r => {
  let score1 = 0;
  for (const k in BENCHMARKS) {
    const b = BENCHMARKS[k];
    const val = r[k];
    let kpiScore = 0;
    if (b.higher) {
      kpiScore = (val / b.target) * 100;
      if (kpiScore > 100) kpiScore = 100; // cap at 100?
    } else {
      if (val === 0) kpiScore = 100;
      else {
        kpiScore = (b.target / val) * 100;
        if (kpiScore > 100) kpiScore = 100;
      }
    }
    score1 += kpiScore * b.weight;
  }
  console.log(r.plant, "Target:", r.qualityScore, "Calculated1:", score1);
});
