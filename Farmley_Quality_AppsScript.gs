/**
 * ============================================================
 *  FARMLEY QUALITY DASHBOARD — Google Apps Script
 *  ============================================================
 *  SETUP INSTRUCTIONS:
 *  1. Open your Google Sheet → Extensions → Apps Script
 *  2. Paste this entire file into the editor
 *  3. Deploy as Web App:
 *       - Execute as: Me
 *       - Who has access: Anyone (or your org)
 *  4. Copy the Web App URL
 *  5. In Quality_Dashboard_Farmley.html, replace
 *     'YOUR_APPS_SCRIPT_WEB_APP_URL' with your URL
 *     and uncomment fetchFromSheet()
 *  ============================================================
 *
 *  SHEET STRUCTURE EXPECTED:
 *  Tab "Quality Performance":
 *    Row 0 = header row with:
 *      Plant | GMP % | Total Complaints | RM Inward Rejection %
 *      RM Acceptance Deviation % | Training Conducted as per schedule %
 *      Units Sold | Complaint Rate / Mn Packs | Quality Score | Rating
 *  Tab "Benchmark":
 *    KPI | Target | Weightage % for Quality score | Remark
 *  Tab "Rating":
 *    Quality score | Rating
 * ============================================================
 */

// ── CONFIG ──────────────────────────────────────────────────
const SHEET_NAMES = {
  performance: "Quality Performance",
  benchmark: "Benchmark",
  rating: "Rating"
};

// Quality Score formula weights (from Benchmark sheet)
const WEIGHTS = {
  gmp:          0.25,
  complaintRate: 0.20,
  rmir:          0.20,
  rmad:          0.10,
  training:      0.25
};


// ── WEB APP ENTRY POINT ──────────────────────────────────────
function doGet(e) {
  const action = e && e.parameter && e.parameter.action ? e.parameter.action : "getData";

  let result;
  try {
    if (action === "getData") {
      result = { status: "ok", data: getPerformanceData(), benchmarks: getBenchmarks(), ratings: getRatings() };
    } else if (action === "getBenchmarks") {
      result = { status: "ok", data: getBenchmarks() };
    } else if (action === "getRatings") {
      result = { status: "ok", data: getRatings() };
    } else {
      result = { status: "error", message: "Unknown action: " + action };
    }
  } catch (err) {
    result = { status: "error", message: err.toString() };
  }

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}


// ── DATA READERS ─────────────────────────────────────────────

/**
 * Reads the Quality Performance sheet and returns an array of plant objects.
 * Automatically detects header row and maps columns by name.
 */
function getPerformanceData() {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.performance);
  if (!sheet) throw new Error("Sheet '" + SHEET_NAMES.performance + "' not found.");

  const allValues = sheet.getDataRange().getValues();

  // Find header row (first row containing "Plant")
  let headerRowIdx = -1;
  for (let i = 0; i < allValues.length; i++) {
    const row = allValues[i].map(c => String(c).trim().toLowerCase());
    if (row.some(c => c === "plant")) { headerRowIdx = i; break; }
  }
  if (headerRowIdx === -1) throw new Error("Could not find header row in '" + SHEET_NAMES.performance + "'.");

  const headers = allValues[headerRowIdx].map(c => String(c).trim());

  // Column index helpers
  function colIdx(patterns) {
    return headers.findIndex(h => patterns.some(p => h.toLowerCase().includes(p.toLowerCase())));
  }

  const idx = {
    plant:          colIdx(["plant"]),
    gmp:            colIdx(["gmp"]),
    complaints:     colIdx(["total complaint"]),
    rmir:           colIdx(["inward rejection"]),
    rmad:           colIdx(["acceptance deviation"]),
    training:       colIdx(["training conducted"]),
    unitsSold:      colIdx(["units sold"]),
    complaintRate:  colIdx(["complaint rate"]),
    qualityScore:   colIdx(["quaity score", "quality score"]),
    rating:         colIdx(["rating"]),
    month:          colIdx(["month"]),
    year:           colIdx(["year"])
  };

  const data = [];
  for (let r = headerRowIdx + 1; r < allValues.length; r++) {
    const row = allValues[r];
    const plantName = String(row[idx.plant] || "").trim();
    if (!plantName) continue; // skip empty rows

    const gmp          = parseFloat(row[idx.gmp])         || 0;
    const complaints   = parseInt(row[idx.complaints])     || 0;
    const rmir         = parseFloat(row[idx.rmir])         || 0;
    const rmad         = parseFloat(row[idx.rmad])         || 0;
    const training     = parseFloat(row[idx.training])     || 0;
    const unitsSold    = parseInt(row[idx.unitsSold])      || 0;
    const complaintRate = parseFloat(row[idx.complaintRate]) || 0;

    // Recalculate quality score using formula for accuracy
    const qualityScore = calculateQualityScore(gmp, complaintRate, rmir, rmad, training);
    const rating       = deriveRating(qualityScore);

    const month        = String(row[idx.month] || "").trim();
    const year         = String(row[idx.year] || "").trim();

    data.push({
      plant:         plantName,
      gmp:           gmp,
      complaints:    complaints,
      rmir:          rmir,
      rmad:          rmad,
      training:      training,
      unitsSold:     unitsSold,
      complaintRate: complaintRate,
      qualityScore:  Math.round(qualityScore * 1000) / 1000,
      rating:        rating,
      month:         month,
      year:          year
    });
  }

  return data;
}


/**
 * Reads the Benchmark sheet and returns KPI targets.
 */
function getBenchmarks() {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.benchmark);
  if (!sheet) throw new Error("Sheet '" + SHEET_NAMES.benchmark + "' not found.");

  const values = sheet.getDataRange().getValues();
  const benchmarks = [];

  // Skip header row (row 0)
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
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


/**
 * Reads the Rating sheet and returns the rating bands.
 */
function getRatings() {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.rating);
  if (!sheet) throw new Error("Sheet '" + SHEET_NAMES.rating + "' not found.");

  const values = sheet.getDataRange().getValues();
  const ratings = [];

  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    if (!row[0]) continue;
    const range = String(row[0]).trim();   // e.g. "90-100"
    const parts = range.split("-").map(Number);
    ratings.push({
      range:  range,
      min:    parts[0] || 0,
      max:    parts[1] || 100,
      rating: String(row[1] || "").trim()
    });
  }
  return ratings;
}


// ── CALCULATION HELPERS ──────────────────────────────────────

/**
 * Implements the quality score formula:
 * = GMP% × 0.25
 * + Complaint Rate/Mn Packs × 0.20   (inverted: target is LOW)
 * + (100 − RM Inward Rejection %) × 0.20
 * + (100 − RM Acceptance Deviation %) × 0.10
 * + Training Conducted % × 0.25
 *
 * Note: Complaint Rate contribution = (15 - actual) normalized.
 * The formula as in the sheet: complaintRate/mnPacks * 0.2 is subtracted from 100 equivalent.
 * Exact formula: GMP%*0.25 + ComplaintRate/MnPack*0.2 + (100-RMIR%)*0.2 + (100-RMAD%)*0.10 + Training%*0.25
 */
function calculateQualityScore(gmp, complaintRate, rmir, rmad, training) {
  return (gmp * 0.25)
       + (complaintRate * 0.20)    // NOTE: this is used as-is per the original sheet formula
       + ((100 - rmir) * 0.20)
       + ((100 - rmad) * 0.10)
       + (training * 0.25);
}


/**
 * Derives rating from quality score using the rating bands.
 */
function deriveRating(score) {
  if (score >= 90) return "Excellent";
  if (score >= 80) return "Very Good";
  if (score >= 70) return "Good";
  if (score >= 60) return "Fair";
  return "Poor";
}


// ── UTILITY: WRITE COMPUTED SCORES BACK TO SHEET ────────────
/**
 * Optional: Recalculates and writes Quality Score + Rating back
 * to the Quality Performance sheet. Run manually or on trigger.
 */
function refreshQualityScores() {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAMES.performance);
  const data  = getPerformanceData();

  // Find header row
  const allValues = sheet.getDataRange().getValues();
  let headerRowIdx = -1;
  for (let i = 0; i < allValues.length; i++) {
    if (allValues[i].some(c => String(c).trim().toLowerCase() === "plant")) {
      headerRowIdx = i; break;
    }
  }
  if (headerRowIdx === -1) return;

  const headers = allValues[headerRowIdx].map(c => String(c).trim());
  const scoreCol  = headers.findIndex(h => h.toLowerCase().includes("quaity score") || h.toLowerCase().includes("quality score")) + 1;
  const ratingCol = headers.findIndex(h => h.toLowerCase() === "rating") + 1;

  data.forEach((d, i) => {
    const rowNum = headerRowIdx + 2 + i; // 1-indexed + skip header
    if (scoreCol  > 0) sheet.getRange(rowNum, scoreCol).setValue(d.qualityScore);
    if (ratingCol > 0) sheet.getRange(rowNum, ratingCol).setValue(d.rating);
  });

  SpreadsheetApp.getActiveSpreadsheet().toast("Quality Scores refreshed!", "Done", 3);
}


// ── TRIGGER SETUP ────────────────────────────────────────────
/**
 * Run this once to set up an hourly auto-refresh trigger.
 * Go to Apps Script → Run → createHourlyTrigger
 */
function createHourlyTrigger() {
  // Remove existing triggers first
  ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t));

  ScriptApp.newTrigger("refreshQualityScores")
    .timeBased()
    .everyHours(1)
    .create();

  Logger.log("Hourly trigger created.");
}


// ── CORS HELPER (for testing locally) ───────────────────────
function doOptions(e) {
  return ContentService.createTextOutput("")
    .setMimeType(ContentService.MimeType.TEXT);
}


// ── TEST FUNCTION ────────────────────────────────────────────
/**
 * Run this from Apps Script editor to test data reading.
 */
function testGetData() {
  const data = getPerformanceData();
  Logger.log(JSON.stringify(data, null, 2));
  const benchmarks = getBenchmarks();
  Logger.log(JSON.stringify(benchmarks, null, 2));
}
