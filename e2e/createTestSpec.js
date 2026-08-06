import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const modules = [
  { name: 'UserRegistration', label: 'User Registration' },
  { name: 'KYCVerification', label: 'KYC Verification' },
  { name: 'ChitGroupCreation', label: 'Chit Group Creation' },
  { name: 'MembershipEnrolment', label: 'Membership Enrolment' },
  { name: 'BidSubmission', label: 'Bid Submission' },
  { name: 'AuctionProcessing', label: 'Auction Processing' },
  { name: 'DividendCalculation', label: 'Dividend Calculation' },
  { name: 'PaymentGateway', label: 'Payment Gateway' },
  { name: 'EMICollection', label: 'EMI Collection' },
  { name: 'WalletBalance', label: 'Wallet Balance' },
  { name: 'DefaulterAlerting', label: 'Defaulter Alerting' },
  { name: 'DoubleEntryLedger', label: 'Double Entry Ledger' },
  { name: 'NotificationDispatcher', label: 'Notification Dispatcher' },
  { name: 'AnalyticsDashboard', label: 'Analytics Dashboard' },
  { name: 'AdminUserManagement', label: 'Admin User Management' },
  { name: 'BackupRestore', label: 'Backup & Restore' },
  { name: 'RateLimiter', label: 'API Rate Limiting' },
  { name: 'UserSession', label: 'User Session Authentication' },
  { name: 'BiddingCap', label: 'Bidding Cap Enforcement' },
  { name: 'TdsReporting', label: 'TDS Reporting' }
];

const scenarios = [
  { text: 'Verify successful execution of happy path for', type: 'HappyPath' },
  { text: 'Validate edge condition boundary values for', type: 'BoundaryValues' },
  { text: 'Verify rejection behavior under invalid/missing input of', type: 'InvalidMissingInput' },
  { text: 'Validate idempotency logic under duplicate submission of', type: 'DuplicateSubmission' },
  { text: 'Verify token rejection under expired session/token scenario for', type: 'ExpiredSession' },
  { text: 'Assess transaction locking during concurrent access of', type: 'ConcurrentAccess' },
  { text: 'Test performance constraints handling large dataset under', type: 'LargeDataset' },
  { text: 'Verify retry policies and circuit breakers under network failure of', type: 'NetworkFailure' },
  { text: 'Ensure unauthorized role blocks with permission denied for', type: 'PermissionDenied' },
  { text: 'Validate onboarding path comparison between first-time vs returning user in', type: 'FirstTimeVsReturning' }
];

const contexts = [
  { detail: 'using standard API configurations', value: 'standard' },
  { detail: 'routed via legacy gateway adapters', value: 'legacy_adapter' },
  { detail: 'operating under simulated high-latency networks', value: 'high_latency' },
  { detail: 'executing in the staging sandbox container environment', value: 'staging' },
  { detail: 'isolated inside multitenant client schemas', value: 'multitenant' }
];

function getStepsForTestCase(category, moduleName, scenarioType, valueKey) {
  const normCategory = category.toLowerCase();
  if (normCategory.includes('api') || normCategory.includes('unit')) {
    return [
      { action: 'sendRequest', method: scenarioType === 'PermissionDenied' ? 'POST' : 'GET', endpoint: `/api/v1/${moduleName.toLowerCase()}` },
      { action: 'validateResponseCode', expectedStatus: scenarioType === 'PermissionDenied' ? 403 : (scenarioType.includes('Invalid') ? 400 : 200) },
      { action: 'assertJSONSchema', schemaType: moduleName }
    ];
  } else if (normCategory.includes('validation')) {
    return [
      { action: 'loadValidator', schemaName: `${moduleName}Schema` },
      { action: 'validateInput', payload: { type: valueKey } },
      { action: 'assertValidationError', shouldHaveError: scenarioType.includes('Invalid') || scenarioType === 'BoundaryValues' }
    ];
  } else if (normCategory.includes('load') || normCategory.includes('performance')) {
    return [
      { action: 'spawnVirtualUsers', count: scenarioType === 'HappyPath' ? 50 : 500 },
      { action: 'measureThroughput', target: `/api/v1/${moduleName.toLowerCase()}` },
      { action: 'assertPercentile', latencyMs: scenarioType === 'HappyPath' ? 200 : 1500 }
    ];
  } else if (normCategory.includes('deployment')) {
    return [
      { action: 'queryK8sDeployment', name: `digital-chit-${moduleName.toLowerCase()}` },
      { action: 'checkHealthEndpoint', path: '/healthz' },
      { action: 'assertReplicaCount', minReplicas: 2 }
    ];
  } else {
    // UI/UX (Selenium / Appium / general E2E)
    return [
      { action: 'navigate', url: `http://localhost:3000/${moduleName.toLowerCase()}` },
      { action: 'findUIElement', selector: `[data-testid="${moduleName.toLowerCase()}-form"]` },
      { action: 'simulateUserAction', event: scenarioType === 'HappyPath' ? 'submitValid' : 'submitInvalid' },
      { action: 'verifyScreenState', expectedState: scenarioType === 'HappyPath' ? 'successMessage' : 'errorBanner' }
    ];
  }
}

/**
 * Generates a JSON file with 300 unique test definitions across several categories.
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
      
      // Combinatorial selection using idx (ensures 100% uniqueness of triples)
      const moduleIndex = (idx - 1) % modules.length;
      const scenarioIndex = Math.floor((idx - 1) / modules.length) % scenarios.length;
      const contextIndex = Math.floor((idx - 1) / (modules.length * scenarios.length)) % contexts.length;
      
      const moduleObj = modules[moduleIndex];
      const scenarioObj = scenarios[scenarioIndex];
      const contextObj = contexts[contextIndex];
      
      const description = `${scenarioObj.text} ${moduleObj.label} ${contextObj.detail} (Test Case #${idx})`;
      const status = statusOptions[idx % statusOptions.length];
      
      const steps = getStepsForTestCase(category, moduleObj.name, scenarioObj.type, contextObj.value);
      
      specs.push({
        id,
        description,
        category,
        status,
        steps,
        metadata: {
          module: moduleObj.name,
          scenarioType: scenarioObj.type,
          contextValue: contextObj.value
        }
      });
      idx++;
    }
  }

  // Programmatic verification that all 300 test descriptions are unique (Requirement 3)
  const descriptions = specs.map(s => s.description);
  const uniqueDescriptions = new Set(descriptions);
  if (uniqueDescriptions.size !== specs.length) {
    throw new Error(`Duplicate test case descriptions detected! Found ${uniqueDescriptions.size} unique descriptions out of ${specs.length} total.`);
  }
  console.log(`Programmatically checked and verified that all ${specs.length} test descriptions/titles are unique.`);

  const outPath = path.join(__dirname, 'testSpec.json');
  fs.writeFileSync(outPath, JSON.stringify(specs, null, 2), 'utf-8');
  console.log('Created testSpec.json with', count, 'tests for category:', categoryFilter || 'All');
}

const filterArg = process.argv[2];
createTestSpec(filterArg);
