const fs = require('fs');
let code = fs.readFileSync('main.js', 'utf8');

const regexTargetActual = /const kpis = \[\s*\{ key:"gmp",\s*label:"GMP %",\s*target:90,\s*higher:true,\s*color:"#3b82f6" \},\s*\{ key:"complaintRate",label:"Complaint Rate \/Mn",\s*target:15,\s*higher:false, color:"#f97316" \},\s*\{ key:"rmir",\s*label:"RM Inward Rejection %",target:5,\s*higher:false, color:"#ef4444" \},\s*\{ key:"rmad",\s*label:"RM Acceptance Dev %",\s*target:2,\s*higher:false, color:"#8b5cf6" \},\s*\{ key:"training",\s*label:"Training %",\s*target:100,\s*higher:true,\s*color:"#10b981" \},\s*\];/;

const replTargetActual = `const kpis = [
    { key:"gmp",          label:"GMP %",                target:BENCHMARKS.gmp.target,  higher:true,  color:"#3b82f6" },
    { key:"complaintRate",label:"Complaint Rate /Mn",   target:BENCHMARKS.complaintRate.target,  higher:false, color:"#f97316" },
    { key:"rmir",         label:"RM Inward Rejection %",target:BENCHMARKS.rmir.target,   higher:false, color:"#ef4444" },
    { key:"rmad",         label:"RM Acceptance Dev %",  target:BENCHMARKS.rmad.target,   higher:false, color:"#8b5cf6" },
    { key:"training",     label:"Training %",            target:BENCHMARKS.training.target, higher:true,  color:"#10b981" },
  ];`;

code = code.replace(regexTargetActual, replTargetActual);
fs.writeFileSync('main.js', code);
console.log("Updated renderTargetVsActual");
