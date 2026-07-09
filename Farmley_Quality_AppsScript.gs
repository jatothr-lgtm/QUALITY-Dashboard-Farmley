/**
 * ============================================================
 *  FARMLEY QUALITY DASHBOARD — Google Apps Script
 * ============================================================
 *  SETUP:
 *  1. Open Google Sheet → Extensions → Apps Script
 *  2. Paste this entire file
 *  3. Deploy → New deployment → Web App
 *       Execute as: Me
 *       Who has access: Anyone
 *  4. Copy the Web App URL and set it as VITE_APPS_SCRIPT_URL
 * ============================================================
 */

const SHEET_NAMES = {
  performance: "Quality Performance",
  benchmark: "Benchmark",
  rating: "Rating"
};

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

// ── WEB APP ENTRY POINT ──────────────────────────────────────
function doGet(e) {
  let result;
  try {
    result = {
      status: "ok",
      data: getPerformanceData(),
      benchmarks: getBenchmarks(),
      ratings: getRatings()
    };
  } catch (err) {
    result = { status: "error", message: err.toString() };
  }

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}


// ── DATA READERS ─────────────────────────────────────────────

function getPerformanceData() {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAMES.performance);
  if (!sheet) throw new Error("Sheet '" + SHEET_NAMES.performance + "' not found.");

  var allValues = sheet.getDataRange().getValues();

  // Find header row (first row containing "Plant")
  var headerRowIdx = -1;
  for (var i = 0; i < allValues.length; i++) {
    var row = allValues[i].map(function(c) { return String(c).trim().toLowerCase(); });
    if (row.indexOf("plant") !== -1) { headerRowIdx = i; break; }
  }
  if (headerRowIdx === -1) throw new Error("Could not find header row.");

  var headers = allValues[headerRowIdx].map(function(c) { return String(c).trim().toLowerCase(); });

  // Column finder
  function findCol(patterns) {
    for (var h = 0; h < headers.length; h++) {
      for (var p = 0; p < patterns.length; p++) {
        if (headers[h].indexOf(patterns[p].toLowerCase()) !== -1) return h;
      }
    }
    return -1;
  }

  var idx = {
    plant:         findCol(["plant"]),
    gmp:           findCol(["gmp"]),
    complaints:    findCol(["total complaint"]),
    rmir:          findCol(["inward rejection"]),
    rmad:          findCol(["acceptance deviation"]),
    training:      findCol(["training conducted"]),
    unitsSold:     findCol(["units sold"]),
    complaintRate: findCol(["complaint rate"]),
    qualityScore:  findCol(["quaity score", "quality score"]),
    rating:        findCol(["rating"]),
    month:         findCol(["month"]),
    year:          findCol(["year"])
  };

  var data = [];
  for (var r = headerRowIdx + 1; r < allValues.length; r++) {
    var row = allValues[r];
    var plantName = String(row[idx.plant] || "").trim();
    if (!plantName) continue;

    var gmp          = parseFloat(row[idx.gmp]) || 0;
    var complaints   = parseInt(row[idx.complaints]) || 0;
    var rmir         = parseFloat(row[idx.rmir]) || 0;
    var rmad         = parseFloat(row[idx.rmad]) || 0;
    var training     = parseFloat(row[idx.training]) || 0;
    var unitsSold    = parseInt(row[idx.unitsSold]) || 0;
    var complaintRate = parseFloat(row[idx.complaintRate]) || 0;
    var qualityScore = parseFloat(row[idx.qualityScore]) || 0;
    var rating       = String(row[idx.rating] || "").trim();
    var year         = String(row[idx.year] || "").trim();

    // Month cell may be a real date (e.g. 01-Jun-2026 displayed as "June")
    // or text in any casing ("june", "JUN"). Normalize to "June" style.
    var month = row[idx.month];
    if (Object.prototype.toString.call(month) === "[object Date]") {
      if (!year) year = String(month.getFullYear());
      month = MONTH_NAMES[month.getMonth()];
    } else {
      month = String(month || "").trim();
      var t = month.charAt(0).toUpperCase() + month.slice(1).toLowerCase().replace(/\./g, "");
      for (var m = 0; m < MONTH_NAMES.length; m++) {
        if (MONTH_NAMES[m] === t || MONTH_NAMES[m].substring(0, 3) === t.substring(0, 3) && t.length >= 3) {
          month = MONTH_NAMES[m];
          break;
        }
      }
    }

    // If year looks like a number like 2026.0, clean it
    if (year.indexOf(".") !== -1) {
      year = String(parseInt(year));
    }

    data.push({
      plant:         plantName,
      gmp:           gmp,
      complaints:    complaints,
      rmir:          rmir,
      rmad:          rmad,
      training:      training,
      unitsSold:     unitsSold,
      complaintRate: Math.round(complaintRate * 100) / 100,
      qualityScore:  Math.round(qualityScore * 1000) / 1000,
      rating:        rating || deriveRating(qualityScore),
      month:         month,
      year:          year
    });
  }

  return data;
}


function getBenchmarks() {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAMES.benchmark);
  if (!sheet) return [];

  var values = sheet.getDataRange().getValues();
  var benchmarks = [];

  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    if (!row[0]) continue;
    benchmarks.push({
      kpi:        String(row[0]).trim(),
      target:     parseFloat(row[1]) || 0,
      weightage:  parseFloat(row[2]) || 0,
      remark:     String(row[3] || "").trim()
    });
  }
  return benchmarks;
}


function getRatings() {
  var ss    = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAMES.rating);
  if (!sheet) return [];

  var values = sheet.getDataRange().getValues();
  var ratings = [];

  for (var i = 1; i < values.length; i++) {
    var row = values[i];
    if (!row[0]) continue;
    var range = String(row[0]).trim();
    var parts = range.split("-");
    ratings.push({
      range:  range,
      min:    parseInt(parts[0]) || 0,
      max:    parseInt(parts[1]) || 100,
      rating: String(row[1] || "").trim()
    });
  }
  return ratings;
}


function deriveRating(score) {
  if (score >= 90) return "Excellent";
  if (score >= 80) return "Very Good";
  if (score >= 70) return "Good";
  if (score >= 60) return "Fair";
  return "Poor";
}


// ── TEST ─────────────────────────────────────────────────────
function testGetData() {
  var data = getPerformanceData();
  Logger.log("Records: " + data.length);
  Logger.log(JSON.stringify(data[0]));
}
