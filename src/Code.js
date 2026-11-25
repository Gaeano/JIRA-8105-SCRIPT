const PROPS = PropertiesService.getScriptProperties().getProperties();

const SPREADSHEET_ID = "1lyuhh9mCiHX1L0rkB4JjLD3lnssbAf6mTlcc2clMm50";

const SHEETS = {
  PARENT: "parent item",
  LAPTOP: "machine details",
  ADDONS: "add-ons"
}

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);

    if (payload.token !== PROPS.WEBHOOK_SECRET) return jsonResponse({ status: 'error', message: 'unauthorized'});
    
    const issueKey = payload.issueKey;
    if (!issueKey) return jsonResponse({ status: 'error', message: 'missing issue key'});

    processPezaPermit(issueKey);
    return jsonResponse({ status: 'success', issueKey});
     
  } catch(err) {
    console.error('doPost error:', err);
    return jsonResponse({ status: 'error', message: err.message});
  }
}

/** HELPERS */
function jsonResponse(obj){ return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); }

// ============ FOR SHEETS

//get sheets
function getSheet(sheetName){
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(sheetName);
  if(!sheet) throw new Error(`Sheet not found "${sheetName}"`);
  return sheet;
}

//get the data of the sheet 
function getSheetData(sheetName){
  return getSheet(sheetName).getDataRange().getValues();
}

//find the row using the issue key to pull data
function findRowByIssueKey(sheetName, issueKey){
  const data = getSheetData(sheetName);
  return data.findIndex(row => row[0] === issueKey);
}

function appendRow(sheetName, rowData){
  getSheet(sheetName).appendRow(rowData);
}

function writeToCell(sheetName, rowIndex, colIndex, value){
  getSheet(sheetName).getRange(rowIndex + 1, colIndex + 1).setValue(value);
}
