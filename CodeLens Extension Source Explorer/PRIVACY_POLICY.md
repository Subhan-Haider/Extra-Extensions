# Chrome Web Store Privacy & Permissions Documentation

## SINGLE PURPOSE

### Single Purpose Description (Max 1000 chars)

CodeLens is a developer tool designed exclusively for inspecting and analyzing browser extension source code. Its single purpose is to enable developers, security researchers, and users to view, download, and examine the source code of browser extensions from the Chrome Web Store, Firefox Add-ons, Opera Extensions, and Edge Add-ons. The extension provides syntax-highlighted code viewing, file filtering, search capabilities, and the ability to download extensions as ZIP files for offline analysis. All functionality serves this singular purpose of extension source code inspection and analysis.

---

## PERMISSION JUSTIFICATIONS

### tabs (Max 1000 chars)

The "tabs" permission is required to identify the currently active tab when the user clicks the extension icon or uses the context menu. This allows CodeLens to automatically detect when a user is viewing an extension page in the Chrome Web Store or other addon marketplaces, extract the extension ID from the URL, and provide one-click access to view that extension's source code. Without this permission, users would need to manually copy and paste extension URLs, significantly degrading the user experience. The permission is used solely to read the current tab's URL to determine which extension the user wants to inspect.

### storage (Max 1000 chars)

The "storage" permission is used exclusively to save user preferences and maintain a local history of recently inspected extensions. Specifically, it stores: (1) User settings such as preferred action when clicking the extension icon (popup, download, or view source), and (2) A list of the last 5 inspected extensions to provide quick re-access through the "Recently Inspected" feature in the popup. All data is stored locally on the user's device using chrome.storage.local and chrome.storage.sync. No data is transmitted to external servers. This permission enables a better user experience by remembering preferences and providing convenient access to previously viewed extensions.

### contextMenus (Max 1000 chars)

The "contextMenus" permission enables CodeLens to add convenient right-click menu options when users browse extension pages in the Chrome Web Store and other addon marketplaces. When a user right-clicks on an extension listing page, CodeLens adds menu items like "Inspect Contents" and "Security Audit" for quick access to source code viewing and security analysis. This provides a seamless, intuitive workflow for developers and security researchers who frequently analyze multiple extensions. The context menu integration is essential for the extension's core purpose of making source code inspection easily accessible. Without this permission, users would need to manually open the extension popup for every inspection, reducing efficiency.

### downloads (Max 1000 chars)

The "downloads" permission is required to enable users to download browser extensions as ZIP files for offline analysis, archival, or detailed inspection. When a user requests to download an extension, CodeLens fetches the extension package (CRX or XPI file), converts it to a standard ZIP format, and triggers a download to the user's computer. This functionality is core to the extension's purpose, as many developers and security researchers need to perform in-depth analysis using external tools, share extension code with team members, or maintain archives of extension versions. The permission is used exclusively for initiating downloads of extension packages that the user explicitly requests.

### declarativeContent (Max 1000 chars)

The "declarativeContent" permission is used to intelligently enable or disable the extension's page action icon based on the current page context. Specifically, CodeLens only shows its icon and enables functionality when the user is browsing supported extension marketplaces (Chrome Web Store, Firefox Add-ons, Opera Extensions, Edge Add-ons) or when viewing the extension's own explorer page. This provides a clean user experience by preventing the icon from appearing on irrelevant pages where the extension cannot function. The permission uses declarative rules to match URL patterns of extension marketplaces, ensuring the extension is only active when it can actually inspect extension source code.

### Host Permissions (*://clients2.google.com/service/update2/crx*, *://clients2.googleusercontent.com/crx/download/*)

These specific host permissions are required to download Chrome extension packages (CRX files) from Google's official Chrome Web Store servers. When a user requests to view or download an extension's source code, CodeLens must fetch the actual extension package from Google's CDN. These are the official URLs used by Chrome itself to download extensions. The permissions are limited to these exact domains and paths - no broader access is requested. The extension does not access any other Google services or user data. These permissions are essential for the core functionality of downloading and inspecting Chrome extensions. Without them, the extension cannot fulfill its primary purpose.

---

## REMOTE CODE

### Are you using remote code?
**Answer: No, I am not using Remote code**

### Justification (if needed)
CodeLens does not use any remote code. All JavaScript and functionality is included in the extension package. The extension does not:
- Load external scripts via <script> tags
- Use eval() to execute remote code strings
- Import modules from external URLs
- Fetch and execute code from remote servers

All code execution happens locally using only the files packaged with the extension.

---

## DATA USAGE

### What user data do you plan to collect?

**Answer: NONE - Check NONE of the boxes**

CodeLens does NOT collect, store, or transmit any user data:

❌ Personally identifiable information - NO
❌ Health information - NO
❌ Financial and payment information - NO
❌ Authentication information - NO
❌ Personal communications - NO
❌ Location - NO
❌ Web history - NO
❌ User activity - NO
❌ Website content - NO

### Certifications

✅ I certify that I do not sell or transfer user data to third parties, outside of the approved use cases
✅ I certify that I do not use or transfer user data for purposes that are unrelated to my item's single purpose
✅ I certify that I do not use or transfer user data to determine creditworthiness or for lending purposes

---

## PRIVACY POLICY

CodeLens Privacy Policy
Last Updated: January 15, 2026

### Overview
CodeLens ("the Extension") is committed to protecting your privacy. This privacy policy explains our data practices for the CodeLens browser extension.

### Data Collection
CodeLens does NOT collect, store, transmit, or share any personal data or user information. The extension operates entirely locally on your device.

### Local Storage Only
The extension uses browser local storage exclusively to save:
- User preferences (e.g., default action when clicking the extension icon)
- Recently inspected extensions list (last 5 items, stored locally only)

This data never leaves your device and is not transmitted to any servers.

### No Analytics or Tracking
CodeLens does not use any analytics services, tracking pixels, or telemetry. We do not collect information about:
- Your browsing history
- Which extensions you inspect
- How you use the extension
- Your IP address or location
- Any personally identifiable information

### Permissions Usage
The extension requests only the minimum permissions necessary for its core functionality:

- **tabs**: To detect the current extension page URL
- **storage**: To save user preferences locally
- **contextMenus**: To add right-click menu options
- **downloads**: To download extension packages
- **declarativeContent**: To show the icon only on relevant pages
- **Host permissions**: To download extension files from Chrome Web Store servers

### Third-Party Services
CodeLens does not integrate with any third-party services, APIs, or analytics platforms. All processing happens locally in your browser.

### Data Security
Since no data is collected or transmitted, there are no data security risks associated with using CodeLens. All operations are performed locally on your device.

### Children's Privacy
CodeLens does not knowingly collect any information from anyone, including children under 13.

### Changes to This Policy
We may update this privacy policy from time to time. Any changes will be posted in the extension's Chrome Web Store listing and GitHub repository.

### Contact
For questions about this privacy policy, please visit: https://github.com/Subhan-Haider

### Your Rights
Since we don't collect any data, there is no personal data to access, modify, or delete. You maintain complete control over the local preferences stored by the extension, which you can clear at any time through your browser settings.

### Compliance
This extension complies with:
- Chrome Web Store Developer Program Policies
- General Data Protection Regulation (GDPR)
- California Consumer Privacy Act (CCPA)
- Other applicable privacy regulations

By using CodeLens, you agree to this privacy policy.

---
CodeLens - Professional Edition
https://github.com/Subhan-Haider
