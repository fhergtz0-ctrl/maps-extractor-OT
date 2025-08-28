/* controllers/contextMenus.js
 * Crea un menú contextual que lanza la extracción de URLs visibles.
 */

/* global chrome */

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'extract-urls',
    title: 'Extract URLs',
    contexts: ['page', 'selection'],
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== 'extract-urls' || !tab?.id) return;
  chrome.tabs.sendMessage(tab.id, { type: 'context:extractUrls' });
});
