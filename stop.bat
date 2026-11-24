@echo off
echo WhatsApp Bot durduruluyor...

REM Node.js işlemlerini sonlandır
taskkill /F /IM node.exe
taskkill /F /IM cmd.exe

echo Bot durduruldu!
echo.
pause 