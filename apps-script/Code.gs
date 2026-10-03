/**
 * La Table d'Hiver — RSVP backend.
 *
 * Deploy this script bound to a Google Sheet, then deploy as a Web App
 * (Execute as: Me, Access: Anyone). Paste the resulting /exec URL into
 * config.js as APPS_SCRIPT_URL. Full steps are in README.md.
 *
 * Sheet columns (row 1 header, created/kept in sync automatically):
 * Timestamp | Name | Email | Attending | Guests | Guest Name | Dietary | Note | Updated
 */

var SHEET_NAME = "RSVPs";
var HEADERS = ["Timestamp", "Name", "Email", "Attending", "Guests", "Guest Name", "Dietary", "Note", "Updated"];

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
  } else {
    // Keep the header row in sync if HEADERS has changed since the sheet was first created
    // (e.g. a new column was added later). Existing data rows are left untouched.
    var existingHeaders = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), HEADERS.length)).getValues()[0];
    var needsUpdate = HEADERS.some(function (h, i) { return existingHeaders[i] !== h; });
    if (needsUpdate) {
      sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    }
  }
  return sheet;
}

function jsonOut_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonOut_({ ok: false, error: "Missing request body." });
    }

    var data = JSON.parse(e.postData.contents);

    // Honeypot — silently accept without writing anything.
    if (data.website) {
      return jsonOut_({ ok: true });
    }

    var name = (data.name || "").toString().trim();
    var email = (data.email || "").toString().trim().toLowerCase();
    var attending = (data.attending || "").toString().trim().toLowerCase();
    var guests = (data.guests || "0").toString().trim();
    var guestName = (data.guestName || "").toString().trim();
    var dietary = (data.dietary || "").toString().trim();
    var note = (data.note || "").toString().trim().slice(0, 140);

    if (!name || !email || (attending !== "yes" && attending !== "no")) {
      return jsonOut_({ ok: false, error: "Missing required fields." });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return jsonOut_({ ok: false, error: "Invalid email address." });
    }

    var lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      var sheet = getSheet_();
      var values = sheet.getDataRange().getValues();
      var emailCol = HEADERS.indexOf("Email");
      var now = new Date();
      var existingRow = -1;

      for (var i = 1; i < values.length; i++) {
        if ((values[i][emailCol] || "").toString().trim().toLowerCase() === email) {
          existingRow = i + 1; // 1-indexed sheet row
          break;
        }
      }

      var rowValues = [now, name, email, attending, guests, guestName, dietary, note, now];

      if (existingRow > -1) {
        // Upsert: keep original Timestamp, update the rest.
        var originalTimestamp = sheet.getRange(existingRow, HEADERS.indexOf("Timestamp") + 1).getValue();
        rowValues[0] = originalTimestamp;
        sheet.getRange(existingRow, 1, 1, HEADERS.length).setValues([rowValues]);
      } else {
        sheet.appendRow(rowValues);
      }
    } finally {
      lock.releaseLock();
    }

    return jsonOut_({ ok: true });
  } catch (err) {
    return jsonOut_({ ok: false, error: "Server error: " + err.message });
  }
}

function doGet(e) {
  return jsonOut_({ ok: true, message: "La Table d'Hiver RSVP endpoint is live." });
}
