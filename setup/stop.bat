@echo off
chcp 65001 > nul
setlocal

echo Deploy Helper 중지 중...

cd /d "%~dp0\.."

docker compose down

echo 중지 완료!
pause
