const fs = require('fs');
let code = fs.readFileSync('main.js', 'utf8');

const targetRegex = /\/\/ The API returns \{ status, data, benchmarks, ratings \}[\s\S]*?\}\)\)\.filter\(d => d\.plant\.length > 0\);/;

const replacement = `// The API returns { status, data, benchmarks, ratings }
    const dataArr = json.data;
    const benchArr = json.benchmarks;
    
    // Update BENCHMARKS dynamically
    if (benchArr && Array.isArray(benchArr)) {
      benchArr.forEach(b => {
        let key = null;
        const kpi = String(b.kpi).toLowerCase();
        if (kpi.includes("gmp")) key = "gmp";
        else if (kpi.includes("complaint rate") || kpi.includes("complaint")) key = "complaintRate";
        else if (kpi.includes("inward") || kpi.includes("rmir")) key = "rmir";
        else if (kpi.includes("acceptance") || kpi.includes("deviation") || kpi.includes("rmad")) key = "rmad";
        else if (kpi.includes("training")) key = "training";
        
        if (key && BENCHMARKS[key]) {
           BENCHMARKS[key].target = parseFloat(b.target) || BENCHMARKS[key].target;
           const w = parseFloat(b.weightage) || 0;
           BENCHMARKS[key].weight = (w > 1) ? w / 100 : w;
        }
      });
    }

    if (dataArr && Array.isArray(dataArr) && dataArr.length > 0) {
      console.log('[Dashboard] Loaded', dataArr.length, 'records.');

      // Normalize data - ensure all expected fields exist & recalculate quality score
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

        // Recalculate Quality Score dynamically based on new BENCHMARKS
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

code = code.replace(targetRegex, replacement);
fs.writeFileSync('main.js', code);
console.log("Updated main.js");
