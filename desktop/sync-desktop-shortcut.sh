#!/bin/bash
# Point ~/Desktop/Smart Scheduler.app at the latest packaged build.
# Prefer a symlink so rebuilds stay fresh without leaving a stale full copy.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC_ARM="$ROOT/dist-desktop/mac-arm64/Smart Scheduler.app"
SRC_X64="$ROOT/dist-desktop/mac/Smart Scheduler.app"
DESKTOP_APP="${HOME}/Desktop/Smart Scheduler.app"

if [[ -d "$SRC_ARM" ]]; then
  SRC="$SRC_ARM"
elif [[ -d "$SRC_X64" ]]; then
  SRC="$SRC_X64"
else
  echo "No packaged app found. Run: npm run build:desktop"
  exit 1
fi

# Refuse to clobber while the app appears to be running
if pgrep -f "Smart Scheduler.app/Contents/MacOS/Smart Scheduler" >/dev/null 2>&1; then
  echo "Smart Scheduler is running. Quit the app, then re-run:"
  echo "  npm run sync:desktop"
  exit 1
fi

# Remove only our Desktop shortcut (file, symlink, or .app bundle) — nothing else
if [[ -e "$DESKTOP_APP" || -L "$DESKTOP_APP" ]]; then
  rm -rf "$DESKTOP_APP"
fi

ln -s "$SRC" "$DESKTOP_APP"
# Finder sometimes caches icons; touch helps refresh
touch "$DESKTOP_APP" 2>/dev/null || true

echo "Desktop shortcut updated:"
echo "  $DESKTOP_APP"
echo "→ $SRC"
ls -la "$DESKTOP_APP"
