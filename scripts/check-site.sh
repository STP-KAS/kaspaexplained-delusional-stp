#!/usr/bin/env bash
set -euo pipefail
npm run check
npm run check:v1
npm run check:render
