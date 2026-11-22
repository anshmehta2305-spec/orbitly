import { extractWebpageMetadata } from './extractor';

// Listen for message from Extension Popup or Service Worker
if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'GET_PAGE_METADATA') {
      try {
        const metadata = extractWebpageMetadata(document, window.location.href);
        sendResponse({ success: true, metadata });
      } catch (err: any) {
        sendResponse({ success: false, error: err.message });
      }
    }
    return true; // Keep message channel open for async response
  });
}
