const { chromium } = require('playwright');

async function recordMagniteNavigation() {
  console.log('Starting Magnite DV+ recording v6...');

  const fs = require('fs');
  const recordingsDir = './recordings-v6';
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
    console.log('Step 1-4: Login flow...');
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

    // Step 6: Find and click New Report button
    console.log('Step 6: Finding New Report button...');

    // Debug: Get ALL elements and their info
    const allElements = await page.evaluate(() => {
      const results = [];
      const all = document.querySelectorAll('*');
      for (const el of all) {
        const text = el.textContent?.trim();
        if (text && text.includes('New Report') && text.length < 50) {
          const rect = el.getBoundingClientRect();
          const style = window.getComputedStyle(el);
          results.push({
            tag: el.tagName,
            className: el.className,
            id: el.id,
            text: text.substring(0, 30),
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height,
            bgColor: style.backgroundColor,
            display: style.display,
            visibility: style.visibility
          });
        }
      }
      return results;
    });

    console.log('Elements containing "New Report":');
    console.log(JSON.stringify(allElements, null, 2));

    // Try to click the most likely candidate
    let clicked = false;

    // Find element with purple-ish background or the smallest container with "New Report"
    for (const el of allElements) {
      if (el.width > 0 && el.height > 0 && el.width < 200) {
        console.log(`  Trying to click at (${el.x + el.width/2}, ${el.y + el.height/2})`);
        await page.mouse.click(el.x + el.width / 2, el.y + el.height / 2);
        clicked = true;
        break;
      }
    }

    // If still not clicked, try role-based selector
    if (!clicked) {
      try {
        await page.click('[role="link"]:has-text("New Report")');
        clicked = true;
        console.log('  Clicked via role=link selector');
      } catch (e) {}
    }

    // Try aria-label
    if (!clicked) {
      try {
        await page.click('[aria-label*="New Report"], [aria-label*="new report"]');
        clicked = true;
        console.log('  Clicked via aria-label');
      } catch (e) {}
    }

    // Try href containing "new"
    if (!clicked) {
      try {
        await page.click('a[href*="new"], a[href*="create"]');
        clicked = true;
        console.log('  Clicked via href');
      } catch (e) {}
    }

    await page.waitForTimeout(3000);
    await page.screenshot({ path: `${recordingsDir}/03-after-click.png` });

    // Check current URL
    const url = page.url();
    console.log(`Current URL: ${url}`);

    // Continue with report configuration if we got to a new page
    console.log('Step 7-10: Report configuration...');
    await page.screenshot({ path: `${recordingsDir}/04-report-form.png` });

    // Try to find field selection UI
    const pageText = await page.evaluate(() => document.body.innerText);
    if (pageText.includes('Dimension') || pageText.includes('Metric') || pageText.includes('Column')) {
      console.log('  Found report builder interface');

      // Try selecting fields
      for (const field of ['Date', 'Bid Requests', 'Bid Responses', 'Paid Impressions', 'eCPM']) {
        try {
          await page.click(`text="${field}"`);
          console.log(`  Selected: ${field}`);
          await page.waitForTimeout(300);
        } catch (e) {}
      }
    }

    await page.screenshot({ path: `${recordingsDir}/05-fields.png` });

    // Look for filters
    try {
      await page.click('text=Filter');
      await page.waitForTimeout(500);
      await page.click('text=Deal ID');
      await page.waitForTimeout(500);
      await page.keyboard.type('3768900');
      await page.keyboard.press('Enter');
    } catch (e) {}

    await page.screenshot({ path: `${recordingsDir}/06-filter.png` });

    // Try to run report
    try {
      await page.click('button:has-text("Run")');
    } catch (e) {}

    await page.waitForTimeout(5000);
    await page.screenshot({ path: `${recordingsDir}/07-results.png` });

    console.log('Recording complete!');

  } catch (error) {
    console.error('Error:', error.message);
    await page.screenshot({ path: `${recordingsDir}/error.png` });
  } finally {
    await context.close();
    await browser.close();

    const files = fs.readdirSync(recordingsDir);
    const videoFile = files.find(f => f.endsWith('.webm'));
    if (videoFile) {
      fs.renameSync(`${recordingsDir}/${videoFile}`, `${recordingsDir}/magnite-recording.webm`);
      console.log(`Video: ${recordingsDir}/magnite-recording.webm`);
    }
    console.log('Done!');
  }
}

recordMagniteNavigation().catch(console.error);
