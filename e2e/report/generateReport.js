import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import ExcelJS from 'exceljs';

// Resolve __dirname in ES module context
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const resultsPath = path.resolve(__dirname, 'results.json');
// Use a timestamped filename to avoid conflicts with an opened file
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const outPath = path.resolve(__dirname, `E2E_Test_Report_${timestamp}.xlsx`);

if (!fs.existsSync(resultsPath)) {
  console.error('results.json not found at', resultsPath);
  process.exit(1);
}

const results = JSON.parse(fs.readFileSync(resultsPath, 'utf-8'));

let csv = 'Test Title,State,Duration(ms)\n';
results.tests.forEach(test => {
  // Escape double quotes in titles
  const safeTitle = test.fullTitle.replace(/"/g, '""');
  csv += `"${safeTitle}",${test.state},${test.duration || ''}\n`;
});

fs.writeFileSync(outPath, csv, 'utf-8');
console.log('Report generated at', outPath);
