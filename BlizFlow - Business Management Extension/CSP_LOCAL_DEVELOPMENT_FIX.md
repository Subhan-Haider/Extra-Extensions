# 🔒 CSP Local Development Fix

## ❌ Error

```
Connecting to 'http://172.16.1.106:3000/health' violates the following 
Content Security Policy directive: "connect-src 'self' https://blizflow.online https://*.blizflow.online". 
The action has been blocked.
```

## ✅ Solution

The CSP (Content Security Policy) in `manifest.json` has been updated to allow connections to local development servers.

### What's Now Allowed

The extension can now connect to:
- ✅ `http://localhost:*` (any port)
- ✅ `http://127.0.0.1:*` (any port)
- ✅ `http://172.16.1.106:*` (your current local IP)
- ✅ `https://blizflow.online` (production)
- ✅ `https://*.blizflow.online` (production subdomains)

### Current CSP Configuration

```json
"connect-src 'self' https://blizflow.online https://*.blizflow.online http://localhost:* http://127.0.0.1:* http://172.16.1.106:*"
```

## 🔧 Adding Your Own Local IP

If you're using a different local IP address (not `172.16.1.106`), you need to add it to the CSP:

### Step 1: Find Your Local IP

**Windows:**
```cmd
ipconfig
```
Look for "IPv4 Address" (usually `192.168.x.x` or `172.16.x.x`)

**Mac/Linux:**
```bash
ifconfig
```
or
```bash
ip addr show
```

### Step 2: Update manifest.json

1. Open `extension/manifest.json`
2. Find the `content_security_policy` section
3. Add your IP to the `connect-src` directive:

**Before:**
```json
"connect-src 'self' https://blizflow.online https://*.blizflow.online http://localhost:* http://127.0.0.1:* http://172.16.1.106:*"
```

**After (example for IP 192.168.1.100):**
```json
"connect-src 'self' https://blizflow.online https://*.blizflow.online http://localhost:* http://127.0.0.1:* http://172.16.1.106:* http://192.168.1.100:*"
```

### Step 3: Reload Extension

1. Go to `chrome://extensions/`
2. Find your extension
3. Click the **Reload** button (🔄)
4. Test the connection again

## 📋 Common Local IP Ranges

If you need to add multiple IPs, here are common local network ranges:

- `192.168.1.*` - Common home router range
- `192.168.0.*` - Alternative router range
- `172.16.*.*` - Corporate/VPN range
- `10.*.*.*` - Corporate/VPN range
- `127.0.0.1` - Localhost (already added)
- `localhost` - Localhost (already added)

**Note:** CSP doesn't support wildcards in the middle of IPs, so you need to add specific IPs.

## 🚀 Quick Fix for Your Current Setup

Since you're using `172.16.1.106`, it's already added! Just:

1. **Reload the extension:**
   - Go to `chrome://extensions/`
   - Click **Reload** on your extension

2. **Test the connection:**
   - Open extension options
   - Click "Test Connection"
   - It should work now! ✅

## ⚠️ Important Notes

1. **CSP is Security Feature**
   - CSP prevents malicious scripts from connecting to unauthorized servers
   - Only add IPs you trust
   - Don't add public IPs or unknown servers

2. **Development vs Production**
   - Local IPs are only needed for development
   - Production should use `https://blizflow.online`
   - Local IPs won't work in production

3. **Extension Reload Required**
   - After changing `manifest.json`, you MUST reload the extension
   - Changes don't take effect until reload

## 🐛 Troubleshooting

### Still Getting CSP Error?

1. **Check manifest.json:**
   - Make sure your IP is in the `connect-src` list
   - Check for typos in the IP address
   - Make sure there's a space between entries

2. **Reload Extension:**
   - Go to `chrome://extensions/`
   - Click **Reload** (not just refresh the page)
   - Close and reopen the options page

3. **Check IP Address:**
   - Make sure you're using the correct IP
   - Verify the server is running on that IP
   - Try `http://localhost:3000` instead

4. **Check URL Format:**
   - Use `http://` (not `https://`) for local development
   - Include port number: `http://172.16.1.106:3000`
   - No trailing slash in API URL setting

### Using Different Port?

The `:*` wildcard allows any port, so:
- ✅ `http://172.16.1.106:3000` - Works
- ✅ `http://172.16.1.106:8080` - Works
- ✅ `http://172.16.1.106:5000` - Works

## ✅ Verification

After fixing, you should be able to:

1. ✅ Open extension options
2. ✅ Enter your API URL: `http://172.16.1.106:3000/api`
3. ✅ Enter your API key
4. ✅ Click "Test Connection"
5. ✅ See "✅ Connection successful!"

## 📝 Summary

- ✅ CSP updated to allow local development servers
- ✅ `localhost`, `127.0.0.1`, and `172.16.1.106` are allowed
- ✅ Reload extension after changes
- ✅ Add your own IP if different
- ✅ Use `http://` for local development

The connection should work now! 🎉

