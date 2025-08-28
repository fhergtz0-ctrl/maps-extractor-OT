/* controllers/index.js
 * Lógica de UI principal (vanilla + pequeñas utilidades).
 * Muestra tabla “tipo hoja”, lee progreso desde storage.local, permite exportar.
 */

/* global chrome */

const HEADERS = [
  'KW','Location','Company Name','Category','Website','Phone','email','address',
  'Postal Code + City','state','pin code','# Reviews','Review','CID','MapLink'
];

const state = {
  rows: [],
  includeEmail: false,
  includeLatLng: true, // opcional: no se popula en DOM, pero mantenemos compatibilidad
};

const els = {
  count: document.getElementById('count'),
  bar: document.getElementById('bar'),
  thead: document.getElementById('thead'),
  tbody: document.getElementById('tbody'),
  log: document.getElementById('log'),
  globalSearch: document.getElementById('globalSearch'),
};

function toStr(v){ return v==null ? '' : String(v); }
function escCSV(v){ return '"' + toStr(v).replace(/"/g,'""') + '"'; }

function renderHeader() {
  const tr1 = document.createElement('tr');
  const tr2 = document.createElement('tr');
  HEADERS.forEach(h => {
    const th = document.createElement('th'); th.textContent = h; tr1.appendChild(th);
    const th2 = document.createElement('th');
    const inp = document.createElement('input'); inp.placeholder = 'filtrar…'; inp.dataset.col = h;
    inp.addEventListener('input', renderBody);
    th2.appendChild(inp); tr2.appendChild(th2);
  });
  els.thead.innerHTML = ''; els.thead.appendChild(tr1); els.thead.appendChild(tr2);
}

function renderBody() {
  const filters = {};
  els.thead.querySelectorAll('input').forEach(i => {
    const v = i.value.trim().toLowerCase(); if (v) filters[i.dataset.col] = v;
  });

  const data = state.rows.filter(r => {
    return Object.entries(filters).every(([k, v]) => toStr(r[k]).toLowerCase().includes(v));
  });

  els.tbody.innerHTML = '';
  for (const r of data) {
    const tr = document.createElement('tr');
    for (const h of HEADERS) {
      const td = document.createElement('td'); td.textContent = toStr(r[h] ?? '');
      tr.appendChild(td);
    }
    els.tbody.appendChild(tr);
  }
  els.count.textContent = String(data.length);
}

function log(msg) {
  els.log.textContent = (els.log.textContent ? els.log.textContent + '\n' : '') + msg;
}

function toCSV(rows) {
  const lines = [HEADERS.map(escCSV).join(',')];
  for (const r of rows) lines.push(HEADERS.map(h => escCSV(r[h] ?? '')).join(','));
  return lines.join('\n');
}

document.getElementById('export')?.addEventListener('click', () => {
  if (!state.rows.length) { alert('No hay filas.'); return; }
  const blob = new Blob([toCSV(state.rows)], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'scrapping-tool.csv';
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
});

document.getElementById('clear')?.addEventListener('click', async () => {
  state.rows = []; renderBody(); els.log.textContent = ''; els.bar.style.width = '0%';
  await chrome.storage.local.set({ collect: [] });
});

els.globalSearch?.addEventListener('input', (e) => {
  const term = e.target.value.trim().toLowerCase();
  els.thead.querySelectorAll('input').forEach(i => { i.value = ''; });
  const data = term
    ? state.rows.filter(r => Object.values(r).some(v => toStr(v).toLowerCase().includes(term)))
    : state.rows.slice();
  els.tbody.innerHTML = '';
  for (const r of data) {
    const tr = document.createElement('tr');
    for (const h of HEADERS) {
      const td = document.createElement('td'); td.textContent = toStr(r[h] ?? '');
      tr.appendChild(td);
    }
    els.tbody.appendChild(tr);
  }
  els.count.textContent = String(data.length);
});

document.getElementById('start')?.addEventListener('click', async () => {
  log('Arrancando… abre una pestaña de resultados y comenzaré a leer.');
  chrome.runtime.sendMessage({ type: 'task:start' });
});

renderHeader(); renderBody();

// “Suscripción” simple a cambios desde content-script (storage.local)
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local' || !changes.collect) return;
  const arr = changes.collect.newValue || [];
  // Mapea a HEADERS deseados
  state.rows = arr.map(x => ({
    'KW': x.keyword || '',
    'Location': x.location || '',
    'Company Name': x.company_name || '',
    'Category': x.category || '',
    'Website': x.website || '',
    'Phone': x.phone || '',
    'email': x.email || '',
    'address': x.address || '',
    'Postal Code + City': x.postal_city || '',
    'state': x.state || '',
    'pin code': x.pin || '',
    '# Reviews': x.userRatingCount || x.rating_count || '',
    'Review': x.rating || x.reviews || '',
    'CID': x.cid || '',
    'MapLink': x.maplink || '',
  }));
  renderBody();
  // Barra de progreso aproximada
  const n = state.rows.length;
  const pct = Math.max(5, Math.min(100, Math.round((n % 50) / 50 * 100)));
  els.bar.style.width = pct + '%';
});
