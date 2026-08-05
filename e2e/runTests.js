import fs from 'fs';
import { execSync } from 'child_process';

// Run Mocha tests and output JSON results
execSync('mocha e2e/specs/**/*.cjs --timeout 60000 --reporter json --reporter-options output=./e2e/report/results.json', { stdio: 'inherit' });
console.log('Mocha tests completed');
