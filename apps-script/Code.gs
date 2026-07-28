/**
 * KEUANGAN BERSAMA — Backend Google Apps Script
 * Spreadsheet kolom: Tanggal | Tipe | Keterangan | Nominal | Nama
 *
 * CARA PAKAI:
 * 1. Buat Spreadsheet baru di Google Drive.
 * 2. Menu Extensions > Apps Script, hapus isi Code.gs, tempel file ini.
 * 3. Jalankan fungsi setup() sekali (izinkan permission) -> sheet & header dibuat.
 * 4. Deploy > New deployment > Type: Web app
 *      Execute as       : Me
 *      Who has access   : Anyone
 *    Copy URL /exec, tempel ke public/config.js pada frontend.
 */

var SHEET_NAME = 'Transaksi';
var HEADER = ['Tanggal', 'Tipe', 'Keterangan', 'Nominal', 'Nama'];

/** Jalankan sekali secara manual dari editor Apps Script. */
function setup() {
  var sh = getSheet();
  SpreadsheetApp.getUi && Logger.log('Sheet siap: ' + sh.getName());
}

function getSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) sh = ss.insertSheet(SHEET_NAME);
  if (sh.getLastRow() === 0) {
    sh.appendRow(HEADER);
    sh.getRange(1, 1, 1, HEADER.length)
      .setFontWeight('bold')
      .setBackground('#111827')
      .setFontColor('#ffffff');
    sh.setFrozenRows(1);
    sh.setColumnWidth(1, 160);
    sh.setColumnWidth(2, 90);
    sh.setColumnWidth(3, 320);
    sh.setColumnWidth(4, 140);
    sh.setColumnWidth(5, 110);
  }
  return sh;
}

/* ---------------- ROUTER ---------------- */

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || 'list';
  try {
    if (action === 'list')   return json({ ok: true, data: listRows() });
    if (action === 'create') return json({ ok: true, data: createRow(e.parameter) });
    if (action === 'update') return json({ ok: true, data: updateRow(e.parameter) });
    if (action === 'delete') return json({ ok: true, data: deleteRow(e.parameter.id) });
    if (action === 'ping')   return json({ ok: true, data: 'pong' });
    return json({ ok: false, error: 'Unknown action: ' + action });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

/** POST juga didukung (dikirim sebagai text/plain agar tidak kena preflight CORS). */
function doPost(e) {
  try {
    var body = {};
    if (e && e.postData && e.postData.contents) body = JSON.parse(e.postData.contents);
    var action = body.action || 'create';
    if (action === 'create') return json({ ok: true, data: createRow(body) });
    if (action === 'update') return json({ ok: true, data: updateRow(body) });
    if (action === 'delete') return json({ ok: true, data: deleteRow(body.id) });
    if (action === 'list')   return json({ ok: true, data: listRows() });
    return json({ ok: false, error: 'Unknown action: ' + action });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

/* ---------------- OPERASI DATA ---------------- */

function listRows() {
  var sh = getSheet();
  var last = sh.getLastRow();
  if (last < 2) return [];
  var values = sh.getRange(2, 1, last - 1, HEADER.length).getValues();
  var out = [];
  for (var i = 0; i < values.length; i++) {
    var r = values[i];
    if (!r[0] && !r[2] && !r[3]) continue;
    out.push({
      id: i + 2, // nomor baris di sheet
      tanggal: toIso(r[0]),
      tipe: String(r[1] || '').toUpperCase(),
      keterangan: String(r[2] || ''),
      nominal: Number(r[3]) || 0,
      nama: String(r[4] || '')
    });
  }
  out.sort(function (a, b) { return a.tanggal < b.tanggal ? 1 : -1; });
  return out;
}

function createRow(p) {
  var tipe = String(p.tipe || '').toUpperCase();
  if (tipe !== 'MASUK' && tipe !== 'KELUAR') throw new Error('Tipe harus MASUK atau KELUAR');

  var nominal = Number(String(p.nominal).replace(/[^0-9.-]/g, ''));
  if (!nominal || nominal <= 0) throw new Error('Nominal tidak valid');

  var nama = String(p.nama || '').trim();
  if (nama !== 'Rachel' && nama !== 'Ferry') throw new Error('Nama harus Rachel atau Ferry');

  var keterangan = String(p.keterangan || '').trim();
  if (!keterangan) throw new Error('Keterangan wajib diisi');

  var tanggal = parseTanggal(p.tanggal);

  var sh = getSheet();
  sh.appendRow([tanggal, tipe, keterangan, nominal, nama]);
  var row = sh.getLastRow();
  sh.getRange(row, 1).setNumberFormat('yyyy-mm-dd');
  sh.getRange(row, 4).setNumberFormat('"Rp"#,##0');

  return {
    id: row,
    tanggal: toIso(tanggal),
    tipe: tipe,
    keterangan: keterangan,
    nominal: nominal,
    nama: nama
  };
}

function updateRow(p) {
  var row = Number(p.id);
  var sh = getSheet();
  if (!row || row < 2 || row > sh.getLastRow()) throw new Error('Baris tidak ditemukan');

  var tipe = String(p.tipe || '').toUpperCase();
  if (tipe !== 'MASUK' && tipe !== 'KELUAR') throw new Error('Tipe harus MASUK atau KELUAR');

  var nominal = Number(String(p.nominal).replace(/[^0-9.-]/g, ''));
  if (!nominal || nominal <= 0) throw new Error('Nominal tidak valid');

  var nama = String(p.nama || '').trim();
  if (nama !== 'Rachel' && nama !== 'Ferry') throw new Error('Nama harus Rachel atau Ferry');

  var keterangan = String(p.keterangan || '').trim();
  if (!keterangan) throw new Error('Keterangan wajib diisi');

  var tanggal = parseTanggal(p.tanggal);

  sh.getRange(row, 1, 1, HEADER.length).setValues([[tanggal, tipe, keterangan, nominal, nama]]);
  sh.getRange(row, 1).setNumberFormat('yyyy-mm-dd');
  sh.getRange(row, 4).setNumberFormat('"Rp"#,##0');

  return { id: row, tanggal: toIso(tanggal), tipe: tipe, keterangan: keterangan,
           nominal: nominal, nama: nama };
}

function deleteRow(id) {
  var row = Number(id);
  var sh = getSheet();
  if (!row || row < 2 || row > sh.getLastRow()) throw new Error('Baris tidak ditemukan');
  sh.deleteRow(row);
  return { deleted: row };
}

/* ---------------- UTIL ---------------- */

/** Kembalikan 'yyyy-MM-dd' (tanpa jam). */
function toIso(v) {
  var d = (v instanceof Date) ? v : new Date(v);
  if (isNaN(d.getTime())) return '';
  return Utilities.formatDate(d, 'Asia/Jakarta', 'yyyy-MM-dd');
}

/** Terima 'yyyy-MM-dd' -> Date tengah hari (hindari geser timezone). */
function parseTanggal(v) {
  var str = String(v || '').slice(0, 10);
  var m = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12, 0, 0);
  var d = v ? new Date(v) : new Date();
  if (isNaN(d.getTime())) d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0);
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
