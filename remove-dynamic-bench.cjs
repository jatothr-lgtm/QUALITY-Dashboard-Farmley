const fs = require('fs');
let code = fs.readFileSync('main.js', 'utf8');

const regexDynamicBench = /\/\/ Update BENCHMARKS dynamically[\s\S]*?\}\n\n    if \(dataArr && Array\.isArray\(dataArr\)/;
const replDynamicBench = `if (dataArr && Array.isArray(dataArr)`;

code = code.replace(regexDynamicBench, replDynamicBench);
fs.writeFileSync('main.js', code);
console.log("Removed dynamic bench mapping");
