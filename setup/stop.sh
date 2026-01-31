#!/bin/bash

# Deploy Helper 중지 스크립트

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

echo "Deploy Helper 중지 중..."

# Docker Compose 명령어 결정
if docker compose version &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker compose"
else
    DOCKER_COMPOSE_CMD="docker-compose"
fi

# 컨테이너 중지 및 제거
$DOCKER_COMPOSE_CMD down --remove-orphans 2>/dev/null || true

# 문제가 있는 컨테이너 강제 제거
docker ps -a --filter "name=deploy-" --format "{{.ID}}" | xargs -r docker rm -f 2>/dev/null || true

echo "중지 완료!"
