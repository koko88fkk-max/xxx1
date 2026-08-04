@echo off
chcp 65001 >nul
title تشغيل موقع متجر تعن T3N
set PATH=C:\Users\koz\node-portable\node-v20.18.0-win-x64;%PATH%

echo ========================================================
echo   جاري تشغيل موقع متجر تعن T3N والخوادم الخاصة به
echo ========================================================
echo.

echo [1/3] تشغيل خادم الخلفية (Backend Port 3001)...
start "Backend Server (3001)" cmd /k "set PATH=C:\Users\koz\node-portable\node-v20.18.0-win-x64;%%PATH%% && cd /d %~dp0 && node server.js"

echo [2/3] تشغيل واجهة الموقع (Website Port 3000)...
start "Website Server (3000)" cmd /k "set PATH=C:\Users\koz\node-portable\node-v20.18.0-win-x64;%%PATH%% && npm run dev"

timeout /t 4 >nul

echo [3/3] إنشاء رابط خارجي مباشر ومجاني (Cloudflare Tunnel)...
start "Direct Public Tunnel" cmd /k "cd /d %~dp0 && .\cloudflared.exe tunnel --url http://localhost:3000"

echo.
echo ========================================================
echo  تم تشغيل جميع الخدمات بنجاح!
echo  - رابط الجهاز المحلي: http://localhost:3000
echo  - رابط الشبكة: http://192.168.0.121:3000
echo  - نافذة النفق ستعرض لك رابط trycloudflare.com المباشر للعملاء!
echo ========================================================
pause
