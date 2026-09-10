# Architecture: S2 Parity

Read this when: your change needs to apply to both s1 and s2, or you're working directly in
an s2 package. Assumes you've already read `architecture-core.md`.

---

`vega-spec-builder-s2` mirrors `vega-spec-builder` structurally. When changing an s1 file, always check the corresponding s2 file. S2 differences:
- Uses `getS2ColorValue` instead of `getColorValue`
- No Venn support
- No `s2` boolean prop (always S2 context)
- Some marks have intentional behavioral differences (e.g. `staticPoint` in S2 only supports `true`, not `'hollow'`/`'solid'`)

When a bug fix applies to both, fix both. Don't port s1-specific behavior blindly — verify the bug exists in s2 before applying the fix.
