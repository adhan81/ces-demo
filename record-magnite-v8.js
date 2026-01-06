const { chromium } = require('playwright');

async function recordMagniteNavigation() {
  console.log('Starting Magnite DV+ recording v8 (iframe-aware)...');

  const fs = require('fs');
  const recordingsDir = './recordings-v8';
  if (!fs.existsSync(recordingsDir)) {
    fs.mkdirSync(recordingsDir, { recursive: true });
  }

  const browser = await chromium.launch({
    headless: true,
    slowMo: 100,
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
    // Login flow
    console.log('Step 1-4: Login...');
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

    // Navigate to Analytics
    console.log('Step 5: Navigate to Analytics...');
    await page.click('text=Reporting');
    await page.waitForTimeout(1500);
    await page.click('text=Analytics');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: `${recordingsDir}/02-analytics.png` });

    // Step 6: Get the /pa/ iframe and click New Report
    console.log('Step 6: Finding /pa/ iframe and clicking New Report...');

    // Find the iframe containing /pa/
    const paFrame = page.frames().find(f => f.url().includes('/pa/'));
    if (!paFrame) {
      throw new Error('Could not find /pa/ iframe');
    }
    console.log(`  Found /pa/ frame: ${paFrame.url()}`);

    // Wait for the frame to be ready
    await paFrame.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    // Click "New Report" in the iframe
    console.log('  Clicking New Report in iframe...');
    await paFrame.click('text=New Report');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: `${recordingsDir}/03-new-report-form.png` });

    // Step 7: Configure report fields
    console.log('Step 7: Configuring report fields...');

    // Check what's in the frame now
    const frameText = await paFrame.evaluate(() => document.body.innerText.substring(0, 500));
    console.log('  Frame content preview:', frameText.substring(0, 200));

    // Look for field selectors - common patterns: checkboxes, dropdowns, or multi-select
    const fields = ['Date', 'Bid Requests', 'Bid Responses', 'Paid Impressions', 'Publisher Gross Revenue', 'eCPM'];

    for (const field of fields) {
      try {
        // Try to find and click the field
        const el = await paFrame.$(`text="${field}"`);
        if (el) {
          await el.click();
          console.log(`  Selected field: ${field}`);
          await page.waitForTimeout(400);
        } else {
          // Try partial match
          const partial = await paFrame.$(`text=${field}`);
          if (partial) {
            await partial.click();
            console.log(`  Selected field (partial): ${field}`);
            await page.waitForTimeout(400);
          }
        }
      } catch (e) {
        console.log(`  Could not find field: ${field}`);
      }
    }

    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${recordingsDir}/04-fields-selected.png` });

    // Step 8: Add Deal ID filter
    console.log('Step 8: Adding Deal ID filter...');
    try {
      // Look for filter section
      const addFilterBtn = await paFrame.$('text=Add Filter');
      if (addFilterBtn) {
        await addFilterBtn.click();
        await page.waitForTimeout(1000);
      } else {
        // Try "Filters" text
        await paFrame.click('text=Filters').catch(() => {});
      }

      // Find Deal ID option
      await paFrame.click('text=Deal ID').catch(() => {});
      await page.waitForTimeout(500);

      // Enter deal ID
      const inputs = await paFrame.$$('input[type="text"]');
      if (inputs.length > 0) {
        await inputs[inputs.length - 1].fill('3768900');
        await paFrame.keyboard.press('Enter');
        console.log('  Entered Deal ID: 3768900');
      }
    } catch (e) {
      console.log('  Filter step - manual adjustment may be needed');
    }

    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${recordingsDir}/05-filter-added.png` });

    // Step 9: Set date range (Jan 1 - Aug 31, 2025)
    console.log('Step 9: Setting date range...');
    try {
      // Look for date range controls
      await paFrame.click('text=Date Range').catch(() => {});
      await page.waitForTimeout(500);
    } catch (e) {}
    await page.screenshot({ path: `${recordingsDir}/06-date-range.png` });

    // Step 10: Run Report
    console.log('Step 10: Running report...');
    try {
      await paFrame.click('button:has-text("Run Report")');
      console.log('  Clicked Run Report');
    } catch (e) {
      try {
        await paFrame.click('button:has-text("Run")');
        console.log('  Clicked Run');
      } catch (e2) {
        console.log('  Could not find Run button');
      }
    }

    // Wait for report to generate
    console.log('  Waiting for report results...');
    await page.waitForTimeout(8000);
    await page.screenshot({ path: `${recordingsDir}/07-report-results.png` });

    // Final capture
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${recordingsDir}/08-final.png` });
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
      fs.renameSync(`${recordingsDir}/${videoFile}`, `${recordingsDir}/magnite-recording.webm`);
      console.log(`Video saved: ${recordingsDir}/magnite-recording.webm`);
    }
    console.log('Done!');
  }
}

recordMagniteNavigation().catch(console.error);
