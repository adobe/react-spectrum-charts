# Publishing S2 Packages (Alpha)

The S2 packages (`@spectrum-charts/react-spectrum-charts-s2` and `@spectrum-charts/vega-spec-builder-s2`) are independently versioned from the main library and follow **alpha (0.x.x)** semantic versioning.

## Version Strategy

| Package | Version Range | NPM Tag | Stability |
|---------|---------------|---------|-----------|
| Main packages (`@adobe/react-spectrum-charts`, `@spectrum-charts/*`) | 1.x.x | latest/beta/rc | Stable |
| S2 packages (`@spectrum-charts/*-s2`) | **0.x.x** | **alpha** | Experimental |

## Publishing Workflow

### Automated Publishing (Recommended)

#### 1. Update Version Locally
```bash
# Update S2 packages to new version (e.g., 0.2.0)
yarn version:s2 0.2.0
```

#### 2. Commit Changes
```bash
git add packages/react-spectrum-charts-s2/package.json packages/vega-spec-builder-s2/package.json
git commit -m "[S2] Bump version to 0.2.0"
git push origin main
```

#### 3. Create and Push Tag
```bash
# Create S2-specific tag
git tag s2-v0.2.0
git push origin s2-v0.2.0
```

#### 4. GitHub Actions Takes Over
The workflow automatically:
- ✅ Validates the version format (must be 0.x.x)
- ✅ Updates S2 package versions
- ✅ Builds dependencies and S2 packages
- ✅ Publishes to npm with `alpha` tag
- ✅ Creates a PR with version changes

### Manual Publishing (Fallback)

```bash
# 1. Update versions
yarn version:s2 0.2.0

# 2. Build packages
yarn build:s2

# 3. Publish with alpha tag
yarn publish:s2 --tag alpha
```

## Version Format

S2 versions **must** follow alpha format:
- ✅ Valid: `0.1.0`, `0.2.0`, `0.1.1-alpha.1`
- ❌ Invalid: `1.0.0`, `0.1`, `v0.1.0`

## Installation

Users install S2 packages with the `alpha` tag:

```bash
# Install specific version
npm install @spectrum-charts/react-spectrum-charts-s2@0.1.0

# Install latest alpha
npm install @spectrum-charts/react-spectrum-charts-s2@alpha

# Or with yarn
yarn add @spectrum-charts/react-spectrum-charts-s2@alpha
```

## Tag Naming Convention

- **Main packages**: `v1.27.0`
- **S2 packages**: `s2-v0.1.0`, `s2-v0.2.0`, `s2-v0.1.1-alpha.1`

The `s2-v` prefix ensures S2 releases don't trigger the main package workflow.

## Breaking Changes

Since S2 is in alpha (0.x.x):
- ⚠️ Breaking changes are expected between minor versions
- 📝 Document all breaking changes in the PR and release notes
- 🔄 Consider migration guides for significant changes

## Dependencies

S2 packages depend on stable 1.x.x versions of core packages:
- `@spectrum-charts/constants@1.27.0`
- `@spectrum-charts/themes@1.27.0`
- `@spectrum-charts/vega-spec-builder@1.27.0`
- etc.

These dependencies are **not** automatically updated when publishing S2 packages. Update them manually when needed.

## Troubleshooting

### Version Update Failed
```bash
# Make sure you're using 0.x.x format
yarn version:s2 0.2.0

# Not 1.x.x or v0.x.x
```

### GitHub Actions Failed
1. Check the workflow logs in GitHub Actions
2. Verify the tag format is correct (`s2-v0.x.x`)
3. Ensure npm token is valid in repository secrets

### Manual Publish Required
```bash
# If automated publishing fails, you can publish manually:

# 1. Update versions
yarn version:s2 0.2.0

# 2. Build
yarn build:s2

# 3. Publish (requires npm login)
cd packages/vega-spec-builder-s2
npm publish --tag alpha

cd ../react-spectrum-charts-s2
npm publish --tag alpha
```

## Example Release Flow

```bash
# Starting at version 0.1.0, releasing 0.2.0

# 1. Update version
yarn version:s2 0.2.0
# Output: ✅ S2 version update completed successfully.

# 2. Commit
git add .
git commit -m "[S2] Bump version to 0.2.0"
git push origin main

# 3. Tag and push
git tag s2-v0.2.0
git push origin s2-v0.2.0

# 4. Wait for GitHub Actions
# - Builds and publishes automatically
# - Creates PR with changes

# 5. Merge the PR
# Done! ✅
```

## Questions?

For questions about S2 publishing, please:
1. Check this document first
2. Review the GitHub Actions workflow logs
3. Open an issue with the `s2` label

