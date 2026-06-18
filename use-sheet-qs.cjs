const fs = require('fs');
let code = fs.readFileSync('main.js', 'utf8');

const regexMapBlock = /\/\/ Normalize data - ensure all expected fields exist[\s\S]*?\}\)\.filter\(d => d\.plant\.length > 0\);/;
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
console.log("Removed JS QS recalculation, relying purely on sheet values");
