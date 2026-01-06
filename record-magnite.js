const { chromium } = require('playwright');

async function recordMagniteNavigation() {
  console.log('Starting Magnite DV+ recording...');

  // Create recordings directory
  const fs = require('fs');
  const recordingsDir = './recordings';
  if (!fs.existsSync(recordingsDir)) {
    fs.mkdirSync(recordingsDir, { recursive: true });
  }

  const browser = await chromium.launch({
    headless: false,
    slowMo: 100, // Slow down actions for visibility
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

    // Step 2: Enter email
    console.log('Step 2: Entering email...');
    const emailInput = await page.waitForSelector('input[name="username"], input[type="email"], input[id="username"]', { timeout: 10000 });
    await emailInput.fill('amit.grover@redfin.com');
    await page.waitForTimeout(800);

    // Click Continue button
    console.log('Step 2b: Clicking Continue...');
    const continueBtn = await page.waitForSelector('button[type="submit"], button:has-text("Continue")', { timeout: 5000 });
    await continueBtn.click();
    await page.waitForTimeout(2000);

    // Step 3: Enter password
    console.log('Step 3: Entering password...');
    const passwordInput = await page.waitForSelector('input[name="password"], input[type="password"]', { timeout: 10000 });
    await passwordInput.fill('Redfin@ds1');
    await page.waitForTimeout(800);

    // Click Log In button
    console.log('Step 3b: Clicking Log In...');
    const loginBtn = await page.waitForSelector('button[type="submit"], button:has-text("Log In"), button:has-text("Login")', { timeout: 5000 });
    await loginBtn.click();

    // Step 4: Wait for dashboard to load
    console.log('Step 4: Waiting for dashboard to load...');
    await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 60000 }).catch(() => {});
    await page.waitForTimeout(4000);

    // Take a screenshot of dashboard
    await page.screenshot({ path: `${recordingsDir}/01-dashboard.png` });

    // Step 5: Click Reporting in sidebar
    console.log('Step 5: Clicking Reporting in sidebar...');
    // Try multiple selectors for the Reporting menu item
    const reportingSelectors = [
      'text=Reporting',
      '[data-testid="reporting"]',
      'a:has-text("Reporting")',
      'nav >> text=Reporting',
      '.sidebar >> text=Reporting',
      'aside >> text=Reporting'
    ];

    let reportingClicked = false;
    for (const selector of reportingSelectors) {
      try {
        const element = await page.waitForSelector(selector, { timeout: 3000 });
        if (element) {
          await element.click();
          reportingClicked = true;
          console.log(`  Found Reporting with selector: ${selector}`);
          break;
        }
      } catch (e) {
        // Try next selector
      }
    }

    if (!reportingClicked) {
      console.log('  Could not find Reporting, trying to explore page...');
      await page.screenshot({ path: `${recordingsDir}/debug-looking-for-reporting.png` });
    }

    await page.waitForTimeout(1500);

    // Step 5b: Click Analytics from submenu
    console.log('Step 5b: Clicking Analytics...');
    const analyticsSelectors = [
      'text=Analytics',
      'a:has-text("Analytics")',
      '[data-testid="analytics"]'
    ];

    for (const selector of analyticsSelectors) {
      try {
        const element = await page.waitForSelector(selector, { timeout: 3000 });
        if (element) {
          await element.click();
          console.log(`  Found Analytics with selector: ${selector}`);
          break;
        }
      } catch (e) {
        // Try next selector
      }
    }

    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${recordingsDir}/02-analytics.png` });

    // Step 6: Click New Report
    console.log('Step 6: Clicking New Report...');
    const newReportSelectors = [
      'button:has-text("New Report")',
      'text=New Report',
      'a:has-text("New Report")',
      '[data-testid="new-report"]',
      'button:has-text("Create Report")',
      'button:has-text("+ New")'
    ];

    for (const selector of newReportSelectors) {
      try {
        const element = await page.waitForSelector(selector, { timeout: 3000 });
        if (element) {
          await element.click();
          console.log(`  Found New Report with selector: ${selector}`);
          break;
        }
      } catch (e) {
        // Try next selector
      }
    }

    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${recordingsDir}/03-new-report.png` });

    // Step 7: Add report fields
    console.log('Step 7: Adding report fields...');
    const fields = ['Date', 'Bid Requests', 'Bid Responses', 'Paid Impressions', 'Publisher Gross Revenue', 'eCPM'];

    for (const field of fields) {
      console.log(`  Adding field: ${field}`);
      try {
        // Look for field selector/dropdown
        const fieldElement = await page.waitForSelector(`text="${field}"`, { timeout: 3000 });
        if (fieldElement) {
          await fieldElement.click();
          await page.waitForTimeout(500);
        }
      } catch (e) {
        console.log(`  Could not find field: ${field}`);
      }
    }

    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${recordingsDir}/04-fields-added.png` });

    // Step 8: Add Filters - Deal ID
    console.log('Step 8: Adding filters...');
    try {
      const addFiltersBtn = await page.waitForSelector('button:has-text("Add Filters"), text="Add Filters", button:has-text("Filter")', { timeout: 5000 });
      await addFiltersBtn.click();
      await page.waitForTimeout(1000);

      // Select Deal ID filter
      const dealIdOption = await page.waitForSelector('text="Deal ID"', { timeout: 3000 });
      await dealIdOption.click();
      await page.waitForTimeout(500);

      // Enter Deal ID value
      const filterInput = await page.waitForSelector('input[placeholder*="Deal"], input[type="text"]:visible', { timeout: 3000 });
      await filterInput.fill('3768900');
      await page.waitForTimeout(300);

      // Press Enter (important!)
      await page.keyboard.press('Enter');
      console.log('  Pressed Enter after Deal ID');

    } catch (e) {
      console.log('  Filter section - may need manual adjustment');
    }

    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${recordingsDir}/05-filter-added.png` });

    // Step 9: Set date range
    console.log('Step 9: Setting date range (Jan 1 - Aug 31, 2025)...');
    try {
      // Look for date picker
      const datePickerSelectors = [
        'input[type="date"]',
        '[data-testid="date-range"]',
        'button:has-text("Date Range")',
        'text="Date Range"'
      ];

      for (const selector of datePickerSelectors) {
        try {
          const element = await page.waitForSelector(selector, { timeout: 2000 });
          if (element) {
            await element.click();
            break;
          }
        } catch (e) {
          // Try next
        }
      }

      await page.waitForTimeout(500);

      // Try to find start/end date inputs
      const startDateInput = await page.waitForSelector('input[name="startDate"], input[placeholder*="Start"]', { timeout: 2000 }).catch(() => null);
      if (startDateInput) {
        await startDateInput.fill('2025-01-01');
      }

      const endDateInput = await page.waitForSelector('input[name="endDate"], input[placeholder*="End"]', { timeout: 2000 }).catch(() => null);
      if (endDateInput) {
        await endDateInput.fill('2025-08-31');
      }

    } catch (e) {
      console.log('  Date range - may need manual adjustment');
    }

    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${recordingsDir}/06-date-range.png` });

    // Step 10: Run Report
    console.log('Step 10: Running report...');
    const runReportSelectors = [
      'button:has-text("Run Report")',
      'button:has-text("Run")',
      'button[type="submit"]:has-text("Run")',
      'text="Run Report"'
    ];

    for (const selector of runReportSelectors) {
      try {
        const element = await page.waitForSelector(selector, { timeout: 3000 });
        if (element) {
          await element.click();
          console.log(`  Clicked Run Report with selector: ${selector}`);
          break;
        }
      } catch (e) {
        // Try next selector
      }
    }

    // Wait for report to load
    console.log('  Waiting for report results...');
    await page.waitForTimeout(5000);
    await page.screenshot({ path: `${recordingsDir}/07-report-results.png` });

    // Keep the page open for a moment to capture final state
    console.log('Recording complete! Capturing final frames...');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: `${recordingsDir}/08-final.png` });

  } catch (error) {
    console.error('Error during recording:', error.message);
    await page.screenshot({ path: `${recordingsDir}/error-state.png` });
  } finally {
    // Close context to save the video
    console.log('Saving video...');
    await context.close();
    await browser.close();

    // Find and rename the video file
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
