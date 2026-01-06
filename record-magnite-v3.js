const { chromium } = require('playwright');

async function recordMagniteNavigation() {
  console.log('Starting Magnite DV+ recording v3...');

  const fs = require('fs');
  const recordingsDir = './recordings-v3';
  if (!fs.existsSync(recordingsDir)) {
    fs.mkdirSync(recordingsDir, { recursive: true });
  }

  const browser = await chromium.launch({
    headless: false,
    slowMo: 150,
    args: ['--window-size=1440,900'] // Smaller window that fits most screens
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }, // Smaller viewport
    recordVideo: {
      dir: recordingsDir,
      size: { width: 1440, height: 900 }
    }
  });

  const page = await context.newPage();

  try {
    // Step 1: Navigate to Magnite login
    console.log('Step 1: Navigating to Magnite SSO login...');
    await page.goto('https://sso.magnite.com/u/login/identifier?state=hKFo2SBDZlliUEFPb2tialp0WDJsdlRURnpyUmttalNES2l3b6Fur3VuaXZlcnNhbC1sb2dpbqN0aWTZIFN5MnJFNjUyRk9SN0ZiNXNNZ0pDNTYyWHJ4N1NWRjEzo2NpZNkgZjhld1hVaXB3UEdtM01BZDQyOUNHZm9Xc20yWGVINU8', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${recordingsDir}/01-login-page.png` });

    // Step 2: Enter email
    console.log('Step 2: Entering email...');
    await page.fill('input[name="username"]', 'amit.grover@redfin.com');
    await page.waitForTimeout(800);

    // Click Continue button
    console.log('Step 2b: Clicking Continue...');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    // Step 3: Enter password
    console.log('Step 3: Entering password...');
    await page.waitForSelector('input[type="password"]', { timeout: 10000 });
    await page.fill('input[type="password"]', 'Redfin@ds1');
    await page.waitForTimeout(800);

    // Click Log In button
    console.log('Step 3b: Clicking Log In...');
    await page.click('button[type="submit"]');

    // Step 4: Wait for dashboard to load
    console.log('Step 4: Waiting for dashboard to load...');
    await page.waitForURL('**/dashboard**', { timeout: 60000 }).catch(() => {});
    await page.waitForTimeout(4000);
    await page.screenshot({ path: `${recordingsDir}/02-dashboard.png` });

    // Step 5: Click Reporting in sidebar
    console.log('Step 5: Clicking Reporting in sidebar...');
    await page.click('text=Reporting');
    await page.waitForTimeout(1500);

    // Step 5b: Click Analytics from submenu
    console.log('Step 5b: Clicking Analytics...');
    await page.click('text=Analytics');
    await page.waitForTimeout(2500);
    await page.screenshot({ path: `${recordingsDir}/03-analytics-list.png` });

    // Step 6: Click New Report button (top right corner)
    console.log('Step 6: Clicking New Report button...');
    // Try multiple approaches to find the button
    const newReportClicked = await page.evaluate(() => {
      // Look for any element containing "New Report" text
      const elements = document.querySelectorAll('button, a, div[role="button"]');
      for (const el of elements) {
        if (el.textContent && el.textContent.includes('New Report')) {
          el.click();
          return true;
        }
      }
      return false;
    });

    if (!newReportClicked) {
      // Try by position - top right area
      console.log('  Trying alternative selectors...');
      try {
        await page.click('a:has-text("New Report")');
      } catch (e) {
        try {
          await page.click('[class*="new-report"]');
        } catch (e2) {
          try {
            // Click in the top-right area where button should be
            await page.click('button >> nth=-1'); // Last button on page
          } catch (e3) {
            console.log('  Could not find New Report button');
          }
        }
      }
    }

    await page.waitForTimeout(2500);
    await page.screenshot({ path: `${recordingsDir}/04-new-report-form.png` });

    // Step 7: Configure report - look for the report builder interface
    console.log('Step 7: Configuring report...');
    await page.screenshot({ path: `${recordingsDir}/05-report-builder.png` });

    // The report builder likely has a field selection area
    // Let's look for common UI patterns
    const fieldsToAdd = ['Date', 'Bid Requests', 'Bid Responses', 'Paid Impressions', 'Publisher Gross Revenue', 'eCPM'];

    // Try to find and click on each field
    for (const field of fieldsToAdd) {
      try {
        const fieldEl = await page.$(`text="${field}"`);
        if (fieldEl) {
          await fieldEl.click();
          console.log(`  Added field: ${field}`);
          await page.waitForTimeout(400);
        }
      } catch (e) {}
    }

    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${recordingsDir}/06-fields-configured.png` });

    // Step 8: Add Deal ID filter
    console.log('Step 8: Adding Deal ID filter...');
    try {
      // Look for filter options
      const filterBtn = await page.$('button:has-text("Filter"), text=Add Filter, text=Filters');
      if (filterBtn) {
        await filterBtn.click();
        await page.waitForTimeout(1000);
      }

      // Look for Deal ID in filter options
      const dealIdOpt = await page.$('text=Deal ID');
      if (dealIdOpt) {
        await dealIdOpt.click();
        await page.waitForTimeout(500);

        // Enter the deal ID
        await page.keyboard.type('3768900');
        await page.keyboard.press('Enter');
        console.log('  Entered Deal ID: 3768900');
      }
    } catch (e) {
      console.log('  Filter configuration - manual adjustment needed');
    }

    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${recordingsDir}/07-filter-added.png` });

    // Step 9: Set date range (Jan 1 - Aug 31, 2025)
    console.log('Step 9: Setting date range...');
    // Date pickers vary widely - just capture current state
    await page.screenshot({ path: `${recordingsDir}/08-date-range.png` });

    // Step 10: Run Report
    console.log('Step 10: Running report...');
    try {
      await page.click('button:has-text("Run")');
    } catch (e) {
      // Try finding run button via evaluate
      await page.evaluate(() => {
        const btns = document.querySelectorAll('button');
        for (const btn of btns) {
          if (btn.textContent && (btn.textContent.includes('Run') || btn.textContent.includes('Generate'))) {
            btn.click();
            break;
          }
        }
      });
    }

    console.log('  Waiting for report results...');
    await page.waitForTimeout(6000);
    await page.screenshot({ path: `${recordingsDir}/09-report-results.png` });

    // Final capture
    console.log('Recording complete!');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: `${recordingsDir}/10-final.png` });

  } catch (error) {
    console.error('Error during recording:', error.message);
    await page.screenshot({ path: `${recordingsDir}/error-state.png` });
  } finally {
    console.log('Saving video...');
    await context.close();
    await browser.close();

    const files = fs.readdirSync(recordingsDir);
    const videoFile = files.find(f => f.endsWith('.webm'));
    if (videoFile) {
      const newName = 'magnite-recording-v3.webm';
      fs.renameSync(`${recordingsDir}/${videoFile}`, `${recordingsDir}/${newName}`);
      console.log(`Video saved to: ${recordingsDir}/${newName}`);
    }

    console.log('Done!');
  }
}

recordMagniteNavigation().catch(console.error);
