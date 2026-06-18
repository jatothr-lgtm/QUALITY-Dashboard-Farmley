const fs = require('fs');
let code = fs.readFileSync('main.js', 'utf8');

// Replace renderKPIOverview hardcodings
code = code.replace(
  /const tiles = \[[\s\S]*?\];/,
  `const tiles = [
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
  ];`
);

// Replace kpiStatus hardcodings in renderRankings
code = code.replace(/const gmpSt  = kpiStatus\(r\.gmp, 90, true\);/, 'const gmpSt  = kpiStatus(r.gmp, BENCHMARKS.gmp.target, true);');
code = code.replace(/const cmpSt  = kpiStatus\(r\.complaintRate, 15, false\);/, 'const cmpSt  = kpiStatus(r.complaintRate, BENCHMARKS.complaintRate.target, false);');
code = code.replace(/const rmirSt = kpiStatus\(r\.rmir, 5, false\);/, 'const rmirSt = kpiStatus(r.rmir, BENCHMARKS.rmir.target, false);');
code = code.replace(/const trainSt = kpiStatus\(r\.training, 100, true\);/, 'const trainSt = kpiStatus(r.training, BENCHMARKS.training.target, true);');

fs.writeFileSync('main.js', code);
console.log("Updated hardcodings in main.js");
