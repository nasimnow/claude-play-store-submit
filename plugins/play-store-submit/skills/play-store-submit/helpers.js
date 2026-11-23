// Paste into the page (via your browser tool's evaluate/JS action) after each full Play Console load.
// Then call e.g. __sec('Ads'), __rl(), __r(1), __btn('Save'), __ok().
window.__els = () => [...document.querySelectorAll('input,textarea,button,[role=radio],[role=checkbox],[role=option],[role=switch],[role=button],[role=tab]')].filter(e => e.getClientRects().length);
window.__w = (ms) => new Promise(r => setTimeout(r, ms));
// Reliable text entry for Angular Dart inputs.
window.__set = (el, v) => { el.focus(); if (el.select) el.select(); document.execCommand('selectAll'); document.execCommand('insertText', false, v); el.blur(); };
// Click the first enabled visible button with this exact text.
window.__btn = (t) => { const b = __els().filter(e => (e.tagName == 'BUTTON' || e.getAttribute('role') == 'button') && e.innerText.trim() == t && !e.disabled)[0]; b && b.click(); return !!b; };
// List interactive elements (index:tag:role:label).
window.__l = () => __els().map((e, i) => i + ':' + e.tagName + ':' + (e.getAttribute('role') || e.type || '') + ':' + (e.getAttribute('aria-label') || e.innerText || e.placeholder || '').slice(0, 80).replace(/\n/g, ' ')).join('\n');
// List radios/checkboxes with their label text; click one by index.
window.__rl = () => __els().filter(e => e.type == 'radio' || e.type == 'checkbox').map((e, i) => i + ':' + e.type + ':' + e.checked + ':' + (e.closest('label,material-radio,material-checkbox') || e.parentElement.parentElement).innerText.slice(0, 110).replace(/\n/g, ' ')).join('\n');
window.__r = (i) => { const e = __els().filter(e => e.type == 'radio' || e.type == 'checkbox')[i]; e.click(); return e.checked; };
window.__txt = (from, n = 2500) => { const t = document.body.innerText; const i = t.indexOf(from); return t.slice(i, i + n); };
window.__ok = () => (document.body.innerText.match(/Change saved/) || ['no toast'])[0];
// App content overview: click "Start declaration"/"Manage" for a section heading.
window.__sec = (h) => { const hs = [...document.querySelectorAll('h2,h3,h4,[role=heading]')].filter(x => x.innerText.trim() == h); let n = hs[0]; while (n && !n.querySelector('button')) n = n.parentElement; const b = [...n.querySelectorAll('button')].find(b => /Start declaration|Manage/.test(b.innerText)); b.click(); return b.innerText; };

// --- Data safety per-data-type dialog (scope to the visible dialog, match by label) ---
window.__dlg = () => [...document.querySelectorAll('[role=dialog]')].filter(d => d.getClientRects().length && d.innerText.includes('Is this data collected')).pop();
window.__inputs = (d) => [...d.querySelectorAll('input[type=checkbox],input[type=radio]')].filter(e => e.getClientRects().length).map(e => ({ e, l: (e.closest('label,material-radio,material-checkbox') || e.parentElement.parentElement).innerText.trim() }));
window.__want = async (d, label, on = true) => { for (const y of __inputs(d).filter(x => x.l.startsWith(label))) { if (y.e.checked !== on) { y.e.click(); await __w(300); } } };
window.__state = (d) => __inputs(d).filter(x => x.e.checked).map(x => x.l.slice(0, 22)).join(' | ');
// required: true/false; purp: e.g. ['App functionality','Account management']
window.__fix = async (required, purp) => { const d = __dlg(); await __want(d, 'Collected', true); await __want(d, 'Shared', false); await __w(500); await __want(d, 'No, this collected data is not processed'); await __want(d, required ? 'Data collection is required' : 'Users can choose'); for (const p of ['App functionality', 'Analytics', 'Developer communications', 'Advertising or marketing', 'Fraud prevention', 'Personalisation', 'Account management']) await __want(d, p, purp.includes(p)); return __state(d); };
window.__openq = async (n) => { __els().find(e => e.getAttribute('aria-label') == 'Open ' + n + ' questions').click(); await __w(2000); return __state(__dlg()); };
window.__save = async () => { [...__dlg().querySelectorAll('button')].find(b => b.innerText.trim() == 'Save').click(); await __w(2000); };

// --- Inject a large .aab served by serve.py (preview upload caps at 50 MB) ---
window.__aabInject = async (name = 'app.aab') => { const b = await (await fetch('http://127.0.0.1:8765/' + name)).blob(); const f = new File([b], name, { type: 'application/octet-stream' }); const inp = document.querySelector('input[type=file][accept=".aab"]'); const dt = new DataTransfer(); dt.items.add(f); inp.files = dt.files; inp.dispatchEvent(new Event('change', { bubbles: true })); return b.size; };
