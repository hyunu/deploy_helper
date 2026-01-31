#!/bin/bash

# Deploy Helper 시작 스크립트

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

echo "======================================"
echo "  Deploy Helper 배포 시스템 시작"
echo "======================================"
echo ""

# .env 파일 확인
if [ ! -f ".env" ]; then
    echo "[정보] .env 파일이 없습니다. 예시 파일을 복사합니다..."
    cp .env.example .env
    echo "[경고] .env 파일의 비밀번호를 변경하세요!"
    echo ""
fi

# Docker 확인
if ! command -v docker &> /dev/null; then
    echo "[오류] Docker가 설치되어 있지 않습니다."
    exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "[오류] Docker Compose가 설치되어 있지 않습니다."
    exit 1
fi

# Docker Compose 명령어 결정
if docker compose version &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker compose"
else
    DOCKER_COMPOSE_CMD="docker-compose"
fi

# 기존 컨테이너 정리 (KeyError 방지를 위해)
echo "[정보] 기존 컨테이너 정리 중..."
$DOCKER_COMPOSE_CMD down --remove-orphans 2>/dev/null || true

# 문제가 있는 컨테이너 강제 제거
echo "[정보] 문제가 있는 컨테이너 강제 제거 중..."
docker ps -a --filter "name=deploy-" --format "{{.ID}}" | xargs -r docker rm -f 2>/dev/null || true

# Docker Compose 실행
echo "[정보] Docker 컨테이너 빌드 및 시작..."
echo ""

$DOCKER_COMPOSE_CMD up -d --build --force-recreate --remove-orphans

echo ""
echo "======================================"
echo "  시작 완료!"
echo "======================================"
echo ""
echo "  관리자 대시보드: http://localhost:${WEB_PORT:-3000}"
echo "  API 문서:       http://localhost:${API_PORT:-8000}/docs"
echo ""
echo "  기본 관리자 계정:"
echo "    이메일: admin@company.com"
echo "    비밀번호: admin123"
echo ""
echo "  ※ 첫 로그인 후 비밀번호를 변경하세요!"
echo ""
