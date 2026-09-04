# Architecture: Encoding Conventions, Callback Props, Alpha vs Stable

Read this when: your change touches a Vega `encode` block on any mark, adds/modifies a
callback prop (`onClick`, `onMouseOver`, etc.), or adds a new mark/component and needs to
decide alpha vs stable placement. Assumes you've already read `architecture-core.md`.

---

## Encoding Conventions

- **Background-tracking colors**: use `{ signal: BACKGROUND_COLOR }`, not a hardcoded value. A static value is baked into the spec and won't react to runtime `backgroundColor` prop changes.
- **Opacity**: use `getMarkOpacity()`, not a hardcoded value.
- **Decorative/overlay marks**: must have `interactive: false` — without it they intercept mouse events meant for data marks beneath them.
- **Hiding text marks**: use `fontSize: 0`, not `fillOpacity: 0`. Opacity still runs layout calculations (like `limit` constraints), which can produce NaN.
- **Vega encode assertions in tests**: use `toHaveProperty('key', value)`, never direct property access — Vega uses `ProductionRule<T>` union types that TypeScript rejects.

---

## Callback Props and Boolean Flags

Callback props (`onClick`, `onMouseOver`, `onMouseOut`, `onContextMenu`) never enter the Vega spec. The adapter converts them to boolean flags that gate voronoi/hover mark creation. The mapping is mark-specific:

For Line:
- `hasOnClick: Boolean(onClick)` — gates click behavior
- `hasMouseInteraction: Boolean(onMouseOut || onMouseOver)` — gates hover behavior

Always read the existing adapter for the mark before writing new flag logic — do not assume one flag covers all callbacks.

---

## Alpha vs Stable Components

When a mark is not ready for the public API, place it in `alpha/`:
- Component: `react-spectrum-charts/src/alpha/components/<Name>/`
- Import in `childrenAdapter.ts` from `'../alpha/components/<Name>'`
- Spec builder, types, and `chartSpecBuilder.ts` registration are identical to stable

To graduate from alpha to stable: move the component to `components/`, update the import in `childrenAdapter.ts`. No spec builder changes needed.
