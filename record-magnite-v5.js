const { chromium } = require('playwright');

async function recordMagniteNavigation() {
  console.log('Starting Magnite DV+ recording v5 (headless, 1920x1080)...');

  const fs = require('fs');
  const recordingsDir = './recordings-v5';
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
    // Step 1: Navigate to Magnite login
    console.log('Step 1: Navigating to Magnite SSO login...');
    await page.goto('https://sso.magnite.com/u/login/identifier?state=hKFo2SBDZlliUEFPb2tialp0WDJsdlRURnpyUmttalNES2l3b6Fur3VuaXZlcnNhbC1sb2dpbqN0aWTZIFN5MnJFNjUyRk9SN0ZiNXNNZ0pDNTYyWHJ4N1NWRjEzo2NpZNkgZjhld1hVaXB3UEdtM01BZDQyOUNHZm9Xc20yWGVINU8', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    await page.waitForTimeout(1500);

    // Step 2: Enter email and continue
    console.log('Step 2: Entering email...');
    await page.fill('input[name="username"]', 'amit.grover@redfin.com');
    await page.waitForTimeout(500);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);

    // Step 3: Enter password and login
    console.log('Step 3: Entering password...');
    await page.waitForSelector('input[type="password"]', { timeout: 10000 });
    await page.fill('input[type="password"]', 'Redfin@ds1');
    await page.waitForTimeout(500);
    await page.click('button[type="submit"]');

    // Step 4: Wait for dashboard
    console.log('Step 4: Waiting for dashboard...');
    await page.waitForURL('**/dashboard**', { timeout: 60000 }).catch(() => {});
    await page.waitForTimeout(4000);
    await page.screenshot({ path: `${recordingsDir}/01-dashboard.png` });

    // Step 5: Navigate to Reporting > Analytics
    console.log('Step 5: Navigating to Reporting > Analytics...');
    await page.click('text=Reporting');
    await page.waitForTimeout(1500);
    await page.click('text=Analytics');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: `${recordingsDir}/02-analytics-list.png` });

    // Step 6: Click New Report - use multiple strategies
    console.log('Step 6: Clicking New Report...');

    // Strategy 1: Try direct click on visible text
    let clicked = false;
    try {
      await page.locator('text=New Report').first().click({ timeout: 3000 });
      clicked = true;
      console.log('  Strategy 1 worked: text=New Report');
    } catch (e) {
      console.log('  Strategy 1 failed');
    }

    // Strategy 2: Click by bounding box of element containing "New Report"
    if (!clicked) {
      try {
        const box = await page.evaluate(() => {
          const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
          while (walker.nextNode()) {
            if (walker.currentNode.textContent.includes('New Report')) {
              const el = walker.currentNode.parentElement;
              const rect = el.getBoundingClientRect();
              return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
            }
          }
          return null;
        });
        if (box) {
          await page.mouse.click(box.x, box.y);
          clicked = true;
          console.log(`  Strategy 2 worked: clicked at (${box.x}, ${box.y})`);
        }
      } catch (e) {
        console.log('  Strategy 2 failed');
      }
    }

    // Strategy 3: Click in top-right area where button should be (~1850, 55)
    if (!clicked) {
      console.log('  Strategy 3: Clicking top-right area (1850, 55)...');
      await page.mouse.click(1850, 55);
      clicked = true;
    }

    await page.waitForTimeout(3000);
    await page.screenshot({ path: `${recordingsDir}/03-after-new-report-click.png` });

    // Check if we're on a new page/form
    const currentUrl = page.url();
    console.log(`  Current URL: ${currentUrl}`);

    // Step 7: Look for report builder interface
    console.log('Step 7: Configuring report...');

    // Debug: Get all clickable elements' text
    const clickableTexts = await page.evaluate(() => {
      const elements = document.querySelectorAll('button, a, [role="button"], input[type="submit"]');
      return Array.from(elements).map(el => ({
        tag: el.tagName,
        text: el.textContent?.trim().substring(0, 50),
        href: el.href || null
      }));
    });
    console.log('  Clickable elements:', JSON.stringify(clickableTexts.slice(0, 10), null, 2));

    await page.screenshot({ path: `${recordingsDir}/04-report-config.png` });

    // Try to find and interact with the report builder
    // Look for field selection, dimensions, metrics, etc.
    const fields = ['Date', 'Bid Requests', 'Bid Responses', 'Paid Impressions', 'Publisher Gross Revenue', 'eCPM'];

    for (const field of fields) {
      try {
        const el = await page.locator(`text=${field}`).first();
        if (await el.isVisible()) {
          await el.click();
          console.log(`  Clicked: ${field}`);
          await page.waitForTimeout(300);
        }
      } catch (e) {}
    }

    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${recordingsDir}/05-fields-selected.png` });

    // Step 8: Add Deal ID filter
    console.log('Step 8: Adding Deal ID filter...');
    try {
      await page.locator('text=Add Filter').or(page.locator('text=Filters')).first().click({ timeout: 2000 });
      await page.waitForTimeout(1000);
      await page.locator('text=Deal ID').first().click({ timeout: 2000 });
      await page.waitForTimeout(500);

      // Find input and enter deal ID
      const input = page.locator('input[type="text"]').last();
      await input.fill('3768900');
      await page.keyboard.press('Enter');
      console.log('  Added Deal ID: 3768900');
    } catch (e) {
      console.log('  Filter step needs manual adjustment');
    }

    await page.screenshot({ path: `${recordingsDir}/06-filter.png` });

    // Step 9: Date range
    console.log('Step 9: Date range...');
    await page.screenshot({ path: `${recordingsDir}/07-date-range.png` });

    // Step 10: Run Report
    console.log('Step 10: Running report...');
    try {
      await page.locator('button:has-text("Run")').first().click({ timeout: 3000 });
      console.log('  Clicked Run');
    } catch (e) {
      console.log('  Run button not found');
    }

    await page.waitForTimeout(8000);
    await page.screenshot({ path: `${recordingsDir}/08-results.png` });

    console.log('Recording complete!');
    await page.screenshot({ path: `${recordingsDir}/09-final.png` });

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
      console.log(`Video saved to: ${recordingsDir}/magnite-recording.webm`);
    }
    console.log('Done!');
  }
}

recordMagniteNavigation().catch(console.error);
