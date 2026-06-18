const fs = require('fs');
let code = fs.readFileSync('main.js', 'utf8');

// I will output what the BENCHMARKS object looks like
const match = code.match(/const BENCHMARKS = \{[\s\S]*?\n\};/);
if (match) {
  console.log(match[0]);
}

// I will output the calculation block
const match2 = code.match(/let qs = 0;[\s\S]*?row\.qualityScore = qs;/);
if (match2) {
  console.log(match2[0]);
}
