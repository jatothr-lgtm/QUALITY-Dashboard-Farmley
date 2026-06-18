const fs = require('fs');
let code = fs.readFileSync('main.js', 'utf8');

const regexTable = /<td style="color:\$\{r\.gmp>=90\?'var\(--excellent\)'\:'var\(--danger\)'\}">\$\{r\.gmp\}%<\/td>[\s\S]*?<td style="color:\$\{r\.training===100\?'var\(--excellent\)'\:'var\(--warn\)'\}">\$\{r\.training\}%<\/td>/;

const replTable = `<td style="color:\${r.gmp>=BENCHMARKS.gmp.target?'var(--excellent)':'var(--danger)'}">\${r.gmp}%</td>
      <td>\${r.complaints}</td>
      <td>\${r.unitsSold.toLocaleString()}</td>
      <td style="color:\${r.complaintRate<=BENCHMARKS.complaintRate.target?'var(--excellent)':'var(--danger)'}">\${typeof r.complaintRate === 'number' ? r.complaintRate.toFixed(2) : r.complaintRate}</td>
      <td style="color:\${r.rmir<=BENCHMARKS.rmir.target?'var(--excellent)':'var(--danger)'}">\${r.rmir}%</td>
      <td style="color:\${r.rmad<=BENCHMARKS.rmad.target?'var(--excellent)':'var(--danger)'}">\${r.rmad}%</td>
      <td style="color:\${r.training>=BENCHMARKS.training.target?'var(--excellent)':'var(--warn)'}">\${r.training}%</td>`;

code = code.replace(regexTable, replTable);
fs.writeFileSync('main.js', code);
console.log("Updated renderDataTable hardcodings");
