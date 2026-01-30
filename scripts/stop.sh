#!/bin/bash

# Deploy Helper 중지 스크립트

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

echo "Deploy Helper 중지 중..."

if docker compose version &> /dev/null; then
    docker compose down
else
    docker-compose down
fi

echo "중지 완료!"
