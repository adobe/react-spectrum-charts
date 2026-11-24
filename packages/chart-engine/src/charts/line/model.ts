import type { Datum, ScaleType } from '../../core/types.js';
import { accessor, inferXType, parseDate, toNumber } from '../../util/data.js';
import type { LineChartOptions, LineStyle, PointShape, SeriesStyle, XValue } from './types.js';

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
/** Series name used when there is no series field and `y` is not a field name. */
const DEFAULT_SERIES_KEY = 'value';

type FieldGetter = (datum: Datum, index: number) => unknown;

/** Distinct values of each encoding field, in first-appearance order. */
interface KeyRegistry {
  categories: string[];
  categoryIndex: Map<string, number>;
  seriesKeys: string[];
  colorKeys: string[];
  facets: string[];
  styleKeys: string[];
}

function addUnique(list: string[], value: string): void {
  if (!list.includes(value)) list.push(value);
}

/** Numeric x position and the parsed raw value, or null when the value can't be placed. */
function resolveX(raw: unknown, xType: ScaleType, keys: KeyRegistry): { x: number; xRaw: XValue } | null {
  if (xType === 'time') {
    const date = parseDate(raw);
    if (!date) return null;
    return { x: +date, xRaw: date };
  }
  if (xType === 'linear') {
    const value = toNumber(raw);
    if (value == null) return null;
    return { x: value, xRaw: value };
  }
  const category = raw instanceof Date ? raw.toISOString() : String(raw ?? '');
  let index = keys.categoryIndex.get(category);
  if (index === undefined) {
    index = keys.categories.length;
    keys.categories.push(category);
    keys.categoryIndex.set(category, index);
  }
  return { x: index, xRaw: category };
}

function seriesKeyFor(opts: LineChartOptions, getSeries: FieldGetter | null, datum: Datum, index: number): string {
  if (getSeries) return String(getSeries(datum, index) ?? '');
  return typeof opts.y === 'string' ? opts.y : DEFAULT_SERIES_KEY;
}

/** Line style from the series style, the style field's mapping, or the default cycle. */
function lineStyleFor(opts: LineChartOptions, custom: SeriesStyle | undefined, hasStyleField: boolean, styleValue: string, styleKeys: string[]): LineStyle {
  if (custom?.lineStyle != null) return custom.lineStyle;
  if (!hasStyleField) return 'solid';
  const cycled = DEFAULT_STYLES[styleKeys.indexOf(styleValue) % DEFAULT_STYLES.length];
  return opts.lineStyles?.[styleValue] ?? cycled;
}

function shapeFor(opts: LineChartOptions, custom: SeriesStyle | undefined, key: string, seriesKeys: string[]): PointShape {
  if (custom?.shape != null) return custom.shape;
  return opts.shapes ? SHAPES[seriesKeys.indexOf(key) % SHAPES.length] : 'circle';
}

export function buildModel(opts: LineChartOptions): Model {
  const data = opts.data ?? [];
  const getX = accessor(opts.x)!;
  const getY = accessor(opts.y)!;
  const getSeries = accessor(opts.series);
  const getColor = accessor(opts.color) ?? getSeries;
  const getStyle = accessor(opts.lineStyle);
  const getEstimated = accessor(opts.estimated);
  const getFacet = opts.layout === 'single' ? null : accessor(opts.facet);

  const rawX = data.map((datum, i) => getX(datum, i));
  const xType = opts.xAxis?.type ?? inferXType(rawX);

  const keys: KeyRegistry = { categories: [], categoryIndex: new Map(), seriesKeys: [], colorKeys: [], facets: [], styleKeys: [] };
  const byId = new Map<string, SeriesModel>();
  const y2Series = new Set(opts.y2Axis?.series ?? []);

  const createSeries = (id: string, key: string, colorKey: string, facet: string, datum: Datum, index: number): SeriesModel => {
    const styleValue = getStyle ? String(getStyle(datum, index) ?? '') : '';
    if (getStyle) addUnique(keys.styleKeys, styleValue);
    const custom = opts.seriesStyles?.[key];
    return {
      id,
      key,
      colorKey,
      styleKey: styleValue,
      facet,
      axis: y2Series.has(key) ? 'y2' : 'y',
      lineStyle: lineStyleFor(opts, custom, !!getStyle, styleValue, keys.styleKeys),
      shape: shapeFor(opts, custom, key, keys.seriesKeys),
      area: custom?.area ?? opts.area ?? false,
      points: [],
      missing: false,
    };
  };

  data.forEach((datum, i) => {
    const position = resolveX(rawX[i], xType, keys);
    if (!position) return;
    const key = seriesKeyFor(opts, getSeries, datum, i);
    const colorKey = getColor ? String(getColor(datum, i) ?? key) : key;
    const facet = getFacet ? String(getFacet(datum, i) ?? '') : '';
    addUnique(keys.seriesKeys, key);
    addUnique(keys.colorKeys, colorKey);
    addUnique(keys.facets, facet);
    const id = JSON.stringify([facet, key]);
    let series = byId.get(id);
    if (!series) {
      series = createSeries(id, key, colorKey, facet, datum, i);
      byId.set(id, series);
    }
    series.points.push({
      x: position.x,
      xRaw: position.xRaw,
      y: toNumber(getY(datum, i)),
      estimated: getEstimated ? Boolean(getEstimated(datum, i)) : false,
      datum,
      index: i,
    });
  });

  const series = Array.from(byId.values());
  for (const line of series) {
    line.points.sort((a, b) => a.x - b.x);
    line.missing = line.points.every((point) => point.y == null);
  }
  const { categories, seriesKeys, colorKeys, facets, styleKeys } = keys;
  const missing = seriesKeys.filter((key) => series.filter((line) => line.key === key).every((line) => line.missing));
  return { xType, series, seriesKeys, colorKeys, facets, styleKeys, categories, missing };
}
