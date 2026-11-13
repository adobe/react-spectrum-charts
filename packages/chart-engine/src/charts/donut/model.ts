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

/** Group the data into donuts (one per facet) and order the segments. */
export function buildDonutModel(o: DonutChartOptions): DonutModel {
  const cat = accessor(o.category)!;
  const val = accessor(o.value)!;
  const fac = accessor(o.facet);
  const byFacet = new Map<string | null, Segment[]>();
  const totals = new Map<string, number>();
  o.data.forEach((d, i) => {
    const v = toNumber(val(d, i));
    const c = cat(d, i);
    if (c == null) return;
    const category = String(c);
    const facet = fac ? String(fac(d, i) ?? '') : null;
    if (!byFacet.has(facet)) byFacet.set(facet, []);
    const value = v != null && v > 0 ? v : 0;
    byFacet.get(facet)!.push({ category, value, index: i, datum: d });
    totals.set(category, (totals.get(category) ?? 0) + value);
  });

  let categories = [...totals.keys()];
  let binary: DonutModel['binary'] = null;
  if (o.binary && categories.length >= 2) {
    const secondary = typeof o.binary === 'object' ? o.binary.secondary : categories[1];
    const primary = categories.find((c) => c !== secondary) ?? categories[0];
    binary = { primary, secondary };
    categories = [primary, ...categories.filter((c) => c !== primary && c !== secondary), secondary];
  } else if ((o.sort ?? 'descending') === 'descending') {
    // One global order keeps a category in the same place and color in every facet.
    categories.sort((a, b) => totals.get(b)! - totals.get(a)!);
  }
  const rank = new Map(categories.map((c, i) => [c, i]));
  const pies: Pie[] = [...byFacet].map(([facet, segs]) => ({
    facet,
    segments: [...segs].sort((a, b) => rank.get(a.category)! - rank.get(b.category)!),
  }));
  const empty = !pies.length || [...totals.values()].every((v) => v <= 0);
  return { categories, pies, binary, empty };
}
