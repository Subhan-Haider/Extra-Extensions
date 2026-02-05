# Privacy Policy for Chronos Ultima

**Last Updated:** January 27, 2026

Chronos Ultima ("we", "our", or "the extension") is defined by a **Local-First** philosophy. We believe your browser data belongs to you, and you alone. This Privacy Policy explains how we handle your data.

## 1. Data Collections & Storage

Chronos Ultima does **NOT** collect, transmit, or sell your personal data to any external servers or third parties. 

The extension stores the following data **locally on your device** (using `chrome.storage.local`) to function:

*   **Browsing History (Tabs):** When you save a "Context", we store the URL, Title, and Favicon of the tabs you explicitly choose to capture.
*   **Website Content:** When you use the "Capture to Chronos" feature, we store the specific text or image URL you selected.
*   **Settings:** Your preferences (e.g., Theme, Auto-Archive settings).

## 2. Data Usage

All data is used strictly for the functionality of the extension:
*   To restore your tab sessions when requested.
*   To display your saved snippets in the dashboard.
*   To check for duplicate tabs or projects.

## 3. Remote Code & External Connections

*   **No Remote Code:** Chronos Ultima does not load any remote code. All logic is contained within the extension package.
*   **No Analytics:** We do not use Google Analytics, Mixpanel, or any other tracking software.
*   **Offline Capable:** The extension functions 100% offline.

## 4. Host Permissions

The extension requests access to `all_urls` (`<all_urls>`) for a singular purpose:
*   To inject a lightweight content script that displays a **visual notification (Toast)** when you save a snippet. 
*   This script **does not** read or scan webpages in the background. It is passive and only activates when receiving a "Success" message from the extension background.

## 5. Contact

If you have questions about this policy or your privacy, you can verify our source code directly on GitHub or contact the developer via the GitHub repository issues page: 
https://github.com/haider-subhan/Chronos-Visual-Context-Manager
