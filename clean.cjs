const fs = require('fs');
let code = fs.readFileSync('main.js', 'utf8');

// 1. yMin
code = code.replace(
  'const yMin = Math.floor(Math.min(Math.min(...allVals), targetVal * 0.7) / 10) * 10;',
  'const yMin = 0;'
);

// 2. ranking plant select
const regexPlantSelect = /\s*const rSel = document\.getElementById\("ranking-plant-select"\);[\s\S]*?rSel\.value = rPrev \|\| "";\s*\}/;
code = code.replace(regexPlantSelect, '');

// 3. renderRankingTrend function definition
const regexFunc = /\n\/\* =====================================================================\n\s*RANKING TREND CHART[\s\S]*?function renderRankingTrend\(\) \{[\s\S]*?svg\.innerHTML = paths;\n\}/;
code = code.replace(regexFunc, '');

// 4. renderRankingTrend call
code = code.replace(/\s*renderRankingTrend\(\);/, '');

fs.writeFileSync('main.js', code);
console.log("Done");
