/* load task manager logic */
try { importScripts('controllers/TaskManagerContainer.js'); } catch (e) { console.warn('TaskManager not loaded', e); }

/* controllers/background.js
 * MV3 service-worker friendly.
 * Orquesta: abre la UI principal y enruta mensajes start/stop/openMap.
 */

/* global chrome */

const STATE = {
  uiTabId: null,
  running: false,
};

chrome.runtime.onInstalled.addListener(() => {
  console.info('[bg] installed');
});

chrome.action.onClicked.addListener(async () => {
  await openUI();
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async () => {
    switch (msg?.type) {
      case 'ui:open':
        await openUI();
        sendResponse({ ok: true });
        break;
      case 'task:start':
        STATE.running = true;
        sendResponse({ ok: true });
        break;
      case 'task:stop':
        STATE.running = false;
        sendResponse({ ok: true });
        break;
      case 'task:openMap':
        await openTarget(msg.payload);
        sendResponse({ ok: true });
        break;
      default:
        sendResponse({ ok: false, error: 'unknown_message' });
    }
  })();
  return true;
});

async function openUI() {
  // Abre/activa la pestaña de UI (views/index.html)
  const url = chrome.runtime.getURL('views/index.html');
  const tabs = await chrome.tabs.query({ url });
  if (tabs.length) {
    await chrome.tabs.update(tabs[0].id, { active: true });
    STATE.uiTabId = tabs[0].id;
  } else {
    const tab = await chrome.tabs.create({ url, active: true });
    STATE.uiTabId = tab.id;
  }
}

async function openTarget({ keyword, location }) {
  if (!keyword || !location) return;
  // Usa una búsqueda segura en Google (Local/Maps). Deja ambas opciones.
  const q = encodeURIComponent(`${keyword} in ${location}`);
  const urls = [
    // Local Services / prolist (cuando aplique por región)
    `https://www.google.com/localservices/prolist?hl=es&q=${q}`,
    // Google Maps results
    `https://www.google.com/maps/search/${q}`,
  ];
  // Abrimos la primera; la content script hará el scraping/lectura.
  await chrome.tabs.create({ url: urls[0], active: true });
}
