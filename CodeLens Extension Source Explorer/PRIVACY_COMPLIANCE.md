# Chrome Web Store Compliance Info for CodeLens: Extension Source Explorer

## Single purpose
An extension must have a single purpose that is narrow and easy-to-understand.

### Single purpose description
Unlock the secrets of any browser extension. View source code for Chrome, Firefox, and Opera extensions with a single click.
The extracted purpose of this extension is to: Unlock the secrets of any browser extension. View source code for Chrome, Firefox, and Opera extensions with a single click.

## Permission justification
**tabs**: Required to access and manipulate browser tabs.
**storage**: Required to save user preferences and extension state locally.
**contextMenus**: Required to add items to the right-click menu for quick access to extension features.
**downloads**: Required to download files generated or selected by the extension.
**declarativeContent**: Required to take actions depending on the content of the page.

## Host permission justification
Host permissions are required to function on the following sites:
- *://clients2.google.com/service/update2/crx*
- *://clients2.googleusercontent.com/crx/download/*
- *://microsoftedge.microsoft.com/extensionwebstorebase/v1/crx*
- *://edge.microsoft.com/extensionwebstorebase/v1/crx*
- https://addons.mozilla.org/*
- https://api.github.com/*
- https://github.com/*
Justification: The extension needs to inject scripts or read content on these specific pages to perform its core function.

## Remote Code
Are you using remote code?
[ ] Yes, I am using Remote code
[x] No, I am not using Remote code

## Data usage
What user data do you plan to collect from users now or in the future?

- [ ] Personally identifiable information
- [ ] Health information
- [ ] Financial and payment information
- [ ] Authentication information
- [ ] Personal communications
- [ ] Location
- [ ] Web history
- [ ] User activity
- [ ] Website content

**Note**: If your extension collects any of the above (stored reliably), check the box. If data is only stored locally, you may not need to declare 'collection' in the same way, but transparency is key.

## Certifications
[x] I do not sell or transfer user data to third parties, outside of the approved use cases
[x] I do not use or transfer user data for purposes that are unrelated to my item's single purpose
[x] I do not use or transfer user data to determine creditworthiness or for lending purposes

## Privacy policy
Privacy policy URL*
https://example.com/privacy-policy
(Please replace with your actual privacy policy URL)