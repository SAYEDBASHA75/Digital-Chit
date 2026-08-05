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

const workbook = new ExcelJS.Workbook();
const worksheet = workbook.addWorksheet('E2E Test Report');

worksheet.columns = [
  { header: 'Test Title', key: 'title', width: 50 },
  { header: 'State', key: 'state', width: 15 },
  { header: 'Duration(ms)', key: 'duration', width: 15 }
];

results.tests.forEach(test => {
  worksheet.addRow({
    title: test.fullTitle,
    state: test.state || 'passed',
    duration: test.duration || 1
  });
});

await workbook.xlsx.writeFile(outPath);
console.log('Report generated at', outPath);
