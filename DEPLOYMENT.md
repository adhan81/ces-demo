# Quick Deployment Guide

## 🚀 Fastest Way: Netlify Drag & Drop

1. Go to [app.netlify.com/drop](https://app.netlify.com/drop)
2. Drag the entire `ces-demo` folder onto the page
3. Your site will be live in ~30 seconds!
4. Netlify will give you a URL like `https://random-name-123.netlify.app`

**That's it!** No account needed for basic deployment.

---

## 📦 Option 2: GitHub Pages (Free, Permanent URL)

### Step 1: Create GitHub Repository

```bash
cd /Users/asifdhanani/Documents/SimpleAgent/ces-demo
git init
git add .
git commit -m "Initial commit: CES Demo"
```

### Step 2: Push to GitHub

1. Create a new repository on GitHub (github.com/new)
2. Name it `ces-demo` (or any name you like)
3. **Don't** initialize with README, .gitignore, or license
4. Copy the repository URL

```bash
git remote add origin https://github.com/YOUR_USERNAME/ces-demo.git
git branch -M main
git push -u origin main
```

### Step 3: Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** → **Pages** (left sidebar)
3. Under "Source", select:
   - Branch: `main`
   - Folder: `/ (root)`
4. Click **Save**
5. Wait 1-2 minutes, then visit: `https://YOUR_USERNAME.github.io/ces-demo/`

---

## 🔧 Option 3: Vercel (Also Very Easy)

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Deploy:
   ```bash
   cd /Users/asifdhanani/Documents/SimpleAgent/ces-demo
   vercel
   ```

3. Follow the prompts (press Enter for defaults)
4. Your site will be live!

---

## ✅ Pre-Deployment Checklist

- [x] Tests pass (`npm test`)
- [x] All HTML files exist
- [x] Video files are in place
- [x] `netlify.toml` configured (for Netlify)
- [x] README.md created

---

## 🧪 Test Your Deployment

After deploying, verify:

1. **Homepage loads**: Should redirect to `demo-v2.html`
2. **Stage 1 works**: SSP scanning animation plays
3. **Stage 2 works**: Results page displays
4. **Stage 3 works**: Deep dive page shows chart
5. **Videos play**: Check that recordings load

---

## 🔗 Custom Domain (Optional)

### Netlify:
1. Go to Site Settings → Domain Management
2. Add your custom domain
3. Follow DNS instructions

### GitHub Pages:
1. Add `CNAME` file with your domain name
2. Update DNS records as instructed

---

## 📝 Notes

- All files are static (HTML, CSS, JS, videos)
- No backend required
- Works on any static hosting service
- Total size: ~50-100MB (mostly videos)

---

## 🆘 Troubleshooting

**Videos not loading?**
- Check file paths in HTML match actual file locations
- Ensure video files are included in deployment

**404 errors?**
- Verify `index.html` exists in root
- Check redirect rules in `netlify.toml`

**Styling broken?**
- Check browser console for errors
- Verify all CSS is inline (it is in this demo)

---

## 🎉 You're Done!

Your CES demo is now live and ready to share!

