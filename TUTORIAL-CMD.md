# 💻 Tutorial Update Lewat CMD (Windows)

Khusus untuk:
- **Folder:** `C:\Users\HumanTremor\Downloads\keuangan-bersama`
- **Repo:** https://github.com/ferryad98-dev/rachelferry
- **Live:** https://rachelferry.vercel.app

> **Alur singkat:** edit file → `git add` → `git commit` → `git push` → Vercel deploy otomatis (±30 detik).

---

## PERSIAPAN (sekali saja)

### 1. Cek Git sudah terpasang

Buka **CMD** (tekan `Win + R` → ketik `cmd` → Enter), lalu:

```cmd
git --version
```

✅ Muncul `git version 2.xx.x` → lanjut ke langkah 2.
❌ Muncul `'git' is not recognized` → install dulu dari **https://git-scm.com/download/win**
(Next terus sampai selesai, lalu **tutup CMD dan buka lagi**.)

### 2. Kenalkan identitas Anda ke Git

```cmd
git config --global user.name "ferryad98-dev"
git config --global user.email "email-github-anda@gmail.com"
```

Ganti emailnya dengan email yang Anda pakai daftar GitHub.

### 3. Masuk ke folder proyek

```cmd
cd /d C:\Users\HumanTremor\Downloads\keuangan-bersama
```

> `/d` dipakai supaya bisa pindah antar-drive (misal dari C: ke D:).

Cek isinya sudah benar:

```cmd
dir
```

✅ Harus terlihat: `public`, `apps-script`, `vercel.json`, `README.md`

### 4. Cek folder ini sudah tersambung ke GitHub atau belum

```cmd
git remote -v
```

**Kalau muncul** `origin  https://github.com/ferryad98-dev/rachelferry.git` → **sudah tersambung**, lompat ke bagian **CARA UPDATE**.

**Kalau kosong / muncul error** `not a git repository` → jalankan ini:

```cmd
git init
git branch -M main
git remote add origin https://github.com/ferryad98-dev/rachelferry.git
git add .
git commit -m "update aplikasi"
git push -u origin main --force
```

> `--force` hanya dipakai **sekali di sini** karena repo GitHub Anda sudah berisi file.
> Setelah ini, jangan pakai `--force` lagi.

---

## CARA UPDATE (dipakai setiap kali ada perubahan)

Ini rutinitas harian Anda. **4 baris**, hafalkan saja:

```cmd
cd /d C:\Users\HumanTremor\Downloads\keuangan-bersama
git add .
git commit -m "update tampilan"
git push
```

Tulisan di dalam tanda kutip bebas — itu catatan perubahan. Contoh:
- `"perbaiki grafik"`
- `"tambah fitur baru"`
- `"update backend"`

### Apa yang terjadi setelah `git push`?

1. Kode naik ke GitHub
2. Vercel mendeteksi otomatis, langsung build ulang
3. ±30 detik → **https://rachelferry.vercel.app** sudah versi baru

Cek prosesnya di: **https://vercel.com/dashboard** → pilih project → tab **Deployments**

> 📱 Kalau di HP masih tampil versi lama: tarik layar ke bawah untuk refresh,
> atau tutup-buka aplikasinya. Browser kadang menyimpan cache.

---

## ⚡ CARA SUPER CEPAT — Klik 2× Saja

Di folder proyek sudah ada file **`update.bat`**.

**Cara pakai:**
1. Buka folder `C:\Users\HumanTremor\Downloads\keuangan-bersama`
2. **Klik 2×** pada file `update.bat`
3. Ketik catatan perubahan → tekan Enter
4. Selesai

Skrip itu otomatis menjalankan `add`, `commit`, dan `push` sekaligus.

---

## 🔑 Kalau Diminta Login / Password

GitHub **sudah tidak menerima password biasa**. Anda butuh **token**.

### Membuat token (sekali saja, simpan baik-baik)

1. Buka **https://github.com/settings/tokens**
2. **Generate new token** → **Generate new token (classic)**
3. Isi:
   - **Note:** `laptop saya`
   - **Expiration:** `No expiration`
   - **Scopes:** centang **`repo`** (kotak paling atas)
4. Klik **Generate token**
5. **SALIN token** yang muncul (diawali `ghp_...`) — hanya tampil sekali!

### Memakainya

Saat CMD bertanya:
```
Username: ferryad98-dev
Password: <-- TEMPEL TOKEN di sini, bukan password GitHub
```

> Saat menempel token, layar **tidak menampilkan apa-apa** — itu normal, bukan error.
> Klik kanan di CMD = paste. Lalu tekan Enter.

### Supaya tidak ditanya terus

```cmd
git config --global credential.helper manager
```

Setelah sekali berhasil login, seterusnya otomatis.

---

## 📋 Perintah yang Sering Dipakai

| Perintah | Fungsi |
|---|---|
| `git status` | Lihat file apa saja yang berubah |
| `git add .` | Siapkan semua perubahan |
| `git commit -m "pesan"` | Simpan perubahan + catatan |
| `git push` | Kirim ke GitHub → Vercel deploy |
| `git pull` | Ambil versi terbaru dari GitHub |
| `git log --oneline` | Lihat riwayat perubahan |
| `cls` | Bersihkan layar CMD |

---

## 🔧 Kalau Ada Masalah

### ❌ `'git' is not recognized`
Git belum terpasang atau CMD belum di-restart.
→ Install dari https://git-scm.com/download/win, lalu **tutup dan buka ulang CMD**.

### ❌ `fatal: not a git repository`
Anda belum masuk folder yang benar, atau folder belum di-`git init`.
```cmd
cd /d C:\Users\HumanTremor\Downloads\keuangan-bersama
git init
git branch -M main
git remote add origin https://github.com/ferryad98-dev/rachelferry.git
```

### ❌ `nothing to commit, working tree clean`
Tidak ada yang berubah — file Anda sudah sama persis dengan yang di GitHub. **Bukan error.**

### ❌ `Updates were rejected because the remote contains work...`
Ada perubahan di GitHub yang belum ada di komputer (misal Anda pernah edit lewat web).
```cmd
git pull origin main --rebase
git push
```

### ❌ `error: remote origin already exists`
Remote sudah ada, tinggal diperbarui:
```cmd
git remote set-url origin https://github.com/ferryad98-dev/rachelferry.git
```

### ❌ `Authentication failed`
Token salah/kedaluwarsa. Buat token baru, lalu hapus login lama:
**Control Panel** → **Credential Manager** → **Windows Credentials** →
cari `git:https://github.com` → **Remove**. Push lagi, masukkan token baru.

### ❌ Sudah push tapi web belum berubah
1. Cek **https://vercel.com/dashboard** → **Deployments** → statusnya harus **Ready** (hijau)
2. Kalau **Error** (merah) → klik untuk lihat pesannya
3. Kalau **Ready** tapi tampilan lama → refresh paksa: `Ctrl + F5`

---

## ⚠️ Penting: Backend Tidak Ikut Ter-push

File **`apps-script/Code.gs`** memang tersimpan di GitHub, tapi **Google Apps Script tidak membacanya dari sana**.

Kalau Anda mengubah `Code.gs`, harus **manual**:
1. Buka Spreadsheet → **Extensions** → **Apps Script**
2. Hapus semua isi → tempel isi `Code.gs` yang baru → **Ctrl+S**
3. **Deploy** → **Manage deployments** → ikon **✏️** → **Version: New version** → **Deploy**

> Pilih **Manage deployments**, **bukan** "New deployment" — supaya URL `/exec` tidak berubah.

---

## ✅ Contoh Sesi Lengkap

```cmd
C:\Users\HumanTremor>cd /d C:\Users\HumanTremor\Downloads\keuangan-bersama

C:\Users\HumanTremor\Downloads\keuangan-bersama>git status
On branch main
Changes not staged for commit:
        modified:   public/style.css

C:\Users\HumanTremor\Downloads\keuangan-bersama>git add .

C:\Users\HumanTremor\Downloads\keuangan-bersama>git commit -m "perbaiki warna tombol"
[main 7a3f2c1] perbaiki warna tombol
 1 file changed, 3 insertions(+), 1 deletion(-)

C:\Users\HumanTremor\Downloads\keuangan-bersama>git push
Enumerating objects: 7, done.
Writing objects: 100% (4/4), 412 bytes | 412.00 KiB/s, done.
To https://github.com/ferryad98-dev/rachelferry.git
   fe6e268..7a3f2c1  main -> main
```

Tulisan `main -> main` di baris terakhir = **berhasil**. Tunggu ±30 detik, buka
https://rachelferry.vercel.app — sudah versi baru. 🎉
