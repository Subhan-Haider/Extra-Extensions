# Chrome Web Store Privacy Form - CodeLens: Extension Source Explorer

## SINGLE PURPOSE

**Single purpose description:**
Unlock the secrets of any browser extension. View source code for Chrome, Firefox, and Opera extensions with a single click.

This extension serves a single, well-defined purpose: unlock the secrets of any browser extension. view source code for chrome, firefox, and opera extensions with a single click. The extension does not perform any unrelated functions and all requested permissions are strictly necessary to fulfill this core functionality.

---

## PERMISSION JUSTIFICATION

**storage justification:**
Required to save user preferences, settings, and application state locally on the device using Chrome's secure storage API, ensuring data persistence across browser sessions.

**Other permissions:**
- **tabs**: Required to query and interact with browser tabs, such as opening, closing, or switching between tabs to enable core functionality.
- **contextMenus**: Required to add custom menu items to the browser's right-click context menu, providing quick access to extension features.
- **downloads**: Required to programmatically download files generated or processed by the extension, such as exported data or converted content.
- **declarativeContent**: Required for core functionality of the extension.

**Host permission justification:**
This extension requires access to the following domains to perform its core functionality:

- *://clients2.googleusercontent.com/crx/download/*
- *://edge.microsoft.com/extensionwebstorebase/v1/crx*
- https://github.com/*
- *://microsoftedge.microsoft.com/extensionwebstorebase/v1/crx*
- *://clients2.google.com/service/update2/crx*
- https://api.github.com/*
- https://addons.mozilla.org/*

These host permissions are essential for the extension to:
- Access and read page content when the user explicitly invokes the extension
- Inject necessary scripts or styles to enhance functionality
- Communicate with specific web services required for the extension's operation
- Modify page content as part of the extension's single purpose

All host access is used exclusively for the extension's stated purpose and no data is collected or transmitted without user consent.

---

## REMOTE CODE

**Are you using remote code?**
☑ No, I am not using Remote code
☐ Yes, I am using Remote code

**Justification:**
This extension does not use any remote code. All JavaScript and resources are packaged within the extension. There are no external script references, no eval() usage, and no dynamically loaded code from external sources.

---

## DATA USAGE

**What user data do you plan to collect from users now or in the future?**

☐ Personally identifiable information
☐ Health information
☐ Financial and payment information
☐ Authentication information
☐ Personal communications
☐ Location
☐ Web history
☐ User activity
☐ Website content

**Note:** Any data collected is stored locally on the user's device and is not transmitted to external servers unless explicitly required for the extension's core functionality (e.g., API calls). Users have full control over their data.

---

## CERTIFICATIONS

I certify that the following disclosures are true:

☑ I do not sell or transfer user data to third parties, outside of the approved use cases
☑ I do not use or transfer user data for purposes that are unrelated to my item's single purpose
☑ I do not use or transfer user data to determine creditworthiness or for lending purposes

---

## PRIVACY POLICY

**Privacy policy URL:**
https://github.com/YOUR_USERNAME/CodeLens:-Extension-Source-Explorer/blob/main/PRIVACY_POLICY.md

(Please update this URL with your actual privacy policy location)

---

**Generated for:** CodeLens: Extension Source Explorer v2.1.0
**Last Updated:** 2.1.0 release
