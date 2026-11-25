const FIELD_MAPS = {

  PARENT: [
    { col: 0,  key: "jira_issue_key",    extract: (f) => f.key },
    { col: 1,  key: "summary",           extract: (f) => f.fields.summary },
    { col: 2,  key: "status",            extract: (f) => f.fields.status.name },
    { col: 3,  key: "supplier_name",     extract: (f) => f.fields.customfield_10268 },
    { col: 4,  key: "supplier_address",  extract: (f) => f.fields.customfield_11599 },
    { col: 5,  key: "date_received",     extract: (f) => f.fields.customfield_11592 },
    { col: 6,  key: "total_price",       extract: (f) => f.fields.customfield_11593 },
    { col: 7,  key: "is_late_filing",    extract: (f) => isLateFiling(f.fields.customfield_11592) },
    { col: 8,  key: "doc_generated",     extract: ()  => false },
    { col: 9,  key: "doc_generated_at",  extract: ()  => "" },
    { col: 10, key: "generated_doc_url", extract: ()  => "" },
    { col: 11, key: "subtasks_ready",    extract: ()  => false },
    { col: 12, key: "last_synced_at",    extract: ()  => new Date() },
    { col: 13, key: "sync_error",        extract: ()  => "" }
  ],

  LAPTOP: [
    { col: 0,  key: "jira_issue_key",    extract: (f) => f.key },
    { col: 1,  key: "parent_issue_key",  extract: (f) => f.fields.parent?.key ?? "" },
    { col: 2,  key: "summary",           extract: (f) => f.fields.summary },
    { col: 3,  key: "item_type",         extract: (f) => f.fields.customfield_11602 }, 
    { col: 4,  key: "status",            extract: (f) => f.fields.status.name },
    { col: 5,  key: "quantity",          extract: (f) => f.fields.customfield_11595 },
    { col: 6,  key: "unit_price",        extract: (f) => f.fields.customfield_11596 },
    { col: 7,  key: "processor",         extract: (f) => f.fields.customfield_10255 },
    { col: 8,  key: "ram",               extract: (f) => f.fields.customfield_10252 },
    { col: 9,  key: "storage",           extract: (f) => f.fields.customfield_10253 },
    { col: 10, key: "graphics",          extract: (f) => f.fields.customfield_10256 },
    { col: 11, key: "display",           extract: (f) => f.fields.customfield_11597 ?? "" },
    { col: 12, key: "os",                extract: (f) => f.fields.customfield_10257 },
    { col: 13, key: "Computer Peripherals", extract: (f) => f.fields.customfield_10159 ?? "" },
    { col: 14, key: "serial_numbers",    extract: (f) => f.fields.customfield_10250 },
    { col: 15, key: "inventory_codes",   extract: (f) => f.fields.customfield_11600 },
    { col: 16, key: "sn_count",          extract: (f) => (f.fields.customfield_10250 || "").split(",").filter(Boolean).length },
    { col: 17, key: "last_synced_at",    extract: ()  => new Date() },
    { col: 18, key: "sync_error",        extract: ()  => "" }
  ],

  ADDONS: [
    { col: 0, key: "jira_issue_key",    extract: (f) => f.key },
    { col: 1, key: "parent_issue_key",  extract: (f) => f.fields.parent?.key ?? "" },
    { col: 2, key: "summary",           extract: (f) => f.fields.summary },
    { col: 3, key: "status",            extract: (f) => f.fields.status.name },
    { col: 4, key: "item_type",         extract: (f) => f.fields.customfield_11602 },
    { col: 5, key: "quantity",          extract: (f) => f.fields.customfield_11595 },
    { col: 6, key: "unit_price",        extract: (f) => f.fields.customfield_11596 },
    { col: 7, key: "last_synced_at",    extract: ()  => new Date() },
    { col: 8, key: "sync_error",        extract: ()  => "" }
  ]

};