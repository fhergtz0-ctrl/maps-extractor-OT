/* controllers/GoogleForm.js
 * Envío de datos a un Google Form detectado (action e inputs).
 */

/**
 * Envía un objeto plano a un Google Form.
 * @param {string} actionUrl - URL del form (atributo action).
 * @param {Record<string,string>} fields - Mapa { entry.xxxxxx: valor }
 * @param {number} [timeoutMs=12000]
 */
export async function postToGoogleForm(actionUrl, fields, timeoutMs = 12000) {
  const form = new FormData();
  Object.entries(fields || {}).forEach(([k, v]) => form.append(k, v ?? ''));

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);

  try {
    const res = await fetch(actionUrl, { method: 'POST', body: form, mode: 'no-cors', signal: ctrl.signal });
    return { ok: true, status: res.status || 0 };
  } catch (e) {
    return { ok: false, error: String(e?.message || e) };
  } finally {
    clearTimeout(timer);
  }
}
