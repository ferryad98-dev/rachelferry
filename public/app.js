/* ============================================================
   KEUANGAN BERSAMA — Rachel & Ferry
   Frontend vanilla JS. Backend: Google Apps Script Web App.
   ============================================================ */

const CFG = window.APP_CONFIG || {};
const API = (CFG.API_URL || '').trim();
const LS_KEY = 'kb_cache_v1';

let DATA = [];
let tipe = 'MASUK';
let nama = 'Rachel';
let filter = 'ALL';
let query = '';
let editId = null;         // null = mode tambah, angka = mode edit
let chartMode = 'bulan';   // 'bulan' | 'hari'
let syncing = false;

/* ---------------- helpers ---------------- */
const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));

const rp = (n) =>
  'Rp ' + Math.round(Math.abs(n)).toLocaleString('id-ID') ;
const rpSigned = (n) => (n < 0 ? '-' : '') + rp(n);

function toast(msg, type = 'ok') {
  const t = $('#toast');
  t.textContent = msg;
  t.className = 'toast show ' + type;
  clearTimeout(t._t);
  t._t = setTimeout(() => (t.className = 'toast ' + type), 2600);
}

function vibrate(ms = 12) { if (navigator.vibrate) navigator.vibrate(ms); }

function todayValue() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

function asDate(iso) {
  const m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
  const d = new Date(iso);
  return isNaN(d) ? null : new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function fmtDate(iso) {
  const d = asDate(iso);
  if (!d) return '-';
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

function dayLabel(iso) {
  const d = asDate(iso);
  if (!d) return '-';
  const today = new Date(); const y = new Date(); y.setDate(y.getDate() - 1);
  const same = (a, b) => a.toDateString() === b.toDateString();
  if (same(d, today)) return 'Hari ini';
  if (same(d, y)) return 'Kemarin';
  return d.toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
}

/* animasi angka */
function countTo(el, to) {
  const from = Number(el.dataset.v || 0);
  el.dataset.v = to;
  const dur = 750, t0 = performance.now();
  const step = (t) => {
    const p = Math.min(1, (t - t0) / dur);
    const e = 1 - Math.pow(1 - p, 3);
    el.textContent = rpSigned(from + (to - from) * e);
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/* ---------------- API ---------------- */
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

/**
 * Apps Script kadang membalas halaman HTML / 404 sementara saat redirect
 * ke script.googleusercontent.com. Ulangi otomatis beberapa kali.
 */
async function apiGet(params, tries = 3) {
  if (!API) throw new Error('API_URL belum diisi di config.js');
  const url = API + '?' + new URLSearchParams(params).toString();
  let lastErr;

  for (let i = 0; i < tries; i++) {
    try {
      const ctl = new AbortController();
      const to = setTimeout(() => ctl.abort(), 20000);
      const res = await fetch(url, { method: 'GET', redirect: 'follow', signal: ctl.signal });
      clearTimeout(to);

      const txt = (await res.text()).trim();
      if (!txt || txt[0] === '<') throw new Error('Server sibuk');

      let j;
      try { j = JSON.parse(txt); }
      catch (e) { throw new Error('Server sibuk'); }

      if (!j.ok) {
        const msg = String(j.error || 'Gagal').replace(/^Error:\s*/, '');
        const err = new Error(msg);
        err.fromServer = true;   // error validasi -> jangan diulang
        throw err;
      }
      return j.data;
    } catch (e) {
      lastErr = e;
      if (e.fromServer) throw e;
      if (i < tries - 1) await sleep(700 * (i + 1));
    }
  }
  throw new Error(lastErr && lastErr.name === 'AbortError'
    ? 'Koneksi lambat, coba lagi'
    : (lastErr ? lastErr.message : 'Gagal terhubung'));
}

/* Data contoh — dipakai hanya jika API_URL belum diisi (mode pratinjau). */
function demoData() {
  const now = Date.now(), h = 3600e3;
  return [
    { id: 1, tanggal: new Date(now - 2 * h).toISOString().slice(0, 19), tipe: 'MASUK', keterangan: 'Gaji bulanan', nominal: 8500000, nama: 'Ferry' },
    { id: 2, tanggal: new Date(now - 5 * h).toISOString().slice(0, 19), tipe: 'KELUAR', keterangan: 'Belanja bulanan di supermarket', nominal: 745000, nama: 'Rachel' },
    { id: 3, tanggal: new Date(now - 26 * h).toISOString().slice(0, 19), tipe: 'KELUAR', keterangan: 'Bensin motor', nominal: 50000, nama: 'Ferry' },
    { id: 4, tanggal: new Date(now - 30 * h).toISOString().slice(0, 19), tipe: 'MASUK', keterangan: 'Hasil jualan online', nominal: 1250000, nama: 'Rachel' },
    { id: 5, tanggal: new Date(now - 52 * h).toISOString().slice(0, 19), tipe: 'KELUAR', keterangan: 'Bayar listrik & air', nominal: 430000, nama: 'Rachel' }
  ];
}

function showSync(on) {
  syncing = on;
  const el = $('#syncDot');
  if (el) el.classList.toggle('show', on);
}

/** Tampilkan cache instan (tanpa skeleton) lalu segarkan dari server. */
function hydrateFromCache() {
  try {
    const c = localStorage.getItem(LS_KEY);
    if (!c) return false;
    const arr = JSON.parse(c);
    if (!Array.isArray(arr) || !arr.length) return false;
    DATA = arr;
    renderAll();
    return true;
  } catch (e) { return false; }
}

async function loadData({ silent, quiet } = {}) {
  if (!API) {
    DATA = demoData();
    renderAll();
    if (!silent) toast('Mode demo — isi API_URL di config.js', 'err');
    return;
  }

  const hasView = DATA.length > 0;
  if (!silent && !hasView) renderSkeleton();
  if (hasView) showSync(true);

  try {
    const fresh = await apiGet({ action: 'list' });
    const changed = JSON.stringify(fresh) !== JSON.stringify(DATA);
    DATA = fresh;
    localStorage.setItem(LS_KEY, JSON.stringify(DATA));
    if (changed || !hasView) renderAll();
  } catch (err) {
    if (!hasView) {
      DATA = [];
      renderAll();
      if (!quiet) toast(err.message, 'err');
    } else if (!quiet) {
      toast('Gagal menyegarkan — data tersimpan ditampilkan', 'err');
    }
  } finally {
    showSync(false);
  }
}

/* auto-sync: saat tab kembali aktif & saat koneksi pulih */
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) loadData({ silent: true, quiet: true });
});
window.addEventListener('online', () => loadData({ silent: true, quiet: true }));
window.addEventListener('focus', () => {
  if (Date.now() - (window.__lastSync || 0) > 20000) {
    window.__lastSync = Date.now();
    loadData({ silent: true, quiet: true });
  }
});

/* ---------------- RENDER ---------------- */
function renderSkeleton() {
  const s = '<div class="skel"></div>'.repeat(3);
  $('#recentList').innerHTML = s;
  $('#historyList').innerHTML = s;
}

function renderAll() { renderBeranda(); renderRiwayat(); drawCharts(); }

function renderBeranda() {
  const masuk = DATA.filter(d => d.tipe === 'MASUK').reduce((a, b) => a + b.nominal, 0);
  const keluar = DATA.filter(d => d.tipe === 'KELUAR').reduce((a, b) => a + b.nominal, 0);

  countTo($('#saldo'), masuk - keluar);
  countTo($('#totalMasuk'), masuk);
  countTo($('#totalKeluar'), keluar);

  ['Rachel', 'Ferry'].forEach(p => {
    const mine = DATA.filter(d => d.nama === p);
    const mi = mine.filter(d => d.tipe === 'MASUK').reduce((a, b) => a + b.nominal, 0);
    const mo = mine.filter(d => d.tipe === 'KELUAR').reduce((a, b) => a + b.nominal, 0);
    countTo($('#net' + p), mi - mo);
    $('#det' + p).innerHTML =
      `<span class="green">↓ ${rp(mi)}</span><span class="red">↑ ${rp(mo)}</span>`;
    const pct = mi + mo ? (mi / (mi + mo)) * 100 : 0;
    setTimeout(() => { $('#bar' + p).style.width = pct + '%'; }, 120);
  });

  const list = $('#recentList');
  const recent = DATA.slice(0, 5);
  list.innerHTML = recent.length
    ? recent.map((d, i) => itemHTML(d, i)).join('')
    : emptyHTML('Belum ada transaksi', 'Tekan tombol + untuk mulai mencatat');
}

function renderRiwayat() {
  let rows = DATA.slice();

  if (filter === 'MASUK' || filter === 'KELUAR') rows = rows.filter(d => d.tipe === filter);
  else if (filter === 'Rachel' || filter === 'Ferry') rows = rows.filter(d => d.nama === filter);

  if (query) {
    const q = query.toLowerCase();
    rows = rows.filter(d =>
      d.keterangan.toLowerCase().includes(q) || d.nama.toLowerCase().includes(q));
  }

  const mi = rows.filter(d => d.tipe === 'MASUK').reduce((a, b) => a + b.nominal, 0);
  const mo = rows.filter(d => d.tipe === 'KELUAR').reduce((a, b) => a + b.nominal, 0);
  $('#fMasuk').textContent = rp(mi);
  $('#fKeluar').textContent = rp(mo);
  const net = $('#fNet');
  net.textContent = rpSigned(mi - mo);
  net.className = mi - mo < 0 ? 'red' : 'green';

  const box = $('#historyList');
  if (!rows.length) {
    box.innerHTML = emptyHTML('Tidak ada data', 'Coba ubah filter atau kata kunci');
    return;
  }

  let html = '', lastDay = '', i = 0;
  rows.forEach(d => {
    const lbl = dayLabel(d.tanggal);
    if (lbl !== lastDay) { html += `<p class="day-sep">${lbl}</p>`; lastDay = lbl; }
    html += itemHTML(d, i++, true);
  });
  box.innerHTML = html;
}

function itemHTML(d, i, withDel) {
  const isIn = d.tipe === 'MASUK';
  const ini = d.nama === 'Rachel' ? 'r' : 'f';
  return `
  <div class="item ${isIn ? 'in' : 'out'}" data-edit="${d.id}" style="animation-delay:${Math.min(i,8) * 45}ms">
    <div class="tag">${isIn ? '↓' : '↑'}</div>
    <div class="meta">
      <p class="ket">${escapeHtml(d.keterangan)}</p>
      <p class="sub">
        <span class="badge ${ini}">${escapeHtml(d.nama)}</span>
        <span class="dot"></span>${fmtDate(d.tanggal)}
      </p>
    </div>
    <div class="val ${isIn ? 'green' : 'red'}">${isIn ? '+' : '−'}${rp(d.nominal)}</div>
    ${withDel ? `<button class="del" data-edit="${d.id}" aria-label="Edit">✎</button>` : ''}
  </div>`;
}

function emptyHTML(title, sub) {
  return `<div class="empty"><span class="e-ico">🪙</span><p><b>${title}</b></p><p>${sub}</p></div>`;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/* ---------------- NAVIGASI ---------------- */
function goto(page) {
  $$('.page').forEach(p => p.classList.toggle('active', p.id === 'page-' + page));
  $$('.tab').forEach(t => t.classList.toggle('active', t.dataset.goto === page));
  window.scrollTo({ top: 0 });
  if (page === 'riwayat') requestAnimationFrame(drawCharts);
  vibrate(8);
}
$$('[data-goto]').forEach(b => b.addEventListener('click', () => goto(b.dataset.goto)));

/* ---------------- SHEET ---------------- */
function setTipe(t) {
  tipe = t;
  $$('.seg-btn').forEach(x => x.classList.toggle('active', x.dataset.tipe === t));
  $('#segTipe').classList.toggle('out', t === 'KELUAR');
}
function setNama(n) {
  nama = n;
  $$('.who-btn').forEach(x => x.classList.toggle('active', x.dataset.nama === n));
}

function openSheet(row) {
  editId = row ? row.id : null;
  if (row) {
    $('#sheetTitle').textContent = 'Edit Transaksi';
    $('#btnSubmit').querySelector('.txt').textContent = 'Simpan Perubahan';
    $('#btnDelete').hidden = false;
    setTipe(row.tipe);
    setNama(row.nama);
    $('#nominal').value = Number(row.nominal).toLocaleString('id-ID');
    $('#keterangan').value = row.keterangan;
    $('#tanggal').value = String(row.tanggal).slice(0, 10);
  } else {
    $('#sheetTitle').textContent = 'Transaksi Baru';
    $('#btnSubmit').querySelector('.txt').textContent = 'Simpan Transaksi';
    $('#btnDelete').hidden = true;
    $('#form').reset();
    $('#nominal').value = '';
    setTipe('MASUK');
    setNama('Rachel');
    $('#tanggal').value = todayValue();
  }
  $('#scrim').classList.add('show');
  $('#sheet').classList.add('show');
  $('#btnAdd').classList.add('open');
  document.body.style.overflow = 'hidden';
  vibrate(14);
  if (!row) setTimeout(() => $('#nominal').focus(), 380);
}
function closeSheet() {
  editId = null;
  $('#scrim').classList.remove('show');
  $('#sheet').classList.remove('show');
  $('#btnAdd').classList.remove('open');
  document.body.style.overflow = '';
}
$('#btnAdd').addEventListener('click', () =>
  $('#sheet').classList.contains('show') ? closeSheet() : openSheet(null));
$('#scrim').addEventListener('click', closeSheet);
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && $('#sheet').classList.contains('show')) closeSheet();
});
/* geser ke bawah untuk menutup sheet */
(function swipeClose(){
  const sh = $('#sheet'); let y0 = null;
  sh.addEventListener('touchstart', e => { if (sh.scrollTop <= 0) y0 = e.touches[0].clientY; }, {passive:true});
  sh.addEventListener('touchmove', e => {
    if (y0 === null) return;
    const dy = e.touches[0].clientY - y0;
    if (dy > 0) sh.style.transform = `translate(-50%, ${dy}px)`;
  }, {passive:true});
  sh.addEventListener('touchend', e => {
    if (y0 === null) return;
    const dy = (e.changedTouches[0].clientY - y0);
    sh.style.transform = '';
    if (dy > 110) closeSheet();
    y0 = null;
  });
})();

/* segmented MASUK / KELUAR */
$$('.seg-btn').forEach(b => b.addEventListener('click', () => { setTipe(b.dataset.tipe); vibrate(10); }));

/* pilih nama */
$$('.who-btn').forEach(b => b.addEventListener('click', () => { setNama(b.dataset.nama); vibrate(10); }));

/* format ribuan nominal */
$('#nominal').addEventListener('input', (e) => {
  const raw = e.target.value.replace(/\D/g, '');
  e.target.value = raw ? Number(raw).toLocaleString('id-ID') : '';
});

/* submit */
$('#form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = $('#btnSubmit');
  const nominal = Number($('#nominal').value.replace(/\D/g, ''));
  const keterangan = $('#keterangan').value.trim();
  const tanggal = $('#tanggal').value;

  if (!nominal) return toast('Nominal belum diisi', 'err');
  if (!keterangan) return toast('Keterangan belum diisi', 'err');

  const isEdit = editId !== null;
  btn.classList.add('loading');
  try {
    const saved = await apiGet({
      action: isEdit ? 'update' : 'create',
      id: isEdit ? editId : '',
      tipe, keterangan, nominal, nama, tanggal
    });
    if (isEdit) {
      const i = DATA.findIndex(d => String(d.id) === String(editId));
      if (i > -1) DATA[i] = saved;
    } else {
      DATA.unshift(saved);
    }
    DATA.sort((a, b) => (a.tanggal < b.tanggal ? 1 : -1));
    localStorage.setItem(LS_KEY, JSON.stringify(DATA));
    renderAll();
    closeSheet();
    toast(isEdit ? 'Perubahan tersimpan'
                 : `${tipe === 'MASUK' ? 'Pemasukan' : 'Pengeluaran'} ${rp(nominal)} tersimpan`, 'ok');
    vibrate([12, 40, 12]);
    loadData({ silent: true, quiet: true });
  } catch (err) {
    toast(err.message, 'err');
  } finally {
    btn.classList.remove('loading');
  }
});

/* klik transaksi -> mode edit */
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-edit]');
  if (!b) return;
  const row = DATA.find(d => String(d.id) === String(b.dataset.edit));
  if (row) openSheet(row);
});

/* hapus dari dalam form edit */
$('#btnDelete').addEventListener('click', async () => {
  if (editId === null) return;
  if (!confirm('Hapus transaksi ini?')) return;
  const id = editId;
  try {
    await apiGet({ action: 'delete', id });
    DATA = DATA.filter(d => String(d.id) !== String(id));
    localStorage.setItem(LS_KEY, JSON.stringify(DATA));
    renderAll();
    closeSheet();
    toast('Transaksi dihapus', 'ok');
    loadData({ silent: true, quiet: true });
  } catch (err) { toast(err.message, 'err'); }
});

/* filter & search */
$$('.chip').forEach(c => c.addEventListener('click', () => {
  filter = c.dataset.filter;
  $$('.chip').forEach(x => x.classList.toggle('active', x === c));
  renderRiwayat();
  drawDonut();
  vibrate(8);
}));
$('#search').addEventListener('input', (e) => { query = e.target.value; renderRiwayat(); });

/* refresh */
$('#btnRefresh').addEventListener('click', async (e) => {
  const b = e.currentTarget;
  b.classList.add('spin');
  await loadData({ silent: true, quiet: true });
  b.classList.remove('spin');
  toast('Data diperbarui', 'ok');
});

/* greeting */
(function greeting() {
  const h = new Date().getHours();
  const g = h < 11 ? 'Selamat pagi' : h < 15 ? 'Selamat siang' : h < 18 ? 'Selamat sore' : 'Selamat malam';
  $('#greet').textContent = `${g}, Rachel & Ferry`;
})();

/* ============================================================
   GRAFIK (canvas murni, tanpa library)
   ============================================================ */
function setupCanvas(cv, h) {
  const dpr = window.devicePixelRatio || 1;
  const w = cv.parentElement.clientWidth;
  cv.width = w * dpr; cv.height = h * dpr;
  cv.style.width = w + 'px'; cv.style.height = h + 'px';
  const ctx = cv.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  return { ctx, w, h };
}

function ringkas(n) {
  const a = Math.abs(n);
  if (a >= 1e9) return (n / 1e9).toFixed(a % 1e9 ? 1 : 0) + 'M';
  if (a >= 1e6) return (n / 1e6).toFixed(a % 1e6 ? 1 : 0) + 'jt';
  if (a >= 1e3) return Math.round(n / 1e3) + 'rb';
  return String(Math.round(n));
}

/** Kelompokkan data jadi bucket (6 bulan / 14 hari). */
function buildBuckets() {
  const out = [];
  const now = new Date();
  if (chartMode === 'bulan') {
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      out.push({
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        label: d.toLocaleDateString('id-ID', { month: 'short' }),
        masuk: 0, keluar: 0
      });
    }
    DATA.forEach(t => {
      const k = String(t.tanggal).slice(0, 7);
      const b = out.find(x => x.key === k);
      if (b) b[t.tipe === 'MASUK' ? 'masuk' : 'keluar'] += t.nominal;
    });
  } else {
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      out.push({
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
        label: String(d.getDate()),
        masuk: 0, keluar: 0
      });
    }
    DATA.forEach(t => {
      const k = String(t.tanggal).slice(0, 10);
      const b = out.find(x => x.key === k);
      if (b) b[t.tipe === 'MASUK' ? 'masuk' : 'keluar'] += t.nominal;
    });
  }
  return out;
}

let chartAnim = 0, chartRaf = null;
function drawCharts() {
  drawBars();
  drawDonut();
}

function drawBars() {
  const cv = $('#chart'); if (!cv || !cv.parentElement.clientWidth) return;
  const buckets = buildBuckets();
  const max = Math.max(1, ...buckets.map(b => Math.max(b.masuk, b.keluar)));

  cancelAnimationFrame(chartRaf);
  const t0 = performance.now(), dur = 700;
  const step = (t) => {
    const p = Math.min(1, (t - t0) / dur);
    const e = 1 - Math.pow(1 - p, 3);
    paintBars(cv, buckets, max, e);
    if (p < 1) chartRaf = requestAnimationFrame(step);
  };
  chartRaf = requestAnimationFrame(step);
}

function paintBars(cv, buckets, max, prog) {
  const { ctx, w, h } = setupCanvas(cv, 170);
  const padL = 34, padB = 20, padT = 8;
  const gh = h - padB - padT, gw = w - padL - 6;
  if (gh <= 0 || gw <= 0) return;   // canvas belum punya ukuran

  // garis grid + label sumbu Y
  ctx.font = '9px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  for (let i = 0; i <= 3; i++) {
    const y = padT + gh - (gh * i / 3);
    ctx.strokeStyle = 'rgba(255,255,255,.07)';
    ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(w - 4, y); ctx.stroke();
    ctx.fillStyle = 'rgba(154,164,196,.75)';
    ctx.fillText(ringkas(max * i / 3), padL - 6, y);
  }

  const n = buckets.length;
  const slot = gw / n;
  const bw = Math.max(3, Math.min(11, slot / 3));
  const gap = 3;

  buckets.forEach((b, i) => {
    const cx = padL + slot * i + slot / 2;
    [['masuk', '#22e6a0', -1], ['keluar', '#ff6b8b', 1]].forEach(([k, col, dir]) => {
      const val = b[k]; if (!val) return;
      const bh = Math.max(0, (val / max) * gh * prog);
      if (bh <= 0.5) return;
      const x = cx + dir * (gap / 2) - (dir < 0 ? bw : 0);
      const y = padT + gh - bh;
      const g = ctx.createLinearGradient(0, y, 0, padT + gh);
      g.addColorStop(0, col);
      g.addColorStop(1, col + '33');
      ctx.fillStyle = g;
      const r = Math.max(0, Math.min(3, bw / 2, bh / 2));
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(x, y, bw, bh, [r, r, 0, 0]);
      else ctx.rect(x, y, bw, bh);
      ctx.fill();
    });
    // label sumbu X
    ctx.fillStyle = 'rgba(154,164,196,.9)';
    ctx.font = '9px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    if (n <= 6 || i % 2 === 0) ctx.fillText(b.label, cx, padT + gh + 6);
  });
}

function drawDonut() {
  const cv = $('#donut'); if (!cv || !cv.parentElement.clientWidth) return;
  let rows = DATA.slice();
  if (filter === 'MASUK' || filter === 'KELUAR') rows = rows.filter(d => d.tipe === filter);
  else if (filter === 'Rachel' || filter === 'Ferry') rows = rows.filter(d => d.nama === filter);

  const R = rows.filter(d => d.nama === 'Rachel').reduce((a, b) => a + b.nominal, 0);
  const F = rows.filter(d => d.nama === 'Ferry').reduce((a, b) => a + b.nominal, 0);
  const tot = R + F;

  const { ctx, w, h } = setupCanvas(cv, 96);
  const cx = w / 2, cy = h / 2, r = Math.min(w, h) / 2 - 4, lw = 13;

  ctx.lineWidth = lw; ctx.lineCap = 'butt';
  ctx.strokeStyle = 'rgba(255,255,255,.07)';
  ctx.beginPath(); ctx.arc(cx, cy, r - lw / 2, 0, Math.PI * 2); ctx.stroke();

  if (tot > 0) {
    let a0 = -Math.PI / 2;
    [[R, '#ff6bcb'], [F, '#4facfe']].forEach(([v, col]) => {
      if (!v) return;
      const a1 = a0 + (v / tot) * Math.PI * 2;
      ctx.strokeStyle = col;
      ctx.beginPath(); ctx.arc(cx, cy, r - lw / 2, a0, a1); ctx.stroke();
      a0 = a1;
    });
  }
  ctx.fillStyle = '#eef2ff';
  ctx.font = '800 13px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(rows.length + '', cx, cy - 5);
  ctx.fillStyle = 'rgba(154,164,196,.9)';
  ctx.font = '600 8.5px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('transaksi', cx, cy + 9);

  const pct = (v) => tot ? Math.round(v / tot * 100) : 0;
  $('#donutInfo').innerHTML = `
    <div class="di-row"><span class="di-dot" style="background:#ff6bcb"></span>
      <span class="nm">Rachel ${pct(R)}%</span><span class="vl">${rp(R)}</span></div>
    <div class="di-row"><span class="di-dot" style="background:#4facfe"></span>
      <span class="nm">Ferry ${pct(F)}%</span><span class="vl">${rp(F)}</span></div>`;
}

/* toggle 6 Bulan / 14 Hari */
$$('.ct').forEach(b => b.addEventListener('click', () => {
  chartMode = b.dataset.mode;
  $$('.ct').forEach(x => x.classList.toggle('active', x === b));
  drawCharts();
  vibrate(8);
}));

let rzT;
window.addEventListener('resize', () => { clearTimeout(rzT); rzT = setTimeout(drawCharts, 160); });

/* init */
document.body.classList.add('first-load');
setTimeout(() => document.body.classList.remove('first-load'), 2000);
hydrateFromCache();
window.__lastSync = Date.now();
loadData();
