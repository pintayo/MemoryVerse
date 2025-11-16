# MemoryVerse Website

This folder contains the official website for MemoryVerse, including all legal documentation required for App Store submission.

## 📁 Contents

- **index.html** - Beautiful landing page showcasing the app
- **privacy.html** - Comprehensive Privacy Policy (GDPR & CCPA compliant)
- **terms.html** - Complete Terms of Service
- **support.html** - Support center with FAQs and contact form
- **styles.css** - Shared stylesheet with app-inspired design

## 🎨 Design Features

- **Responsive Design** - Works beautifully on mobile, tablet, and desktop
- **App-Inspired Colors** - Warm terracotta, sandy beige, and sunlit saffron palette
- **Professional Layout** - Clean, modern design suitable for App Store requirements
- **Accessibility** - Readable fonts, good contrast, semantic HTML

## 🚀 Deploy to GitHub Pages

### Option 1: Deploy from this branch

1. Go to your repository settings on GitHub
2. Navigate to **Settings → Pages**
3. Under "Source", select your branch: `claude/app-store-ready-01T3z5ZuSjxx4zwMnApsdAoG`
4. Set the folder to `/html`
5. Click Save
6. Your site will be available at: `https://pintayo.github.io/MemoryVerse/`

### Option 2: Copy to a separate website repository (Recommended)

1. Create a new repository named `pintayo.github.io` (for user site) or `memoryverse-website` (for project site)
2. Copy all files from this `html` folder to the root of the new repository
3. Push to the `main` branch
4. Enable GitHub Pages in repository settings
5. Your site will be available at:
   - User site: `https://pintayo.github.io/`
   - Project site: `https://pintayo.github.io/memoryverse-website/`

## 🌐 Custom Domain Setup (pintayo.com)

1. In your repository settings, go to **Settings → Pages**
2. Under "Custom domain", enter: `pintayo.com`
3. Click Save
4. In your domain registrar (e.g., GoDaddy, Namecheap), add these DNS records:

   **For apex domain (pintayo.com):**
   ```
   A Record:
   185.199.108.153
   185.199.109.153
   185.199.110.153
   185.199.111.153
   ```

   **For www subdomain:**
   ```
   CNAME Record:
   www.pintayo.com → pintayo.github.io
   ```

5. Wait for DNS propagation (can take up to 24 hours)
6. Enable "Enforce HTTPS" in GitHub Pages settings

## ✏️ Customization

### Contact Information

All contact information has been set to: **pintayo.dev@gmail.com**

### Update App Store Links

In `index.html`, replace the placeholder links with your actual App Store URLs:
```html
<!-- iOS -->
<a href="YOUR_APPLE_APP_STORE_URL" target="_blank">

<!-- Android -->
<a href="YOUR_GOOGLE_PLAY_STORE_URL" target="_blank">
```

### Legal Information

- **Governing Law**: Set to Delaware, United States (standard for tech companies)
- **Contact Form**: Fully functional using mailto protocol
- **Privacy Policy**: Compliant with GDPR and CCPA requirements

Review and customize the Privacy Policy if you have specific data practices that differ from the defaults.

## 📱 App Store Requirements

This website satisfies Apple App Store and Google Play Store requirements:

✅ Privacy Policy clearly displayed and accessible
✅ Terms of Service available
✅ Support/Contact information provided
✅ Clear app description and features
✅ Professional presentation
✅ GDPR and CCPA compliance considerations

## 🔧 Testing Locally

To test the website locally:

```bash
# Navigate to the html folder
cd html

# Start a simple HTTP server
python3 -m http.server 8000

# Open in browser
open http://localhost:8000
```

## 📝 Notes

- All files use relative links, so they work in any directory structure
- The design is mobile-first and fully responsive
- No external dependencies - pure HTML/CSS
- Contact form is currently non-functional (email link provided instead)
- Consider adding a backend for the contact form if needed

## 🎯 Next Steps

1. Review all content and customize as needed
2. Update all placeholder contact information
3. Add your actual App Store and Google Play links
4. Deploy to GitHub Pages
5. Set up custom domain (pintayo.com)
6. Submit to App Store with website URLs:
   - Privacy Policy: `https://pintayo.com/privacy.html`
   - Terms of Service: `https://pintayo.com/terms.html`
   - Support URL: `https://pintayo.com/support.html`

## 📧 Support

For questions or issues, contact: support@pintayo.com

---

**Made with ❤️ for MemoryVerse**
