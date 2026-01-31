#!/bin/bash

# Deploy Helper 로그 확인 스크립트

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

SERVICE=${1:-""}

if docker compose version &> /dev/null; then
    docker compose logs -f $SERVICE
else
    docker-compose logs -f $SERVICE
fi
