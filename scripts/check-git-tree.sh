#!/usr/bin/env bash
set -euo pipefail
repo_root="$(git rev-parse --show-toplevel)"
mode="${1:-index}"
case "$mode" in index|head) ;; *) exit 2 ;; esac
stage_dir="$(mktemp -d "${TMPDIR:-/tmp}/kaspa-release-tree.XXXXXX")"
trap 'rm -rf "$stage_dir"' EXIT
if [[ "$mode" == index ]]; then
  git checkout-index --prefix="$stage_dir/" -a
else
  git archive HEAD | tar -x -C "$stage_dir"
fi
# Only dependency installations are shared. Source and generated output belong
# to the snapshot, so unstaged edits cannot make a broken commit pass.
mkdir -p "$stage_dir/.cache"
for dependency in upstream public-templates; do
  if [[ -d "$repo_root/.cache/$dependency" ]]; then
    ln -s "$repo_root/.cache/$dependency" "$stage_dir/.cache/$dependency"
  fi
done
if [[ -d "$repo_root/node_modules" ]]; then
  ln -s "$repo_root/node_modules" "$stage_dir/node_modules"
fi
cd "$stage_dir"
npm run check
npm run check:v1
npm run check:copy
if [[ "$mode" == head ]]; then
  npm run check:journeys
  npm run check:render
  KASPA_RELEASE=v2 npm run check:render
fi
