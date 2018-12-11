const browser = window.browser || window.chrome;

/**
 * Opens extension options page
 */
function openOptionsPage() {
  if (browser.runtime.openOptionsPage) {
    browser.runtime.openOptionsPage();
  } else {
    window.open(browser.runtime.getURL('src/options/options.html'));
  }
}

browser.runtime.onMessage.addListener(message => {
  if (message.action === 'openOptionsPage') {
    openOptionsPage();
  }
});
