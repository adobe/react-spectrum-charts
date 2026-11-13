import type { Datum } from '../../core/types.js';
import { accessor, toNumber } from '../../util/data.js';
import type { DonutChartOptions } from './types.js';

export interface Segment {
  category: string;
  value: number;
  index: number;
  datum: Datum;
}

export interface Pie {
  facet: string | null;
  /** Segments in drawing order (clockwise from the start angle). */
  segments: Segment[];
}

export interface DonutModel {
  /** Every category in drawing order; also the legend and color order. */
  categories: string[];
  pies: Pie[];
  /** Binary donut: the highlighted share and the gray remainder. */
  binary: { primary: string; secondary: string } | null;
  empty: boolean;
}

interface Grouped {
  byFacet: Map<string | null, Segment[]>;
  /** Category totals across every facet, in first-seen order. */
  totals: Map<string, number>;
}

/** Collect segments per facet, skipping rows without a category; negative or missing values become 0. */
function groupRows(options: DonutChartOptions): Grouped {
  const getCategory = accessor(options.category)!;
  const getValue = accessor(options.value)!;
  const getFacet = accessor(options.facet);
  const byFacet = new Map<string | null, Segment[]>();
  const totals = new Map<string, number>();
  options.data.forEach((datum, index) => {
    const rawValue = toNumber(getValue(datum, index));
    const rawCategory = getCategory(datum, index);
    if (rawCategory == null) return;
    const category = String(rawCategory);
    const facet = getFacet ? String(getFacet(datum, index) ?? '') : null;
    if (!byFacet.has(facet)) byFacet.set(facet, []);
    const value = rawValue != null && rawValue > 0 ? rawValue : 0;
    byFacet.get(facet)!.push({ category, value, index, datum });
    totals.set(category, (totals.get(category) ?? 0) + value);
  });
  return { byFacet, totals };
}

/** Category order: binary puts primary first and secondary last; otherwise largest total first unless unsorted. */
function orderCategories(options: DonutChartOptions, totals: Map<string, number>): { categories: string[]; binary: DonutModel['binary'] } {
  const categories = [...totals.keys()];
  if (options.binary && categories.length >= 2) {
    const secondary = typeof options.binary === 'object' ? options.binary.secondary : categories[1];
    const primary = categories.find((category) => category !== secondary) ?? categories[0];
    const middle = categories.filter((category) => category !== primary && category !== secondary);
    return { categories: [primary, ...middle, secondary], binary: { primary, secondary } };
  }
  if ((options.sort ?? 'descending') === 'descending') {
    // One global order keeps a category in the same place and color in every facet.
    categories.sort((a, b) => totals.get(b)! - totals.get(a)!);
  }
  return { categories, binary: null };
}

/** Group the data into donuts (one per facet) and order the segments. */
export function buildDonutModel(options: DonutChartOptions): DonutModel {
  const { byFacet, totals } = groupRows(options);
  const { categories, binary } = orderCategories(options, totals);
  const rank = new Map(categories.map((category, i) => [category, i]));
  const pies: Pie[] = [...byFacet].map(([facet, segments]) => ({
    facet,
    segments: [...segments].sort((a, b) => rank.get(a.category)! - rank.get(b.category)!),
  }));
  const empty = !pies.length || [...totals.values()].every((total) => total <= 0);
  return { categories, pies, binary, empty };
}
