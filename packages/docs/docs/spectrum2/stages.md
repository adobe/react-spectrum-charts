---
sidebar_position: 2
---

# Component Stages

Spectrum 2 components move through four stages on the way to stable. The stage tells you how
much a component's API and visuals may still change.

| Stage | What it means |
|---|---|
| **Alpha** | The Spectrum 2 design is finalized and the core feature set is implemented. Changes that aren't backwards compatible can still happen. Animation and accessibility support are in progress. |
| **Beta** | The planned feature set is complete. No more breaking API changes. Animation and accessibility are complete. Work focuses on feedback and fixes. |
| **RC** (release candidate) | Feature freeze. The component is validated in consumer environments before stable. Only blocking issues are fixed. |
| **Stable** | Production ready. Follows semver. |

Components that aren't stable are exempt from semver, even after the package reaches 1.0.

## Release candidate period

RC confirms a component works in real consumer environments; it isn't for adding features.
Feature requests that come in during RC are scheduled after the stable release.

- The first component to reach stable, which takes the package to 1.0, has a **3-week** RC
  period. Later components have **1–2 weeks**.
- The period restarts when a blocking issue is found and fixed. Blocking issues are incorrect
  rendering, crashes, accessibility failures, and API defects: API problems that couldn't be
  fixed after stable without a breaking change.
- Other bugs become known issues, fixed in patch releases after stable.

## Lab

Lab components are usable but have no finalized Spectrum 2 design and no commitment to
graduate. They can change or be removed in any release. They're imported from a separate
subpath so their status is visible in your code. A lab component enters alpha once it has a
design and the team commits to it.

Lab components are currently imported from `@spectrum-charts/react-spectrum-charts-s2/pre-alpha`
(see [Pre-Alpha Components](./pre-alpha.md)). That subpath will be renamed `lab`.

## How to tell a component's stage

- **In your editor:** the component's documentation comment has an `@alpha` or `@beta` tag.
  Release candidates use `@beta` and say "Release candidate." Stable components have no tag.
- **In these docs and in Storybook:** the component shows a stage badge.
- **In the changelog:** stage changes are announced in the release notes.

Planned work for a component's next stage is tracked in a GitHub milestone named
`<Component> <stage>` (e.g. `Line beta`).
