// Remove ads by common selectors
const adSelectors = [
  '[id^="ad"]',
  '[class*="ad-"]',
  '[class*="ads"]',
  '[class*="banner"]',
  '[class*="promoted"]',
  'iframe[src*="ads"]'
];

adSelectors.forEach(selector => {
  document.querySelectorAll(selector).forEach(el => el.remove());
});
