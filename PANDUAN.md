# 📘 PANDUAN LENGKAP — Dari Nol Sampai Online

Aplikasi **Keuangan Bersama** (Rachel & Ferry).
Ikuti berurutan. Total sekitar **20–30 menit**.

> **Alurnya:** Spreadsheet (database) → Apps Script (backend) → GitHub (simpan kode) → Vercel (jadi website).

**Yang perlu disiapkan:** akun Google, akun GitHub, akun Vercel (bisa daftar pakai GitHub). Semua gratis.

---

# BAGIAN 1 — Membuat Database (Spreadsheet)

### Langkah 1.1 — Buat spreadsheet baru
1. Buka browser, ketik alamat: **https://sheets.new**
2. Spreadsheet kosong langsung terbuka.
3. Klik tulisan **"Untitled spreadsheet"** di kiri atas, ganti jadi: **DB Keuangan Bersama**

✅ *Selesai kalau:* judul spreadsheet sudah berubah.

> Anda **tidak perlu** membuat kolom apa pun secara manual. Nanti dibuat otomatis.

---

# BAGIAN 2 — Memasang Backend (Apps Script)

### Langkah 2.1 — Buka editor Apps Script
Di spreadsheet tadi, klik menu:

**Extensions** (Ekstensi) → **Apps Script**

Tab baru terbuka bernama *Untitled project*.

### Langkah 2.2 — Tempel kode
1. Di editor, ada file **`Code.gs`** berisi:
   ```
   function myFunction() {
   }
   ```
2. **Blok semua** teks itu (klik di area kode, tekan `Ctrl+A` / `Cmd+A`) lalu **Delete**.
3. Buka file **`apps-script/Code.gs`** dari proyek ini, **salin seluruh isinya**.
4. **Tempel** (`Ctrl+V` / `Cmd+V`) ke editor yang sudah kosong tadi.
5. Tekan **`Ctrl+S`** (atau ikon 💾) untuk menyimpan.
6. Ganti nama proyek: klik **"Untitled project"** di atas → tulis **API Keuangan** → **Rename**.

### Langkah 2.3 — Jalankan `setup` (bikin kolom otomatis)
1. Di bar atas editor ada dropdown fungsi (biasanya tertulis `setup` atau `doGet`).
   Pilih **`setup`**.
2. Klik tombol **▶ Run**.

**Akan muncul permintaan izin — ini normal:**

| Yang muncul | Yang diklik |
|---|---|
| "Authorization required" | **Review permissions** |
| Pilih akun | Klik akun Google Anda |
| ⚠️ "Google hasn't verified this app" | **Advanced** → **Go to API Keuangan (unsafe)** |
| Daftar izin | **Allow** |

> Tulisan "unsafe" wajar — karena skripnya buatan sendiri, bukan aplikasi terdaftar. Aman.

3. Tunggu sampai muncul **"Execution completed"** di bawah.

✅ *Cek hasilnya:* kembali ke tab spreadsheet. Sekarang ada sheet bernama **Transaksi** dengan header hitam:

| Tanggal | Tipe | Keterangan | Nominal | Nama |
|---|---|---|---|---|

Kalau sudah muncul → berhasil.

### Langkah 2.4 — Deploy jadi Web App
1. Kembali ke tab Apps Script.
2. Klik tombol biru **Deploy** (kanan atas) → **New deployment**.
3. Klik ikon **⚙️ gerigi** di kiri atas panel → pilih **Web app**.
4. Isi persis seperti ini:

   | Kolom | Isi |
   |---|---|
   | Description | `api v1` |
   | Execute as | **Me (email Anda)** |
   | Who has access | **Anyone** ⚠️ |

   > ⚠️ **Wajib "Anyone"**, bukan "Anyone with Google account". Kalau salah, aplikasi tidak bisa baca data.

5. Klik **Deploy**.
6. Muncul **Web app URL** seperti:
   ```
   https://script.google.com/macros/s/AKfycbx......../exec
   ```
7. Klik **Copy** — **simpan baik-baik**, ini dipakai di Langkah 3.

### Langkah 2.5 — Tes URL-nya
Buka tab browser baru, tempel URL tadi lalu **tambahkan** `?action=ping` di ujungnya:

```
https://script.google.com/macros/s/AKfycbx......../exec?action=ping
```

✅ **Berhasil** kalau muncul: `{"ok":true,"data":"pong"}`

❌ Kalau muncul halaman login Google atau error → ulangi Langkah 2.4, pastikan **Anyone**.

---

# BAGIAN 3 — Memasukkan URL ke Aplikasi

Buka file **`public/config.js`**, ganti bagian `API_URL` dengan URL Anda:

```js
window.APP_CONFIG = {
  API_URL: "https://script.google.com/macros/s/AKfycbx......../exec",
  ORANG: ["Rachel", "Ferry"],
  JUDUL: "Keuangan Bersama"
};
```

> Pastikan URL diapit **tanda kutip** dan diakhiri `/exec`.
> Kalau `API_URL` dibiarkan kosong, aplikasi jalan dalam **mode demo** (data contoh, tidak tersimpan).

### Tes di komputer dulu (opsional tapi disarankan)
Buka Terminal / Command Prompt:
```bash
cd keuangan-bersama/public
python3 -m http.server 5173
```
Buka **http://localhost:5173** → coba simpan 1 transaksi → cek apakah masuk ke spreadsheet.
Tekan `Ctrl+C` di terminal untuk berhenti.

---

# BAGIAN 4 — Upload ke GitHub

### Langkah 4.1 — Buat repository kosong
1. Buka **https://github.com/new**
2. Isi:
   - **Repository name:** `keuangan-bersama`
   - **Public** atau **Private** — dua-duanya bisa dipakai Vercel
   - ⚠️ **JANGAN centang** "Add a README file", "Add .gitignore", atau "Choose a license"
3. Klik **Create repository**.
4. Muncul halaman berisi perintah — biarkan terbuka.

### Langkah 4.2 — Upload

**Cara A — Lewat website (tanpa perlu paham Git):**
1. Di halaman repo baru, klik link **"uploading an existing file"**.
2. **Drag & drop** folder `keuangan-bersama` (isi-isinya) ke area upload.
3. Tulis pesan commit: `aplikasi keuangan bersama`
4. Klik **Commit changes**.

> Pastikan struktur di GitHub jadi seperti ini — folder `public` harus ada:
> ```
> public/index.html
> public/style.css
> public/app.js
> public/config.js
> apps-script/Code.gs
> vercel.json
> ```

**Cara B — Lewat Terminal (repo di proyek ini sudah di-`git init` & commit):**
```bash
cd keuangan-bersama
git remote add origin https://github.com/USERNAME/keuangan-bersama.git
git push -u origin main
```
Ganti **USERNAME** dengan username GitHub Anda.

> Kalau diminta password: GitHub **tidak lagi menerima password biasa**.
> Buat token di **https://github.com/settings/tokens** → *Generate new token (classic)* →
> centang **repo** → *Generate* → salin token → pakai token itu sebagai password.

✅ *Selesai kalau:* refresh halaman GitHub, semua file sudah terlihat.

---

# BAGIAN 5 — Deploy ke Vercel

### Langkah 5.1 — Daftar / masuk
1. Buka **https://vercel.com/signup**
2. Klik **Continue with GitHub** → **Authorize**.

### Langkah 5.2 — Import project
1. Buka **https://vercel.com/new**
2. Cari **`keuangan-bersama`** di daftar → klik **Import**.
   - Kalau repo tidak muncul: klik **Adjust GitHub App Permissions** → izinkan akses ke repo tersebut.

### Langkah 5.3 — Setting
| Kolom | Isi |
|---|---|
| Project Name | `keuangan-bersama` |
| Framework Preset | **Other** |
| Root Directory | `./` (biarkan default) |
| Build Command | kosongkan |
| Output Directory | kosongkan |
| Install Command | kosongkan |

> File `vercel.json` sudah otomatis mengarahkan Vercel ke folder `public`. Tidak perlu diubah.

### Langkah 5.4 — Deploy
Klik **Deploy**, tunggu ±30 detik sampai muncul animasi konfetti 🎉

URL Anda:
```
https://keuangan-bersama.vercel.app
```
Klik **Visit** untuk membuka.

---

# BAGIAN 6 — Pasang di HP

Agar tampil seperti aplikasi asli (tanpa address bar browser):

**Android (Chrome):**
Buka URL → titik tiga **⋮** → **Add to Home screen** → **Add**

**iPhone (Safari):**
Buka URL → tombol **Share** (kotak dengan panah ke atas) → **Add to Home Screen** → **Add**

Ikon 💸 muncul di layar HP. Buka dari situ → tampil layar penuh.

---

# 🔄 Cara Mengubah Aplikasi Nanti

### Mengubah tampilan/fitur (HTML, CSS, JS)
```bash
# edit file di folder public/
git add .
git commit -m "update tampilan"
git push
```
Vercel **otomatis** deploy ulang dalam ±30 detik. Tidak perlu buka Vercel.

Atau lewat web: buka file di GitHub → ikon **✏️ pensil** → edit → **Commit changes**.

### ⚠️ Ada pembaruan `Code.gs`? Wajib deploy ulang
Versi terbaru menambah fitur **edit transaksi**. Backend harus diperbarui,
kalau tidak tombol "Simpan Perubahan" akan error:

1. Buka Apps Script → blok semua isi `Code.gs` → hapus → tempel isi terbaru → **Save**.
2. **Deploy** → **Manage deployments** → ikon **✏️** → **Version: New version** → **Deploy**.

URL `/exec` Anda tidak berubah, jadi `config.js` tidak perlu disentuh.

### Mengubah backend (`Code.gs`)
Setelah edit di editor Apps Script:

**Deploy** → **Manage deployments** → ikon **✏️** → **Version: New version** → **Deploy**

> ⚠️ Jangan pilih "New deployment" — nanti URL-nya berubah dan harus ganti `config.js` lagi.

### Mengganti nama Rachel/Ferry
Cari-ganti kata `Rachel` dan `Ferry` di **`public/index.html`**, **`public/app.js`**, dan **`apps-script/Code.gs`**.

---

# 🔧 Kalau Ada Masalah

| Gejala | Penyebab & Solusi |
|---|---|
| Muncul toast **"Mode demo"** | `API_URL` di `config.js` masih kosong. Isi, lalu push ulang. |
| Data tidak masuk spreadsheet | Deployment bukan **Anyone**. Ulangi Langkah 2.4. |
| Muncul halaman **login Google** saat buka `?action=ping` | Setting akses salah. Harus **Execute as: Me** + **Who has access: Anyone**. |
| Vercel tampil **404 NOT_FOUND** | `vercel.json` tidak ikut ter-upload, atau folder `public` tidak ada di repo. Cek struktur di GitHub. |
| Halaman **putih kosong** | Buka DevTools (F12) → tab Console. Biasanya `config.js` salah ketik — kutip kurang atau koma hilang. |
| Ubah `Code.gs` tapi tidak berubah | Belum deploy versi baru. Manage deployments → Edit → **New version**. |
| `git push` ditolak / minta password | Pakai **Personal Access Token**, bukan password. Lihat catatan di Langkah 4.2. |
| Tanggal/jam meleset | Di Apps Script: **Project Settings** → **Time zone** → *(GMT+07:00) Jakarta*. |

---

# ✅ Checklist

- [ ] Spreadsheet **DB Keuangan Bersama** dibuat
- [ ] `Code.gs` ditempel & disimpan
- [ ] Fungsi `setup` dijalankan → sheet **Transaksi** + header muncul
- [ ] Deploy Web app (**Me** + **Anyone**) → URL `/exec` disalin
- [ ] `?action=ping` menghasilkan `{"ok":true,"data":"pong"}`
- [ ] `public/config.js` diisi URL
- [ ] Repo GitHub dibuat & file ter-upload
- [ ] Vercel import → Deploy → dapat URL
- [ ] Tes simpan transaksi → **masuk ke spreadsheet**
- [ ] Dipasang di HP (Add to Home Screen)
