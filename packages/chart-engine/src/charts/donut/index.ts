import { Chart } from '../../core/chart.js';
import type { ChartModule } from '../../core/module.js';
import { listFormat } from '../../util/data.js';
import { drawDonutMarks, drawDonutOverlay } from './draw.js';
import { layoutDonut, snapshotDonut, type ArcLayout, type DonutGeometry, type DonutSnapshot } from './layout.js';
import { hitDonut, hoverForDonut } from './hit.js';
import { donutLegend } from './legend.js';
import { buildDonutModel, type DonutModel } from './model.js';
import { describeArc, donutNav } from './nav.js';
import type { DonutChartOptions, DonutHoverContext, DonutItem } from './types.js';

/** Screen reader summary, e.g. "Donut chart with 3 segments: a, b, and c. Use the arrow keys…". */
function describeDonut(model: DonutModel, options: DonutChartOptions): string {
  const segmentCount = model.categories.length;
  const kind = options.variant === 'semicircle' ? 'Semicircle donut chart' : 'Donut chart';
  const facets = model.pies.length > 1 ? ` in ${model.pies.length} small multiples` : '';
  const plural = segmentCount === 1 ? '' : 's';
  const list = segmentCount ? `: ${listFormat(model.categories)}` : '';
  return `${kind}${facets} with ${segmentCount} segment${plural}${list}. Use the arrow keys to explore values.`;
}

function toItem(arc: ArcLayout): DonutItem {
  return {
    category: arc.category,
    value: arc.value,
    percent: arc.percent,
    total: arc.pie.total,
    index: arc.segment.index,
    datum: arc.segment.datum,
    ...(arc.pie.facet != null ? { facet: arc.pie.facet } : {}),
  };
}

/** Donut chart: everything that differs from other chart types. */
export const donutModule: ChartModule<DonutChartOptions, DonutModel, DonutGeometry, ArcLayout, DonutItem, DonutSnapshot> = {
  name: 'Donut chart',
  dataKeys: ['data', 'category', 'value', 'facet', 'sort', 'binary', 'variant'],

  model: {
    prepare: (options) => buildDonutModel(options),
    legend: donutLegend,
    notice: (model) => (model.empty ? 'There are no data available.' : ''),
    description: describeDonut,
  },

  geometry: {
    layout: layoutDonut,
    snapshot: snapshotDonut,
  },

  draw: {
    marks: (geometry, state, env) => drawDonutMarks(geometry, state, env),
    overlay: (geometry, state, env) => drawDonutOverlay(geometry, state, env),
  },

  identity: {
    key: (arc) => arc.key,
    group: (arc) => arc.category,
    item: (_g, arc) => toItem(arc),
    find: (geometry, item) => {
      for (const pie of geometry.pies) {
        if (item.facet != null && pie.facet !== item.facet) continue;
        const arc = pie.arcs.find((candidate) => candidate.category === item.category);
        if (arc && arc.end > arc.start) return arc;
      }
      return null;
    },
    anchor: (_g, arc) => {
      const midAngle = (arc.start + arc.end) / 2;
      const pie = arc.pie;
      return { x: pie.cx + Math.sin(midAngle) * pie.outer, y: pie.cy - Math.cos(midAngle) * pie.outer };
    },
    describe: describeArc,
  },

  interaction: {
    hit: (geometry, x, y) => {
      const arc = hitDonut(geometry, x, y);
      return arc ? hoverForDonut(geometry, arc) : null;
    },
    hoverFor: (geometry, arc) => hoverForDonut(geometry, arc),
    context: (geometry, hover): DonutHoverContext => ({
      item: toItem(hover.primary),
      items: hover.items.map(toItem),
      mode: hover.mode,
      colorOf: (category) => (category === hover.primary.category ? hover.primary.color : geometry.colorOf(category)),
      formatValue: geometry.formatValue,
      formatPercent: geometry.formatPercent,
    }),
    tooltip: (context) => {
      const donutContext = context as DonutHoverContext;
      const item = donutContext.item;
      const value = `${donutContext.formatPercent(item.percent)} (${donutContext.formatValue(item.value)})`;
      return {
        ...(item.facet != null ? { title: item.facet } : {}),
        rows: [{ color: donutContext.colorOf(item.category), name: item.category, value }],
      };
    },
    legendEmphasis: (hover, selected) => {
      const keys = new Set(selected.map((arc) => arc.category));
      if (hover) keys.add(hover.primary.category);
      return keys.size ? [...keys] : null;
    },
    multiSelect: (options) => options.multiSelect ?? true,
  },

  nav: (geometry) => donutNav(geometry),
};

/** A Spectrum 2 donut chart. */
export class DonutChart extends Chart<DonutChartOptions, DonutItem, DonutModel, DonutGeometry, ArcLayout, DonutSnapshot> {
  constructor(container: HTMLElement, options: DonutChartOptions) {
    super(container, options, donutModule);
  }
}

export function createDonutChart(container: HTMLElement, options: DonutChartOptions): DonutChart {
  return new DonutChart(container, options);
}
