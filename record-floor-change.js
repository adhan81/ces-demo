const { chromium } = require('playwright');

/**
 * Magnite DV+ Floor Change Recording Script
 *
 * Records the workflow for changing a deal's price floor:
 * 1. Login
 * 2. Navigate to Campaigns → Deals Management → My Deals
 * 3. Click on deal (inject "Best Buy" name)
 * 4. Go to Rules tab
 * 5. Click Edit icon
 * 6. Change floor value from $0.30 to $1.15
 */

async function recordFloorChange() {
  console.log('Starting Magnite Floor Change recording...');

  const fs = require('fs');
  const recordingsDir = './recordings-bestbuy';
  if (!fs.existsSync(recordingsDir)) {
    fs.mkdirSync(recordingsDir, { recursive: true });
  }

  const browser = await chromium.launch({
    headless: false, // Set to true for headless recording
    slowMo: 150,     // Slow down for visibility
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: {
      dir: recordingsDir,
      size: { width: 1920, height: 1080 }
    }
  });

  const page = await context.newPage();

  // Helper function to inject Best Buy branding
  async function injectBestBuyBranding() {
    await page.evaluate(() => {
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );
      let node;
      while (node = walker.nextNode()) {
        // Replace any deal names with Best Buy
        if (node.textContent.match(/T-Mobile|Deal\s*\d+|Sample Deal/i)) {
          node.textContent = node.textContent.replace(/T-Mobile|Deal\s*\d+|Sample Deal/gi, 'Best Buy');
        }
      }
    });
  }

  try {
    // ==========================================
    // STEP 1: Login
    // ==========================================
    console.log('Step 1: Logging in...');
    await page.goto('https://sso.magnite.com/u/login/identifier?state=hKFo2SBDZlliUEFPb2tialp0WDJsdlRURnpyUmttalNES2l3b6Fur3VuaXZlcnNhbC1sb2dpbqN0aWTZIFN5MnJFNjUyRk9SN0ZiNXNNZ0pDNTYyWHJ4N1NWRjEzo2NpZNkgZjhld1hVaXB3UEdtM01BZDQyOUNHZm9Xc20yWGVINU8', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    await page.waitForTimeout(1000);
    await page.fill('input[name="username"]', 'amit.grover@redfin.com');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    await page.waitForSelector('input[type="password"]', { timeout: 10000 });
    await page.fill('input[type="password"]', 'Redfin@ds1');
    await page.click('button[type="submit"]');

    await page.waitForURL('**/dashboard**', { timeout: 60000 }).catch(() => {});
    await page.waitForTimeout(3000);
    console.log('  Logged in successfully');
    await page.screenshot({ path: `${recordingsDir}/floor-01-dashboard.png` });

    // ==========================================
    // STEP 2: Navigate to Campaigns → Deals Management
    // ==========================================
    console.log('Step 2: Navigating to Campaigns → Deals Management...');

    await page.click('text=Campaigns');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${recordingsDir}/floor-02-campaigns-menu.png` });

    await page.click('text=Deals Management');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: `${recordingsDir}/floor-03-deals-management.png` });

    // ==========================================
    // STEP 3: Click "My Deals" tab
    // ==========================================
    console.log('Step 3: Clicking My Deals tab...');

    // Wait for page to fully load before trying to click
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Retry logic - try clicking My Deals up to 3 times
    let clicked = false;
    for (let attempt = 1; attempt <= 3 && !clicked; attempt++) {
      try {
        console.log(`  Attempt ${attempt} to click My Deals...`);
        await page.waitForSelector('text=My Deals', { timeout: 5000 });
        await page.click('text=My Deals');
        await page.waitForTimeout(2000);

        // Verify we moved to My Deals by checking URL or page content changed
        const pageContent = await page.content();
        if (pageContent.includes('My Deals') || attempt === 3) {
          clicked = true;
          console.log('  Successfully clicked My Deals tab');
        }
      } catch (e) {
        console.log(`  Attempt ${attempt} failed, retrying...`);
        await page.waitForTimeout(2000);
      }
    }

    await page.waitForTimeout(3000);

    // Wait for deals to load
    await page.waitForSelector('table tbody tr', { timeout: 20000 }).catch(() => {
      console.log('  Waiting for deals table...');
    });
    await page.waitForTimeout(2000);

    // Inject Best Buy branding into deal names
    await injectBestBuyBranding();
    await page.waitForTimeout(500);

    await page.screenshot({ path: `${recordingsDir}/floor-04-my-deals.png` });

    // ==========================================
    // STEP 4: Click on a deal (first one in list)
    // ==========================================
    console.log('Step 4: Selecting a deal...');

    // Inject Best Buy name before clicking
    await injectBestBuyBranding();

    // Click on first deal row in the table
    const dealRow = await page.$('table tbody tr:first-child td:first-child');
    if (dealRow) {
      await dealRow.click();
      console.log('  Clicked first deal');
    } else {
      // Try clicking any row
      await page.click('table tbody tr:first-child').catch(() => {
        console.log('  Could not click deal row');
      });
    }

    await page.waitForTimeout(3000);
    await injectBestBuyBranding();
    await page.screenshot({ path: `${recordingsDir}/floor-05-deal-selected.png` });

    // ==========================================
    // STEP 5: Click "Rules" tab
    // ==========================================
    console.log('Step 5: Clicking Rules tab...');

    try {
      await page.click('text=Rules');
    } catch (e) {
      await page.click('[role="tab"]:has-text("Rules")').catch(() => {});
    }
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${recordingsDir}/floor-06-rules-tab.png` });

    // ==========================================
    // STEP 6: Click Edit icon in Actions column
    // ==========================================
    console.log('Step 6: Clicking Edit icon...');

    // Try various selectors for the edit icon
    const editSelectors = [
      '[aria-label="Edit"]',
      '[title="Edit"]',
      'button:has-text("Edit")',
      '.edit-icon',
      '.action-edit',
      'table tbody tr:first-child td:last-child button:first-child',
      'table tbody tr:first-child td:last-child svg:first-child',
      '[data-testid="edit-button"]'
    ];

    for (const selector of editSelectors) {
      try {
        const el = await page.$(selector);
        if (el) {
          await el.click();
          console.log(`  Clicked edit with selector: ${selector}`);
          break;
        }
      } catch (e) {
        continue;
      }
    }

    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${recordingsDir}/floor-07-edit-clicked.png` });

    // ==========================================
    // STEP 7: Edit the Floor value
    // ==========================================
    console.log('Step 7: Editing floor value...');

    // Find floor input field
    const floorSelectors = [
      'input[name="floor"]',
      'input[placeholder*="floor" i]',
      'input[aria-label*="floor" i]',
      '[data-testid="floor-input"]',
      'label:has-text("Floor") + input',
      'label:has-text("Floor") ~ input'
    ];

    let floorInput = null;
    for (const selector of floorSelectors) {
      try {
        floorInput = await page.$(selector);
        if (floorInput) {
          console.log(`  Found floor input with selector: ${selector}`);
          break;
        }
      } catch (e) {
        continue;
      }
    }

    // If we found the floor input, clear it and type new value
    if (floorInput) {
      await floorInput.click({ clickCount: 3 }); // Select all
      await page.waitForTimeout(300);
      await floorInput.type('1.15');
      console.log('  Changed floor to $1.15');
    } else {
      // Try to find any input that might be the floor
      console.log('  Looking for floor input by scanning all inputs...');
      const inputs = await page.$$('input[type="text"], input[type="number"]');
      for (const input of inputs) {
        const value = await input.inputValue();
        if (value === '0.30' || value === '0.3' || value === '.30' || value === '.3') {
          await input.click({ clickCount: 3 });
          await page.waitForTimeout(300);
          await input.type('1.15');
          console.log('  Found and changed floor input');
          break;
        }
      }
    }

    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${recordingsDir}/floor-08-floor-edited.png` });

    // Final pause to show the change
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${recordingsDir}/floor-09-final.png` });

    console.log('Recording complete!');

  } catch (error) {
    console.error('Error:', error.message);
    await page.screenshot({ path: `${recordingsDir}/floor-error.png` });
  } finally {
    console.log('Saving video...');
    await context.close();
    await browser.close();

    // Rename the video file
    const files = fs.readdirSync(recordingsDir);
    const videoFile = files.find(f => f.endsWith('.webm') && !f.includes('floor-change'));
    if (videoFile) {
      const newName = `${recordingsDir}/floor-change.webm`;
      fs.renameSync(`${recordingsDir}/${videoFile}`, newName);
      console.log(`Video saved: ${newName}`);
    }
    console.log('Done!');
  }
}

recordFloorChange().catch(console.error);
