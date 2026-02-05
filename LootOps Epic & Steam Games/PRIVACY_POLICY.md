# Privacy Policy for LootOps: Epic & Steam Games

**Effective Date: February 5, 2026**

At **LootOps**, we respect your privacy as much as your gaming library. This policy explains how we handle your data.

## 1. Zero Data Collection
**LootOps** is a surveillance tool for free games, not your personal data.
*   **No Personal Information**: We do not collect names, email addresses, or gaming account credentials (Steam/Epic).
*   **No Tracking**: We do not track which games you've already claimed or your personal wishlist.
*   **No External Analytics**: We do not use Google Analytics or any 3rd party tracking pixels.

## 2. Local-Only Storage
All extension settings, including your notification history (to prevent duplicate alerts) and theme preferences, are stored locally on your device using the `chrome.storage.local` API. This data stays on your machine and is destroyed if you uninstall the extension.

## 3. Permissions & Justification
*   `alarms`: Used to trigger periodic background checks for new free game drops.
*   `notifications`: Used to alert you when a free game is detected.
*   `storage`: Required to save settings and tracking state locally.
*   `host_permissions`: Required solely to communicate with the official public backends of Epic Games and Steam to check for pricing updates.

## 4. Third-Party Services
LootOps communicates with the publicly accessible store backends of **Epic Games** and **Steam**. We do not send any of your personal data to these services; we only fetch the current list of free titles.

## 5. Security
The extension is open-source and reviewable. We do not use remote code execution to ensure your browser remains a secure environment.

## 6. Contact
If you have questions about our privacy practices, please open an issue on our [GitHub Repository](https://github.com/Subhan-Haider/Extra-Extensions).
