# Legal Documents for MemoryVerse

## 📋 Required for App Store Submission

These legal documents MUST be uploaded to your website before submitting to the App Store:

### Files to Upload

1. **privacy.html** → Upload to `https://pintayo.com/privacy.html`
2. **terms.html** → Upload to `https://pintayo.com/terms.html`

## 🚀 How to Upload

### Option 1: Static Hosting (GitHub Pages, Netlify, Vercel)
```bash
# If using GitHub Pages
git add legal/
git commit -m "Add privacy and terms pages"
git push

# Configure your domain to serve these files at:
# - pintayo.com/privacy.html
# - pintayo.com/terms.html
```

### Option 2: Traditional Web Server (cPanel, FTP)
1. Log into your web hosting control panel
2. Navigate to public_html or www folder
3. Upload `privacy.html` and `terms.html`
4. Verify they are accessible at the URLs above

### Option 3: Simple HTTP Server (for testing)
```bash
# Navigate to legal directory
cd legal/

# Python 3
python3 -m http.server 8000

# Then access:
# http://localhost:8000/privacy.html
# http://localhost:8000/terms.html
```

## ✅ Verification Checklist

Before app submission, verify:

- [ ] `https://pintayo.com/privacy.html` loads correctly
- [ ] `https://pintayo.com/terms.html` loads correctly
- [ ] Both pages are mobile-friendly (responsive)
- [ ] Both pages mention "MemoryVerse"
- [ ] Privacy policy mentions data collection details
- [ ] Privacy policy mentions RevenueCat, Supabase, Perplexity AI
- [ ] Privacy policy mentions GDPR compliance
- [ ] Terms of service mentions subscription details
- [ ] No spelling errors or broken formatting

## 📱 Mobile Testing

Test on actual devices:
```
1. Open Safari/Chrome on your phone
2. Visit pintayo.com/privacy.html
3. Scroll through - should be readable
4. Visit pintayo.com/terms.html
5. Scroll through - should be readable
```

## 🔒 IMPORTANT NOTES

1. **DO NOT CHANGE URLs**: App Store already has these URLs configured in app.json
2. **HTTPS Required**: Make sure your domain has SSL certificate (https://)
3. **Must be PUBLIC**: Pages must be accessible without login
4. **Keep Updated**: Update dates when you make changes

## 📞 Current Status

**Status**: ⚠️ URLs currently return 403 errors
**Action Required**: Upload these files to pintayo.com BEFORE app submission

## 🎯 Next Steps

1. Upload files to your web server
2. Test URLs in browser
3. Test URLs on mobile device
4. Mark as complete in pre-production checklist
5. Proceed with app submission

---

**Questions?** Contact your web hosting provider or email support@pintayo.com
