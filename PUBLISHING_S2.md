# Publishing Spectrum 2 packages

Spectrum 2 uses the same Changesets workflow described in
[`PUBLISHING.md`](./PUBLISHING.md).

The following packages form a fixed release pair:

- `@spectrum-charts/react-spectrum-charts-s2`;
- `@spectrum-charts/vega-spec-builder-s2`.

A changeset for either package versions and publishes both packages together.
They remain independently versioned from the S1 package pair.

## Creating an S2 release

In a feature PR:

```bash
yarn changeset
```

Select the affected S2 package, choose the appropriate SemVer bump, and write
the consumer-facing release note. After the feature PR merges, the shared
release PR accumulates the change. Merging that release PR publishes the new
versions.

Do not edit package versions, create an `s2-v*` tag, or publish locally during
the normal release flow.

## Versioning and installation

S2 remains in the `0.x` range while its API is unstable. It now uses npm's
standard `latest` tag rather than a permanent `alpha` tag:

```bash
npm install @spectrum-charts/react-spectrum-charts-s2
```

Breaking changes before 1.0 should use a minor bump. Backward-compatible fixes
should use a patch bump.

## Shared dependencies

S2 consumes the independently versioned shared packages:

- `@spectrum-charts/constants`;
- `@spectrum-charts/locales`;
- `@spectrum-charts/schemas`;
- `@spectrum-charts/themes`;
- `@spectrum-charts/utils`.

Those packages are not automatically published with an S2 release. Add a
changeset for a shared package only when that package itself changes.
