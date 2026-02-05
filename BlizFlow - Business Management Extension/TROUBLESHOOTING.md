# Extension Troubleshooting Guide

## 🔧 Common Issues and Fixes

### Issue: Extension Not Loading
**Symptoms:** Extension doesn't appear in Chrome or shows errors

**Solutions:**
1. **Check Chrome Extensions Page:**
   - Go to `chrome://extensions/`
   - Enable "Developer mode" (top right)
   - Click "Load unpacked"
   - Select the `extension` folder (not the parent folder)

2. **Check for Errors:**
   - Look at the extension card for error messages
   - Click "Errors" button if available
   - Check browser console (F12 → Console tab)

3. **Verify Required Files:**
   - `manifest.json` must exist
   - `background.js` must exist
   - `popup.html` and `popup.js` must exist
   - `icons/icon16.png`, `icon48.png`, `icon128.png` must exist

### Issue: Popup Not Opening
**Symptoms:** Clicking extension icon does nothing

**Solutions:**
1. **Check manifest.json:**
   - Verify `action.default_popup` is set to `"popup.html"`
   - Check that `popup.html` exists

2. **Check Browser Console:**
   - Right-click extension icon → "Inspect popup"
   - Look for JavaScript errors
   - Check for missing files or import errors

3. **Reload Extension:**
   - Go to `chrome://extensions/`
   - Click reload button on extension card

### Issue: Buttons Not Working
**Symptoms:** Clicking buttons in popup does nothing

**Solutions:**
1. **Check Event Listeners:**
   - Open popup inspector (right-click icon → Inspect popup)
   - Check Console for errors
   - Verify buttons have correct IDs in HTML

2. **Check JavaScript:**
   - Ensure `popup.js` is loaded (check `<script>` tag in `popup.html`)
   - Verify `setupEventListeners()` is called
   - Check for JavaScript errors in console

### Issue: Features Not Working
**Symptoms:** Features don't execute or show errors

**Solutions:**
1. **Check Background Service Worker:**
   - Go to `chrome://extensions/`
   - Find extension → Click "service worker" link
   - Check for errors in service worker console

2. **Check Storage:**
   - Open popup inspector
   - In Console, type: `chrome.storage.local.get(null, console.log)`
   - Verify data is being stored correctly

3. **Check API Connection:**
   - Verify API key is set in options page
   - Check network requests in DevTools → Network tab
   - Ensure API URL is correct

### Issue: Icons Not Showing
**Symptoms:** Extension shows default icon or broken icon

**Solutions:**
1. **Generate Icons:**
   - Open `extension/icons/generate-icons.html` in browser
   - Click "Generate Icons"
   - Click "Download All Icons"
   - Save files to `extension/icons/` folder

2. **Verify Icon Files:**
   - Check that `icon16.png`, `icon48.png`, `icon128.png` exist
   - Verify files are valid PNG images
   - Check file sizes (should be small, < 50KB each)

### Issue: Content Script Not Working
**Symptoms:** Floating button or page features don't appear

**Solutions:**
1. **Check Content Script:**
   - Verify `content.js` exists
   - Check manifest.json has content_scripts section
   - Reload extension

2. **Check Page Permissions:**
   - Some pages may block content scripts
   - Try on different websites
   - Check Chrome extension permissions

### Issue: Auto-Login Not Working
**Symptoms:** Auto-login feature doesn't trigger

**Solutions:**
1. **Check Settings:**
   - Open options page
   - Verify "Enable Auto-Login" is checked
   - Verify credentials are saved

2. **Check Background Service Worker:**
   - Check service worker console for errors
   - Verify `auto-login.js` is imported correctly
   - Check for permission errors

## 🐛 Debugging Steps

### 1. Check Extension Console
1. Go to `chrome://extensions/`
2. Find your extension
3. Click "service worker" (for background.js)
4. Or right-click extension icon → "Inspect popup" (for popup.js)
5. Check Console tab for errors

### 2. Check Browser Console
1. Press F12 to open DevTools
2. Go to Console tab
3. Look for extension-related errors
4. Check for permission errors

### 3. Verify Files
Run this in terminal to check required files:
```bash
cd extension
ls manifest.json background.js popup.html popup.js content.js
ls icons/icon*.png
```

### 4. Test Storage
Open popup inspector and run:
```javascript
// Check storage
chrome.storage.local.get(null, console.log);

// Set test data
chrome.storage.local.set({test: 'value'}, () => {
  console.log('Storage test successful');
});
```

### 5. Test Message Passing
In popup inspector console:
```javascript
chrome.runtime.sendMessage({action: 'getUserData'}, (response) => {
  console.log('Response:', response);
});
```

## ✅ Quick Fixes

### Reload Extension
1. Go to `chrome://extensions/`
2. Click reload button on extension card
3. Try again

### Clear Extension Data
1. Go to `chrome://extensions/`
2. Click "Remove" on extension
3. Reload extension
4. This clears all stored data

### Check Permissions
1. Go to `chrome://extensions/`
2. Find extension
3. Click "Details"
4. Check "Site access" and permissions
5. Ensure required permissions are granted

## 📝 Error Messages

### "Could not load manifest"
- **Fix:** Check `manifest.json` is valid JSON
- Use JSON validator online
- Check for syntax errors

### "Could not load icon"
- **Fix:** Generate icons using `generate-icons.html`
- Verify icon files exist and are valid PNGs

### "Service worker registration failed"
- **Fix:** Check `background.js` for syntax errors
- Verify all imports are correct
- Check for missing files

### "Refused to execute inline script"
- **Fix:** All scripts must be in external files
- Remove inline `<script>` tags
- Use external `.js` files

## 🔍 Still Not Working?

1. **Check Chrome Version:**
   - Extension requires Chrome 88+ (Manifest V3)
   - Update Chrome if needed

2. **Check for Conflicts:**
   - Disable other extensions
   - Test in incognito mode
   - Check for ad blockers interfering

3. **Reinstall Extension:**
   - Remove extension completely
   - Reload from folder
   - Test again

4. **Check File Permissions:**
   - Ensure files are readable
   - Check folder permissions
   - Verify no file locks

---

**Need More Help?**
- Check browser console for specific error messages
- Review extension service worker logs
- Verify all files are present and correct

