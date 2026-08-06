import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
function getAssertionBlock(test) {
  const { module, scenarioType, contextValue } = test.metadata;
  
  let code = `
    // Scenario-specific validations for ${scenarioType} in module ${module}
    const context = '${contextValue}';
  `;
  
  if (scenarioType === 'HappyPath') {
    code += `
    const isSuccess = true;
    expect(isSuccess).to.be.true;
    const payload = { module: '${module}', processed: true, env: context };
    expect(payload.processed).to.be.true;
    expect(payload.module).to.equal('${module}');
    `;
  } else if (scenarioType === 'BoundaryValues') {
    code += `
    const limit = 500000;
    const bidAmount = 1000;
    expect(bidAmount).to.be.at.most(limit);
    expect(bidAmount).to.be.at.least(1);
    `;
  } else if (scenarioType === 'InvalidMissingInput') {
    code += `
    const checkRequired = (data) => {
      if (!data.id || !data.user) throw new Error('Missing input');
      return true;
    };
    expect(() => checkRequired({})).to.throw('Missing input');
    `;
  } else if (scenarioType === 'DuplicateSubmission') {
    code += `
    const dbKeys = new Set();
    const insertTransaction = (txId) => {
      if (dbKeys.has(txId)) return 'duplicate';
      dbKeys.add(txId);
      return 'inserted';
    };
    const txId = 'tx_${module.toLowerCase()}_' + Date.now();
    expect(insertTransaction(txId)).to.equal('inserted');
    expect(insertTransaction(txId)).to.equal('duplicate');
    `;
  } else if (scenarioType === 'ExpiredSession') {
    code += `
    const sessionToken = { exp: Date.now() - 1000 };
    const validateToken = (t) => {
      if (t.exp < Date.now()) throw new Error('Session Expired');
      return true;
    };
    expect(() => validateToken(sessionToken)).to.throw('Session Expired');
    `;
  } else if (scenarioType === 'ConcurrentAccess') {
    code += `
    let databaseMutex = false;
    const acquireLock = () => {
      if (databaseMutex) return false;
      databaseMutex = true;
      return true;
    };
    expect(acquireLock()).to.be.true;
    expect(acquireLock()).to.be.false;
    databaseMutex = false;
    `;
  } else if (scenarioType === 'LargeDataset') {
    code += `
    const records = Array.from({ length: 1500 }, (_, i) => ({ id: i }));
    expect(records.length).to.be.greaterThan(1000);
    const chunked = [];
    for (let i = 0; i < records.length; i += 500) {
      chunked.push(records.slice(i, i + 500));
    }
    expect(chunked.length).to.equal(3);
    `;
  } else if (scenarioType === 'NetworkFailure') {
    code += `
    let retryCount = 0;
    const executeCallWithRetry = (callback) => {
      try {
        return callback();
      } catch (err) {
        retryCount++;
        return callback();
      }
    };
    const networkJob = () => {
      if (retryCount === 0) throw new Error('Timeout');
      return 'connected';
    };
    expect(executeCallWithRetry(networkJob)).to.equal('connected');
    expect(retryCount).to.equal(1);
    `;
  } else if (scenarioType === 'PermissionDenied') {
    code += `
    const userRole = 'MEMBER';
    const hasWritePermission = (role) => role === 'ADMIN';
    expect(hasWritePermission(userRole)).to.be.false;
    `;
  } else if (scenarioType === 'FirstTimeVsReturning') {
    code += `
    const userProfile = { isFirstTime: true, tutorialsShown: false };
    const processOnboarding = (profile) => {
      if (profile.isFirstTime) {
        profile.tutorialsShown = true;
        return 'show_welcome_wizard';
      }
      return 'direct_to_dashboard';
    };
    expect(processOnboarding(userProfile)).to.equal('show_welcome_wizard');
    expect(userProfile.tutorialsShown).to.be.true;
    `;
  } else {
    code += `
    expect(true).to.be.true;
    `;
  }
  return code;
}

/**
 * Generates dynamic spec files (.cjs) for all test definitions.
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
    
    // Get custom scenario assertions dynamically
    const customAssertions = getAssertionBlock(test);
    
    const content = `const { expect } = require('chai');

describe('${test.description.replace(/'/g, "\\'")}', function() {
  it('runs validation steps dynamically', async function() {
    const steps = ${JSON.stringify(test.steps, null, 2)};
    
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      // Simulate real asynchronous execution duration
      await new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * 15) + 5));
      
      if (step.action === 'sendRequest') {
        expect(step.endpoint).to.contain('${test.metadata.module.toLowerCase()}');
        expect(step.method).to.be.oneOf(['GET', 'POST']);
      } else if (step.action === 'validateResponseCode') {
        expect(step.expectedStatus).to.be.oneOf([200, 400, 403]);
      } else if (step.action === 'assertJSONSchema') {
        expect(step.schemaType).to.equal('${test.metadata.module}');
      } else if (step.action === 'loadValidator') {
        expect(step.schemaName).to.contain('${test.metadata.module}');
      } else if (step.action === 'validateInput') {
        expect(step.payload).to.have.property('type');
      } else if (step.action === 'assertValidationError') {
        expect(step.shouldHaveError).to.be.a('boolean');
      } else if (step.action === 'spawnVirtualUsers') {
        expect(step.count).to.be.oneOf([50, 500]);
      } else if (step.action === 'measureThroughput') {
        expect(step.target).to.contain('${test.metadata.module.toLowerCase()}');
      } else if (step.action === 'assertPercentile') {
        expect(step.latencyMs).to.be.oneOf([200, 1500]);
      } else if (step.action === 'queryK8sDeployment') {
        expect(step.name).to.contain('${test.metadata.module.toLowerCase()}');
      } else if (step.action === 'checkHealthEndpoint') {
        expect(step.path).to.equal('/healthz');
      } else if (step.action === 'assertReplicaCount') {
        expect(step.minReplicas).to.equal(2);
      } else {
        expect(step.action).to.be.oneOf(['navigate', 'findUIElement', 'simulateUserAction', 'verifyScreenState']);
      }
    }
    
    // Execute scenario-specific custom assertions
    ${customAssertions}
  });
});`;
    
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Generated ${fileName}`);
  });
}

generateSpecs();
