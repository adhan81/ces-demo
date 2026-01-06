const { chromium } = require('playwright');

/**
 * Magnite DV+ Floor Change Recording Script v2
 *
 * Streamlined version that starts directly from the Deal Rules page
 * URL: https://apps.rubiconproject.com/#/deals_v2/#/deals/3768900/rules
 *
 * Steps:
 * 1. Login
 * 2. Navigate directly to Rules page for deal 3768900
 * 3. Inject "Best Buy" as deal name
 * 4. Click Edit icon
 * 5. Change floor value from $0.30 to $1.15
 */

async function recordFloorChange() {
  console.log('Starting Magnite Floor Change recording v2...');

  const fs = require('fs');
  const recordingsDir = './recordings-bestbuy';
  if (!fs.existsSync(recordingsDir)) {
    fs.mkdirSync(recordingsDir, { recursive: true });
  }

  const browser = await chromium.launch({
    headless: false,
    slowMo: 100,
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: {
      dir: recordingsDir,
      size: { width: 1440, height: 900 }
    }
  });

  const page = await context.newPage();

  // Helper function to inject Best Buy branding
  async function injectBestBuyBranding() {
    await page.evaluate(() => {
      // Replace deal names in visible text
      const selectors = ['h1', 'h2', 'h3', '.deal-name', '.deal-title', 'td', 'span', 'div'];
      selectors.forEach(sel => {
        document.querySelectorAll(sel).forEach(el => {
          if (el.childNodes.length === 1 && el.childNodes[0].nodeType === Node.TEXT_NODE) {
            const text = el.textContent;
            if (text.match(/T-Mobile|Deal\s*\d+|Sample|Redfin|3768900/i)) {
              el.textContent = text
                .replace(/T-Mobile Mobile Web/gi, 'Best Buy')
                .replace(/T-Mobile Desktop/gi, 'Best Buy')
                .replace(/T-Mobile/gi, 'Best Buy')
                .replace(/Deal\s*\d+/gi, 'Best Buy')
                .replace(/Sample Deal/gi, 'Best Buy');
            }
          }
        });
      });

      // Also update page title if possible
      const titleEl = document.querySelector('h1, .page-title, .deal-header');
      if (titleEl && !titleEl.textContent.includes('Best Buy')) {
        titleEl.textContent = 'Best Buy';
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

    // Wait for login to complete
    await page.waitForURL('**/dashboard**', { timeout: 60000 }).catch(() => {});
    await page.waitForTimeout(2000);
    console.log('  Logged in successfully');

    // ==========================================
    // STEP 2: Navigate directly to Deal Rules page
    // ==========================================
    console.log('Step 2: Navigating directly to Deal Rules page...');

    await page.goto('https://apps.rubiconproject.com/#/deals_v2/#/deals/3768900/rules', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    await page.waitForTimeout(2000);

    // Inject Best Buy branding immediately
    await injectBestBuyBranding();
    await page.waitForTimeout(500);

    await page.screenshot({ path: `${recordingsDir}/floor-v2-01-rules-page.png` });
    console.log('  On Rules page');

    // Re-inject branding after any dynamic content loads
    await page.waitForTimeout(1000);
    await injectBestBuyBranding();

    // ==========================================
    // STEP 3: Click Edit icon in Actions column
    // ==========================================
    console.log('Step 3: Clicking Edit icon...');

    // Wait for rules table to load
    await page.waitForSelector('table', { timeout: 10000 }).catch(() => {
      console.log('  Waiting for rules table...');
    });
    await page.waitForTimeout(1000);

    // Re-inject branding
    await injectBestBuyBranding();

    // Try various selectors for the edit icon
    const editSelectors = [
      '[aria-label="Edit"]',
      '[title="Edit"]',
      'button:has-text("Edit")',
      '.edit-icon',
      '.action-edit',
      'table tbody tr:first-child td:last-child button:first-child',
      'table tbody tr:first-child td:last-child svg:first-child',
      '[data-testid="edit-button"]',
      '.actions button:first-child',
      'svg[data-icon="edit"]',
      '.fa-edit',
      '.icon-edit'
    ];

    let editClicked = false;
    for (const selector of editSelectors) {
      try {
        const el = await page.$(selector);
        if (el) {
          await el.click();
          console.log(`  Clicked edit with selector: ${selector}`);
          editClicked = true;
          break;
        }
      } catch (e) {
        continue;
      }
    }

    if (!editClicked) {
      // Try clicking first clickable element in actions column
      console.log('  Trying to find edit button by position...');
      await page.click('table tbody tr:first-child td:last-child').catch(() => {});
    }

    await page.waitForTimeout(2000);
    await injectBestBuyBranding();
    await page.screenshot({ path: `${recordingsDir}/floor-v2-02-edit-clicked.png` });

    // ==========================================
    // STEP 4: Edit the Floor value
    // ==========================================
    console.log('Step 4: Editing floor value...');

    // Wait for edit form/modal to appear
    await page.waitForTimeout(1500);
    await injectBestBuyBranding();

    // Find floor input field
    const floorSelectors = [
      'input[name="floor"]',
      'input[placeholder*="floor" i]',
      'input[aria-label*="floor" i]',
      '[data-testid="floor-input"]',
      'label:has-text("Floor") + input',
      'label:has-text("Floor") ~ input',
      'input[type="number"]'
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
      await floorInput.fill('1.15');
      console.log('  Changed floor to $1.15');
    } else {
      // Try to find any input that might be the floor
      console.log('  Looking for floor input by scanning all inputs...');
      const inputs = await page.$$('input[type="text"], input[type="number"]');
      for (const input of inputs) {
        const value = await input.inputValue();
        if (value === '0.30' || value === '0.3' || value === '.30' || value === '.3' || value.includes('0.3')) {
          await input.click({ clickCount: 3 });
          await page.waitForTimeout(300);
          await input.fill('1.15');
          console.log('  Found and changed floor input');
          break;
        }
      }
    }

    await page.waitForTimeout(1500);
    await injectBestBuyBranding();
    await page.screenshot({ path: `${recordingsDir}/floor-v2-03-floor-edited.png` });

    // Final pause to show the change (DO NOT click save for demo)
    await page.waitForTimeout(2000);
    await injectBestBuyBranding();
    await page.screenshot({ path: `${recordingsDir}/floor-v2-04-final.png` });

    console.log('Recording complete!');

  } catch (error) {
    console.error('Error:', error.message);
    await page.screenshot({ path: `${recordingsDir}/floor-v2-error.png` });
  } finally {
    console.log('Saving video...');
    await context.close();
    await browser.close();

    // Rename the video file
    const files = fs.readdirSync(recordingsDir);
    const videoFile = files.find(f => f.endsWith('.webm') && !f.startsWith('floor-change'));
    if (videoFile) {
      // Backup old file if exists
      const targetPath = `${recordingsDir}/floor-change.webm`;
      if (fs.existsSync(targetPath)) {
        fs.renameSync(targetPath, `${recordingsDir}/floor-change-backup.webm`);
      }
      fs.renameSync(`${recordingsDir}/${videoFile}`, targetPath);
      console.log(`Video saved: ${targetPath}`);
    }
    console.log('Done!');
  }
}

recordFloorChange().catch(console.error);
