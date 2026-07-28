# 💸 Keuangan Bersama — Rachel & Ferry

Aplikasi pencatat keuangan pribadi bersama. Tampilan **mobile-only**, UI modern dengan animasi,
2 menu (**Beranda** & **Riwayat**), tombol input transaksi di **tengah** bottom-nav.
Database: **Google Spreadsheet** via **Google Apps Script**. Frontend statis, deploy ke **Vercel**.

Kolom spreadsheet: `Tanggal | Tipe | Keterangan | Nominal | Nama`
Tipe hanya **MASUK** / **KELUAR** — tanpa kategori, keterangan diisi manual.

```
keuangan-bersama/
├── apps-script/Code.gs     ← backend (tempel ke Apps Script)
├── public/
│   ├── index.html
│   ├── style.css
│   ├── app.js
│   ├── config.js           ← isi API_URL di sini
│   └── manifest.json
├── vercel.json
└── README.md
```

---

> 💻 **Mau update lewat CMD?** Buka **[TUTORIAL-CMD.md](TUTORIAL-CMD.md)** — khusus Windows,
> lengkap dengan skrip `update.bat` (tinggal klik 2×).

> 🚀 **Baru pertama kali / ingin dituntun langkah demi langkah?**
> Buka **[PANDUAN.md](PANDUAN.md)** — panduan lengkap dari nol sampai online, termasuk screenshot alur klik & troubleshooting.

## 1) Siapkan Spreadsheet + Apps Script

1. Buka [sheets.new](https://sheets.new) → beri nama, misal **DB Keuangan Bersama**.
2. Menu **Extensions → Apps Script**.
3. Hapus isi `Code.gs`, tempel seluruh isi file `apps-script/Code.gs` dari repo ini. **Save**.
4. Pilih fungsi `setup` di dropdown → **Run** → izinkan permission
   (jika muncul "Google hasn't verified": *Advanced → Go to project (unsafe)*).
   Sheet `Transaksi` + header otomatis dibuat.
5. **Deploy → New deployment → ⚙️ → Web app**
   - Description: `api v1`
   - **Execute as: Me**
   - **Who has access: Anyone**  ← wajib, agar bisa diakses dari Vercel
   - **Deploy** → salin **Web app URL** (berakhiran `/exec`).
6. Tes di browser: buka `URL_ANDA/exec?action=ping` → harus muncul `{"ok":true,"data":"pong"}`.

> Setiap kali `Code.gs` diubah, lakukan **Deploy → Manage deployments → ✏️ → Version: New version → Deploy**
> agar URL lama tetap berlaku.

## 2) Hubungkan frontend

Edit `public/config.js`:

```js
window.APP_CONFIG = {
  API_URL: "https://script.google.com/macros/s/AKfycb...../exec",
  ORANG: ["Rachel", "Ferry"],
  JUDUL: "Keuangan Bersama"
};
```

Kalau `API_URL` masih kosong, aplikasi jalan dalam **mode demo** (data contoh, tidak tersimpan).

## 3) Coba lokal

```bash
cd keuangan-bersama/public
python3 -m http.server 5173
# buka http://localhost:5173 — aktifkan device toolbar (mobile view) di DevTools
```

## 4) Push ke GitHub

```bash
cd keuangan-bersama
git init
git add .
git commit -m "feat: aplikasi keuangan bersama Rachel & Ferry"
git branch -M main
git remote add origin https://github.com/USERNAME/keuangan-bersama.git
git push -u origin main
```

(Buat repo kosong dulu di https://github.com/new — **jangan** centang "Add README".)

## 5) Deploy ke Vercel

**Cara web (paling gampang):**
1. Buka https://vercel.com/new → **Import Git Repository** → pilih `keuangan-bersama`.
2. **Framework Preset:** `Other`
3. **Root Directory:** biarkan `./` (sudah diatur oleh `vercel.json`)
4. Build Command & Install Command: kosongkan.
5. **Deploy.** Selesai — dapat URL `https://keuangan-bersama.vercel.app`.

**Cara CLI:**
```bash
npm i -g vercel
cd keuangan-bersama
vercel        # preview
vercel --prod # production
```

## 6) Pasang di HP (biar seperti aplikasi)

- **Android/Chrome:** buka URL → menu ⋮ → *Add to Home screen*
- **iPhone/Safari:** tombol Share → *Add to Home Screen*

---

## Fitur

| Beranda | Riwayat | Input |
|---|---|---|
| Saldo bersama (animasi angka berjalan) | Cari keterangan/nama | Bottom sheet dari tombol + di tengah |
| Total masuk & keluar | Filter: Semua / Masuk / Keluar / Rachel / Ferry | Toggle MASUK–KELUAR bergeser |
| Ringkasan per orang + progress bar | Ringkasan sesuai filter | Nominal auto format ribuan |
| 5 transaksi terakhir | Dikelompokkan per hari (Hari ini/Kemarin) | Pilih nama Rachel/Ferry |
| Tarik-ulang data | Hapus transaksi | Tanggal & jam bisa diubah |

Ekstra: splash screen, background aurora bergerak, efek kilau pada kartu saldo,
haptic feedback, toast notifikasi, cache offline (localStorage), PWA-ready.

## API

| Aksi | Contoh |
|---|---|
| Ping | `GET /exec?action=ping` |
| List | `GET /exec?action=list` |
| Tambah | `GET /exec?action=create&tipe=MASUK&keterangan=Gaji&nominal=5000000&nama=Ferry` |
| Hapus | `GET /exec?action=delete&id=2` |

`POST` (body JSON, `Content-Type: text/plain`) juga didukung.

## Troubleshooting

| Masalah | Solusi |
|---|---|
| Muncul "Mode demo" | `API_URL` di `config.js` masih kosong |
| Data tidak tersimpan / error fetch | Deployment belum **Anyone**; deploy ulang sebagai *New version* |
| 401 / halaman login Google | Pilih **Execute as: Me** dan **Who has access: Anyone** |
| Perubahan `Code.gs` tidak berefek | Manage deployments → Edit → New version → Deploy |
| Halaman Vercel 404 | `vercel.json` belum ikut ter-upload ke repo |
