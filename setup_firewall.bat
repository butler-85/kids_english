@echo off
chcp 65001 >nul
echo 正在添加 Windows 防火墙规则（TCP 8899 入站放行）...
netsh advfirewall firewall delete rule name="ABC Park 8899" >nul 2>&1
netsh advfirewall firewall add rule name="ABC Park 8899" dir=in action=allow protocol=TCP localport=8899
if %errorlevel% neq 0 (
  echo.
  echo 失败：请右键本文件，选择"以管理员身份运行"。
) else (
  echo.
  echo 成功！现在同一 WiFi 下的 iPad/手机 可以访问本机的 8899 端口了。
)
pause
