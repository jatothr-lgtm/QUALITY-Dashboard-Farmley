const fs = require('fs');
let code = fs.readFileSync('main.js', 'utf8');

const regexHeatmap = /const kpis = \[\s*\{ key:"gmp",\s*label:"GMP %",\s*target:90,\s*higher:true  \},\s*\{ key:"complaintRate", label:"Complaint\/Mn", target:15, higher:false \},\s*\{ key:"rmir",\s*label:"RM Inward Rej %", target:5, higher:false \},\s*\{ key:"rmad",\s*label:"RM Accept Dev %", target:2, higher:false \},\s*\{ key:"training",\s*label:"Training %", target:100, higher:true  \},\s*\];/;

const replHeatmap = `const kpis = [
    { key:"gmp",           label:"GMP %",      target:BENCHMARKS.gmp.target,  higher:true  },
    { key:"complaintRate", label:"Complaint/Mn", target:BENCHMARKS.complaintRate.target, higher:false },
    { key:"rmir",          label:"RM Inward Rej %", target:BENCHMARKS.rmir.target, higher:false },
    { key:"rmad",          label:"RM Accept Dev %", target:BENCHMARKS.rmad.target, higher:false },
    { key:"training",      label:"Training %", target:BENCHMARKS.training.target, higher:true  },
  ];`;

code = code.replace(regexHeatmap, replHeatmap);
code = code.replace(/const sc = kpiStatus\(r\.qualityScore, 70, true\);/g, 'const sc = kpiStatus(r.qualityScore, BENCHMARKS.qualityScore.target, true);');

fs.writeFileSync('main.js', code);
console.log("Updated renderHeatmap");
