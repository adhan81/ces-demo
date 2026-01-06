const { chromium } = require('playwright');

/**
 * Magnite DV+ Recording Script - Best Buy Version
 *
 * This script records navigation through the Magnite platform, injecting
 * JavaScript to display "Best Buy" in place of actual deal names for demo purposes.
 */

async function recordMagniteNavigation() {
  console.log('Starting Magnite DV+ recording (Best Buy version)...');

  const fs = require('fs');
  const recordingsDir = './recordings-bestbuy';
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

  // Helper function to inject Best Buy branding into page elements
  async function injectBestBuyBranding(target) {
    await target.evaluate(() => {
      // Replace deal names in table cells, spans, and divs
      const textNodes = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );

      let node;
      while (node = textNodes.nextNode()) {
        // Replace T-Mobile or similar placeholder text with Best Buy
        if (node.textContent.includes('T-Mobile')) {
          node.textContent = node.textContent.replace(/T-Mobile/g, 'Best Buy');
        }
        // Also handle common deal name patterns
        if (node.textContent.match(/Deal\s*ID.*3768900/i)) {
          node.textContent = node.textContent.replace('3768900', 'Best Buy Mobile');
        }
      }

      // Update any input fields that might show deal names
      document.querySelectorAll('input').forEach(input => {
        if (input.value.includes('T-Mobile')) {
          input.value = input.value.replace(/T-Mobile/g, 'Best Buy');
        }
      });
    });
  }

  try {
    // ==========================================
    // STEP 1-4: Login Flow
    // ==========================================
    console.log('Step 1-4: Login...');
    await page.goto('https://sso.magnite.com/u/login/identifier?state=hKFo2SBDZlliUEFPb2tialp0WDJsdlRURnpyUmttalNES2l3b6Fur3VuaXZlcnNhbC1sb2dpbqN0aWTZIFN5MnJFNjUyRk9SN0ZiNXNNZ0pDNTYyWHJ4N1NWRjEzo2NpZNkgZjhld1hVaXB3UEdtM01BZDQyOUNHZm9Xc20yWGVINU8', {
      waitUntil: 'networkidle', timeout: 30000
    });

    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${recordingsDir}/01-login.png` });

    await page.fill('input[name="username"]', 'amit.grover@redfin.com');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    await page.waitForSelector('input[type="password"]', { timeout: 10000 });
    await page.fill('input[type="password"]', 'Redfin@ds1');
    await page.click('button[type="submit"]');

    await page.waitForURL('**/dashboard**', { timeout: 60000 }).catch(() => {});
    await page.waitForTimeout(4000);
    await page.screenshot({ path: `${recordingsDir}/02-dashboard.png` });
    console.log('  Logged in successfully');

    // ==========================================
    // STEP 5: Navigate to Analytics
    // ==========================================
    console.log('Step 5: Navigate to Analytics...');
    await page.click('text=Reporting');
    await page.waitForTimeout(1500);
    await page.click('text=Analytics');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: `${recordingsDir}/03-analytics.png` });

    // ==========================================
    // STEP 6: Find /pa/ iframe and open New Report
    // ==========================================
    console.log('Step 6: Finding /pa/ iframe and clicking New Report...');

    const paFrame = page.frames().find(f => f.url().includes('/pa/'));
    if (!paFrame) {
      throw new Error('Could not find /pa/ iframe');
    }
    console.log(`  Found /pa/ frame: ${paFrame.url()}`);

    await paFrame.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    // Click "New Report" in the iframe
    console.log('  Clicking New Report in iframe...');
    await paFrame.click('text=New Report');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: `${recordingsDir}/04-new-report.png` });

    // ==========================================
    // STEP 7: Configure report fields
    // ==========================================
    console.log('Step 7: Configuring report fields...');

    const fields = ['Date', 'Ad Requests', 'Auctions', 'Ad Responses', 'Paid Impressions', 'Publisher Gross Revenue', 'eCPM'];

    for (const field of fields) {
      try {
        const el = await paFrame.$(`text="${field}"`);
        if (el) {
          await el.click();
          console.log(`  Selected field: ${field}`);
          await page.waitForTimeout(400);
        } else {
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
    await page.screenshot({ path: `${recordingsDir}/05-fields-selected.png` });

    // ==========================================
    // STEP 8: Add Deal/Advertiser filter
    // ==========================================
    console.log('Step 8: Adding filter...');

    try {
      // Look for filter section
      const addFilterBtn = await paFrame.$('text=Add Filter');
      if (addFilterBtn) {
        await addFilterBtn.click();
        await page.waitForTimeout(1500);
        await page.screenshot({ path: `${recordingsDir}/06-filter-dialog.png` });
      }

      // Try to select Deal ID or Advertiser filter
      const dealIdOption = await paFrame.$('text=Deal ID');
      if (dealIdOption) {
        await dealIdOption.click();
        await page.waitForTimeout(500);
      }

      // Enter a deal ID (the actual value will be replaced visually)
      const inputs = await paFrame.$$('input[type="text"]');
      if (inputs.length > 0) {
        await inputs[inputs.length - 1].fill('3768900');
        await paFrame.keyboard.press('Enter');
        console.log('  Entered filter value');
      }

      await page.screenshot({ path: `${recordingsDir}/07-filter-added.png` });
    } catch (e) {
      console.log('  Filter step - manual adjustment may be needed:', e.message);
    }

    await page.waitForTimeout(1000);

    // ==========================================
    // STEP 9: Set date range
    // ==========================================
    console.log('Step 9: Setting date range...');

    try {
      // Look for date range controls
      const dateRange = await paFrame.$('text=Last 7 Days');
      if (dateRange) {
        await dateRange.click();
        await page.waitForTimeout(500);

        // Try to select a longer range
        const last30 = await paFrame.$('text=Last 30 Days');
        if (last30) {
          await last30.click();
        }
      }
    } catch (e) {
      console.log('  Date range - using default');
    }

    await page.screenshot({ path: `${recordingsDir}/08-date-range.png` });

    // ==========================================
    // STEP 10: Run Report
    // ==========================================
    console.log('Step 10: Running report...');

    try {
      await paFrame.click('button:has-text("Run Report")');
      console.log('  Clicked Run Report');
    } catch (e) {
      try {
        await paFrame.click('button:has-text("Run")');
        console.log('  Clicked Run');
      } catch (e2) {
        await paFrame.click('text=Run Report').catch(() => {
          console.log('  Could not find Run button');
        });
      }
    }

    // Wait for report to generate
    console.log('  Waiting for report results...');
    await page.waitForTimeout(8000);

    // ==========================================
    // STEP 11: Inject Best Buy branding and capture
    // ==========================================
    console.log('Step 11: Injecting Best Buy branding...');

    // Inject into main page
    await injectBestBuyBranding(page);

    // Also inject into the iframe
    try {
      await paFrame.evaluate(() => {
        // Replace any T-Mobile references with Best Buy in the results
        const walker = document.createTreeWalker(
          document.body,
          NodeFilter.SHOW_TEXT,
          null,
          false
        );

        let node;
        while (node = walker.nextNode()) {
          if (node.textContent.includes('T-Mobile')) {
            node.textContent = node.textContent.replace(/T-Mobile/g, 'Best Buy');
          }
        }

        // Update table cells specifically
        document.querySelectorAll('td, th').forEach(cell => {
          if (cell.textContent.includes('T-Mobile')) {
            cell.textContent = cell.textContent.replace(/T-Mobile/g, 'Best Buy');
          }
        });
      });
    } catch (e) {
      console.log('  Could not inject into iframe:', e.message);
    }

    await page.waitForTimeout(500);
    await page.screenshot({ path: `${recordingsDir}/09-report-results.png` });

    // Scroll down to show more results
    try {
      await paFrame.evaluate(() => window.scrollBy(0, 300));
    } catch (e) {
      await page.evaluate(() => window.scrollBy(0, 300));
    }

    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${recordingsDir}/10-results-scrolled.png` });

    // Final capture
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${recordingsDir}/11-final.png` });

    console.log('Recording complete!');

  } catch (error) {
    console.error('Error:', error.message);
    await page.screenshot({ path: `${recordingsDir}/error.png` });
  } finally {
    console.log('Saving video...');
    await context.close();
    await browser.close();

    // Rename the video file
    const files = fs.readdirSync(recordingsDir);
    const videoFile = files.find(f => f.endsWith('.webm'));
    if (videoFile) {
      fs.renameSync(`${recordingsDir}/${videoFile}`, `${recordingsDir}/magnite-bestbuy.webm`);
      console.log(`Video saved: ${recordingsDir}/magnite-bestbuy.webm`);
    }
    console.log('Done!');
  }
}

recordMagniteNavigation().catch(console.error);
