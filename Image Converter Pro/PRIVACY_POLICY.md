# Privacy Policy for Image Converter Pro

**Effective Date: February 5, 2026**

At **Image Converter Pro**, we take your privacy seriously. This Privacy Policy explains how our browser extension handles user data.

## 1. Data Collection & Usage
**Image Converter Pro** is designed with a "Local-First" architecture. 
*   **No Personal Data Collection**: We do not collect, store, or transmit any personally identifiable information (PII).
*   **Local Processing**: All image conversions, compressions, and batch processing occur entirely within your browser's local environment. Your images are never uploaded to our servers or any third-party cloud.
*   **No Tracking**: We do not use cookies, analytics, or fingerprinting to track your browsing habits or extension usage.

## 2. Permissions & Justification
To provide its core functionality, the extension requires the following permissions:
*   `storage`: Used to save your settings, custom presets, and conversion history locally on your device.
*   `contextMenus`: Allows you to right-click images on the web to quickly load them into the converter.
*   `activeTab`: Allows the extension to interact with the images on the page you are currently viewing when you explicitly click the extension.
*   `downloads`: Required to save the converted images or ZIP archives to your computer.
*   `notifications`: Used to alert you when a large batch process is complete.

## 3. Data Storage
All configurations, presets, and history records are stored using the `chrome.storage.local` API. This data remains on your physical device and is deleted if you uninstall the extension.

## 4. Third-Party Services
This extension does not communicate with any external APIs or third-party services. All processing logic is contained within the extension package.

## 5. Security
All code is open-source and can be reviewed for security practices. We do not use remote code execution; every script is packaged locally.

## 6. Policy Updates
We may update this policy occasionally to reflect changes in our practices or for legal reasons. Updates will be posted in the repository's `PRIVACY_POLICY.md` file.

## 7. Contact
If you have questions about our privacy practices, please open an issue on our [GitHub Repository](https://github.com/Subhan-Haider/Extra-Extensions).
