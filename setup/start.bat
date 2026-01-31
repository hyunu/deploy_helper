@echo off
chcp 65001 > nul
setlocal

echo ======================================
echo   Deploy Helper 배포 시스템 시작
echo ======================================
echo.

cd /d "%~dp0\.."

REM .env 파일 확인
if not exist ".env" (
    echo [정보] .env 파일이 없습니다. 예시 파일을 복사합니다...
    copy env.example .env
    echo [경고] .env 파일의 비밀번호를 변경하세요!
    echo.
)

REM Docker 확인
where docker >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [오류] Docker가 설치되어 있지 않습니다.
    pause
    exit /b 1
)

REM Docker Compose 실행
echo [정보] Docker 컨테이너 빌드 및 시작...
echo.

docker compose up -d --build

echo.
echo ======================================
echo   시작 완료!
echo ======================================
echo.
echo   관리자 대시보드: http://localhost:3000
echo   API 문서:       http://localhost:8000/docs
echo.
echo   기본 관리자 계정:
echo     이메일: admin@company.com
echo     비밀번호: admin123
echo.
echo   ※ 첫 로그인 후 비밀번호를 변경하세요!
echo.

pause
