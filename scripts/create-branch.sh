#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
: "${1:?Usage: scripts/create-branch.sh feature/name}"
git fetch origin || true
git checkout main
git pull origin main || true
git checkout -b "$1"
