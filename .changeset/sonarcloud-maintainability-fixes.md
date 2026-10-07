---
'@spectrum-charts/react-spectrum-charts-s2': minor
'@spectrum-charts/vega-spec-builder-s2': minor
'@spectrum-charts/utils': minor
---

Resolve a batch of SonarCloud maintainability findings in the S2 packages (S1 is in maintenance mode, so its existing findings are suppressed with line-level `NOSONAR` comments instead), with a couple of real bug fixes mixed in:

- Fixed worst-case quadratic regex backtracking in `toCamelCase` and a legend data-source name check, both reachable from a user-supplied chart/mark `name`.
- Fixed the `Chart` `locale` prop silently breaking data-navigator's accessible color names when passed as an object (e.g. `{ number: 'de-DE' }`) instead of a plain locale string.
- Fixed a few spots where a Vega scale/domain field could be stringified as `"[object Object]"` instead of being treated as unusable.
- Narrowed the `width` prop's type to `number | 'auto' | \`${number}%\`` (matching `height`) instead of an overly-permissive `string`.
- Unified S2 deep copies: a new `jsonClone` util (in `@spectrum-charts/utils`) for copies that must drop `undefined` keys so Vega applies its config defaults, and `structuredClone` for faithful copies.
- Internal refactors and modernization (reduced cognitive complexity in a few functions, consolidated duplicate logic) with no behavior change.
