const fs = require('fs');
let code = fs.readFileSync('main.js', 'utf8');

// Update hardcoded BENCHMARKS block
const regexBenchmarksBlock = /const BENCHMARKS = \{[\s\S]*?qualityScore:[^\n]*\n\};/;
const replBenchmarksBlock = `const BENCHMARKS = {
  gmp:          { target:90,  weight:0.40, label:"GMP %",                    higher:true,  unit:"%" },
  complaintRate:{ target:5,   weight:0.25, label:"Complaint Rate / Mn Packs", higher:false, unit:""  },
  rmir:         { target:5,   weight:0.05, label:"RM Inward Rejection %",    higher:false, unit:"%" },
  rmad:         { target:2,   weight:0.05, label:"RM Acceptance Deviation %", higher:false, unit:"%" },
  training:     { target:100, weight:0.25, label:"Training Conducted %",     higher:true,  unit:"%" },
  qualityScore: { target:70,  weight:1,    label:"Quality Score",            higher:true,  unit:"pts" }
};`;
code = code.replace(regexBenchmarksBlock, replBenchmarksBlock);

// Replace mapping block
const regexMapBlock = /\/\/ Normalize data - ensure all expected fields exist & recalculate quality score[\s\S]*?\}\)\.filter\(d => d\.plant\.length > 0\);/;
const replMapBlock = `// Normalize data - ensure all expected fields exist
      const normalized = dataArr.map(d => {
        return {
          plant:         String(d.plant || '').trim(),
          gmp:           parseFloat(d.gmp) || 0,
          complaints:    parseInt(d.complaints) || 0,
          rmir:          parseFloat(d.rmir) || 0,
          rmad:          parseFloat(d.rmad) || 0,
          training:      parseFloat(d.training) || 0,
          unitsSold:     parseInt(d.unitsSold) || 0,
          complaintRate: parseFloat(d.complaintRate) || 0,
          qualityScore:  parseFloat(d.qualityScore) || 0,
          rating:        String(d.rating || 'Fair').trim(),
          month:         String(d.month || '').trim(),
          year:          String(d.year || '').trim()
        };
      }).filter(d => d.plant.length > 0);`;

code = code.replace(regexMapBlock, replMapBlock);

fs.writeFileSync('main.js', code);
console.log("Updated BENCHMARKS and fetchFromSheet mapping");
