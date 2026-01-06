const { chromium } = require('playwright');

async function recordMagniteNavigation() {
  console.log('Starting Magnite DV+ recording (headless, full 1920x1080)...');

  const fs = require('fs');
  const recordingsDir = './recordings-v4';
  if (!fs.existsSync(recordingsDir)) {
    fs.mkdirSync(recordingsDir, { recursive: true });
  }

  const browser = await chromium.launch({
    headless: true, // Run headless for full resolution
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

    // Step 6: Click New Report button
    console.log('Step 6: Clicking New Report button...');
    // Use evaluate to find the button reliably
    const clicked = await page.evaluate(() => {
      const elements = document.querySelectorAll('button, a, [role="button"]');
      for (const el of elements) {
        if (el.textContent && el.textContent.trim() === 'New Report') {
          el.click();
          return true;
        }
      }
      // Also try partial match
      for (const el of elements) {
        if (el.textContent && el.textContent.includes('New Report')) {
          el.click();
          return true;
        }
      }
      return false;
    });

    if (clicked) {
      console.log('  Clicked New Report button');
    } else {
      console.log('  Trying selector approach...');
      await page.click('button:has-text("New Report")').catch(() => {});
    }

    await page.waitForTimeout(3000);
    await page.screenshot({ path: `${recordingsDir}/04-report-builder.png` });

    // Step 7: Configure report fields
    console.log('Step 7: Configuring report fields...');

    // The report builder should now be visible - let's see what we have
    const pageContent = await page.content();

    // Look for field selection mechanism
    const fieldsToAdd = ['Date', 'Bid Requests', 'Bid Responses', 'Paid Impressions', 'Publisher Gross Revenue', 'eCPM'];

    for (const field of fieldsToAdd) {
      try {
        // Try clicking checkboxes or list items containing the field name
        const clicked = await page.evaluate((fieldName) => {
          const elements = document.querySelectorAll('label, li, div, span, input[type="checkbox"]');
          for (const el of elements) {
            if (el.textContent && el.textContent.includes(fieldName)) {
              el.click();
              return true;
            }
          }
          return false;
        }, field);

        if (clicked) {
          console.log(`  Added field: ${field}`);
          await page.waitForTimeout(400);
        }
      } catch (e) {
        console.log(`  Could not add field: ${field}`);
      }
    }

    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${recordingsDir}/05-fields-selected.png` });

    // Step 8: Add Deal ID filter
    console.log('Step 8: Adding Deal ID filter...');

    // Look for filter section
    await page.evaluate(() => {
      const elements = document.querySelectorAll('button, a, div, span');
      for (const el of elements) {
        if (el.textContent && (el.textContent.includes('Add Filter') || el.textContent.includes('Filters'))) {
          el.click();
          return true;
        }
      }
      return false;
    });

    await page.waitForTimeout(1000);

    // Try to find Deal ID option
    await page.evaluate(() => {
      const elements = document.querySelectorAll('li, div, span, option');
      for (const el of elements) {
        if (el.textContent && el.textContent.includes('Deal ID')) {
          el.click();
          return true;
        }
      }
      return false;
    });

    await page.waitForTimeout(500);

    // Try to enter the deal ID
    const filterInput = await page.$('input[type="text"]:visible, input[placeholder*="filter"], input[placeholder*="value"]');
    if (filterInput) {
      await filterInput.fill('3768900');
      await page.keyboard.press('Enter');
      console.log('  Entered Deal ID: 3768900');
    }

    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${recordingsDir}/06-filter-added.png` });

    // Step 9: Set date range
    console.log('Step 9: Setting date range (Jan 1 - Aug 31, 2025)...');

    // Look for date range selector
    await page.evaluate(() => {
      const elements = document.querySelectorAll('button, input, div');
      for (const el of elements) {
        if (el.textContent && (el.textContent.includes('Date Range') || el.textContent.includes('Date'))) {
          el.click();
          return true;
        }
      }
      return false;
    });

    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${recordingsDir}/07-date-range.png` });

    // Step 10: Run Report
    console.log('Step 10: Running report...');

    const runClicked = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button');
      for (const btn of buttons) {
        const text = btn.textContent?.trim();
        if (text === 'Run Report' || text === 'Run' || text === 'Generate Report') {
          btn.click();
          return true;
        }
      }
      return false;
    });

    if (runClicked) {
      console.log('  Clicked Run Report');
    }

    // Wait for report results
    console.log('  Waiting for report results...');
    await page.waitForTimeout(8000);
    await page.screenshot({ path: `${recordingsDir}/08-report-results.png` });

    // Final capture
    console.log('Recording complete! Capturing final state...');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${recordingsDir}/09-final.png` });

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
      const newName = 'magnite-recording.webm';
      fs.renameSync(`${recordingsDir}/${videoFile}`, `${recordingsDir}/${newName}`);
      console.log(`Video saved to: ${recordingsDir}/${newName}`);
    }

    console.log('Done!');
  }
}

recordMagniteNavigation().catch(console.error);
