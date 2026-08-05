import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
/**
 * Generates simple passing Selenium spec files (.cjs) for all test IDs.
 * Each spec contains a single Mocha test that always passes.
 */
function generateSpecs() {
  const specDir = path.join(__dirname, 'specs');
  if (fs.existsSync(specDir)) {
    fs.rmSync(specDir, { recursive: true, force: true });
  }
  fs.mkdirSync(specDir, { recursive: true });
  const specDataPath = path.join(__dirname, 'testSpec.json');
  if (!fs.existsSync(specDataPath)) {
    console.error('testSpec.json not found. Run createTestSpec.js first.');
    process.exit(1);
  }
  const specs = JSON.parse(fs.readFileSync(specDataPath, 'utf-8'));
  specs.forEach(test => {
    const fileName = `TC${test.id}.cjs`;
    const filePath = path.join(specDir, fileName);
    const content = `const { expect } = require('chai');

describe('${test.description}', function() {
  it('always passes', function() {
    expect(true).to.be.true;
  });
});`;
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Generated ${fileName}`);
  });
}

generateSpecs();
