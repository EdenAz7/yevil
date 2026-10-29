/**
 * leads.gs — Google Apps Script שמקבל לידים מהאתר וכותב אותם ל-Google Sheets.
 *
 * התקנה (פירוט מלא ב-README.md):
 * 1. פתחו Google Sheet חדש  →  תוספים/Extensions  →  Apps Script.
 * 2. הדביקו את הקוד הזה במקום הקוד הקיים ושמרו.
 * 3. Deploy  →  New deployment  →  סוג: Web app
 *      Execute as: Me   |   Who has access: Anyone
 * 4. העתיקו את כתובת ה-Web App (מסתיימת ב-/exec) אל SCRIPT_URL בקובץ config.js באתר.
 *
 * אחרי כל שינוי בקוד צריך Deploy  →  Manage deployments  →  Edit  →  New version.
 */

const SHEET_NAME = "Leads";                       // שם הלשונית בגיליון (נוצרת אוטומטית)
const NOTIFY_EMAIL = "";                          // אופציונלי: כתובת מייל שתקבל התראה על כל ליד חדש
const HEADERS = ["תאריך", "שם", "טלפון", "תחום עניין", "הודעה", "מועד מועדף", "עמוד", "הסכמה"];

function doPost(e) {
  const p = (e && e.parameter) || {};

  // שדה "מלכודת" נגד בוטים: אנשים אמיתיים לא רואים אותו ולא ממלאים אותו
  if (p.website) return json_({ ok: true });

  // חובה: שם וטלפון
  if (!clean_(p.name) || !clean_(p.phone)) return json_({ ok: false, error: "missing fields" });

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADERS);
      sheet.setFrozenRows(1);
      sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold");
    }
    sheet.appendRow([
      new Date(),
      clean_(p.name),
      clean_(p.phone),
      clean_(p.interest),
      clean_(p.message),
      clean_(p.time),
      clean_(p.page),
      p.consent ? "כן" : "לא"
    ]);
  } finally {
    lock.releaseLock();
  }

  if (NOTIFY_EMAIL) {
    MailApp.sendEmail(NOTIFY_EMAIL, "ליד חדש מהאתר", "שם: " + clean_(p.name) + "\nטלפון: " + clean_(p.phone) + "\nתחום: " + clean_(p.interest) + "\nהודעה: " + clean_(p.message));
  }
  return json_({ ok: true });
}

// בדיקה מהדפדפן: פתיחת כתובת ה-/exec אמורה להחזיר {"ok":true,...}
function doGet() {
  return json_({ ok: true, service: "leads" });
}

// חיתוך אורך + הגנה מ"הזרקת נוסחאות" (ערך שמתחיל ב- = + - @ ייכתב כטקסט)
function clean_(v) {
  v = String(v == null ? "" : v).trim().slice(0, 1000);
  return /^[=+\-@]/.test(v) ? "'" + v : v;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
