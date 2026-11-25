const CONFIG = {
  SHEETS:{
    PARENT: "parent item",
    LAPTOP: "machine details",
    ADDONS: "add-ons"
  },
  TEMPLATE_DOC_ID: PropertiesService.getScriptProperties().getProperty("TEMPLATE_DOC_ID"),
  OUTPUT_FOLDER_ID: PropertiesService.getScriptProperties().getProperty("OUTPUT_FOLDER_ID"),
  JIRA:{
    BASE_URL: PropertiesService.getScriptProperties().getProperty("JIRA_DOMAIN"),
    EMAIL: PropertiesService.getScriptProperties().getProperty("JIRA_EMAIL"),
    SECRET: PropertiesService.getScriptProperties().getProperty("WEBHOOK_SECRET"),
    API_TOKEN: PropertiesService.getScriptProperties().getProperty("JIRA_API_TOKEN"),
    PROJECT_KEY: "SI"
  }
}

//sheet function helpers
//get sheets
function getSheet(sheetName){
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if(!sheet) throw new Error(`Sheet not found" ${sheetName}`);
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

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);

    if (payload.token !== SECRET) return jsonResponse({ status: 'error', message: 'unauthorized'});
    
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
