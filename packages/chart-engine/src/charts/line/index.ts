import { drawAxes, drawAxisHover, drawReferenceLines } from '../../core/cartesian/draw.js';
import { Chart } from '../../core/chart.js';
import type { ChartModule, TooltipModel, TooltipRow } from '../../core/module.js';
import { listFormat } from '../../util/data.js';
import { drawLineMarks, drawLineOverlay } from './draw.js';
import { hitLine, hoverForLine, type LineHit } from './hit.js';
import { colorsFor, layoutLine, snapshotLine, type LineGeometry, type LineSnapshot } from './layout.js';
import { lineLegend } from './legend.js';
import { buildModel, type Model } from './model.js';
import { lineNav } from './nav.js';
import type { LineChartOptions, LineHoverContext, LineItem } from './types.js';

function toItem(hit: LineHit): LineItem {
  const series = hit.series.s;
  const point = hit.pt.p;
  return {
    series: series.key,
    color: series.colorKey,
    x: point.xRaw,
    y: point.y,
    index: point.index,
    datum: point.datum,
    estimated: point.estimated,
    axis: series.axis,
    ...(series.facet ? { facet: series.facet } : {}),
  };
}

function missingDataNotice(model: Model): string {
  if (model.series.every((series) => series.missing)) return 'There are no data available.';
  if (model.missing.length) return `There are no data available for ${listFormat(model.missing)}.`;
  return '';
}

function describeChart(model: Model): string {
  const keys = model.seriesKeys.filter((key) => !model.missing.includes(key));
  const lineCount = keys.length;
  const noun = lineCount === 1 ? 'line' : 'lines';
  const names = lineCount ? `: ${listFormat(keys)}` : '';
  return `Line chart with ${lineCount} ${noun}${names}. Use the arrow keys to explore values.`;
}

function tooltipFor(context: LineHoverContext): TooltipModel {
  const items = context.mode === 'x' ? context.items : [context.item];
  const rows: TooltipRow[] = items.map((item) => ({
    color: context.seriesColor(item.series),
    name: item.series,
    value: context.formatY(item.y, item.axis) + (item.estimated ? ' (estimated)' : ''),
  }));
  if (items.length > 1 && items.every((item) => item.axis === 'y')) {
    const total = items.reduce((sum, item) => sum + (item.y ?? 0), 0);
    rows.push({ name: 'Total', value: context.formatY(total), total: true });
  }
  return { title: context.formatX(context.item.x), rows };
}

/** Line chart: everything that differs from other chart types. */
export const lineModule: ChartModule<LineChartOptions, Model, LineGeometry, LineHit, LineItem, LineSnapshot> = {
  name: 'Line chart',
  dataKeys: ['data', 'x', 'y', 'series', 'color', 'lineStyle', 'estimated', 'facet', 'layout', 'y2Axis'],

  model: {
    prepare: (options) => buildModel(options),
    legend: (model, options, env) => {
      const colors = colorsFor(model, options, env);
      return lineLegend(model, options, env, colors.colorOf, colors.seriesColor);
    },
    notice: missingDataNotice,
    description: describeChart,
    minimal: (options) => !!options.minimal,
  },

  geometry: {
    layout: layoutLine,
    snapshot: snapshotLine,
  },

  draw: {
    back: (geometry, options, env) => drawAxes(geometry.frame, options, env.theme, env.sizes),
    marks: drawLineMarks,
    front: (geometry, options, env) => drawReferenceLines(geometry.frame, options, env.theme, env.sizes),
    overlay: (geometry, state, env) => {
      const primary = state.hover?.primary;
      let axisHover: ReturnType<typeof drawAxisHover> = [];
      if (primary) {
        const label = geometry.frame.formatX(primary.pt.p.xRaw);
        axisHover = drawAxisHover(geometry.frame, { panel: primary.panel.index, x: primary.pt.x, label }, env.theme, env.sizes);
      }
      return [...axisHover, ...drawLineOverlay(geometry, state, env)];
    },
  },

  identity: {
    key: (hit) => `${hit.series.s.id}#${hit.pt.p.index}`,
    group: (hit) => hit.series.s.key,
    item: (_geometry, hit) => toItem(hit),
    find: (geometry, item) => {
      for (const panel of geometry.panels) {
        if (item.facet != null && panel.facet !== item.facet) continue;
        for (const series of panel.series) {
          if (series.s.key !== item.series) continue;
          const byIndex = series.pts.find((point) => point.p.index === item.index);
          const pt = byIndex ?? series.pts.find((point) => point.p.x === geometry.frame.xValue(item.x));
          if (pt && pt.y != null) return { panel, series, pt };
        }
      }
      return null;
    },
    anchor: (_geometry, hit) => ({ x: hit.panel.x + hit.pt.x, y: hit.panel.y + (hit.pt.y ?? 0) }),
    describe: (geometry, hit) => {
      const { formatX, formatY } = geometry.frame;
      return `${hit.series.s.key}, ${formatX(hit.pt.p.xRaw)}, ${formatY(hit.pt.value, hit.series.s.axis)}`;
    },
  },

  interaction: {
    hoverMode: (options) => options.hover ?? 'point',
    hit: hitLine,
    hoverFor: (_geometry, mark, mode) => hoverForLine(mark, mode),
    context: (geometry, hover): LineHoverContext => ({
      item: toItem(hover.primary),
      items: hover.items.map(toItem),
      mode: hover.mode,
      colorOf: geometry.colorOf,
      formatX: geometry.frame.formatX,
      formatY: geometry.frame.formatY,
      seriesColor: geometry.seriesColor,
    }),
    tooltip: (context) => tooltipFor(context as LineHoverContext),
  },

  nav: (geometry) => lineNav(geometry),
};

/** A Spectrum 2 line chart. */
export class LineChart extends Chart<LineChartOptions, LineItem, Model, LineGeometry, LineHit, LineSnapshot> {
  constructor(container: HTMLElement, options: LineChartOptions) {
    super(container, options, lineModule);
  }
}

export function createLineChart(container: HTMLElement, options: LineChartOptions): LineChart {
  return new LineChart(container, options);
}
