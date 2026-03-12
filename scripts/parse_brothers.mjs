import fs from "fs";

const dump = fs.readFileSync("/Users/ohyeajesus/Downloads/alllovechurch-20260308.dump", "utf-8");

// Extract INSERT INTO g5_write_brothers
const match = dump.match(/INSERT INTO `g5_write_brothers` VALUES (.+?);(\n|$)/s);
if (!match) {
  console.error("No brothers data found");
  process.exit(1);
}

const valuesStr = match[1];

// Parse each row - VALUES (...),(...),(...)
const rows = [];
let depth = 0;
let current = "";
let inStr = false;
let escape = false;

for (let i = 0; i < valuesStr.length; i++) {
  const ch = valuesStr[i];
  if (escape) { current += ch; escape = false; continue; }
  if (ch === "\\") { current += ch; escape = true; continue; }
  if (ch === "'" && !inStr) { inStr = true; current += ch; continue; }
  if (ch === "'" && inStr) { inStr = false; current += ch; continue; }
  if (inStr) { current += ch; continue; }
  if (ch === "(") { depth++; if (depth === 1) { current = ""; continue; } }
  if (ch === ")") { depth--; if (depth === 0) { rows.push(current); current = ""; continue; } }
  current += ch;
}

// Parse CSV-like fields from each row
function parseFields(row) {
  const fields = [];
  let field = "";
  let inString = false;
  let esc = false;

  for (let i = 0; i < row.length; i++) {
    const ch = row[i];
    if (esc) { field += ch; esc = false; continue; }
    if (ch === "\\") { esc = true; field += ch; continue; }
    if (ch === "'" && !inString) { inString = true; continue; }
    if (ch === "'" && inString) { inString = false; continue; }
    if (inString) { field += ch; continue; }
    if (ch === ",") { fields.push(field.trim()); field = ""; continue; }
    field += ch;
  }
  fields.push(field.trim());
  return fields;
}

// gnuboard write table columns:
// wr_id, wr_num, wr_reply, wr_parent, wr_is_comment, wr_comment, wr_comment_reply,
// ca_name, wr_option, wr_subject, wr_content, wr_seo_title, wr_link1, wr_link2,
// wr_link1_hit, wr_link2_hit, wr_hit, wr_good, wr_nogood, mb_id, wr_password,
// wr_name, wr_email, wr_homepage, wr_datetime, wr_file, wr_last, wr_ip,
// wr_facebook_user, wr_twitter_user, wr_1..wr_10

const posts = [];
for (const row of rows) {
  const f = parseFields(row);
  const wrId = parseInt(f[0]);
  const isComment = parseInt(f[4]);
  if (isComment === 1) continue; // skip comments

  const subject = f[9]?.replace(/\\r\\n/g, "\n").replace(/\\'/g, "'").replace(/\\"/g, '"') || "";
  const content = f[10]?.replace(/\\r\\n/g, "\n").replace(/\\'/g, "'").replace(/\\"/g, '"') || "";
  const datetime = f[24] || "";
  const hitCount = parseInt(f[16]) || 0;

  posts.push({
    old_id: wrId,
    title: subject,
    content: content,
    post_date: datetime,
    hit_count: hitCount,
  });
}

// Sort by date desc
posts.sort((a, b) => b.post_date.localeCompare(a.post_date));

console.log(`Total brothers posts: ${posts.length}`);
console.log("\nLatest 5:");
for (const p of posts.slice(0, 5)) {
  console.log(`  [${p.old_id}] ${p.post_date} | ${p.title.substring(0, 50)}`);
}

// Output as JSON for migration
fs.writeFileSync("/Users/ohyeajesus/Documents/alllovech/scripts/brothers_data.json", JSON.stringify(posts, null, 2));
console.log(`\nSaved ${posts.length} posts to brothers_data.json`);
