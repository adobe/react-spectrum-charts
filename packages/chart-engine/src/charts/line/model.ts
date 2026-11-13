import type { Datum, ScaleType } from '../../core/types.js';
import { accessor, inferXType, parseDate, toNumber } from '../../util/data.js';
import type { LineChartOptions, LineStyle, PointShape, XValue } from './types.js';

export interface Point {
  /** Numeric position: epoch ms for time, the value for linear, index for band. */
  x: number;
  xRaw: XValue;
  y: number | null;
  estimated: boolean;
  datum: Datum;
  /** Index into the original data array. */
  index: number;
}

export interface SeriesModel {
  /** Unique id, including the facet. */
  id: string;
  key: string;
  colorKey: string;
  /** Value of the line-style field ('' when unused). */
  styleKey: string;
  facet: string;
  axis: 'y' | 'y2';
  lineStyle: LineStyle;
  shape: PointShape;
  area: boolean;
  points: Point[];
  /** True when every value is null; the series is reported missing and not drawn. */
  missing: boolean;
}

export interface Model {
  xType: ScaleType;
  series: SeriesModel[];
  /** Distinct series keys in first-appearance order. */
  seriesKeys: string[];
  colorKeys: string[];
  facets: string[];
  /** Distinct line-style field values. */
  styleKeys: string[];
  /** Category labels when xType is band. */
  categories: string[];
  missing: string[];
}

const DEFAULT_STYLES: LineStyle[] = ['solid', 'dashed', 'dotted'];
const SHAPES: PointShape[] = ['circle', 'square', 'triangle', 'diamond'];

export function buildModel(opts: LineChartOptions): Model {
  const data = opts.data ?? [];
  const getX = accessor(opts.x)!;
  const getY = accessor(opts.y)!;
  const getSeries = accessor(opts.series);
  const getColor = accessor(opts.color) ?? getSeries;
  const getStyle = accessor(opts.lineStyle);
  const getEst = accessor(opts.estimated);
  const getFacet = opts.layout === 'single' ? null : accessor(opts.facet);

  const rawX = data.map((d, i) => getX(d, i));
  const xType = opts.xAxis?.type ?? inferXType(rawX);

  const categories: string[] = [];
  const catIndex = new Map<string, number>();
  const seriesKeys: string[] = [];
  const colorKeys: string[] = [];
  const facets: string[] = [];
  const styleKeys: string[] = [];
  const byId = new Map<string, SeriesModel>();
  const y2 = new Set(opts.y2Axis?.series ?? []);

  data.forEach((d, i) => {
    const xr = rawX[i];
    let x: number;
    let xRaw: XValue;
    if (xType === 'time') {
      const date = parseDate(xr);
      if (!date) return;
      x = +date;
      xRaw = date;
    } else if (xType === 'linear') {
      const n = toNumber(xr);
      if (n == null) return;
      x = n;
      xRaw = n;
    } else {
      const s = xr instanceof Date ? xr.toISOString() : String(xr ?? '');
      let idx = catIndex.get(s);
      if (idx === undefined) {
        idx = categories.length;
        categories.push(s);
        catIndex.set(s, idx);
      }
      x = idx;
      xRaw = s;
    }
    const key = getSeries ? String(getSeries(d, i) ?? '') : typeof opts.y === 'string' ? opts.y : 'value';
    const colorKey = getColor ? String(getColor(d, i) ?? key) : key;
    const facet = getFacet ? String(getFacet(d, i) ?? '') : '';
    if (!seriesKeys.includes(key)) seriesKeys.push(key);
    if (!colorKeys.includes(colorKey)) colorKeys.push(colorKey);
    if (!facets.includes(facet)) facets.push(facet);
    const id = JSON.stringify([facet, key]);
    let s = byId.get(id);
    if (!s) {
      const styleValue = getStyle ? String(getStyle(d, i) ?? '') : '';
      if (getStyle && !styleKeys.includes(styleValue)) styleKeys.push(styleValue);
      const custom = opts.seriesStyles?.[key];
      const lineStyle: LineStyle =
        custom?.lineStyle ??
        (getStyle
          ? (opts.lineStyles?.[styleValue] ?? DEFAULT_STYLES[styleKeys.indexOf(styleValue) % DEFAULT_STYLES.length])
          : 'solid');
      s = {
        id,
        key,
        colorKey,
        styleKey: styleValue,
        facet,
        axis: y2.has(key) ? 'y2' : 'y',
        lineStyle,
        shape: custom?.shape ?? (opts.shapes ? SHAPES[seriesKeys.indexOf(key) % SHAPES.length] : 'circle'),
        area: custom?.area ?? opts.area ?? false,
        points: [],
        missing: false,
      };
      byId.set(id, s);
    }
    s.points.push({
      x,
      xRaw,
      y: toNumber(getY(d, i)),
      estimated: getEst ? Boolean(getEst(d, i)) : false,
      datum: d,
      index: i,
    });
  });

  const series = Array.from(byId.values());
  for (const s of series) {
    s.points.sort((a, b) => a.x - b.x);
    s.missing = s.points.every((p) => p.y == null);
  }
  const missing = seriesKeys.filter((k) => series.filter((s) => s.key === k).every((s) => s.missing));
  return { xType, series, seriesKeys, colorKeys, facets, styleKeys, categories, missing };
}
