#!/usr/bin/env bash
set -euo pipefail
npm run build:v1
node scripts/check-links.mjs
