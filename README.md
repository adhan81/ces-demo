# CES Demo - Revenue Scanner / Deal Watch

An interactive demo showcasing revenue optimization scanning across multiple SSPs (Supply-Side Platforms).

## Features

- **Live SSP Scanning**: Simulated real-time scanning of Magnite DV+, Index Exchange, TripleLift, and Xandr
- **Interactive Demo**: Multi-stage presentation with auto-progression
- **Revenue Analysis**: Identifies pricing anomalies, volume drops, and optimization opportunities
- **Visual Analytics**: Charts and graphs showing eCPM performance over time
- **Action Recommendations**: AI-powered suggestions for revenue optimization

## Local Development

### Prerequisites

- Node.js (v14 or higher)
- A modern web browser

### Running Locally

1. **Install dependencies** (optional, only needed for Playwright scripts):
   ```bash
   npm install
   ```

2. **Start a local server**:
   ```bash
   # Using Python
   python3 -m http.server 8000
   
   # Or using Node.js
   npx serve .
   
   # Or using PHP
   php -S localhost:8000
   ```

3. **Open in browser**:
   Navigate to `http://localhost:8000`

4. **Run tests**:
   ```bash
   npm test
   ```

## Deployment

### Option 1: Netlify (Recommended - Easiest)

1. **Install Netlify CLI** (optional):
   ```bash
   npm install -g netlify-cli
   ```

2. **Deploy**:
   ```bash
   # Login to Netlify
   netlify login
   
   # Initialize and deploy
   netlify init
   netlify deploy --prod
   ```

   Or simply:
   - Go to [netlify.com](https://netlify.com)
   - Drag and drop the `ces-demo` folder
   - Your site will be live in seconds!

### Option 2: GitHub Pages

1. **Create a GitHub repository**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/ces-demo.git
   git push -u origin main
   ```

2. **Enable GitHub Pages**:
   - Go to repository Settings → Pages
   - Select source branch (usually `main`)
   - Select root folder
   - Save

3. **Your site will be live at**:
   `https://yourusername.github.io/ces-demo/`

### Option 3: Vercel

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Deploy**:
   ```bash
   vercel
   ```

### Option 4: Any Static Host

This is a static site, so it can be deployed to:
- AWS S3 + CloudFront
- Google Cloud Storage
- Azure Static Web Apps
- Any web hosting service

Simply upload all files to your web server.

## Project Structure

```
ces-demo/
├── index.html          # Redirects to demo-v2.html
├── demo.html           # Original demo version
├── demo-v2.html        # Main demo (current version)
├── recordings-v7/      # Video recordings for demo
├── recordings-bestbuy/ # Floor change recordings
├── package.json        # Dependencies
├── netlify.toml       # Netlify configuration
└── README.md          # This file
```

## Testing

Run the test suite:
```bash
node test-demo.js
```

This verifies:
- All HTML files exist
- Required content is present
- Video files are available
- Structure is correct

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Notes

- The demo uses simulated data and animations
- Video files are included for the live scanning demonstration
- Auto-progression can be disabled by setting `autoProgressEnabled = false` in `demo-v2.html`

## License

ISC

