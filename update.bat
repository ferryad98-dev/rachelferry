@echo off
chcp 65001 >nul
title Update Keuangan Bersama
cd /d "%~dp0"

echo ============================================
echo    UPDATE KEUANGAN BERSAMA
echo    github.com/ferryad98-dev/rachelferry
echo ============================================
echo.

where git >nul 2>nul
if errorlevel 1 (
  echo [X] Git belum terpasang.
  echo     Download: https://git-scm.com/download/win
  echo     Setelah install, tutup dan buka lagi file ini.
  echo.
  pause
  exit /b
)

if not exist ".git" (
  echo [!] Folder ini belum tersambung ke GitHub. Menyiapkan...
  git init
  git branch -M main
  git remote add origin https://github.com/ferryad98-dev/rachelferry.git
  echo.
)

git remote get-url origin >nul 2>nul
if errorlevel 1 git remote add origin https://github.com/ferryad98-dev/rachelferry.git

echo --- Perubahan yang terdeteksi ---
git status --short
echo.

set "ADA="
for /f "delims=" %%A in ('git status --porcelain') do set "ADA=1"
if not defined ADA (
  echo [i] Tidak ada perubahan. Semua sudah tersimpan di GitHub.
  echo.
  pause
  exit /b
)

set "pesan="
set /p pesan="Catatan perubahan (Enter = 'update aplikasi'): "
if "%pesan%"=="" set "pesan=update aplikasi"

echo.
echo --- Mengirim ke GitHub ---
git add .
git commit -m "%pesan%"
git push -u origin main

echo.
if errorlevel 1 (
  echo [X] GAGAL push.
  echo.
  echo   Kalau diminta password, pakai TOKEN, bukan password GitHub.
  echo   Buat di: https://github.com/settings/tokens
  echo   Generate new token ^(classic^) -^> centang "repo"
  echo.
  echo   Kalau pesannya "Updates were rejected", jalankan:
  echo      git pull origin main --rebase
  echo      git push
) else (
  echo [OK] BERHASIL!
  echo.
  echo   Vercel sedang build ulang, tunggu sekitar 30 detik.
  echo   Cek: https://rachelferry.vercel.app
  echo   Status: https://vercel.com/dashboard
)
echo.
pause
