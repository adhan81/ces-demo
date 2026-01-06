/**
 * Simple test script to verify the CES demo works correctly
 * Run with: node test-demo.js
 */

const fs = require('fs');
const path = require('path');

const testResults = {
  passed: [],
  failed: []
};

function testFileExists(filePath, description) {
  const fullPath = path.join(__dirname, filePath);
  if (fs.existsSync(fullPath)) {
    testResults.passed.push(`✓ ${description}: ${filePath} exists`);
    return true;
  } else {
    testResults.failed.push(`✗ ${description}: ${filePath} not found`);
    return false;
  }
}

function testFileContent(filePath, description, checks) {
  const fullPath = path.join(__dirname, filePath);
  if (!fs.existsSync(fullPath)) {
    testResults.failed.push(`✗ ${description}: File not found`);
    return;
  }

  const content = fs.readFileSync(fullPath, 'utf8');
  let allPassed = true;

  checks.forEach(check => {
    if (check.type === 'contains') {
      if (content.includes(check.value)) {
        testResults.passed.push(`✓ ${description}: Contains "${check.value}"`);
      } else {
        testResults.failed.push(`✗ ${description}: Missing "${check.value}"`);
        allPassed = false;
      }
    } else if (check.type === 'notContains') {
      if (!content.includes(check.value)) {
        testResults.passed.push(`✓ ${description}: Does not contain "${check.value}"`);
      } else {
        testResults.failed.push(`✗ ${description}: Should not contain "${check.value}"`);
        allPassed = false;
      }
    }
  });
}

console.log('🧪 Testing CES Demo...\n');

// Test 1: Check main HTML files exist
testFileExists('index.html', 'Main index file');
testFileExists('demo-v2.html', 'Demo v2 file');
testFileExists('demo.html', 'Demo file');

// Test 2: Check index.html redirects correctly
testFileContent('index.html', 'Index redirect', [
  { type: 'contains', value: 'demo-v2.html' }
]);

// Test 3: Check demo-v2.html has required elements
testFileContent('demo-v2.html', 'Demo v2 structure', [
  { type: 'contains', value: '<!DOCTYPE html>' },
  { type: 'contains', value: 'Deal Watch' },
  { type: 'contains', value: 'stage1' },
  { type: 'contains', value: 'stage2' },
  { type: 'contains', value: 'stage3' }
]);

// Test 4: Check for video files
testFileExists('recordings-v7/magnite-recording.webm', 'Magnite recording video');
testFileExists('recordings-bestbuy/floor-change.webm', 'Floor change video');

// Test 5: Check package.json
testFileExists('package.json', 'Package configuration');

// Print results
console.log('\n📊 Test Results:\n');
console.log(`✅ Passed: ${testResults.passed.length}`);
testResults.passed.forEach(result => console.log(`  ${result}`));

if (testResults.failed.length > 0) {
  console.log(`\n❌ Failed: ${testResults.failed.length}`);
  testResults.failed.forEach(result => console.log(`  ${result}`));
  process.exit(1);
} else {
  console.log('\n🎉 All tests passed!');
  process.exit(0);
}

