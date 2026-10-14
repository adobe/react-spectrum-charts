# Pattern fills for S2 bars

- Status: Parked (waiting on [vega/vega#4290](https://github.com/vega/vega/pull/4290))
- Date: 2026-10-14
- Issues: prototype PR [#883](https://github.com/adobe/react-spectrum-charts/pull/883) (closed; everything
  needed to rebuild it is in this document)

## Question

Can S2 bars use texture fills (stripes, dots, hatching) as well as, or instead of, color? The
motivating case is a period comparison where the previous period is striped and the current period is
solid, in the same series color. Patterns also give a non-color encoding for accessibility and print.

## Findings

A prototype worked end to end for the **canvas renderer** without changing any Vega package. It was
verified by unit tests, `buildSpec()` + `vega.parse()`, and Storybook on canvas. SVG was designed but
not built.

### API

- `pattern` on `<Bar>` works like `color`. A field name dodges. A `[primary, secondary]` tuple dodges by
  primary and stacks by secondary. A `{ value }` gives a static fill. When both are set, `pattern` wins
  for the fill only; `color` still adds its own facet.
- `patterns` on `<Chart>` works like `colors`/`opacities` (`string[] | string[][]`). Each entry is a
  built-in pattern name or a color (S2 token or literal). In a row that has both a pattern and a color,
  the pattern is drawn in that color.
- Built-in palette (the default range): `diagonal-stripe` (45°), `diagonal-stripe-reverse` (135°),
  `horizontal-stripe`, `dots`, `crosshatch`, `grid`.

```tsx
// Solid current period and striped previous period, in each region's own color.
<Chart data={data} renderer="canvas" patterns={[
  ['categorical-100', 'diagonal-stripe'], // East: [Current, Previous]
  ['categorical-200', 'diagonal-stripe'], // West: [Current, Previous]
]}>
  <Bar type="dodged" dimension="browser" metric="downloads" pattern={['region', 'period']} />
  <Legend title="Region / Period" highlight />
</Chart>
```

### How it works

1. **Value type.** A pattern is a plain object, `{ pattern: id, foreground?: color }`, detected the same
   way as Vega's `isGradient` (`'pattern' in value`). An earlier string form (`url(#id)` / `id::color`)
   was replaced because parsing strings was fragile.
2. **Spec builder.** A new ordinal `PATTERN_SCALE` (`'pattern'`) works like the other facet scales,
   with a `patterns` 2D signal and a `secondaryPattern` scale for dual facets.
3. **Rendering.** After embed, `VegaChart` patches the `fillStyle` setter on the canvas 2D context.
   When it sees a pattern object, it draws (or reuses) a `CanvasPattern` tile. Strings and gradients
   pass through untouched. Vega never knows patterns exist.

### Things learned that any implementation needs

- **Vega rejects objects in a literal scale `range`**, as it does for gradients. A signal reference is
  allowed, so the pattern scale's range comes from a `patternRange` signal. Objects are accepted as
  literal encode `value`s.
- **Facet scale names are hardcoded in three places**, and the pattern scales must be added to all
  three:
  - `legendFacetUtils.ts` (`facetScaleNames`)
  - `legendUtils.ts` (`secondaryFacetMapping`)
  - `specUtils.ts` (`getFacetsFromScales`)

  Missing the last one leaves the pattern field out of `rscSeriesId`. Legend-to-bar hover then fails
  silently.
- **`pattern` must be passed everywhere `color`/`lineType`/`opacity` are passed** to
  `getFacetsFromOptions` and `isDodgedAndStacked`. Before this was done, a dodged bar with `pattern` as
  its only facet built an empty dodge-group formula, which `vega.parse` rejects.
- **The default renderer is SVG.** Stories without `renderer="canvas"` silently showed no patterns.
  Checking the built spec can't catch this, because the renderer isn't part of the spec. Tests need to
  render on canvas.
- **High-DPI:** read the scale from `canvas.width / canvas.clientWidth`, not `window.devicePixelRatio`.
  Draw the tile at device pixels, then scale the pattern back down with `setTransform`, combined with
  any rotation.
- **Opacity is unaffected** for the fill itself: canvas `globalAlpha` and `fillOpacity` are applied
  separately from `fillStyle`. Legend highlight and hover dimming over patterns were **not**
  separately checked.
- **Period consistency is awkward.** Keeping the same treatment per period needed one `patterns` row per
  primary value. That's unwieldy when the number of categories isn't known in advance; consider a
  simpler API (e.g. a single row applied to every primary value).

### Upstream: vega/vega#4290

[vega/vega#4290](https://github.com/vega/vega/pull/4290) ("feat: Pattern Fills (#1372)") adds a native
`Pattern` value type alongside `Gradient`. It was still open and unmerged at its last update
(2026-09-03). It provides:

- A `vega-pattern` package with a registry (`vega.pattern(name, def)`).
- Pattern definitions by `name`, `shape` (SVG path), `rule` (angled lines) or `url` (image), with
  `foreground`, `background`, `strokeWidth`, `origin`, `scale` and `shapeRendering`.
- Pattern objects accepted in `fill`/`stroke` encodes and directly in scale ranges, mixed with colors.
- A `pattern()` expression function, e.g.
  `pattern(scale('tex', datum.type), { foreground: scale('color', datum.group) })`.
- `patterns` and `monochrome` schemes.
- Native legend swatches.
- Matching canvas and SVG output.

It covers everything the prototype's rendering layer did, plus SVG. Dodge and stack composition stays
in our spec builder either way. Our `{ pattern, foreground }` value deliberately uses the same
`foreground` name.

## Options

1. **Wait for #4290 and build on it.** This gives the native type, SVG, legend swatches and no canvas
   patching. It depends on the upstream timeline and a Vega upgrade.
2. **Ship the prototype approach now.** It's canvas only until the SVG half is built. Patching
   `fillStyle` is fragile across Vega versions and must be removed after #4290.
3. **Contribute to #4290.** Give generic review feedback from the prototype: DPI-correct tile sizing,
   color-matched pattern/solid pairs, and dual-facet scale composition. Its tiles are drawn once into an
   image rather than rotated with `setTransform`; that workaround is only needed for `node-canvas`, since
   browsers support `setTransform`.

## Recommendation

Option 1, optionally with 3. When #4290 merges, write a bar spec for the API above:

- Keep the whole **spec-builder layer** from the implementation reference below.
- Change the value type to Vega's native `Pattern`. If #4290 lets Vega accept pattern objects in a
  literal `range`, the `patternRange` signal workaround can go.
- Drop the **rendering layer** (canvas patch, tile registry, SVG plan).
- Before marking the spec `implemented`, check legend highlight and hover dimming over patterns.

If patterns are needed before then, build Option 2 from the reference, including the SVG half.

---

## Implementation reference (prototype)

All of this is S2 only. S1 has no pattern support.

### Spec-builder layer (keep regardless of renderer approach)

**`packages/constants/constants.ts`**

```ts
export const PATTERN_SCALE = 'pattern';
```

**`packages/vega-spec-builder-s2/src/types/specUtil.types.ts`**

```ts
/** A built-in pattern name (e.g. 'diagonal-stripe') or a literal color value, used as a static fill. */
export type PatternFacet = FacetRef<string>;
// add 'pattern' to FacetType and 'secondaryPattern' to SecondaryFacetType
```

**`types/chartSpec.types.ts`**: add `patterns?: Patterns` to `ChartOptions`, with:

```ts
/** Each entry is a built-in pattern name (e.g. 'diagonal-stripe') or a literal color value. */
export type Patterns = string[] | string[][];
```

**`types/marks/barSpec.types.ts`**: add `pattern?: PatternFacet | DualFacet` to `BarOptions`. It has no
default.

**`packages/utils/src/patternFillId.ts`** (new). This lives in `utils` so both S2 packages can use it.
Export it from `packages/utils/src/index.ts`.

```ts
export const DEFAULT_PATTERN_FILL_IDS = [
  'diagonal-stripe', 'diagonal-stripe-reverse', 'horizontal-stripe', 'dots', 'crosshatch', 'grid',
] as const;
export type DefaultPatternFillId = (typeof DEFAULT_PATTERN_FILL_IDS)[number];

export interface PatternFillValue {
  pattern: string;
  foreground?: string;
}

export const isPatternFillValue = (value: unknown): value is PatternFillValue =>
  typeof value === 'object' && value !== null && 'pattern' in value;

export const getPatternFillId = (value: unknown): string | undefined =>
  isPatternFillValue(value) ? value.pattern : undefined;

const isBuiltInPatternFillId = (entry: string): boolean =>
  (DEFAULT_PATTERN_FILL_IDS as readonly string[]).includes(entry);

/** Built-in name -> PatternFillValue; anything else passes through as a color. */
export const resolvePatternFillValue = (entry: string): string | PatternFillValue =>
  isBuiltInPatternFillId(entry) ? { pattern: entry } : entry;

/** Recolors built-in names in a group with the first literal color in the same group. */
export const resolvePatternFillGroup = (group: string[]): (string | PatternFillValue)[] => {
  const siblingColor = group.find((entry) => !isBuiltInPatternFillId(entry));
  return group.map((entry) => {
    if (!isBuiltInPatternFillId(entry)) return entry;
    return siblingColor ? { pattern: entry, foreground: siblingColor } : { pattern: entry };
  });
};
```

**`vega-spec-builder-s2/src/chartSpecBuilder.ts`**

- Destructure `patterns` in `buildSpec` and pass it through to `getDefaultSignals`.
- Add `getPatternScale()` to `getDefaultScales`.
- Add two signals to `getDefaultSignals`, next to `colors`/`lineTypes`/`opacities`:

```ts
getGenericValueSignal('patterns', getTwoDimensionalPatterns(patterns, colorScheme)),
getGenericValueSignal(PATTERN_RANGE_SIGNAL, getPatternRange(patterns, colorScheme)),
```

```ts
// S2 tokens resolve like getColors; built-in names are left for resolvePatternFillGroup.
const resolveS2PatternGroup = (group: string[], colorScheme: ColorScheme) =>
  resolvePatternFillGroup(
    group.map((entry) =>
      (DEFAULT_PATTERN_FILL_IDS as readonly string[]).includes(entry) ? entry : getS2ColorValue(entry, colorScheme)
    )
  );

// Vega's scale-range parser rejects literal objects, so the range comes from a signal.
const PATTERN_RANGE_SIGNAL = 'patternRange';

export const isPatternArray = (patterns: Patterns): patterns is string[] =>
  !patterns.some((pattern) => Array.isArray(pattern));

export const getPatternRange = (
  patterns: Patterns = [...DEFAULT_PATTERN_FILL_IDS],
  colorScheme: ColorScheme = DEFAULT_COLOR_SCHEME
) =>
  isPatternArray(patterns)
    ? resolveS2PatternGroup(patterns, colorScheme)
    : patterns.map((group) => resolveS2PatternGroup(group, colorScheme)[0]);

export const getPatternScale = (): OrdinalScale => ({
  name: PATTERN_SCALE,
  type: 'ordinal',
  range: { signal: PATTERN_RANGE_SIGNAL },
  domain: { data: TABLE, fields: [] },
});

export const getTwoDimensionalPatterns = (
  patterns: Patterns = [...DEFAULT_PATTERN_FILL_IDS],
  colorScheme: ColorScheme = DEFAULT_COLOR_SCHEME
) =>
  isPatternArray(patterns)
    ? resolveS2PatternGroup(patterns, colorScheme).map((pattern) => [pattern])
    : patterns.map((group) => resolveS2PatternGroup(group, colorScheme));
```

**`marks/markUtils.ts`**: the fill encoding, using the same lookup as the color dual-facet:

```ts
export const getPatternProductionRule = (pattern: PatternFacet | DualFacet): ColorValueRef => {
  if (Array.isArray(pattern)) {
    return {
      signal: `scale('patterns', datum.${pattern[0]})[indexof(domain('secondaryPattern'), datum.${pattern[1]})% length(scale('patterns', datum.${pattern[0]}))]`,
    };
  }
  if (typeof pattern === 'string') return { scale: PATTERN_SCALE, field: pattern };
  // Vega accepts an object literal as an encode value; the cast is only for ColorValueRef typing.
  return { value: resolvePatternFillValue(pattern.value) } as unknown as ColorValueRef;
};
```

**`specUtils.ts`**

- `getFacetsFromOptions` takes `pattern` and includes it in both the primary list
  (`[color, lineType, opacity, pattern, size]`) and the secondary list
  (`[color, lineType, opacity, pattern]`).
- `getFacetsFromScales` adds `PATTERN_SCALE` and `'secondaryPattern'`. This is required for
  `rscSeriesId`.

**`bar/barSpecBuilder.ts`**

- `addBar`: destructure `pattern` and add it to the assembled options. Also pass it to
  `getFacetsFromOptions` in the `hasSeriesFacet` diverging check.
- `getStackFields` and `getDodgeGroupTransform`: pass `pattern` to `getFacetsFromOptions`.
- `addScales`: `addFieldToFacetScaleDomain(scales, PATTERN_SCALE, pattern)`.
- `addSecondaryScales`: add
  `{ value: pattern, scaleName: 'patterns', secondaryScaleName: 'secondaryPattern' }` to the list.

**`bar/barUtils.ts`**

```ts
export const isDodgedAndStacked = ({ color, lineType, opacity, pattern }: BarSpecOptions): boolean =>
  [color, lineType, opacity, pattern].some((facet) => Array.isArray(facet) && facet.length === 2);

// in getBarEnterEncodings
fill: options.pattern ? getPatternProductionRule(options.pattern) : getBarFillEncoding(options),
```

**`legend/legendFacetUtils.ts`**: add `PATTERN_SCALE` and `'secondaryPattern'` to `facetScaleNames`.

**`legend/legendUtils.ts`**

```ts
// getSymbolEncodings: pattern takes precedence over color for the swatch fill
const patternRef = getSymbolFacetEncoding<string>({ facets, facetType: PATTERN_SCALE, name });
const colorRef =
  patternRef ??
  getSymbolFacetEncoding<Color>({ facets, facetType: COLOR_SCALE, customValue: color, name }) ?? {
    value: spectrum2Colors[colorScheme]['categorical-100'],
  };

// getSymbolFacetEncoding's secondaryFacetMapping
pattern: { scale: 'secondaryPattern', signal: 'patterns' },
```

**React plumbing (`react-spectrum-charts-s2`)**

- `RscChart.tsx`: destructure `patterns` and pass it to `useSpec`.
- `hooks/useSpec.tsx`: accept `patterns`, pass it to `rscPropsToSpecBuilderOptions`, and add it to the
  dependency array.
- `components/Bar/Bar.tsx`: destructure `pattern` (no default).
- `patterns` and `pattern` reach `ChartProps`/`BarProps` through the existing `Omit<…Options>` types.

### Rendering layer: canvas (replace with native #4290 when available)

**`react-spectrum-charts-s2/src/utils/patternFillUtils.ts`**: the tile registry.

```ts
export interface PatternTileSource {
  id: string;
  tileSize: { width: number; height: number };
  draw: (ctx: CanvasRenderingContext2D, tileSize: { width: number; height: number }) => void;
  /** Same shape recolored to a sibling color; used when a PatternFillValue has a foreground. */
  drawWithColor?: (ctx: CanvasRenderingContext2D, tileSize: { width: number; height: number }, color: string) => void;
  /** Degrees, applied as a pattern transform rather than baked into the tile. */
  rotation?: number;
}

export const specHasPatternFill = (spec: Spec): boolean => JSON.stringify(spec).includes('"pattern":');

const registry = new Map<string, PatternTileSource>();
export const registerPatternFill = (source: PatternTileSource): void => { registry.set(source.id, source); };
export const getPatternFillSource = (id: string) => registry.get(id);
export const clearPatternFillRegistry = (): void => registry.clear(); // test isolation
```

**`utils/defaultPatternFills.ts`**: the built-in tiles. They're registered when the module loads, via
a side-effect `import './defaultPatternFills'` at the top of `utils/index.ts`.

```ts
const TILE_SIZE = { width: 10, height: 10 };
const BASE_COLOR = '#ffffff';
const TEXTURE_COLOR = '#404040';
type ShapeDraw = (ctx: CanvasRenderingContext2D, size: TileSize, inkColor: string, baseColor: string | null) => void;

// Each shape fills baseColor (if any) first, then draws in inkColor:
// stripe:     fillRect(0, 0, w, h / 2)
// dots:       arc(w / 2, h / 2, min(w, h) / 4) filled
// crosshatch: 1px lines through the vertical and horizontal centers
// grid:       1px strokeRect(0, 0, w, h)

const toTileSource = (id: string, shape: ShapeDraw, rotation?: number): PatternTileSource => ({
  id,
  tileSize: TILE_SIZE,
  rotation,
  draw: (ctx, size) => shape(ctx, size, TEXTURE_COLOR, BASE_COLOR),
  // Transparent base so the recolored ink doesn't add its own background.
  drawWithColor: (ctx, size, color) => shape(ctx, size, color, null),
});

registerPatternFill(toTileSource('diagonal-stripe', drawStripe, 45));
registerPatternFill(toTileSource('diagonal-stripe-reverse', drawStripe, 135));
registerPatternFill(toTileSource('horizontal-stripe', drawStripe));
registerPatternFill(toTileSource('dots', drawDots));
registerPatternFill(toTileSource('crosshatch', drawCrosshatch));
registerPatternFill(toTileSource('grid', drawGrid));
```

**`utils/canvasPatternFillUtils.ts`**: patches the canvas `fillStyle` setter.

```ts
type FillStyleValue = string | CanvasGradient | CanvasPattern;
const patchedContexts = new WeakSet<CanvasRenderingContext2D>();
const getPatternCacheKey = (id: string, color?: string) => (color ? `${id}::${color}` : id);

// Walk the prototype chain to find the browser's built-in fillStyle getter/setter.
const getNativeFillStyleAccessor = (ctx: CanvasRenderingContext2D) => {
  let proto: unknown = Object.getPrototypeOf(ctx);
  while (proto) {
    const d = Object.getOwnPropertyDescriptor(proto, 'fillStyle');
    if (d?.get && d.set) {
      return { get: (c: CanvasRenderingContext2D) => d.get!.call(c), set: (c: CanvasRenderingContext2D, v: FillStyleValue) => d.set!.call(c, v) };
    }
    proto = Object.getPrototypeOf(proto);
  }
  throw new Error('could not locate the native fillStyle accessor');
};

const getCanvasPixelScale = (canvas: HTMLCanvasElement) =>
  canvas.clientWidth > 0 ? canvas.width / canvas.clientWidth : 1;

const buildPatternTransform = (degrees: number, scale: number): DOMMatrix2DInit => {
  const r = (degrees * Math.PI) / 180;
  const s = 1 / scale;
  return { a: Math.cos(r) * s, b: Math.sin(r) * s, c: -Math.sin(r) * s, d: Math.cos(r) * s, e: 0, f: 0 };
};

const buildCanvasPattern = (ctx: CanvasRenderingContext2D, source: PatternTileSource) => {
  const { width, height } = source.tileSize;
  const scale = getCanvasPixelScale(ctx.canvas);
  const tile = document.createElement('canvas');
  tile.width = width * scale;
  tile.height = height * scale;
  const tileCtx = tile.getContext('2d');
  if (!tileCtx) return undefined;
  tileCtx.scale(scale, scale);
  source.draw(tileCtx, source.tileSize);
  const pattern = ctx.createPattern(tile, 'repeat');
  if (pattern && (source.rotation || scale !== 1)) {
    pattern.setTransform(buildPatternTransform(source.rotation ?? 0, scale));
  }
  return pattern ?? undefined;
};

const getColorMatchedPatternSource = (id: string, color: string): PatternTileSource | undefined => {
  const base = getPatternFillSource(id);
  if (!base?.drawWithColor) return undefined;
  return { id: getPatternCacheKey(id, color), tileSize: base.tileSize, rotation: base.rotation,
    draw: (ctx, size) => base.drawWithColor!(ctx, size, color) };
};

const resolveFillStyleValue = (ctx, value, cache: Map<string, CanvasPattern>): FillStyleValue => {
  const id = getPatternFillId(value);
  if (id === undefined) return value;
  const foreground = isPatternFillValue(value) ? value.foreground : undefined;
  const key = getPatternCacheKey(id, foreground);
  const cached = cache.get(key);
  if (cached) return cached;
  const source = foreground ? getColorMatchedPatternSource(id, foreground) : getPatternFillSource(id);
  const pattern = source && buildCanvasPattern(ctx, source);
  if (!pattern) return value; // unknown id: fall back to native behavior
  cache.set(key, pattern);
  return pattern;
};

export const patchCanvasContextForPatternFill = (ctx: CanvasRenderingContext2D): void => {
  if (patchedContexts.has(ctx)) return;
  patchedContexts.add(ctx);
  const cache = new Map<string, CanvasPattern>();
  const native = getNativeFillStyleAccessor(ctx);
  Object.defineProperty(ctx, 'fillStyle', {
    configurable: true,
    get: () => native.get(ctx),
    set: (value) => native.set(ctx, resolveFillStyleValue(ctx, value, cache)),
  });
};
```

**`VegaChart.tsx`**: in the `embed(...).then(({ view }) => …)` callback, after `onNewView(view)` and
before `view.resize()`:

```ts
if (renderer === 'canvas' && specHasPatternFill(specCopy)) {
  const ctx = containerRef.current?.querySelector('canvas')?.getContext('2d');
  if (ctx) patchCanvasContextForPatternFill(ctx);
}
```

Open question: if Vega ever replaces the `<canvas>` element without re-embedding, the new context isn't
patched. Re-embedding is handled, because each patched context gets its own cache.

### Rendering layer: SVG (designed, not built)

- After render, find fills that hold pattern objects. Vega's SVG renderer writes them as attributes,
  so they're probably serialized as `[object Object]`; the hook point needs investigating.
- Add one `<pattern>` per id and foreground to the chart's own `<defs>`, using `patternTransform` for
  rotation, and point the fill at `url(#…)`.
- Tiles must look the same as the canvas version at any pixel density.
- The cache belongs to the SVG root and is rebuilt when the root is recreated.
- This is the weakest part of the RSC-only approach, and the main reason to wait for #4290, which does
  SVG natively.

### Tests the prototype had (reuse as a checklist)

- **`patternFillId`**
  - Type guard: object recognized; strings and `undefined` rejected.
  - `resolvePatternFillValue`: a built-in name becomes an object; a color passes through.
  - `resolvePatternFillGroup`: recolors with a sibling color, falls back to no foreground, leaves colors
    alone.
  - `DEFAULT_PATTERN_FILL_IDS` is non-empty.
- **`chartSpecBuilder`**
  - `getTwoDimensionalPatterns`: default palette, 1D group, 2D rows.
  - `getPatternScale`: the range is a signal.
  - `getPatternRange`: default, recolored names, S2 tokens resolve, 2D uses the first entry of each row.
- **`markUtils.getPatternProductionRule`**: field → scale ref; static name → object; static color →
  pass-through; tuple → the 2D lookup signal.
- **`specUtils`**
  - A plain pattern field is a primary facet; with another facet, it's still a primary facet; a tuple
    gives a secondary facet.
  - `getFacetsFromScales` includes `pattern` and `secondaryPattern`.
- **`barSpecBuilder` / `barUtils`**
  - The pattern scale domain is added.
  - Pattern-only dodge works.
  - `pattern` plus `color` dodges by both.
  - A tuple stacks within its dodge group.
  - `isDodgedAndStacked` cases.
  - Fill uses the pattern rule when set and the color rule when not.
- **Legend**: the pattern scale is recognized as an ordinal facet; pattern beats color for the swatch.
- **`canvasPatternFillUtils`**
  - Plain colors are untouched.
  - A pattern object becomes a `CanvasPattern`.
  - Each id/foreground pair is cached; different pairs get different patterns.
  - Rotation sets a transform; no rotation means no transform.
  - The tile is drawn at device pixels, and high-DPI is corrected without rotation.
  - A foreground uses `drawWithColor`; a source without `drawWithColor` and an unknown id fall back to
    native behavior.
  - Patching twice is a no-op; separate contexts get separate caches.
- **`VegaChart`**: patches on canvas with patterns; not on SVG; not without patterns.
- **Stories** (`React Spectrum Charts 2/Bar/Features/Pattern Fill`, both `renderer: 'canvas'`)
  - `PreviousCurrentComparison`: data split into region × period. Uses `pattern: ['region', 'period']`,
    `type: 'dodged'`, and the `patterns` override from the API example above. List Current before
    Previous in the data so it stacks at the bottom.
  - `DefaultPalette`: `pattern: 'browser'` with no override.
