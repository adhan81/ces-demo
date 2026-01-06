const { chromium } = require('playwright');

async function recordMagniteNavigation() {
  console.log('Starting Magnite DV+ recording v7...');

  const fs = require('fs');
  const recordingsDir = './recordings-v7';
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

    // Navigate to Analytics
    console.log('Step 5: Navigate to Analytics...');
    await page.click('text=Reporting');
    await page.waitForTimeout(1500);
    await page.click('text=Analytics');
    await page.waitForTimeout(3000);
    await page.screenshot({ path: `${recordingsDir}/01-analytics.png` });

    // Check for iframes
    console.log('Step 6: Checking for iframes...');
    const frames = page.frames();
    console.log(`  Found ${frames.length} frames`);
    for (let i = 0; i < frames.length; i++) {
      const frame = frames[i];
      console.log(`  Frame ${i}: ${frame.url()}`);

      // Search each frame for "New Report"
      try {
        const hasNewReport = await frame.evaluate(() => {
          return document.body.innerText.includes('New Report');
        });
        if (hasNewReport) {
          console.log(`  -> Frame ${i} contains "New Report"!`);
        }
      } catch (e) {}
    }

    // Get all text on page
    const allText = await page.evaluate(() => document.body.innerText);
    console.log('Page text includes "New Report":', allText.includes('New Report'));
    console.log('Page text includes "New":', allText.includes('New'));

    // Search for purple elements (the button appears purple)
    const purpleElements = await page.evaluate(() => {
      const results = [];
      const all = document.querySelectorAll('*');
      for (const el of all) {
        const style = window.getComputedStyle(el);
        const bg = style.backgroundColor;
        // Purple colors typically have high red, low green, high blue
        // Or check for specific Magnite purple
        if (bg.includes('rgb(') || bg.includes('rgba(')) {
          const match = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
          if (match) {
            const [_, r, g, b] = match.map(Number);
            // Check if it's purple-ish (r > 100, g < 100, b > 100) or Magnite purple
            if ((r > 80 && g < 80 && b > 100) || (r > 100 && b > 150)) {
              const rect = el.getBoundingClientRect();
              if (rect.width > 0 && rect.height > 0 && rect.width < 300) {
                results.push({
                  tag: el.tagName,
                  text: el.innerText?.substring(0, 50),
                  x: rect.x,
                  y: rect.y,
                  width: rect.width,
                  height: rect.height,
                  bg: bg
                });
              }
            }
          }
        }
      }
      return results;
    });

    console.log('Purple elements:', JSON.stringify(purpleElements, null, 2));

    // Get all elements in the top-right area (where button should be)
    const topRightElements = await page.evaluate(() => {
      const results = [];
      const all = document.querySelectorAll('*');
      for (const el of all) {
        const rect = el.getBoundingClientRect();
        // Top right area: x > 1700, y < 100
        if (rect.x > 1700 && rect.y < 100 && rect.width > 0 && rect.height > 0 && rect.width < 200) {
          results.push({
            tag: el.tagName,
            className: el.className?.substring(0, 50),
            text: el.innerText?.substring(0, 30),
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height
          });
        }
      }
      return results;
    });

    console.log('Top-right elements:', JSON.stringify(topRightElements.slice(0, 10), null, 2));

    // Try clicking specific coordinates where button appears
    // From screenshot analysis: button is at approximately (1870, 23)
    console.log('Clicking at (1385, 23) - estimated button location...');
    await page.mouse.click(1385, 23);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${recordingsDir}/02-after-click-1.png` });

    // Try another position
    console.log('Clicking at (1870, 55)...');
    await page.mouse.click(1870, 55);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${recordingsDir}/03-after-click-2.png` });

    // Check URL
    console.log(`URL: ${page.url()}`);

    // Final screenshot
    await page.screenshot({ path: `${recordingsDir}/04-final.png` });
    console.log('Done!');

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
    }
  }
}

recordMagniteNavigation().catch(console.error);
