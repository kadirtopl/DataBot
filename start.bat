@echo off
title WhatsApp Bot Başlatıcı
color 0A
cls

:: Terminal penceresini büyüt
mode con: cols=120 lines=50

echo WhatsApp Bot başlatılıyor...
echo ===========================
echo.

:: Node.js kontrolü
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo Node.js bulunamadı!
    echo Lütfen Node.js'i yükleyin: https://nodejs.org
    pause
    exit
)

:: Bağımlılıkları yükle
echo Bağımlılıklar yükleniyor...
call npm install

:: TypeScript dosyalarını derle
echo TypeScript dosyaları derleniyor...
call npm run build

:: Eski QR dosyasını sil
if exist qr.txt del qr.txt

:: Uygulamayı başlat
echo Bot başlatılıyor...
echo.
echo QR kod oluşturuluyor...
echo.
echo WhatsApp uygulamanızı açın
echo Menü > Bağlı Cihazlar > Cihaz Bağla
echo QR kodu okutun
echo.
echo ===========================
echo.

REM Node.js servisini başlat
start cmd /k "npm start"

echo Bot başlatıldı! QR kodu terminal penceresinde görünecektir.
echo.
pause 