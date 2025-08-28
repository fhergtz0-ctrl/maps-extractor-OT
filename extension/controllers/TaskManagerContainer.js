/* controllers/TaskManagerContainer.js
 * “Máquina de estados” simple: start → openMap (por cada tarea) → stop.
 */

/* global chrome */

const TM = {
  running: false,
  queue: [],
  current: null,
};

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async () => {
    switch (msg?.type) {
      case 'task:start':
        TM.running = true;
        sendResponse({ ok: true });
        break;
      case 'task:stop':
        TM.running = false;
        TM.queue = [];
        sendResponse({ ok: true });
        break;
      case 'task:enqueue':
        TM.queue.push(...(msg.payload || []));
        sendResponse({ ok: true, size: TM.queue.length });
        break;
      default:
        sendResponse({ ok: false });
    }
  })();
  return true;
});

// Bucle simple (tick) para abrir búsquedas
setInterval(async () => {
  if (!TM.running || TM.current || TM.queue.length === 0) return;
  TM.current = TM.queue.shift();
  await chrome.runtime.sendMessage({ type: 'task:openMap', payload: TM.current });
  // el content-script hará el resto; liberamos current tras un delay de cortesía
  setTimeout(() => { TM.current = null; }, 2500);
}, 800);
