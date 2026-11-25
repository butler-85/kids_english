@echo off
chcp 65001 >nul
cd /d "%~dp0"
set PY=python
where python >nul 2>nul
if %errorlevel% neq 0 set PY=D:\anaconda3\python.exe

echo ================================================
echo   ABC Park - 字母乐园（含小朋友档案管理）
echo ================================================
echo.
echo   本机使用:   http://localhost:8899
echo   平板/手机（同一WiFi）请用下面任一地址:
for /f "tokens=*" %%i in ('powershell -NoProfile -Command "(Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*'} | Select-Object -ExpandProperty IPAddress)"') do echo     http://%%i:8899
echo.
echo   iPad 用 Safari 打开后，点"分享 -^> 添加到主屏幕"即可像 App 一样使用
echo   若平板无法访问，请先右键"以管理员身份运行" setup_firewall.bat
echo   进程数据保存在 server\data\abc.db（备份该文件即可迁移）
echo.
echo   关闭本窗口即可停止。
echo ================================================
start "" "http://localhost:8899"
%PY% server\app.py
pause
