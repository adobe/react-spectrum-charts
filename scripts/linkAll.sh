#!/bin/bash

# Unlink first to avoid conflicts
echo "Unlinking any existing links..."
cd packages/constants && yarn unlink 2>/dev/null || true
cd ../themes && yarn unlink 2>/dev/null || true
cd ../utils && yarn unlink 2>/dev/null || true
cd ../locales && yarn unlink 2>/dev/null || true
cd ../vega-spec-builder && yarn unlink 2>/dev/null || true
cd ../react-spectrum-charts && yarn unlink 2>/dev/null || true
cd ../mcp && yarn unlink 2>/dev/null || true
cd ../..

# Build all packages
echo "Building all packages..."
yarn build:parallel

# Link all packages
echo "Linking packages..."
cd packages/constants && yarn link
cd ../themes && yarn link
cd ../utils && yarn link
cd ../locales && yarn link
cd ../vega-spec-builder && yarn link
cd ../react-spectrum-charts && yarn link
cd ../mcp && yarn link

echo ""
echo "✓ All packages linked!"
echo ""
echo "In your target project, run:"
echo "yarn link @adobe/react-spectrum-charts"

