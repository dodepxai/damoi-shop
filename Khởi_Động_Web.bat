@echo off
title Damoi Shop Server
color 0A
echo =========================================
echo       KHOI DONG SERVER DAMOI SHOP
echo =========================================
echo DANG KHOI DONG, VUI LONG DOI...
echo.

:: Vòng lặp tìm thư mục Desktop chứa chữ M (bỏ qua viết lỗi dấu)
for /d %%i in ("C:\Users\ADMIN\OneDrive\*") do (
    if exist "%%i\damoi shop\server.js" (
        cd /d "%%i\damoi shop"
        goto :startnode
    )
)

echo Khong tim thay thu muc "damoi shop" o Desktop.
pause
exit /b

:startnode
node server.js
if errorlevel 1 (
    echo.
    echo Co loi xay ra khi chay Server.
    pause
)
