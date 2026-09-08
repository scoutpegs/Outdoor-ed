/* ============================================================
   Camp Board — Apps Script backend
   ============================================================
   SIMPLEST SETUP (no ID to copy, nothing to get wrong):
     1. Open your Google Sheet.
     2. Extensions > Apps Script.
     3. Delete anything in the editor, paste this whole file in.
     4. Deploy > New deployment > Web app.
        - Execute as: Me
        - Who has access: Anyone with the link
     5. Copy the URL that ends in /exec — paste it into API_URL
        in config.js. That's the whole setup.

   Leave SPREADSHEET_ID below exactly as "" for that path — the
   script automatically uses whichever Sheet it's attached to,
   and creates the "Pins" tab with the right headers itself the
   first time it runs. This is what fixes the
   "Illegal spreadsheet key or URL" error: that error only
   happens when SPREADSHEET_ID is filled in with something that
   isn't a real Sheet ID (e.g. still the placeholder text).

   Only fill in SPREADSHEET_ID if you specifically created this
   as a STANDALONE script (script.google.com, not opened from
   inside a Sheet) and need to point it at a Sheet by hand. To
   get the ID: open the Sheet, look at the address bar —
   it's the long string between "/d/" and "/edit".
   ============================================================ */
const SPREADSHEET_ID = "";
const SHEET_NAME = "Pins";
const HEADERS = ["id", "created_at", "url", "title", "author", "author_id", "category"];

function out_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function ss_() {
  const id = (SPREADSHEET_ID || "").trim();
  if (id) {
    try {
      return SpreadsheetApp.openById(id);
    } catch (e) {
      throw new Error(
        "Can't open a Google Sheet with the ID currently pasted into SPREADSHEET_ID. " +
        "Open your Sheet, copy the long ID between '/d/' and '/edit' in its URL, and paste " +
        "that exact ID in — or simplest, delete everything between the quotes so it reads " +
        'SPREADSHEET_ID = "" and instead create this script from inside the Sheet itself ' +
        "(Extensions > Apps Script), which needs no ID at all."
      );
    }
  }
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    throw new Error(
      "No Google Sheet is connected. Easiest fix: open your Sheet, go to Extensions > " +
      "Apps Script, and paste this code in there (instead of a standalone project at " +
      "script.google.com) — then it will always use that Sheet automatically."
    );
  }
  return ss;
}

function sheet_() {
  const ss = ss_();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(HEADERS);
    sh.setFrozenRows(1);
  } else if (sh.getLastRow() === 0) {
    sh.appendRow(HEADERS);
    sh.setFrozenRows(1);
  }
  return sh;
}

function getRows_() {
  const sh = sheet_(), values = sh.getDataRange().getValues();
  if (values.length < 2) return [];
  const h = values[0].map(String);
  return values
    .slice(1)
    .filter(r => r.some(v => v !== ""))
    .map(r => { const o = {}; h.forEach((x, i) => o[x] = r[i]); return o; });
}

function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) || "listPins";
    if (action === "listPins") return out_({ ok: true, pins: getRows_() });
    if (action === "ping") return out_({ ok: true, message: "Camp Board backend is connected." });
    return out_({ ok: false, error: "Unknown action: " + action });
  } catch (err) {
    return out_({ ok: false, error: String(err.message || err) });
  }
}

function doPost(e) {
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    const sh = sheet_();
    if (body.action === "addPin") {
      if (!body.url) return out_({ ok: false, error: "Missing url" });
      sh.appendRow([
        body.id || Utilities.getUuid(),
        body.created_at || new Date().toISOString(),
        body.url || "",
        body.title || "",
        body.author || "Anonymous",
        body.author_id || "",
        body.category || "idea",
      ]);
      return out_({ ok: true });
    }
    if (body.action === "deletePin") {
      const values = sh.getDataRange().getValues();
      const h = values[0].map(String);
      const idCol = h.indexOf("id"), authorCol = h.indexOf("author_id");
      for (let i = 1; i < values.length; i++) {
        if (String(values[i][idCol]) === String(body.id)) {
          if (String(values[i][authorCol]) !== String(body.author_id)) {
            return out_({ ok: false, error: "You can only delete pins you added." });
          }
          sh.deleteRow(i + 1);
          return out_({ ok: true });
        }
      }
      return out_({ ok: false, error: "Pin not found" });
    }
    return out_({ ok: false, error: "Unknown action: " + body.action });
  } catch (err) {
    return out_({ ok: false, error: String(err.message || err) });
  }
}

/* ---------- Run this once by hand to sanity-check everything ----------
   In the Apps Script editor, pick "setup" from the function dropdown at
   the top and click ▶ Run. Check View > Logs / Execution log afterwards.
   It will create the "Pins" tab with headers if it doesn't exist yet,
   and tell you plainly whether the connection works. */
function setup() {
  const sh = sheet_();
  Logger.log("✅ Connected to Sheet: " + sh.getParent().getName());
  Logger.log("✅ Using tab: " + sh.getName() + " (row 1 headers: " + sh.getRange(1, 1, 1, HEADERS.length).getValues()[0].join(", ") + ")");
  Logger.log("Next: Deploy > New deployment > Web app, then paste the /exec URL into API_URL in config.js.");
}
