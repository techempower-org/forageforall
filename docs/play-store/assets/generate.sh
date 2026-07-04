#!/usr/bin/env bash
# Regenerate the derived Play Store assets from brand sources.
# Requires ImageMagick (`convert`). Run from the repo root:
#   bash docs/play-store/assets/generate.sh
set -euo pipefail

cd "$(git rev-parse --show-toplevel)"
out="docs/play-store/assets"

# 1) Play hi-res icon: 512x512, 32-bit (8-bit/channel RGBA) PNG, <=1MB.
#    Source assets/icon.png is 1024x1024 @ 16-bit; PNG32 forces the format
#    Play expects. Full-bleed art — Google applies its own corner mask.
convert assets/icon.png -resize 512x512 -depth 8 PNG32:"$out/play-icon-512.png"

# 2) Feature graphic: 1024x500. Top-left 1176x574 crop of the og-image keeps
#    wordmark + tagline + promise chips + illustration and EXCLUDES the bottom
#    strip (stale github.com/jphein URL). 1176x574 has the same 2.048 aspect
#    as 1024x500, so the resize is distortion-free.
convert docs/og-image.png -crop 1176x574+0+0 +repage \
  -resize 1024x500 -depth 8 PNG24:"$out/feature-graphic-1024x500.png"

identify "$out/play-icon-512.png" "$out/feature-graphic-1024x500.png"
echo "OK — regenerated Play assets in $out/"
