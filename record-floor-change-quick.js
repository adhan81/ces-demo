const { chromium } = require('playwright');

/**
 * Quick Floor Change Recording (~5 seconds)
 * 
 * Records a focused video showing:
 * 1. Login to Magnite DV+
 * 2. Navigate directly to edit page: /deals/3768900/rules/5427242/edit
 * 3. Inject Best Buy branding BEFORE recording starts
 *    - Changes "Redfin_TMobile_Display_Mobile/Tablet_Web - Rule 1" 
 *      to "Redfin_BestBuy - Rule 1"
 * 4. Highlight changing floor value to $1.15 (the main action)
 * 5. Show success modal/notification
 * 
 * The video recording only starts AFTER branding injection,
 * so the final video is clean and focused on the floor change action.
 * 
 * Usage: node record-floor-change-quick.js
 */

async function recordQuickFloorChange() {
  console.log('Starting quick floor change recording...');

  const fs = require('fs');
  const recordingsDir = './recordings-bestbuy';
  if (!fs.existsSync(recordingsDir)) {
    fs.mkdirSync(recordingsDir, { recursive: true });
  }

  const browser = await chromium.launch({
    headless: false,
    slowMo: 50, // Faster for 5-second video
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    // Don't start recording yet - we'll start after branding injection
  });

  const page = await context.newPage();
  let storageState = null; // Will store cookies for recording context

  // Helper to inject Best Buy branding
  async function injectBestBuyBranding() {
    await page.evaluate(() => {
      // Change titles in HTML - find elements with ant-page-header-heading-title class
      // There are 3 instances that need to be changed
      const titleElements = document.querySelectorAll('.ant-page-header-heading-title, .css-1dz6p8z');
      titleElements.forEach(el => {
        if (el.textContent) {
          el.textContent = el.textContent
            .replace(/Redfin_TMobile_Display_Mobile\/Tablet_Web - Rule 1/gi, 'Redfin_BestBuy - Rule 1')
            .replace(/Redfin_TMobile/gi, 'Redfin_BestBuy')
            .replace(/TMobile/gi, 'BestBuy')
            .replace(/T-Mobile/gi, 'Best Buy')
            .replace(/t-mobile/gi, 'Best Buy');
        }
      });

      // Also replace in all text nodes for safety
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );
      
      let node;
      while (node = walker.nextNode()) {
        const text = node.textContent;
        if (text.includes('Redfin_TMobile') || text.includes('TMobile') || text.includes('T-Mobile')) {
          node.textContent = text
            .replace(/Redfin_TMobile_Display_Mobile\/Tablet_Web - Rule 1/gi, 'Redfin_BestBuy - Rule 1')
            .replace(/Redfin_TMobile/gi, 'Redfin_BestBuy')
            .replace(/TMobile/gi, 'BestBuy')
            .replace(/T-Mobile/gi, 'Best Buy')
            .replace(/t-mobile/gi, 'Best Buy');
        }
      }

      // Update any input fields or labels
      document.querySelectorAll('input, label, h1, h2, h3, .title, .deal-name').forEach(el => {
        if (el.textContent) {
          el.textContent = el.textContent
            .replace(/Redfin_TMobile_Display_Mobile\/Tablet_Web - Rule 1/gi, 'Redfin_BestBuy - Rule 1')
            .replace(/Redfin_TMobile/gi, 'Redfin_BestBuy')
            .replace(/TMobile/gi, 'BestBuy')
            .replace(/T-Mobile/gi, 'Best Buy')
            .replace(/t-mobile/gi, 'Best Buy');
        }
        if (el.value) {
          el.value = el.value
            .replace(/Redfin_TMobile_Display_Mobile\/Tablet_Web - Rule 1/gi, 'Redfin_BestBuy - Rule 1')
            .replace(/Redfin_TMobile/gi, 'Redfin_BestBuy')
            .replace(/TMobile/gi, 'BestBuy')
            .replace(/T-Mobile/gi, 'Best Buy')
            .replace(/t-mobile/gi, 'Best Buy');
        }
      });
    });
  }

  try {
    // ==========================================
    // STEP 1: Login (if needed)
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
    
    // Save storage state (cookies) for recording context
    storageState = await context.storageState();

    // ==========================================
    // STEP 2: Navigate to edit page
    // ==========================================
    console.log('Step 2: Navigating to edit page...');
    await page.goto('https://apps.rubiconproject.com/#/deals_v2/#/deals/3768900/rules/5427242/edit', {
      waitUntil: 'networkidle',
      timeout: 30000
    });

    // Wait for page to fully load
    await page.waitForTimeout(3000);

    // ==========================================
    // STEP 3: Inject Best Buy branding BEFORE recording
    // ==========================================
    console.log('Step 3: Injecting Best Buy branding...');
    await injectBestBuyBranding();
    await page.waitForTimeout(500);
    
    // Re-inject after any dynamic content loads
    await page.waitForTimeout(1000);
    await injectBestBuyBranding();
    await page.waitForTimeout(500);
    console.log('  Branding injected');

    // ==========================================
    // STEP 4: Start video recording NOW
    // ==========================================
    console.log('Step 4: Starting video recording...');
    
    // Close current context and create new one with video recording
    await context.close();
    
    const recordingContext = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      recordVideo: {
        dir: recordingsDir,
        size: { width: 1920, height: 1080 }
      },
      // Preserve cookies from login
      storageState: storageState
    });

    const recordingPage = await recordingContext.newPage();
    
    // Navigate to the same page (should already be logged in)
    await recordingPage.goto('https://apps.rubiconproject.com/#/deals_v2/#/deals/3768900/rules/5427242/edit', {
      waitUntil: 'networkidle', // Wait for network to be idle
      timeout: 60000
    });

    // Wait for page to fully load
    await recordingPage.waitForTimeout(3000);
    
    // Check if there are iframes
    const iframes = await recordingPage.frames();
    console.log(`  Page loaded, found ${iframes.length} frames`);
    
    // Wait for any dynamic content
    await recordingPage.waitForLoadState('networkidle');
    await recordingPage.waitForTimeout(2000);
    
    // Inject branding again on the recording page
    await recordingPage.evaluate(() => {
      // Change titles in HTML - find elements with ant-page-header-heading-title class
      const titleElements = document.querySelectorAll('.ant-page-header-heading-title, .css-1dz6p8z');
      titleElements.forEach(el => {
        if (el.textContent) {
          el.textContent = el.textContent
            .replace(/Redfin_TMobile_Display_Mobile\/Tablet_Web - Rule 1/gi, 'Redfin_BestBuy - Rule 1')
            .replace(/Redfin_TMobile/gi, 'Redfin_BestBuy')
            .replace(/TMobile/gi, 'BestBuy')
            .replace(/T-Mobile/gi, 'Best Buy')
            .replace(/t-mobile/gi, 'Best Buy');
        }
      });

      // Also replace in all text nodes
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );
      
      let node;
      while (node = walker.nextNode()) {
        const text = node.textContent;
        if (text.includes('Redfin_TMobile') || text.includes('TMobile') || text.includes('T-Mobile')) {
          node.textContent = text
            .replace(/Redfin_TMobile_Display_Mobile\/Tablet_Web - Rule 1/gi, 'Redfin_BestBuy - Rule 1')
            .replace(/Redfin_TMobile/gi, 'Redfin_BestBuy')
            .replace(/TMobile/gi, 'BestBuy')
            .replace(/T-Mobile/gi, 'Best Buy')
            .replace(/t-mobile/gi, 'Best Buy');
        }
      }

      document.querySelectorAll('input, label, h1, h2, h3, .title, .deal-name').forEach(el => {
        if (el.textContent) {
          el.textContent = el.textContent
            .replace(/Redfin_TMobile_Display_Mobile\/Tablet_Web - Rule 1/gi, 'Redfin_BestBuy - Rule 1')
            .replace(/Redfin_TMobile/gi, 'Redfin_BestBuy')
            .replace(/TMobile/gi, 'BestBuy')
            .replace(/T-Mobile/gi, 'Best Buy')
            .replace(/t-mobile/gi, 'Best Buy');
        }
        if (el.value) {
          el.value = el.value
            .replace(/Redfin_TMobile_Display_Mobile\/Tablet_Web - Rule 1/gi, 'Redfin_BestBuy - Rule 1')
            .replace(/Redfin_TMobile/gi, 'Redfin_BestBuy')
            .replace(/TMobile/gi, 'BestBuy')
            .replace(/T-Mobile/gi, 'Best Buy')
            .replace(/t-mobile/gi, 'Best Buy');
        }
      });
    });

    await recordingPage.waitForTimeout(500);

    // ==========================================
    // STEP 5: Find and change floor value to $1.15
    // ==========================================
    console.log('Step 5: Changing floor to $1.15...');

    // Wait for form to be ready - wait for the label to appear
    try {
      await recordingPage.waitForSelector('label[for="pmpDealRuleForm_priceFloor_amount"]', { 
        timeout: 10000,
        state: 'visible'
      });
      console.log('  Floor label found');
    } catch (e) {
      console.log('  Floor label not found, continuing anyway...');
    }
    
    await recordingPage.waitForTimeout(2000);

    // Find the floor input using the specific ID from the label
    // Label: for="pmpDealRuleForm_priceFloor_amount"
    // So input should be: id="pmpDealRuleForm_priceFloor_amount" or name="pmpDealRuleForm_priceFloor_amount"
    // Wait a bit more for form to fully render
    await recordingPage.waitForTimeout(1500);
    
    const floorSelectors = [
      '#pmpDealRuleForm_priceFloor_amount',
      'input#pmpDealRuleForm_priceFloor_amount',
      'input[name="pmpDealRuleForm_priceFloor_amount"]',
      'input[id="pmpDealRuleForm_priceFloor_amount"]',
      // Try finding input by the label's for attribute
      'input[id*="priceFloor"]',
      'input[name*="priceFloor"]',
      // Fallback selectors
      'label[for="pmpDealRuleForm_priceFloor_amount"] + input',
      'label[for="pmpDealRuleForm_priceFloor_amount"] ~ input',
      'input[name="floor"]',
      'input[placeholder*="floor" i]',
      'input[aria-label*="floor" i]'
    ];

    let floorInput = null;
    for (const selector of floorSelectors) {
      try {
        floorInput = await recordingPage.$(selector);
        if (floorInput) {
          const value = await floorInput.inputValue();
          console.log(`  Found floor input with selector: ${selector}, current value: ${value}`);
          break;
        }
      } catch (e) {
        continue;
      }
    }

    // If still not found, try finding by the label's parent form item using evaluate
    if (!floorInput) {
      try {
        const inputInfo = await recordingPage.evaluate(() => {
          const label = document.querySelector('label[for="pmpDealRuleForm_priceFloor_amount"]');
          if (label) {
            // First try to find input by the for attribute directly
            const inputById = document.getElementById('pmpDealRuleForm_priceFloor_amount');
            if (inputById) {
              inputById.setAttribute('data-floor-input', 'true');
              return { found: true, value: inputById.value, method: 'by-id' };
            }
            
            // Then try within the form item
            const formItem = label.closest('.ant-form-item');
            if (formItem) {
              // Try all input types
              const inputs = formItem.querySelectorAll('input[type="text"], input[type="number"], input[type="tel"], input');
              for (const input of inputs) {
                // Check if it's likely the floor input (has a number value or is empty)
                const val = input.value;
                if (val === '0.30' || val === '0.3' || val === '' || !isNaN(parseFloat(val))) {
                  input.setAttribute('data-floor-input', 'true');
                  return { found: true, value: val, method: 'by-form-item' };
                }
              }
              // If no value match, just take the first input in the form item
              if (inputs.length > 0) {
                inputs[0].setAttribute('data-floor-input', 'true');
                return { found: true, value: inputs[0].value, method: 'by-form-item-first' };
              }
            }
          }
          return { found: false };
        });
        
        if (inputInfo.found) {
          floorInput = await recordingPage.$('input[data-floor-input="true"]');
          if (floorInput) {
            console.log(`  Found floor input via ${inputInfo.method}, current value: ${inputInfo.value}`);
          }
        }
      } catch (e) {
        console.log('  Could not find via label:', e.message);
      }
    }

    if (floorInput) {
      // Highlight the input by focusing it (this is the key visual moment)
      await floorInput.scrollIntoViewIfNeeded();
      await recordingPage.waitForTimeout(200);
      await floorInput.focus();
      await recordingPage.waitForTimeout(300);
      
      // Select all and replace with new value
      await floorInput.click({ clickCount: 3 });
      await recordingPage.waitForTimeout(200);
      await floorInput.fill('1.15');
      await recordingPage.waitForTimeout(400);
      
      // Blur to show the change is complete
      await floorInput.blur();
      await recordingPage.waitForTimeout(300);
      
      console.log('  Floor changed to $1.15');
    } else {
      console.log('  ERROR: Could not find floor input!');
      // Take a screenshot for debugging
      await recordingPage.screenshot({ path: `${recordingsDir}/floor-debug.png` });
      
      // Debug: log all inputs on the page
      const allInputs = await recordingPage.evaluate(() => {
        const inputs = Array.from(document.querySelectorAll('input'));
        return inputs.map(input => ({
          id: input.id,
          name: input.name,
          type: input.type,
          value: input.value,
          placeholder: input.placeholder,
          label: input.closest('.ant-form-item')?.querySelector('label')?.textContent
        }));
      });
      console.log('  Available inputs on page:', JSON.stringify(allInputs, null, 2));
      
      // Try to find the label and see what's near it
      const labelInfo = await recordingPage.evaluate(() => {
        const label = document.querySelector('label[for="pmpDealRuleForm_priceFloor_amount"]');
        if (label) {
          return {
            found: true,
            text: label.textContent,
            formItem: label.closest('.ant-form-item')?.innerHTML.substring(0, 200)
          };
        }
        return { found: false };
      });
      console.log('  Label info:', JSON.stringify(labelInfo, null, 2));
    }

    // ==========================================
    // STEP 6: Show success modal (click save if needed)
    // ==========================================
    console.log('Step 6: Triggering success modal...');
    
    // Look for save button and click it to trigger success
    const saveSelectors = [
      'button:has-text("Save")',
      'button:has-text("Update")',
      'button[type="submit"]',
      '[aria-label="Save"]',
      '.save-button',
      'button.primary'
    ];

    let saved = false;
    for (const selector of saveSelectors) {
      try {
        const saveBtn = await recordingPage.$(selector);
        if (saveBtn && await saveBtn.isVisible()) {
          await saveBtn.click();
          console.log(`  Clicked save with selector: ${selector}`);
          saved = true;
          break;
        }
      } catch (e) {
        continue;
      }
    }

    // Wait for success modal/notification to appear
    await recordingPage.waitForTimeout(1000);

    // Look for success indicators (modal, toast, notification)
    const successSelectors = [
      '.success',
      '.alert-success',
      '.notification-success',
      '[role="alert"]',
      '.modal:has-text("success")',
      '.modal:has-text("saved")',
      '.toast-success',
      'text=/success/i',
      'text=/saved/i',
      'text=/updated/i',
      'text=/changes saved/i'
    ];

    let successFound = false;
    for (const selector of successSelectors) {
      try {
        const element = await recordingPage.waitForSelector(selector, { timeout: 2000, state: 'visible' });
        if (element) {
          // Scroll success message into view
          await element.scrollIntoViewIfNeeded();
          console.log(`  Success indicator found: ${selector}`);
          successFound = true;
          break;
        }
      } catch (e) {
        continue;
      }
    }

    if (!successFound) {
      console.log('  No success modal found, but continuing...');
    }

    // Final pause to show success state (this is the end of the 5-second video)
    await recordingPage.waitForTimeout(800);

    console.log('Recording complete!');

    // Close recording context
    await recordingContext.close();

  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
    await page.screenshot({ path: `${recordingsDir}/floor-quick-error.png` }).catch(() => {});
  } finally {
    await browser.close();

    // Rename the video file
    try {
      const files = fs.readdirSync(recordingsDir);
      const videoFile = files.find(f => f.endsWith('.webm') && !f.includes('floor-change'));
      if (videoFile) {
        // Backup old file if exists
        const targetPath = `${recordingsDir}/floor-change.webm`;
        if (fs.existsSync(targetPath)) {
          fs.renameSync(targetPath, `${recordingsDir}/floor-change-backup-${Date.now()}.webm`);
        }
        fs.renameSync(`${recordingsDir}/${videoFile}`, targetPath);
        console.log(`✅ Video saved: ${targetPath}`);
      } else {
        console.log('⚠️  No video file found to rename');
      }
    } catch (e) {
      console.error('Error renaming video:', e.message);
    }
    
    console.log('Done!');
  }
}

recordQuickFloorChange().catch(console.error);

