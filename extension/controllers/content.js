/* controllers/content.js
 * Content script robusto para páginas de resultados (Local Services o Maps).
 * - Extrae tarjetas de negocio (multi-estrategia de selectores)
 * - Deriva CID real desde googleMapsUri (si existe ?cid=)
 * - Pagina cuando detecta "Siguiente" o parámetro incremental (lci)
 * - Respeta un límite de filas en modo free (quota demo)
 */

/* global chrome */

const COLLECT = [];
const LIMIT_FREE = 50;

const SELECTORS = [
  // Local Services (prolist)
  'c-wiz div[role="listitem"]',
  // Maps list results
  '.bfdHYd .Nv2PK, .m6QErb .hfpxzc',
  // Fallback genérico
  'a[href*="google.com/maps"], a[href*="google.com/url?q=https://maps.google"]',
];

function text(el, sel) {
  const n = el.querySelector(sel);
  return n ? n.textContent.trim() : '';
}

function href(el, sel) {
  const n = el.querySelector(sel);
  return n?.getAttribute('href') || '';
}

function extractCID(url) {
  try {
    if (!url) return '';
    const u = new URL(url);
    const cid = u.searchParams.get('cid');
    if (cid) return cid;
    const m = url.match(/[?&]cid=(\d+)/);
    return m ? m[1] : '';
  } catch {
    return '';
  }
}

function parseOne(el) {
  // Intento multi-fuente para campos
  const name =
    text(el, '[role="heading"], h3, .qBF1Pd, .bfdHYd') ||
    text(el, 'a, .title') ||
    '';

  const website =
    href(el, 'a[href^="http"]:not([href*="google."])') ||
    (href(el, 'a[href*="/url?"]')?.replace('/url?', '') ?? '');

  const maplink =
    href(el, 'a[href*="google.com/maps"], a[href*="goo.gl/maps"]') || '';

  const phone =
    text(el, '[data-phone], .rllt__details div:has(svg[aria-label*="phone"])') ||
    text(el, '.rllt__details span') ||
    '';

  const rating =
    text(el, '[aria-label*="estrellas"], [aria-label*="stars"], .ZkP5Je') || '';

  const address =
    text(el, '.rllt__details div:has(svg[aria-label*="pin"]), .W4Efsd') || '';

  const category =
    text(el, '.YhemCb, .rllt__wrapped, .UwBkjf') || '';

  const cid = extractCID(maplink);

  return {
    company_name: name,
    category,
    website,
    phone,
    email: '',
    address,
    city: '',
    state: '',
    rating_count: '',
    reviews: rating,
    maplink,
    cid,
  };
}

function collectFromDom() {
  let nodes = [];
  for (const s of SELECTORS) {
    nodes = document.querySelectorAll(s);
    if (nodes?.length) break;
  }
  const items = [];
  nodes.forEach((el) => {
    const it = parseOne(el);
    if (it.company_name) items.push(it);
  });
  return items;
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function paginateIfPossible() {
  // Estrategia 1: botón "Siguiente" / "Next"
  const next =
    document.querySelector('a[aria-label*="Siguiente"], a[aria-label*="Next"]') ||
    document.querySelector('button[aria-label*="Siguiente"], button[aria-label*="Next"]');
  if (next) {
    next.click();
    await sleep(1500);
    return true;
  }

  // Estrategia 2: URL con lci= (Local Services)
  const url = new URL(location.href);
  const lci = Number(url.searchParams.get('lci') || 0);
  if (!Number.isNaN(lci)) {
    url.searchParams.set('lci', String(lci + 20));
    location.href = url.toString();
    return true;
  }

  return false;
}

function pushUnique(items) {
  for (const it of items) {
    const key = `${it.company_name}::${it.maplink}`;
    if (!COLLECT.some((r) => `${r.company_name}::${r.maplink}` === key)) {
      COLLECT.push(it);
      if (COLLECT.length >= LIMIT_FREE) break;
    }
  }
}

async function runCollector() {
  const items = collectFromDom();
  pushUnique(items);

  // Publica parcial al storage para que la UI pueda leer/mostrar progresivamente.
  await chrome.storage.local.set({ collect: COLLECT });

  if (COLLECT.length >= LIMIT_FREE) {
    console.warn('[content] reached demo limit:', LIMIT_FREE);
    return;
  }

  // Paginación (si procede)
  const moved = await paginateIfPossible();
  if (moved) {
    // Espera a que la siguiente página cargue y repite (content script
    // se reinyecta; si no, usamos observer).
  }
}

// Arranque (con debouncing por si se reinserta el script)
if (!window.__scrapper_started__) {
  window.__scrapper_started__ = true;

  // Intenta cuando el DOM está listo; vuelve a intentar si no hay resultados.
  const boot = async () => {
    for (let i = 0; i < 8; i++) {
      await sleep(750);
      const items = collectFromDom();
      if (items.length) break;
    }
    runCollector().catch(console.error);
  };

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    boot();
  } else {
    window.addEventListener('DOMContentLoaded', boot, { once: true });
  }
}
