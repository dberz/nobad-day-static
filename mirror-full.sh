#!/bin/bash
# Full mirror of nobad.day using wget

set -e

MIRROR_DIR="site-mirror"
BASE_URL="https://nobad.day"

echo "🔄 Starting FULL site mirror of ${BASE_URL}..."
echo "📁 Output: ${MIRROR_DIR}/"
echo ""

cd "$(dirname "$0")"
rm -rf "$MIRROR_DIR"
mkdir -p "$MIRROR_DIR"
cd "$MIRROR_DIR"

wget \
  --mirror \
  --convert-links \
  --adjust-extension \
  --page-requisites \
  --no-parent \
  --domains nobad.day,cdn.shopify.com,shopifycdn.com \
  --no-host-directories \
  --cut-dirs=0 \
  --user-agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" \
  --wait=0.5 \
  --random-wait \
  --limit-rate=500k \
  --recursive \
  --level=5 \
  --accept=html,css,js,woff,woff2,ttf,otf,eot,svg,png,jpg,jpeg,gif,webp,json,xml \
  --reject-regex="checkout|cart|account|admin" \
  "$BASE_URL"

echo ""
echo "✅ Full mirror complete!"
echo "📊 Files downloaded: $(find . -type f | wc -l | tr -d ' ')"
echo ""
echo "🔄 Next: Copy to public/"
echo "   cp -r site-mirror/* public/"

