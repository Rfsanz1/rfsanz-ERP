#!/bin/bash

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

info() {
  printf "[INFO] %s\n" "$1"
}

warn() {
  printf "[WARN] %s\n" "$1"
}

cd "$ROOT"

# 1. Delete root binary file `laravel`
if [ -f "$ROOT/laravel" ]; then
  info "Removing root file 'laravel'"
  rm -f "$ROOT/laravel"
else
  warn "Root file 'laravel' not found"
fi

# 2. Delete storage directory
if [ -d "$ROOT/storage" ]; then
  info "Removing storage/ directory"
  rm -rf "$ROOT/storage"
else
  warn "storage/ directory not found"
fi

# 3. Delete root frontend directory
if [ -d "$ROOT/frontend" ]; then
  info "Removing root frontend/ directory"
  rm -rf "$ROOT/frontend"
else
  warn "Root frontend/ directory not found"
fi

# 4. Move public assets to apps/frontend/public/
TARGET_PUBLIC="$ROOT/apps/frontend/public"
mkdir -p "$TARGET_PUBLIC"

for path in "favicon.ico" "manifest.json" "sw.js" ".htaccess"; do
  if [ -f "$ROOT/public/$path" ]; then
    if [ -f "$TARGET_PUBLIC/$path" ]; then
      warn "Skipped existing $TARGET_PUBLIC/$path"
    else
      info "Moving public/$path -> apps/frontend/public/$path"
      mv "$ROOT/public/$path" "$TARGET_PUBLIC/$path"
    fi
  fi
done

if [ -d "$ROOT/public/icons" ]; then
  mkdir -p "$TARGET_PUBLIC/icons"
  find "$ROOT/public/icons" -type f | while read -r icon; do
    relpath="${icon#$ROOT/public/}"
    if [ -f "$TARGET_PUBLIC/$relpath" ]; then
      warn "Skipped existing $TARGET_PUBLIC/$relpath"
    else
      info "Moving public/$relpath -> apps/frontend/public/$relpath"
      mkdir -p "$(dirname "$TARGET_PUBLIC/$relpath")"
      mv "$icon" "$TARGET_PUBLIC/$relpath"
    fi
  done
fi

if [ -d "$ROOT/public" ]; then
  if [ -z "$(find "$ROOT/public" -mindepth 1 | head -n 1)" ]; then
    info "Removing empty root public/ directory"
    rmdir "$ROOT/public"
  else
    warn "Root public/ still contains files; not removed"
  fi
fi

# 5. Move attached_assets Pasted-*.txt to docs/references/
REF_DIR="$ROOT/docs/references"
mkdir -p "$REF_DIR"
if [ -d "$ROOT/attached_assets" ]; then
  find "$ROOT/attached_assets" -maxdepth 1 -type f -name 'Pasted-*.txt' | while read -r file; do
    basename="$(basename "$file")"
    if [ -f "$REF_DIR/$basename" ]; then
      warn "Skipped existing docs/references/$basename"
    else
      info "Moving attached_assets/$basename -> docs/references/$basename"
      mv "$file" "$REF_DIR/$basename"
    fi
  done

  if [ -z "$(find "$ROOT/attached_assets" -mindepth 1 | head -n 1)" ]; then
    info "Removing empty attached_assets/ directory"
    rmdir "$ROOT/attached_assets"
  else
    warn "attached_assets/ still contains files; not removed"
  fi
else
  warn "attached_assets/ directory not found"
fi

info "Cleanup script completed. Review output for skipped or retained files."
