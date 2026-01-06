# Magnite DV+ UI Navigation Guide

This document captures the navigation patterns, selectors, and technical details for automating the Magnite DV+ platform.

## Authentication

### SSO Login URL
```
https://sso.magnite.com/u/login/identifier?state=hKFo2SBDZlliUEFPb2tialp0WDJsdlRURnpyUmttalNES2l3b6Fur3VuaXZlcnNhbC1sb2dpbqN0aWTZIFN5MnJFNjUyRk9SN0ZiNXNNZ0pDNTYyWHJ4N1NWRjEzo2NpZNkgZjhld1hVaXB3UEdtM01BZDQyOUNHZm9Xc20yWGVINU8
```

### Login Flow
1. Navigate to SSO URL
2. Enter email in `input[name="username"]`
3. Click `button[type="submit"]`
4. Enter password in `input[type="password"]`
5. Click `button[type="submit"]`
6. Wait for redirect to `**/dashboard**`

### Credentials (Demo)
- Email: `amit.grover@redfin.com`
- Password: `Redfin@ds1`

---

## Main Navigation

### Left Sidebar Structure
- **Active Apps** (top)
- **Dashboard** - Main performance overview
- **Campaigns** - Campaign management
- **Reporting** - Reports and analytics
- **Brand Protection**
- **Inventory**
- **More** (expandable)
- **Publisher Account** (bottom, shows "Redfin (Publisher)")

### Navigation to Analytics
```javascript
await page.click('text=Reporting');
await page.waitForTimeout(1500);
await page.click('text=Analytics');
await page.waitForTimeout(3000);
```

---

## Iframe Architecture (Critical)

The Analytics/Performance Analytics page loads content in an iframe.

### Iframe Detection
```javascript
const paFrame = page.frames().find(f => f.url().includes('/pa/'));
if (!paFrame) throw new Error('Could not find /pa/ iframe');
await paFrame.waitForLoadState('domcontentloaded');
```

### Important
- All report builder interactions happen **within the iframe**, not the main page
- Use `paFrame.click()` instead of `page.click()` for elements inside the report builder
- The iframe URL contains `/pa/` in the path

---

## Report Builder Workflow

### Opening New Report
```javascript
await paFrame.click('text=New Report');
await page.waitForTimeout(3000);
```

### Report Definition Panel
Located at top of report builder:
- **Dataset**: General / First Party radio buttons
- **Time Period**: Dropdown (Last 7 Days, Last 30 Days, Custom)
- **Timezone**: America/Los_Angeles
- **Currency**: USD dropdown

### Field Selection
Available fields appear as chips/tags with "x" to remove:
- Date
- Ad Requests
- Auctions
- Ad Responses
- Paid Impressions
- Publisher Gross Revenue
- eCPM
- Ad Request CPM

```javascript
// Select fields by clicking their text
await paFrame.click('text=Date');
await paFrame.click('text=Ad Requests');
await paFrame.click('text=eCPM');
// etc.
```

### Adding Filters
```javascript
await paFrame.click('text=Add Filters');
await page.waitForTimeout(1500);

// Select filter type
await paFrame.click('text=Deal ID');

// Enter filter value
const valueInputs = await paFrame.$$('input[type="text"]');
await valueInputs[0].fill('3768900');
await page.keyboard.press('Enter');
```

### Date Range Configuration
```javascript
// Click to open date picker
await paFrame.click('text=Last 7 Days');
await page.waitForTimeout(500);

// Select custom range
await paFrame.click('text=Custom');

// Enter dates (MM/DD/YYYY format)
// Start date input
// End date input
await page.keyboard.press('Enter');
```

### Running Report
```javascript
// Try multiple selectors
await paFrame.click('button:has-text("Run Report")').catch(async () => {
  await paFrame.click('text=Run Report');
}).catch(async () => {
  await paFrame.click('button:has-text("Run")');
});

// Wait for results
await page.waitForTimeout(8000);
```

---

## UI Style Reference

### Color Palette
| Element | Color |
|---------|-------|
| Primary Purple | `#6B46C1` |
| Header Bar | Dark purple/navy |
| Background | `#FFFFFF` |
| Secondary BG | `#F9FAFB` |
| Border | `#E5E7EB` |
| Text Primary | `#111827` |
| Text Secondary | `#6B7280` |
| Accent Blue | `#2563EB` |
| Success Green | `#10B981` |
| Error Red | `#EF4444` |

### Typography
- Font: Clean sans-serif (appears to be Inter or similar)
- Headers: 600 weight
- Body: 400 weight
- Small labels: 12px
- Body text: 14px
- Headers: 16-18px

### Component Styles
**Buttons:**
- Primary: Purple fill (`#6B46C1`), white text, 4px radius
- Secondary: White fill, gray border, dark text

**Cards:**
- White background
- 1px border (`#E5E7EB`)
- 4px border radius
- Minimal shadow or none

**Field Tags/Chips:**
- Light purple/lavender background
- Darker purple text
- Small "x" icon for removal
- Drag handle (6 dots) on left

**Tables:**
- Light header row
- Alternating row colors (subtle)
- Sortable columns (up/down arrows)
- Pagination at bottom right

**Charts:**
- Blue line for primary metric
- Red line for secondary metric
- Light gray grid lines
- Date labels on x-axis

---

## Recording Configuration

### Browser Setup
```javascript
const browser = await chromium.launch({
  headless: true,        // Set false to see browser
  slowMo: 100            // ms delay between actions
});

const context = await browser.newContext({
  viewport: { width: 1920, height: 1080 },
  recordVideo: {
    dir: './recordings-bestbuy',
    size: { width: 1920, height: 1080 }
  }
});
```

### Screenshot Points
Recommended capture points for demo:
1. Login page
2. Dashboard after auth
3. Analytics page (iframe loaded)
4. New Report form open
5. Fields selected
6. Filter dialog
7. Filter applied
8. Date range set
9. Report results
10. Results scrolled
11. Final state

---

## Timing Guidelines

| Action | Wait Time |
|--------|-----------|
| Login → Dashboard | 4000ms |
| Menu click → Submenu | 1500ms |
| Analytics page load | 3000ms |
| New Report dialog | 3000ms |
| Filter apply | 1500ms |
| Report execution | 8000-10000ms |
| Field selection | 400-500ms each |

---

## Selector Priority

When elements are hard to find, try in this order:
1. `text="Exact Text"` - Most reliable
2. `button:has-text("Text")` - Button-specific
3. `[role="button"]:has-text("Text")` - Semantic
4. `[aria-label="Text"]` - Accessibility
5. CSS selector with specific class
6. Coordinate-based click (last resort)

---

---

## Floor Change Workflow

This is the flow for changing a deal's price floor in Magnite DV+:

### Navigation to Deal Rules

1. **Login** as usual (see Authentication section above)

2. **Click "Campaigns"** from the left side menu
   - A submenu will appear
   - Click **"Deals Management"** from the submenu

3. **Click "My Deals" tab**
   - Located near the top of the screen (second tab in the menu)

4. **Click on the relevant deal** from the deals list

5. **Click "Rules" tab**
   - A menu appears under the deal name
   - Click on "Rules" in this submenu

6. **Click the Edit icon**
   - A table with rules will appear
   - The last column is called "Actions"
   - Click the **first icon (Edit)** in the Actions column

7. **Edit the Floor value**
   - Several editable properties for the rule will appear
   - Find the "Floor" field and edit it
   - **Do NOT hit save** (for demo purposes, we just show the edit)

### Selectors (to be determined)
```javascript
// Campaigns menu
await page.click('text=Campaigns');
await page.waitForTimeout(1000);
await page.click('text=Deals Management');

// My Deals tab
await page.click('text=My Deals');

// Deal selection - will need deal name or ID
// await page.click('text=Best Buy');

// Rules tab
await page.click('text=Rules');

// Edit icon - likely first button/icon in Actions column
// await page.click('[aria-label="Edit"]'); // or similar selector
```

---

## Element Injection for Demo

To modify displayed values (e.g., change deal names):
```javascript
await page.evaluate(() => {
  // Replace text in specific elements
  const elements = document.querySelectorAll('td, span, div');
  elements.forEach(el => {
    if (el.textContent.includes('T-Mobile')) {
      el.textContent = el.textContent.replace('T-Mobile', 'Best Buy');
    }
  });
});
```

---

## Troubleshooting

### Common Issues

**Element not found:**
- Check if element is inside iframe (use `paFrame` instead of `page`)
- Wait for page/frame to fully load
- Try different selector strategies

**Timeout errors:**
- Increase wait times for slow network
- Check if page navigation completed
- Verify login was successful

**Iframe not loading:**
- Ensure you waited for Analytics page to load
- Check for `/pa/` in frame URLs
- May need to wait for `networkidle`

### Debug Mode
```javascript
// Run with visible browser
const browser = await chromium.launch({ headless: false });

// Add extra logging
page.on('console', msg => console.log('PAGE:', msg.text()));
```
