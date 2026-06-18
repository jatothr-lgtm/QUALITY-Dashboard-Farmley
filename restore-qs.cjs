const fs = require('fs');
let code = fs.readFileSync('main.js', 'utf8');

const regexMapBlock = /\/\/ Normalize data - ensure all expected fields exist[\s\S]*?\}\)\.filter\(d => d\.plant\.length > 0\);/;
const replMapBlock = `// Normalize data - ensure all expected fields exist
      const normalized = dataArr.map(d => {
        const row = {
          plant:         String(d.plant || '').trim(),
          gmp:           parseFloat(d.gmp) || 0,
          complaints:    parseInt(d.complaints) || 0,
          rmir:          parseFloat(d.rmir) || 0,
          rmad:          parseFloat(d.rmad) || 0,
          training:      parseFloat(d.training) || 0,
          unitsSold:     parseInt(d.unitsSold) || 0,
          complaintRate: parseFloat(d.complaintRate) || 0,
          month:         String(d.month || '').trim(),
          year:          String(d.year || '').trim()
        };

        // Recalculate Quality Score dynamically based on hardcoded BENCHMARKS parameters
        let qs = 0;
        ["gmp", "complaintRate", "rmir", "rmad", "training"].forEach(k => {
          const b = BENCHMARKS[k];
          const val = row[k];
          let kpiScore = 0;
          if (b.higher) {
            kpiScore = (b.target > 0) ? (val / b.target) * 100 : 0;
          } else {
            if (val <= b.target) kpiScore = 100;
            else kpiScore = (b.target / val) * 100;
          }
          if (kpiScore > 100) kpiScore = 100;
          if (kpiScore < 0) kpiScore = 0;
          qs += (kpiScore * b.weight);
        });
        
        row.qualityScore = qs;

        // Recalculate Rating based on new QS
        if (qs >= 90) row.rating = "Excellent";
        else if (qs >= 80) row.rating = "Very Good";
        else if (qs >= 70) row.rating = "Good";
        else if (qs >= 60) row.rating = "Fair";
        else row.rating = "Poor";

        return row;
      }).filter(d => d.plant.length > 0);`;

code = code.replace(regexMapBlock, replMapBlock);

fs.writeFileSync('main.js', code);
console.log("Restored QS recalculation");
