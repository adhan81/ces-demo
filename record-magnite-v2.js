const { chromium } = require('playwright');

async function recordMagniteNavigation() {
  console.log('Starting Magnite DV+ Recording (final)...');

  const fs = require('fs');
  const recordingsDir = './recordings-demo';
  if (!fs.existsSync(recordingsDir)) {
    fs.mkdirSync(recordingsDir, { recursive: true });
  }

  const browser = await chromium.launch({
    headless: true,
    slowMo: 120,
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: {
      dir: recordingsDir,
      size: { width: 1920, height: 1080 }
    }
  });

  const page = await context.newPage();

  try {
    // ========== LOGIN ==========
    console.log('Step 1: Login flow...');
    await page.goto('https://sso.magnite.com/u/login/identifier?state=hKFo2SBDZlliUEFPb2tialp0WDJsdlRURnpyUmttalNES2l3b6Fur3VuaXZlcnNhbC1sb2dpbqN0aWTZIFN5MnJFNjUyRk9SN0ZiNXNNZ0pDNTYyWHJ4N1NWRjEzo2NpZNkgZjhld1hVaXB3UEdtM01BZDQyOUNHZm9Xc20yWGVINU8', {
      waitUntil: 'networkidle', timeout: 30000
    });
    await page.waitForTimeout(1500);
    await page.fill('input[name="username"]', 'amit.grover@redfin.com');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    await page.waitForSelector('input[type="password"]', { timeout: 10000 });
    await page.fill('input[type="password"]', 'Redfin@ds1');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**', { timeout: 60000 }).catch(() => {});
    await page.waitForTimeout(4000);
    await page.screenshot({ path: `${recordingsDir}/01-dashboard.png` });

    // ========== NAVIGATE TO ANALYTICS ==========
    console.log('Step 2: Navigate to Analytics...');
    await page.click('text=Reporting');
    await page.waitForTimeout(1500);
    await page.click('text=Analytics');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: `${recordingsDir}/02-analytics.png` });

    // ========== ACCESS IFRAME AND CLICK NEW REPORT ==========
    console.log('Step 3: Click New Report...');
    const paFrame = page.frames().find(f => f.url().includes('/pa/'));
    if (!paFrame) throw new Error('Could not find /pa/ iframe');
    await paFrame.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);
    await paFrame.click('text=New Report');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: `${recordingsDir}/03-report-builder.png` });

    // ========== ADD DEAL ID FILTER ==========
    console.log('Step 4: Adding Deal ID filter...');

    // Click "Add Filters" to open the dropdown
    await paFrame.click('text=Add Filters');
    await page.waitForTimeout(1000);

    // Type "Deal" to search
    await page.keyboard.type('Deal');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${recordingsDir}/04-filter-search.png` });

    // Click on "Deal ID" option (not "Buyer Deal ID")
    await paFrame.click('text="Deal ID"');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${recordingsDir}/05-deal-id-selected.png` });

    // Now click on the "Please select" dropdown to choose a deal
    console.log('Step 5: Selecting deal from dropdown...');

    // Click on the ant-select container (the third one, which is the value selector)
    const selects = await paFrame.$$('.ant-select');
    console.log(`  Found ${selects.length} ant-select elements`);
    if (selects.length >= 3) {
      await selects[2].click({ force: true });
      await page.waitForTimeout(1000);
    }
    await page.screenshot({ path: `${recordingsDir}/06-deal-dropdown.png` });

    // Type the deal ID to search in the dropdown
    await page.keyboard.type('TMO');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${recordingsDir}/07-deal-search.png` });

    // Click on the TMobile Mobile option
    try {
      await paFrame.click('text=MGNI-TMO-DisplayMobileWeb');
      console.log('  Selected MGNI-TMO-DisplayMobileWeb');
    } catch (e) {
      // Try clicking the first dropdown item
      await paFrame.click('.ant-select-item-option').catch(() => {});
    }

    await page.screenshot({ path: `${recordingsDir}/08-deal-selected.png` });

    // ========== RUN REPORT ==========
    console.log('Step 6: Running report...');
    await paFrame.click('button:has-text("Run Report")').catch(async () => {
      await paFrame.click('text=Run Report');
    });
    console.log('  Report executing...');

    // Wait for results
    await page.waitForTimeout(10000);
    await page.screenshot({ path: `${recordingsDir}/09-report-results.png` });

    // Final capture
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${recordingsDir}/10-final.png` });

    console.log('Recording complete!');

  } catch (error) {
    console.error('Error:', error.message);
    await page.screenshot({ path: `${recordingsDir}/error.png` });
  } finally {
    console.log('Saving video...');
    await context.close();
    await browser.close();

    const files = fs.readdirSync(recordingsDir);
    const videoFile = files.find(f => f.endsWith('.webm'));
    if (videoFile) {
      fs.renameSync(`${recordingsDir}/${videoFile}`, `${recordingsDir}/magnite-demo.webm`);
      console.log(`Video saved: ${recordingsDir}/magnite-demo.webm`);
    }
    console.log('Done!');
  }
}

recordMagniteNavigation().catch(console.error);
