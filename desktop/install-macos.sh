#!/bin/bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC_ARM="$ROOT/dist-desktop/mac-arm64/Smart Scheduler.app"
SRC_X64="$ROOT/dist-desktop/mac/Smart Scheduler.app"

if [[ -d "$SRC_ARM" ]]; then
  SRC="$SRC_ARM"
elif [[ -d "$SRC_X64" ]]; then
  SRC="$SRC_X64"
else
  echo "No built app found. Run: npm run build:desktop"
  exit 1
fi

DEST="/Applications/Smart Scheduler.app"
echo "Installing from:"
echo "  $SRC"
echo "to:"
echo "  $DEST"

rm -rf "$DEST"
ditto "$SRC" "$DEST"
xattr -cr "$DEST" 2>/dev/null || true

# Keep Desktop in sync with the packaged build (symlink → dist-desktop)
bash "$(dirname "$0")/sync-desktop-shortcut.sh" || true

echo "Done. You can open Smart Scheduler from Applications or Spotlight."
echo "Desktop shortcut points at the latest dist-desktop build."
echo "First launch: if macOS blocks it, right-click the app → Open."
