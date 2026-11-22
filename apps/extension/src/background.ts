// Orbitly Chrome Extension Background Service Worker (Manifest V3)

if (typeof chrome !== 'undefined' && chrome.runtime) {
  chrome.runtime.onInstalled.addListener(() => {
    // Register Context Menu: "Share with Orbitly"
    if (chrome.contextMenus) {
      chrome.contextMenus.create({
        id: 'orbitly_share_page',
        title: 'Share with Orbitly',
        contexts: ['page', 'link', 'image', 'selection'],
      });
    }
  });

  if (chrome.contextMenus) {
    chrome.contextMenus.onClicked.addListener((info, tab) => {
      if (info.menuItemId === 'orbitly_share_page' && tab?.id) {
        // Open popup or trigger extension action
        if (chrome.action && chrome.action.openPopup) {
          chrome.action.openPopup().catch(() => {
            // Popup open fallback
          });
        }
      }
    });
  }
}
