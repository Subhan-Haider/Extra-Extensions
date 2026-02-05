# ClipTrack - Testing & Verification Guide

## 🧪 How to Test Clipboard Tracking

### Step 1: Reload the Extension

1. Open `chrome://extensions/`
2. Find "ClipTrack - Clipboard History Manager"
3. Click the **reload icon** (circular arrow)
4. Or toggle it off and back on

### Step 2: Test Keyboard Shortcuts

#### Test Ctrl+C (Copy)

1. Go to any website (e.g., google.com)
2. Select some text on the page
3. Press **Ctrl+C** (or Cmd+C on Mac)
4. Open ClipTrack extension
5. ✅ You should see the copied text appear in history

#### Test Ctrl+V (Paste)

1. Go to any text input field (e.g., search box)
2. Press **Ctrl+V** (or Cmd+V on Mac)
3. Open ClipTrack extension
4. ✅ You should see the pasted text appear in history

#### Test Ctrl+X (Cut)

1. Type some text in an input field
2. Select the text
3. Press **Ctrl+X** (or Cmd+X on Mac)
4. Open ClipTrack extension
5. ✅ You should see the cut text appear in history

### Step 3: Test Right-Click Context Menu

1. Select text on any webpage
2. Right-click and choose "Copy"
3. Open ClipTrack extension
4. ✅ Text should appear in history

### Step 4: Test Browser Copy/Paste Events

1. Select text and use browser's Edit menu → Copy
2. Open ClipTrack extension
3. ✅ Text should appear in history

## 🔍 Debugging

### Check Console Logs

1. Open ClipTrack popup
2. Right-click anywhere in the popup
3. Select "Inspect"
4. Go to **Console** tab
5. Look for messages like:
   - `ClipTrack: Content script loaded and monitoring clipboard operations`
   - `ClipTrack: Detected shortcut: Ctrl+C`

### Check Content Script on Webpage

1. Go to any webpage
2. Press **F12** to open DevTools
3. Go to **Console** tab
4. Press Ctrl+C after selecting text
5. Look for: `ClipTrack: Detected shortcut: Ctrl+C`

### Check Background Script

1. Go to `chrome://extensions/`
2. Find ClipTrack
3. Click "service worker" link
4. Check console for any errors

## 🎯 What Gets Tracked

### ✅ Tracked Operations

- [x] **Ctrl+C** / Cmd+C (keyboard shortcut)
- [x] **Ctrl+V** / Cmd+V (keyboard shortcut)
- [x] **Ctrl+X** / Cmd+X (keyboard shortcut)
- [x] Right-click → Copy
- [x] Right-click → Paste
- [x] Right-click → Cut
- [x] Browser Edit menu → Copy
- [x] Browser Edit menu → Paste
- [x] Browser Edit menu → Cut
- [x] Copy event (any method)
- [x] Paste event (any method)
- [x] Cut event (any method)

### 📊 Tracked Information

For each clipboard operation, we track:
- **Text content** - What was copied/pasted
- **Source URL** - Which website it came from
- **Page title** - Title of the webpage
- **Timestamp** - When it happened
- **Type** - Copy, Paste, or Cut
- **Favicon** - Website icon

## 🐛 Troubleshooting

### Issue: Ctrl+C not tracking

**Solutions:**
1. Reload the extension
2. Refresh the webpage
3. Check if text is actually selected
4. Check console for errors
5. Verify permissions are granted

### Issue: Nothing appears in history

**Solutions:**
1. Make sure tracking is enabled in settings
2. Check if you're copying actual text (not images)
3. Verify the extension is active
4. Check if duplicate detection is preventing it (wait 5 seconds)
5. Look for console errors

### Issue: Duplicate entries

**Solutions:**
- This is prevented automatically (5-second window)
- If you see duplicates, they're from different sources
- Check timestamps to verify

### Issue: Clipboard read permission error

**Solutions:**
1. The extension should have `clipboardRead` permission
2. Some websites may block clipboard access
3. Try on a different website
4. Check manifest.json has correct permissions

## 🧪 Test Scenarios

### Scenario 1: Basic Copy/Paste
```
1. Go to wikipedia.org
2. Select a paragraph
3. Press Ctrl+C
4. Open ClipTrack
5. Verify text appears
6. Go to notepad or text editor
7. Press Ctrl+V
8. Open ClipTrack
9. Verify paste event appears
```

### Scenario 2: Multiple Copies
```
1. Copy text from Site A (Ctrl+C)
2. Copy text from Site B (Ctrl+C)
3. Copy text from Site C (Ctrl+C)
4. Open ClipTrack
5. Verify all 3 items appear
6. Most recent should be at top
```

### Scenario 3: Cut Operation
```
1. Go to any text input (e.g., Gmail compose)
2. Type some text
3. Select it
4. Press Ctrl+X
5. Open ClipTrack
6. Verify cut event appears
```

### Scenario 4: Context Menu
```
1. Select text on any page
2. Right-click
3. Click "Copy"
4. Open ClipTrack
5. Verify text appears
```

### Scenario 5: Cross-Site Tracking
```
1. Copy from Google
2. Copy from GitHub
3. Copy from YouTube
4. Open ClipTrack
5. Verify all 3 sites tracked
6. Check Statistics → Most Used Sites
```

## 📝 Expected Behavior

### When you press Ctrl+C:
1. Content script detects keydown event
2. Waits 50ms for selection to complete
3. Gets selected text
4. Sends to background script
5. Background script stores in history
6. Popup shows new item (if open)

### When you press Ctrl+V:
1. Content script detects keydown event
2. Reads clipboard content
3. Sends to background script
4. Background script stores in history
5. Popup shows new item (if open)

### Duplicate Prevention:
- Same text within 5 seconds = ignored
- Same text after 5 seconds = new entry
- Different text = always new entry

## 🎨 Visual Indicators

### In Popup:
- **New items** appear at the top
- **Type badge** shows Copy/Paste/Cut
- **Timestamp** shows "Just now"
- **Favicon** shows source website
- **Auto-refresh** every 5 seconds

### In Console:
- `ClipTrack: Content script loaded...` = Script active
- `ClipTrack: Detected shortcut: Ctrl+C` = Shortcut detected
- `ClipTrack: Error...` = Something went wrong

## 🔧 Advanced Testing

### Test with Different Websites:
- [ ] Google.com
- [ ] GitHub.com
- [ ] Wikipedia.org
- [ ] YouTube.com
- [ ] Gmail.com
- [ ] Your own website

### Test with Different Content:
- [ ] Plain text
- [ ] Text with special characters
- [ ] Very long text (1000+ chars)
- [ ] URLs
- [ ] Code snippets
- [ ] Numbers

### Test Edge Cases:
- [ ] Copy empty selection (should not track)
- [ ] Copy same text twice quickly (should deduplicate)
- [ ] Copy in iframe
- [ ] Copy in popup windows
- [ ] Copy in incognito mode (won't work - by design)

## 📊 Performance Testing

### Check Performance:
1. Copy 50 different items
2. Open ClipTrack
3. Should load instantly
4. Search should be instant
5. Filtering should be instant

### Check Memory:
1. Open Task Manager
2. Find Chrome extension process
3. ClipTrack should use ~5-10MB

## ✅ Verification Checklist

After testing, verify:
- [ ] Ctrl+C tracking works
- [ ] Ctrl+V tracking works
- [ ] Ctrl+X tracking works
- [ ] Right-click copy works
- [ ] Context menu tracking works
- [ ] Multiple sites tracked
- [ ] Timestamps are correct
- [ ] Favicons appear
- [ ] No duplicate entries (within 5 sec)
- [ ] Search works
- [ ] Filters work
- [ ] Export works
- [ ] Statistics update
- [ ] No console errors

## 🎯 Success Criteria

✅ **Extension is working correctly if:**
1. Every Ctrl+C creates a new history item
2. Every Ctrl+V creates a new history item
3. Every Ctrl+X creates a new history item
4. Source website is tracked
5. Timestamps are accurate
6. No errors in console
7. Popup loads quickly
8. Search and filter work

## 📞 Still Having Issues?

### Check These:
1. Extension is enabled
2. Extension has permissions
3. Content script is loaded (check console)
4. Background script is running
5. No conflicting extensions
6. Chrome is up to date

### Debug Steps:
1. Reload extension
2. Refresh webpage
3. Check console logs
4. Verify manifest.json
5. Check permissions granted
6. Try incognito mode (if allowed)

## 🚀 Quick Test

**30-Second Test:**
```
1. Go to google.com
2. Select "Google" text
3. Press Ctrl+C
4. Click ClipTrack icon
5. See "Google" in history ✅
```

If this works, everything is working! 🎉

---

**Need Help?** Check the console logs for detailed error messages.

**Working?** Great! Start using all the features:
- Add tags
- Mark favorites
- View statistics
- Export data
- Create templates

**Enjoy ClipTrack v2.0!** 🚀
