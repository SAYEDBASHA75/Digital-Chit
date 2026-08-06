import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import ExcelJS from 'exceljs';

// Resolve __dirname in ES module context
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const resultsPath = path.resolve(__dirname, 'results.json');
const reportPrefix = process.argv[2] || 'E2E_Test_Report';
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const outPath = path.resolve(__dirname, `${reportPrefix}.xlsx`);

if (!fs.existsSync(resultsPath)) {
  console.error('results.json not found at', resultsPath);
  process.exit(1);
}

const results = JSON.parse(fs.readFileSync(resultsPath, 'utf-8'));

// Derive a human-readable report name from the prefix
const reportLabel = reportPrefix.replace(/_/g, ' ');

const workbook = new ExcelJS.Workbook();
const worksheet = workbook.addWorksheet(reportLabel);

// ── Styles ──────────────────────────────────────────────────────────────
const headerFill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FF00796B' } // teal
};
const headerFont = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
const titleFont = { bold: true, size: 14 };
const sourceFont = { italic: true, size: 10, color: { argb: 'FF666666' } };

// ── Row 1: Report title ────────────────────────────────────────────────
const titleRow = worksheet.addRow([`${reportLabel}`]);
titleRow.getCell(1).font = titleFont;
worksheet.mergeCells('A1:C1');

// ── Row 2: Source filename ─────────────────────────────────────────────
const srcRow = worksheet.addRow([`Source: ${reportPrefix}.xlsx  |  Generated: ${new Date().toLocaleString()}`]);
srcRow.getCell(1).font = sourceFont;

// ── Row 3: blank spacer ───────────────────────────────────────────────
worksheet.addRow([]);

// ── Row 4: Column headers ─────────────────────────────────────────────
const hdrRow = worksheet.addRow(['Test Title', 'State', 'Duration (ms)']);
hdrRow.eachCell((cell) => {
  cell.fill = headerFill;
  cell.font = headerFont;
  cell.alignment = { vertical: 'middle', horizontal: 'center' };
  cell.border = {
    bottom: { style: 'thin', color: { argb: 'FF004D40' } }
  };
});

// Column widths
worksheet.getColumn(1).width = 90;
worksheet.getColumn(2).width = 12;
worksheet.getColumn(3).width = 16;

// ── Data rows ─────────────────────────────────────────────────────────
// Ensure every test title is unique by using a Set
const seenTitles = new Set();
let dupCount = 0;

const tests = results.tests || results.passes || [];
tests.forEach((test) => {
  let title = test.fullTitle || test.title || 'Untitled';
  // Deduplicate if needed
  if (seenTitles.has(title)) {
    dupCount++;
    title = `${title} [dup-${dupCount}]`;
  }
  seenTitles.add(title);

  const state = test.state || (test.err && Object.keys(test.err).length ? 'failed' : 'passed');
  const duration = test.duration || 1;

  const row = worksheet.addRow([title, state, duration]);
  // Color the State cell green/red
  const stateCell = row.getCell(2);
  stateCell.font = {
    bold: true,
    color: { argb: state === 'passed' ? 'FF2E7D32' : 'FFC62828' }
  };
  stateCell.alignment = { horizontal: 'center' };
  row.getCell(3).alignment = { horizontal: 'center' };
});

// ── Auto-filter on header row ─────────────────────────────────────────
worksheet.autoFilter = {
  from: { row: 4, column: 1 },
  to: { row: 4 + seenTitles.size, column: 3 }
};

// ── Freeze panes so header stays visible ──────────────────────────────
worksheet.views = [{ state: 'frozen', ySplit: 4 }];

await workbook.xlsx.writeFile(outPath);
console.log(`Report generated at ${outPath} — ${seenTitles.size} unique test rows`);

