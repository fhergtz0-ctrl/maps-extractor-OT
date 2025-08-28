/* controllers/config.js
 * Config centralizada y utilidades de versión/URLs del producto.
 */

/* global chrome */
export const PRODUCT = {
  name: 'Scrapping Tool',
  version: chrome.runtime?.getManifest?.().version || '0.0.0',
};

export const LINKS = {
  about: 'https://tu-dominio.com/about',
  help: 'https://tu-dominio.com/help',
  feedback: 'https://tu-dominio.com/feedback',
};

export function installUrl() {
  const base = 'https://tu-dominio.com/install';
  const v = encodeURIComponent(PRODUCT.version);
  return `${base}?v=${v}`;
}

export function uninstallUrl() {
  const base = 'https://tu-dominio.com/uninstall';
  const v = encodeURIComponent(PRODUCT.version);
  return `${base}?v=${v}`;
}
