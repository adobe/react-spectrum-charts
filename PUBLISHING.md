# Publishing packages

This repository uses [Changesets](https://github.com/changesets/changesets) to
prepare and publish releases.

## Feature pull requests

After making a publishable change, run:

```bash
yarn changeset
```

Select the affected package, choose `patch`, `minor`, or `major`, and write the
release-note summary. Commit the generated `.changeset/*.md` file with the
change.

Changes that do not require a package release, such as documentation,
tests, CI configuration, or internal refactoring, must include an explicit
empty changeset:

```bash
yarn changeset:empty
```

PR CI runs `yarn changeset:status` and fails when neither kind of changeset is
present.

## Release pull request

After feature PRs merge into `main`, the release workflow creates or updates
one `chore: version packages` PR. It accumulates every unconsumed changeset and:

- updates affected `package.json` versions;
- updates internal dependency ranges when required;
- writes package changelogs;
- removes consumed changeset files.

Leaving the release PR open batches additional merged changes into the same
release. Merge it when the batch is ready.

## Publishing

Merging the release PR triggers the same workflow again. Because no pending
changesets remain, it:

1. finds package versions that do not yet exist on npm;
2. builds only those packages and their local workspace dependencies;
3. publishes the new package versions;
4. creates package-specific git tags;
5. creates corresponding GitHub Releases.

For example, an S2-only release builds the shared packages required by S2 and
the two S2 packages. It does not build the S1 React or Vega packages.

There is no manual version edit or release tag to create. Published versions
use npm's standard `latest` tag unless a future prerelease mode is explicitly
started with Changesets.

The workflow uses the `ADOBE_BOT_NPM_TOKEN` repository secret.

## Version relationships

These product pairs use fixed versions and release together:

- `@adobe/react-spectrum-charts` and `@spectrum-charts/vega-spec-builder`;
- `@spectrum-charts/react-spectrum-charts-s2` and
  `@spectrum-charts/vega-spec-builder-s2`.

Shared packages release independently:

- `@spectrum-charts/constants`;
- `@spectrum-charts/locales`;
- `@spectrum-charts/themes`;
- `@spectrum-charts/utils`.

`@spectrum-charts/mcp` and `@spectrum-charts/schemas` also release
independently. A package is not versioned or published unless a changeset or a
required internal dependency update includes it.

## Manual recovery

The normal workflow should be used for all releases. If publishing must be
retried after the version PR has merged:

```bash
yarn install --frozen-lockfile
yarn release
```

`changeset publish` checks npm and skips versions that are already published.
