import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Generates a JSON file with 150 unique test definitions across several categories.
 * Each test includes:
 *   - id
 *   - description
 *   - category (UI/UX, Functional, Unit, Validation)
 *   - status (ready, in-progress, blocked)
 *   - steps (placeholder actions)
 */
function createTestSpec(categoryFilter) {
  const count = 300;
  const specs = [];

  const categories = categoryFilter ? [categoryFilter] : ['Selenium Web', 'Appium Android', 'Unit API', 'Validation', 'Deployment', 'Load Performance'];
  const statusOptions = ['ready', 'in-progress', 'blocked'];

  const perCat = Math.floor(count / categories.length);
  let extra = count % categories.length;

  let idx = 1;
  for (const category of categories) {
    const catCount = perCat + (extra > 0 ? 1 : 0);
    if (extra > 0) extra--;
    for (let i = 0; i < catCount; i++) {
      const id = `TC${String(idx).padStart(3, '0')}`;
      const description = `${category} Test Case ${idx}: Verification of Digital Chit Feature Module ${idx}`;
      const status = statusOptions[idx % statusOptions.length];
      specs.push({
        id,
        description,
        category,
        status,
        steps: [
          { action: 'navigate', url: 'http://localhost:3000' },
          { action: 'checkTitle', expected: 'Digital Chit Fund' }
        ]
      });
      idx++;
    }
  }

  const outPath = path.join(__dirname, 'testSpec.json');
  fs.writeFileSync(outPath, JSON.stringify(specs, null, 2), 'utf-8');
  console.log('Created testSpec.json with', count, 'tests for category:', categoryFilter || 'All');
}

const filterArg = process.argv[2];
createTestSpec(filterArg);
