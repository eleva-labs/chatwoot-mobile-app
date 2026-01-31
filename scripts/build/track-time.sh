#!/bin/bash

# Build Time Tracking Script
# Usage: ./scripts/track-build-time.sh [clean|soft|fast|run] [ios|android]

BUILD_TYPE=${1:-"soft"}
PLATFORM=${2:-"ios"}
METRICS_FILE="build-metrics.csv"

# Initialize metrics file if not exists
if [ ! -f "$METRICS_FILE" ]; then
  echo "timestamp,platform,build_type,duration_seconds,cache_hits,cache_misses" > "$METRICS_FILE"
fi

TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
START_TIME=$(date +%s)

echo "Starting $BUILD_TYPE build for $PLATFORM at $TIMESTAMP"

# Run build based on type
case $BUILD_TYPE in
  "clean")
    pnpm run generate
    ;;
  "soft")
    pnpm run generate:soft
    ;;
  "fast")
    pnpm run generate:fast
    ;;
  "run")
    if [ "$PLATFORM" = "ios" ]; then
      pnpm run ios
    else
      pnpm run android
    fi
    ;;
  *)
    echo "Unknown build type: $BUILD_TYPE"
    echo "Usage: $0 [clean|soft|fast|run] [ios|android]"
    exit 1
    ;;
esac

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

# Get ccache stats if available
if command -v ccache &> /dev/null; then
  CACHE_HITS=$(ccache -s 2>/dev/null | grep "Hits:" | head -1 | awk '{print $2}' || echo "N/A")
  CACHE_MISSES=$(ccache -s 2>/dev/null | grep "Misses:" | head -1 | awk '{print $2}' || echo "N/A")
else
  CACHE_HITS="N/A"
  CACHE_MISSES="N/A"
fi

echo "$TIMESTAMP,$PLATFORM,$BUILD_TYPE,$DURATION,$CACHE_HITS,$CACHE_MISSES" >> "$METRICS_FILE"
echo ""
echo "Build completed in ${DURATION}s"
echo "Results saved to $METRICS_FILE"
