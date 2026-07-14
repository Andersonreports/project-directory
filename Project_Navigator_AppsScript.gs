/************************************************************************
 * Project Navigator  ->  Google Sheet bridge
 *
 * This script receives projects sent from Project_Navigator.html and
 * appends them as rows to your Google Sheet, so you keep a permanent
 * record for documentation. Each system (Jeeva / Nandhana) is written to
 * its own tab; the tabs are created automatically the first time they are
 * used, so no manual sheet setup is needed.
 *
 * ---------------------------------------------------------------------
 * ONE-TIME SETUP (about 2 minutes)
 * ---------------------------------------------------------------------
 * 1. Open your sheet:
 *      https://docs.google.com/spreadsheets/d/1JCVEQPJLLM8JGQlpRDxYsB1TglCktd_NPAgDQekPhuI/edit
 * 2. Menu:  Extensions  ->  Apps Script
 * 3. Delete anything in the editor, then paste ALL of this file.
 * 4. Click the "Save" (disk) icon.
 * 5. Click  Deploy  ->  New deployment.
 *      - Click the gear next to "Select type" -> choose "Web app".
 *      - Description: anything (e.g. "Project Navigator").
 *      - Execute as:      Me (your account)
 *      - Who has access:  Anyone
 *      - Click Deploy.  Authorize when prompted (choose your account,
 *        Advanced -> "Go to ... (unsafe)" -> Allow. This is your own
 *        script, so it is safe.)
 * 6. Copy the "Web app URL". It ends with /exec.
 * 7. Open Project_Navigator.html, find the line:
 *         const SHEET_WEBAPP_URL = '';
 *      and paste your URL between the quotes. Save the file. Done.
 *
 * To test without the page: click "Run" on the testAppend function below,
 * then check the sheet for a "TEST" row.
 ************************************************************************/

var SPREADSHEET_ID = '1JCVEQPJLLM8JGQlpRDxYsB1TglCktd_NPAgDQekPhuI';

// Each system gets its own tab. A project's "system" field decides which tab
// its row is appended to. Unknown / missing values fall back to DEFAULT_SYSTEM.
var SYSTEMS = ['Jeeva', 'Nandhana'];
var DEFAULT_SYSTEM = 'Jeeva';

function sheetNameForSystem_(system) {
  var s = String(system == null ? '' : system).trim();
  return SYSTEMS.indexOf(s) === -1 ? DEFAULT_SYSTEM : s;
}

// Returns the tab for a given system name, creating it (with a header row)
// the first time it is used.
function getSheet_(sheetName) {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['Project Name', 'Purpose', 'Folder', 'Path']);
    sheet.getRange(1, 1, 1, 4).setFontWeight('bold');
  }
  return sheet;
}

function appendProjects_(payload) {
  var rows = Array.isArray(payload) ? payload : [payload];
  rows.forEach(function (p) {
    var sheet = getSheet_(sheetNameForSystem_(p.system));
    sheet.appendRow([p.name || '', p.purpose || '', p.folder || '', p.path || '']);
  });
  return rows.length;
}

// Called by the web page (POST).
function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(30000);
  try {
    var payload = JSON.parse(e.postData.contents);
    var count = appendProjects_(payload);
    return ContentService
      .createTextOutput(JSON.stringify({ result: 'success', added: count }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ result: 'error', error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

// Optional: lets you open the /exec URL in a browser to confirm it is live.
function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ result: 'ok', message: 'Project Navigator endpoint is live.' }))
    .setMimeType(ContentService.MimeType.JSON);
}

// Optional manual test from the Apps Script editor.
// Appends one row to each system tab so you can confirm routing works.
function testAppend() {
  appendProjects_([
    { system: 'Jeeva',    name: 'TEST', purpose: 'from testAppend', folder: 'Documents', path: 'C:\\Users\\Admin\\Test' },
    { system: 'Nandhana', name: 'TEST', purpose: 'from testAppend', folder: 'Projects',  path: 'D:\\Projects\\Test' }
  ]);
}
