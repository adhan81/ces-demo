const { chromium } = require('playwright');

async function recordMagniteNavigation() {
  console.log('Starting Magnite DV+ Final Recording...');

  const fs = require('fs');
  const recordingsDir = './recordings-final';
  if (!fs.existsSync(recordingsDir)) {
    fs.mkdirSync(recordingsDir, { recursive: true });
  }

  const browser = await chromium.launch({
    headless: true,
    slowMo: 150, // Slightly slower for demo clarity
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
    // ========== LOGIN FLOW ==========
    console.log('Step 1: Navigating to Magnite SSO...');
    await page.goto('https://sso.magnite.com/u/login/identifier?state=hKFo2SBDZlliUEFPb2tialp0WDJsdlRURnpyUmttalNES2l3b6Fur3VuaXZlcnNhbC1sb2dpbqN0aWTZIFN5MnJFNjUyRk9SN0ZiNXNNZ0pDNTYyWHJ4N1NWRjEzo2NpZNkgZjhld1hVaXB3UEdtM01BZDQyOUNHZm9Xc20yWGVINU8', {
      waitUntil: 'networkidle', timeout: 30000
    });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${recordingsDir}/01-login.png` });

    console.log('Step 2: Entering credentials...');
    await page.fill('input[name="username"]', 'amit.grover@redfin.com');
    await page.waitForTimeout(500);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2500);

    await page.waitForSelector('input[type="password"]', { timeout: 10000 });
    await page.fill('input[type="password"]', 'Redfin@ds1');
    await page.waitForTimeout(500);
    await page.click('button[type="submit"]');

    console.log('Step 3: Waiting for dashboard...');
    await page.waitForURL('**/dashboard**', { timeout: 60000 }).catch(() => {});
    await page.waitForTimeout(4000);
    await page.screenshot({ path: `${recordingsDir}/02-dashboard.png` });

    // ========== NAVIGATION ==========
    console.log('Step 4: Navigating to Reporting > Analytics...');
    await page.click('text=Reporting');
    await page.waitForTimeout(1500);
    await page.click('text=Analytics');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: `${recordingsDir}/03-analytics.png` });

    // ========== ACCESS IFRAME ==========
    console.log('Step 5: Accessing report builder...');
    const paFrame = page.frames().find(f => f.url().includes('/pa/'));
    if (!paFrame) throw new Error('Could not find /pa/ iframe');

    await paFrame.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    // Click New Report
    console.log('Step 6: Clicking New Report...');
    await paFrame.click('text=New Report');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: `${recordingsDir}/04-new-report.png` });

    // ========== CONFIGURE DATE RANGE ==========
    console.log('Step 7: Setting date range (Jan 1 - Aug 31, 2025)...');

    // Click on the Time Period field to open date picker
    try {
      await paFrame.click('text=Last 7 Days');
      await page.waitForTimeout(1000);
      await page.screenshot({ path: `${recordingsDir}/05-date-picker.png` });

      // Look for Custom option or date inputs
      const hasCustom = await paFrame.$('text=Custom');
      if (hasCustom) {
        await paFrame.click('text=Custom');
        await page.waitForTimeout(500);
      }

      // Try to find and fill start/end date inputs
      const startInput = await paFrame.$('input[placeholder*="Start"], input[name*="start"]');
      const endInput = await paFrame.$('input[placeholder*="End"], input[name*="end"]');

      if (startInput && endInput) {
        await startInput.fill('01/01/2025');
        await endInput.fill('08/31/2025');
        await page.keyboard.press('Enter');
      }
    } catch (e) {
      console.log('  Date range - using default for now');
    }
    await page.waitForTimeout(1000);

    // ========== ADD DEAL ID FILTER ==========
    console.log('Step 8: Adding Deal ID filter (3768900)...');
    await page.screenshot({ path: `${recordingsDir}/06-before-filter.png` });

    try {
      // Click "Add Filters"
      await paFrame.click('text=Add Filters');
      await page.waitForTimeout(1500);
      await page.screenshot({ path: `${recordingsDir}/07-filter-dialog.png` });

      // Look for Deal ID in the filter options
      // It might be in a dropdown or list
      const dealIdOption = await paFrame.$('text=Deal ID');
      if (dealIdOption) {
        await dealIdOption.click();
        await page.waitForTimeout(500);
      } else {
        // Try searching for it
        const searchInput = await paFrame.$('input[placeholder*="Search"], input[type="search"]');
        if (searchInput) {
          await searchInput.fill('Deal');
          await page.waitForTimeout(500);
          await paFrame.click('text=Deal ID').catch(() => {});
        }
      }
      await page.waitForTimeout(500);
      await page.screenshot({ path: `${recordingsDir}/08-deal-id-selected.png` });

      // Enter the deal ID value
      // Look for an input field to enter the ID
      const valueInputs = await paFrame.$$('input[type="text"]');
      for (const input of valueInputs) {
        const placeholder = await input.getAttribute('placeholder');
        const value = await input.inputValue();
        if (placeholder?.toLowerCase().includes('value') || placeholder?.toLowerCase().includes('enter') || !value) {
          await input.fill('3768900');
          console.log('  Entered Deal ID: 3768900');
          break;
        }
      }
      await page.keyboard.press('Enter');
      await page.waitForTimeout(1000);

    } catch (e) {
      console.log('  Filter step encountered issue:', e.message);
    }
    await page.screenshot({ path: `${recordingsDir}/09-filter-added.png` });

    // ========== RUN REPORT ==========
    console.log('Step 9: Running report...');
    await paFrame.click('button:has-text("Run Report")').catch(async () => {
      await paFrame.click('text=Run Report');
    });
    console.log('  Report running...');

    // Wait for results to load
    await page.waitForTimeout(10000);
    await page.screenshot({ path: `${recordingsDir}/10-report-results.png` });

    // Scroll down to show more results if available
    await paFrame.evaluate(() => window.scrollBy(0, 300));
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${recordingsDir}/11-results-scrolled.png` });

    // Final pause for video
    console.log('Step 10: Capturing final frames...');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: `${recordingsDir}/12-final.png` });

    console.log('Recording complete!');

  } catch (error) {
    console.error('Error:', error.message);
    await page.screenshot({ path: `${recordingsDir}/error.png` });
  } finally {
    console.log('Saving video...');
    await context.close();
    await browser.close();

    // Rename video file
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
