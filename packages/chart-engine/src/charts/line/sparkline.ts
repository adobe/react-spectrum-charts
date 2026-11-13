import { mean } from 'd3-array';
import { LineChart } from './index.js';
import { accessor, toNumber } from '../../util/data.js';
import type { LineChartOptions } from './types.js';

export interface SparklineOptions
  extends Omit<LineChartOptions, 'minimal' | 'legend' | 'directLabels' | 'title' | 'subtitle'> {
  /** Draw a thin reference line at the mean value. */
  average?: boolean;
}

/** A compact, axis-less line for tables and KPI cards. */
export function createSparkline(container: HTMLElement, options: SparklineOptions): LineChart {
  const { average, ...rest } = options;
  const refs = [...(rest.referenceLines ?? [])];
  if (average) {
    const get = accessor(rest.y)!;
    const m = mean(rest.data, (d, i) => toNumber(get(d, i)) ?? undefined);
    if (m != null) refs.push({ value: m, kind: 'secondary' });
  }
  return new LineChart(container, {
    size: 'S',
    endMarker: true,
    hover: 'point',
    ...rest,
    referenceLines: refs,
    minimal: true,
    padding: rest.padding ?? { top: 6, right: 2, bottom: 6, left: 2 },
  });
}
