#!/bin/bash
# Mirror nobad.day to static files

set -e

MIRROR_DIR="site-mirror"
BASE_URL="https://nobad.day"

echo "🔄 Starting full site mirror of ${BASE_URL}..."

cd "$(dirname "$0")"
mkdir -p "$MIRROR_DIR"
cd "$MIRROR_DIR"

# Use wget to mirror the site
if command -v wget &> /dev/null; then
  echo "Using wget..."
  wget \
    --mirror \
    --convert-links \
    --adjust-extension \
    --page-requisites \
    --no-parent \
    --domains nobad.day,cdn.shopify.com \
    --no-host-directories \
    --cut-dirs=0 \
    --user-agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" \
    --wait=1 \
    --random-wait \
    --limit-rate=200k \
    "$BASE_URL"
  
  echo "✅ Site mirrored successfully"
else
  echo "❌ wget not found. Installing via Homebrew or using alternative..."
  if command -v brew &> /dev/null; then
    echo "Installing wget via Homebrew..."
    brew install wget
    # Re-run the script
    exec "$0"
  else
    echo "Please install wget: brew install wget"
    exit 1
  fi
fi

