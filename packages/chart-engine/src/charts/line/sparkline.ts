import { mean } from 'd3-array';
import { LineChart } from './index.js';
import { accessor, toNumber } from '../../util/data.js';
import type { LineChartOptions } from './types.js';

/** Sparklines leave just enough room for the end marker and line width. */
const SPARKLINE_PADDING = { top: 6, right: 2, bottom: 6, left: 2 };

export interface SparklineOptions
  extends Omit<LineChartOptions, 'minimal' | 'legend' | 'directLabels' | 'title' | 'subtitle'> {
  /** Draw a thin reference line at the mean value. */
  average?: boolean;
}

/** A compact, axis-less line for tables and KPI cards. */
export function createSparkline(container: HTMLElement, options: SparklineOptions): LineChart {
  const { average, ...rest } = options;
  const referenceLines = [...(rest.referenceLines ?? [])];
  if (average) {
    const getY = accessor(rest.y)!;
    const meanValue = mean(rest.data, (datum, i) => toNumber(getY(datum, i)) ?? undefined);
    if (meanValue != null) referenceLines.push({ value: meanValue, kind: 'secondary' });
  }
  return new LineChart(container, {
    size: 'S',
    endMarker: true,
    hover: 'point',
    ...rest,
    referenceLines,
    minimal: true,
    padding: rest.padding ?? { ...SPARKLINE_PADDING },
  });
}
