#!/bin/bash

# Unlink all packages
echo "Unlinking packages..."
cd packages/constants && yarn unlink
cd ../themes && yarn unlink
cd ../utils && yarn unlink
cd ../locales && yarn unlink
cd ../vega-spec-builder && yarn unlink
cd ../react-spectrum-charts && yarn unlink

echo ""
echo "✓ All packages unlinked!"

