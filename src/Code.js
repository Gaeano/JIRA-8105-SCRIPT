const PROPS = PropertiesService.getScriptProperties().getProperties();

const SPREADSHEET_ID = "1lyuhh9mCiHX1L0rkB4JjLD3lnssbAf6mTlcc2clMm50";

const SHEETS = {
  PARENT: "parent item",
  LAPTOP: "machine details",
  ADDONS: "add-ons"
}

const METADATA_KEYS = new Set([
  "doc_generated",
  "doc_generated_at",
  "generated_doc_url",
  "subtasks_ready",
  "last_synced_at",
  "sync_error",
  "row_hash"
])

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);

    if (payload.token !== PROPS.WEBHOOK_SECRET) return jsonResponse({ status: 'error', message: 'unauthorized'});
    
    const issueKey = payload.issueKey;
    if (!issueKey) return jsonResponse({ status: 'error', message: 'missing issue key'});

    //processPezaPermit(issueKey);
    console.log('Webhook received for issueKey:', payload.issueKey);
    return jsonResponse({ status: 'success', issueKey});
     
  } catch(err) {
    console.error('doPost error:', err);
    return jsonResponse({ status: 'error', message: err.message});
  }
}

//inside the parent function it should have an if else function of what issue type in order to populate the correct sheet tab
function populateSheetWithIssueData(issueData, sheetName) {
  const sheet = getSheet(sheetName);
  const existingRowIndex = findRowByIssueKey(sheetName, issueData.key);

  // Match sheetName ("parent item") back to its key in SHEETS ("PARENT")
  const mapKey = Object.keys(SHEETS).find(k => SHEETS[k] === sheetName);
  const fieldMap = FIELD_MAPS[mapKey];
  if (!fieldMap) throw new Error(`No field map found for sheet: ${sheetName}`);

  // 2. Build the row array in exact column order using each field's extract() function
  const rowData = [];
  const coreValues = [];
  let hashColIndex = -1;
  fieldMap.forEach(field => {
    if (field.key === "row_hash") {
      hashColIndex = field.col;
      rowData[field.col] = ""; // Placeholder for now; will compute after core values are collected
      return;
    }

    let val = field.extract(issueData);

    // Unwrap Jira dropdown/select objects ({ value: "Laptop" }) if returned
    if (val && typeof val === 'object' && !(val instanceof Date) && !Array.isArray(val) && val.value !== undefined) {
      val = val.value;
    }

    rowData[field.col] = val ?? "";

    //get the columns that are not inside the metaData set
    if (!METADATA_KEYS.has(field.key)) {
      coreValues.push(rowData[field.col]);
    }
  });

  // Compute the row hash based on core values and store it in the designated column
  const newHash = computeRowHash(coreValues);
  if (hashColIndex !== -1) {
    rowData[hashColIndex] = newHash;
  }

  // 3. Insert if new, or overwrite the existing row in one batch write
  if (existingRowIndex === -1) {
    appendRow(sheetName, rowData);
    console.log(`[${sheetName}] Appended new row for ${issueData.key}`);
    return;

  } 
  
  //get existing rowhash
  const existingRow = getSheetData(sheetName)[existingRowIndex];
  const existingHash = hashColIndex !== -1 ? existingRow[hashColIndex] : "";

  //compare the newly computed hash and the existing hash to see if there are any changes
  if (existingHash === newHash) {
    console.log(`[${sheetName}] No changes for ${issueData.key} (hash unchanged). Skipping.`);
    return;
  }

  if (sheetName === SHEETS.PARENT) {
    rowData[8] = existingRow[8];   // doc_generated
    rowData[9] = existingRow[9];   // doc_generated_at
    rowData[10] = existingRow[10]; // generated_doc_url
    rowData[11] = existingRow[11]; // subtasks_ready
  }

  sheet.getRange(existingRowIndex + 1, 1, 1, rowData.length).setValues([rowData]);
  console.log(`[${sheetName}] Updated row for ${issueData.key} (new hash: ${newHash})`);
}

/** HELPERS */
function jsonResponse(obj){ return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); }

// Late filing = Date Received falls in a year before the current year (Manila time).
// Jira date fields arrive as "YYYY-MM-DD", so the year is read from the string
// directly to avoid timezone shifts. Empty dates are not flagged.
function isLateFiling(dateReceived){
  if (!dateReceived) return false;
  const receivedYear = Number(String(dateReceived).slice(0, 4));
  const currentYear = Number(Utilities.formatDate(new Date(), "Asia/Manila", "yyyy"));
  return receivedYear < currentYear;
}

// ============ ROW HASHING
function computeRowHash(values) {
  const normalized = values
    .map(val => {
      if (val === null || val === undefined) return "";
      if (val instanceof Date) return val.toISOString();
      return String(val).trim();
    })
    .join("|");

  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, normalized);
  return digest
    .map(byte => (byte < 0 ? byte + 256 : byte).toString(16).padStart(2, "0"))
    .join("");
}

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

function testLocal() {
  const issueKey = 'SI-8';
  const url = `${PROPS.JIRA_DOMAIN}/rest/api/3/issue/${issueKey}`;
  const authHeader = `Basic ` + Utilities.base64Encode(`${PROPS.JIRA_EMAIL}:${PROPS.JIRA_API_TOKEN}`);

  const response = UrlFetchApp.fetch(url, {
    method: 'get',
    headers: {
      'Authorization': authHeader,
      'Accept': 'application/json'
    },
    muteHttpExceptions: true
  });

  const code = response.getResponseCode();
  if (code !== 200) {
    console.error(`connection failed`);
    return;
  }

  const issue = JSON.parse(response.getContentText());
  console.log('Connection OK (200)');
  
  populateSheetWithIssueData(issue, SHEETS.PARENT);

}