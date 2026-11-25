/*
 * Copyright 2026 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import { ReactElement, ReactNode, useState } from 'react';

import { Datum } from '@spectrum-charts/vega-spec-builder-s2';

import { Chart } from '../../../Chart.js';
import { Axis, ChartInspect, ChartPopover, Legend, Title } from '../../../components/index.js';
import useChartProps from '../../../hooks/useChartProps.js';
import { Histogram } from '../../../lab/index.js';
import {
  AxisProps,
  ChartInspectProps,
  ChartPopoverProps,
  ChartProps,
  HistogramProps,
  LegendProps,
  TitleProps,
} from '../../../types/index.js';
import {
  Variation,
  VariationDashboard,
  VariationFilter,
  VariationSizePreset,
  VariationViewMode,
  useVariationAnimationTypes,
  useVariationDataset,
  useVariationRenderer,
  useVariationSize,
  useVariationViewMode,
} from '../../VariationDashboard.js';
import { DashboardDefinition, PropCoverage, SiblingCoverage } from '../../dashboardCoverage.js';
import {
  HistogramVariationDatasetName,
  HistogramVariationDatum,
  getQuantile,
  getQuantileEdges,
  getRoundBinSize,
  histogramDatasetOptions,
  histogramVariationDatasets,
} from './histogramVariationData.js';

const histogramSizePresets: VariationSizePreset[] = [
  { label: 'XS', size: 160 },
  { label: 'S', size: 240 },
  { label: 'M', size: 360 },
  { label: 'L', size: 480 },
  { label: 'XL', size: 720 },
];

const histogramViewModes: VariationViewMode[] = [
  { label: 'Axes', value: 'axes' },
  { label: 'Axes and legend', value: 'axesLegend' },
  { label: 'Bars only', value: 'none' },
];

const HISTOGRAM_ASPECT_RATIO = 0.6;

const HISTOGRAM_CHILDREN = new Set(['ChartInspect', 'ChartPopover']);
const SIBLINGS = new Set(['Axis', 'Chart', 'Legend', 'Title']);

const getCoverageComponent = (entry: string): string => entry.split(/[.=[]/)[0];
const coversAny =
  (components: Set<string>) =>
  ({ coverage }: Variation): boolean =>
    coverage.some((entry) => components.has(getCoverageComponent(entry)));
const coversHistogramProp = ({ coverage }: Variation): boolean =>
  coverage.some((entry) => /^[a-z]/.test(getCoverageComponent(entry)));
const isTwoDimensional = ({ coverage }: Variation): boolean => coverage.some((entry) => entry.startsWith('yMetric'));

const histogramVariationFilters: VariationFilter[] = [
  { label: 'All', value: 'all', matches: () => true },
  { label: 'Histogram props', value: 'histogram', matches: coversHistogramProp },
  { label: '2D', value: '2d', matches: isTwoDimensional },
  { label: 'Children', value: 'children', matches: coversAny(HISTOGRAM_CHILDREN) },
  { label: 'Siblings & Chart', value: 'siblings', matches: coversAny(SIBLINGS) },
];

const formatBin = (datum: Datum): string => {
  const series = datum.series ? `${String(datum.series)} · ` : '';
  return `${series}${datum.binStart}–${datum.binEnd}: ${datum.count}`;
};

const inspectContent = (datum: Datum): ReactNode => (
  <div>
    {datum.series ? <div>{String(datum.series)}</div> : null}
    <div>
      {String(datum.binStart)}–{String(datum.binEnd)}
    </div>
    <div>count: {String(datum.count)}</div>
    <div>percent: {(Number(datum.percent) * 100).toFixed(1)}%</div>
  </div>
);

const inspect2DContent = (datum: Datum): ReactNode => (
  <div>
    <div>
      x {String(datum.binStart)}–{String(datum.binEnd)}
    </div>
    <div>
      y {String(datum.yBinStart)}–{String(datum.yBinEnd)}
    </div>
    <div>count: {String(datum.count)}</div>
  </div>
);

const popoverContent = (datum: Datum, close: () => void): ReactNode => (
  <div>
    <div>{formatBin(datum)}</div>
    <button type="button" onClick={close}>
      Close
    </button>
  </div>
);

type HistogramChartOverrides = Omit<Partial<ChartProps>, 'children' | 'data'>;
type DataFunction<T> = T | ((data: HistogramVariationDatum[]) => T);

const resolve = <T,>(value: DataFunction<T> | undefined, data: HistogramVariationDatum[]): T | undefined =>
  typeof value === 'function' ? (value as (data: HistogramVariationDatum[]) => T)(data) : value;

interface HistogramVariationChartProps extends Pick<HistogramProps, 'children'> {
  /** Fixed data, or a function deriving data from the active dataset. */
  data?: DataFunction<HistogramVariationDatum[]>;
  /** Histogram prop overrides; functions receive the active dataset. */
  histogramProps?: DataFunction<Omit<HistogramProps, 'children'>>;
  /** Chart prop overrides; functions receive the active dataset. */
  chartProps?: DataFunction<HistogramChartOverrides>;
  /** Replaces the default axes in every view mode. */
  axes?: () => ReactNode;
  /** Replaces the default legend in every view mode. */
  legend?: () => ReactNode;
  /** Extra chart-level siblings such as Title. */
  siblings?: () => ReactNode;
}

const DefaultAxes = (): ReactElement[] => [
  <Axis key="dimension" position="bottom" baseline ticks numberFormat="shortNumber" />,
  <Axis key="metric" position="left" grid />,
];

const HistogramVariationChart = ({
  data,
  histogramProps,
  children,
  chartProps: chartPropOverrides,
  axes,
  legend,
  siblings,
}: HistogramVariationChartProps): ReactElement => {
  const selectedDataset = useVariationDataset();
  const size = useVariationSize();
  const viewMode = useVariationViewMode();
  const animationTypes = useVariationAnimationTypes();
  const renderer = useVariationRenderer();
  if (!selectedDataset || !(selectedDataset in histogramVariationDatasets)) {
    throw new Error(`Unknown Histogram variation dataset: ${selectedDataset}`);
  }
  const datasetData = histogramVariationDatasets[selectedDataset as HistogramVariationDatasetName];
  const chartData = resolve(data, datasetData) ?? datasetData;
  const chartProps = useChartProps({
    data: chartData,
    width: size,
    height: Math.round(size * HISTOGRAM_ASPECT_RATIO),
  });
  const showDefaultAxes = viewMode !== 'none';
  let legendNode: ReactNode = null;
  if (legend) {
    legendNode = legend();
  } else if (viewMode === 'axesLegend') {
    legendNode = <Legend />;
  }
  return (
    <Chart
      {...chartProps}
      animationTypes={animationTypes}
      renderer={renderer}
      {...resolve(chartPropOverrides, chartData)}
    >
      {axes ? axes() : showDefaultAxes && DefaultAxes()}
      {siblings?.()}
      <Histogram {...resolve(histogramProps, chartData)}>{children}</Histogram>
      {legendNode}
    </Chart>
  );
};

/** Renders a variation with an `<output>` showing the most recent callback event. */
const CallbackVariation = ({ render }: { render: (log: (message: string) => void) => ReactElement }): ReactElement => {
  const [lastEvent, setLastEvent] = useState('No events yet');
  return (
    <div>
      {render(setLastEvent)}
      <output style={{ display: 'block', fontSize: 12 }}>{lastEvent}</output>
    </div>
  );
};

const customAxes =
  (dimensionAxisProps: Omit<AxisProps, 'position'>, metricAxisProps: Partial<AxisProps> = {}) =>
  (): ReactElement[] =>
    [
      <Axis key="dimension" position="bottom" baseline ticks numberFormat="shortNumber" {...dimensionAxisProps} />,
      <Axis key="metric" position="left" grid {...metricAxisProps} />,
    ];

const percentAxes = customAxes({}, { labelFormat: 'percentage' });
const seriesLegend = () => <Legend title="Series" />;

const binVariations: Variation[] = [
  {
    id: 'defaults',
    title: 'Defaults',
    description: 'One static color, count bars, bin count from the row count, auto "Count" axis title.',
    dataset: 'standard',
    coverage: [
      'metric=value',
      'binCount=auto',
      'color={value:categorical-100}',
      'layout=stacked',
      'orientation=vertical',
      'yValue=count',
      'cumulative=false',
      'densityCurve=false',
      'drawInEffect=grow',
      'name=histogram0',
      'Axis.title=auto',
    ],
    render: () => <HistogramVariationChart />,
  },
  {
    id: 'custom-metric',
    title: 'Custom metric',
    description: 'Bins the alternate `duration` field instead of `value`.',
    dataset: 'standard',
    coverage: ['metric=duration'],
    render: () => <HistogramVariationChart histogramProps={{ metric: 'duration' }} />,
  },
  {
    id: 'bin-count-few',
    title: 'Few bins',
    description: 'At most 5 bins; the step is rounded to a nice number.',
    dataset: 'standard',
    coverage: ['binCount=5'],
    render: () => <HistogramVariationChart histogramProps={{ binCount: 5 }} />,
  },
  {
    id: 'bin-count-many',
    title: 'Many bins',
    description: 'At most 40 bins.',
    dataset: 'standard',
    coverage: ['binCount=40'],
    render: () => <HistogramVariationChart histogramProps={{ binCount: 40 }} />,
  },
  {
    id: 'bin-size',
    title: 'Fixed bin size',
    description: 'A round bin width that splits the range into about 12 bins.',
    dataset: 'standard',
    coverage: ['binSize=range/12'],
    render: () => <HistogramVariationChart histogramProps={(data) => ({ binSize: getRoundBinSize(data, 12) })} />,
  },
  {
    id: 'bin-size-overrides-count',
    title: 'Bin size overrides count',
    description: 'binSize wins over binCount=50, so the bars match the fixed bin size variation.',
    dataset: 'standard',
    coverage: ['binSize=range/12', 'binCount=50'],
    render: () => (
      <HistogramVariationChart histogramProps={(data) => ({ binSize: getRoundBinSize(data, 12), binCount: 50 })} />
    ),
  },
  {
    id: 'extent-inner',
    title: 'Inner extent',
    description: 'Bins only the 10th to 90th percentile; rows outside the extent are dropped.',
    dataset: 'standard',
    coverage: ['extent=[p10,p90]'],
    render: () => (
      <HistogramVariationChart
        histogramProps={(data) => ({ extent: [getQuantile(data, 0.1), getQuantile(data, 0.9)] })}
      />
    ),
  },
  {
    id: 'extent-wide',
    title: 'Wide extent',
    description: 'Extends the binned range past the data, leaving empty bins at both ends.',
    dataset: 'standard',
    coverage: ['extent=[min-range/2,max+range/2]'],
    render: () => (
      <HistogramVariationChart
        histogramProps={(data) => {
          const min = getQuantile(data, 0);
          const max = getQuantile(data, 1);
          const pad = Math.max(1, (max - min) / 2);
          return { extent: [min - pad, max + pad] };
        }}
      />
    ),
  },
  {
    id: 'bin-edges',
    title: 'Custom bin edges',
    description: 'Uneven bins at the 0, 25, 50, 75, 90 and 100th percentiles.',
    dataset: 'standard',
    coverage: ['binEdges=[quantiles]'],
    render: () => <HistogramVariationChart histogramProps={(data) => ({ binEdges: getQuantileEdges(data) })} />,
  },
  {
    id: 'bin-edges-overrides',
    title: 'Bin edges override other bin props',
    description: 'binEdges wins over binCount, binSize and extent, so the bars match the custom edges variation.',
    dataset: 'standard',
    coverage: ['binEdges=[quantiles]', 'binCount=40', 'binSize=1', 'extent=[0,1]'],
    render: () => (
      <HistogramVariationChart
        histogramProps={(data) => ({ binEdges: getQuantileEdges(data), binCount: 40, binSize: 1, extent: [0, 1] })}
      />
    ),
  },
  {
    id: 'bin-anchor',
    title: 'Bin anchor',
    description: 'Anchoring at half a bin width shifts every edge by half a bin compared with the fixed bin size.',
    dataset: 'standard',
    coverage: ['binAnchor=binSize/2', 'binSize=range/12'],
    render: () => (
      <HistogramVariationChart
        histogramProps={(data) => {
          const binSize = getRoundBinSize(data, 12);
          return { binSize, binAnchor: binSize / 2 };
        }}
      />
    ),
  },
  {
    id: 'bin-anchor-zero',
    title: 'Bin anchor at zero',
    description: 'Edges line up on whole multiples of the bin size counted from zero.',
    dataset: 'standard',
    coverage: ['binAnchor=0', 'binCount=10'],
    render: () => <HistogramVariationChart histogramProps={{ binCount: 10, binAnchor: 0 }} />,
  },
  {
    id: 'bin-anchor-edges-ignored',
    title: 'Bin anchor ignored with edges',
    description: 'binEdges wins over binAnchor, so the bars match the custom edges variation.',
    dataset: 'standard',
    coverage: ['binAnchor=binSize/2', 'binEdges=[quantiles]'],
    render: () => (
      <HistogramVariationChart
        histogramProps={(data) => ({ binEdges: getQuantileEdges(data), binAnchor: getRoundBinSize(data, 12) / 2 })}
      />
    ),
  },
];

const weightVariations: Variation[] = [
  {
    id: 'weight-sum',
    title: 'Weighted sum',
    description:
      'Bars sum `duration` per bin instead of counting rows; the left axis is auto-titled "Sum of duration".',
    dataset: 'standard',
    coverage: ['weight=duration', 'Axis.title=auto'],
    render: () => <HistogramVariationChart histogramProps={{ weight: 'duration' }} />,
  },
  {
    id: 'weight-percent',
    title: 'Weighted percent',
    description: 'Each bin’s share of the total `duration`, not of the rows.',
    dataset: 'standard',
    coverage: ['weight=duration', 'yValue=percent'],
    render: () => (
      <HistogramVariationChart histogramProps={{ weight: 'duration', yValue: 'percent' }} axes={percentAxes} />
    ),
  },
  {
    id: 'weight-series',
    title: 'Weighted stacked series',
    description: 'Each series’ summed `duration`, stacked per bin.',
    dataset: 'standard',
    coverage: ['weight=duration', 'color=series', 'layout=stacked'],
    render: () => (
      <HistogramVariationChart histogramProps={{ weight: 'duration', color: 'series' }} legend={seriesLegend} />
    ),
  },
  {
    id: 'weight-cumulative',
    title: 'Weighted cumulative',
    description: 'Summed `duration` accumulates left to right.',
    dataset: 'standard',
    coverage: ['weight=duration', 'cumulative=true'],
    render: () => <HistogramVariationChart histogramProps={{ weight: 'duration', cumulative: true }} />,
  },
  {
    id: 'weight-density-curve',
    title: 'Weight hides the density curve',
    description: 'densityCurve is ignored with weight, so no curve is drawn.',
    dataset: 'standard',
    coverage: ['weight=duration', 'densityCurve=true'],
    render: () => <HistogramVariationChart histogramProps={{ weight: 'duration', densityCurve: true }} />,
  },
];

const horizontalAxes = (): ReactElement[] => [
  <Axis key="metric" position="bottom" baseline grid />,
  <Axis key="dimension" position="left" ticks numberFormat="shortNumber" />,
];
const horizontalPercentAxes = (): ReactElement[] => [
  <Axis key="metric" position="bottom" baseline grid labelFormat="percentage" />,
  <Axis key="dimension" position="left" ticks numberFormat="shortNumber" />,
];

const orientationVariations: Variation[] = [
  {
    id: 'horizontal',
    title: 'Horizontal',
    description: 'Bins run up the left axis and bars grow to the right; the bottom axis is auto-titled "Count".',
    dataset: 'standard',
    coverage: ['orientation=horizontal', 'Axis.title=auto'],
    render: () => <HistogramVariationChart histogramProps={{ orientation: 'horizontal' }} axes={horizontalAxes} />,
  },
  {
    id: 'horizontal-stacked',
    title: 'Horizontal stacked series',
    description: 'Series stack left to right within each bin.',
    dataset: 'standard',
    coverage: ['orientation=horizontal', 'color=series', 'layout=stacked'],
    render: () => (
      <HistogramVariationChart
        histogramProps={{ orientation: 'horizontal', color: 'series' }}
        axes={horizontalAxes}
        legend={seriesLegend}
      />
    ),
  },
  {
    id: 'horizontal-dodged',
    title: 'Horizontal dodged series',
    description: 'Series sit one above another within each bin.',
    dataset: 'standard',
    coverage: ['orientation=horizontal', 'color=series', 'layout=dodged'],
    render: () => (
      <HistogramVariationChart
        histogramProps={{ orientation: 'horizontal', color: 'series', layout: 'dodged' }}
        axes={horizontalAxes}
        legend={seriesLegend}
      />
    ),
  },
  {
    id: 'horizontal-density-curve',
    title: 'Horizontal density curve',
    description: 'The density curve runs bottom to top, scaled to the bar lengths.',
    dataset: 'standard',
    coverage: ['orientation=horizontal', 'densityCurve=true'],
    render: () => (
      <HistogramVariationChart
        histogramProps={{ orientation: 'horizontal', densityCurve: true }}
        axes={horizontalAxes}
      />
    ),
  },
  {
    id: 'horizontal-percent',
    title: 'Horizontal percent',
    description: 'Percent bars with the auto "Percent" title on the bottom axis.',
    dataset: 'standard',
    coverage: ['orientation=horizontal', 'yValue=percent', 'Axis.labelFormat=percentage'],
    render: () => (
      <HistogramVariationChart
        histogramProps={{ orientation: 'horizontal', yValue: 'percent' }}
        axes={horizontalPercentAxes}
      />
    ),
  },
  {
    id: 'horizontal-draw-in-sweep',
    title: 'Horizontal sweep draw-in',
    description: 'Bars grow one after another along the bin axis. Turn on the drawIn animation switch to see it.',
    dataset: 'standard',
    coverage: ['orientation=horizontal', 'drawInEffect=sweep'],
    render: () => (
      <HistogramVariationChart
        histogramProps={{ orientation: 'horizontal', drawInEffect: 'sweep' }}
        axes={horizontalAxes}
      />
    ),
  },
];

const colorVariations: Variation[] = [
  {
    id: 'color-static',
    title: 'Static color',
    description: 'Every bar uses one static Spectrum color.',
    dataset: 'standard',
    coverage: ['color={value:seafoam-600}'],
    render: () => <HistogramVariationChart histogramProps={{ color: { value: 'seafoam-600' } }} />,
  },
  {
    id: 'color-series',
    title: 'Stacked series',
    description: 'One color per series, stacked within each shared bin.',
    dataset: 'standard',
    coverage: ['color=series', 'layout=stacked', 'Legend'],
    render: () => <HistogramVariationChart histogramProps={{ color: 'series' }} legend={seriesLegend} />,
  },
  {
    id: 'layout-overlaid',
    title: 'Overlaid series',
    description: 'Series share the baseline and are semi-transparent.',
    dataset: 'standard',
    coverage: ['color=series', 'layout=overlaid', 'Legend'],
    render: () => (
      <HistogramVariationChart histogramProps={{ color: 'series', layout: 'overlaid' }} legend={seriesLegend} />
    ),
  },
  {
    id: 'layout-overlaid-static',
    title: 'Overlaid without series',
    description: 'With a static color, overlaid looks the same as stacked.',
    dataset: 'standard',
    coverage: ['layout=overlaid'],
    render: () => <HistogramVariationChart histogramProps={{ layout: 'overlaid' }} />,
  },
  {
    id: 'layout-dodged',
    title: 'Dodged series',
    description: 'Series sit side by side within each bin.',
    dataset: 'standard',
    coverage: ['color=series', 'layout=dodged', 'Legend'],
    render: () => (
      <HistogramVariationChart histogramProps={{ color: 'series', layout: 'dodged' }} legend={seriesLegend} />
    ),
  },
  {
    id: 'layout-dodged-percent',
    title: 'Dodged percent',
    description: 'Each series’ shares sum to 100%, side by side per bin.',
    dataset: 'standard',
    coverage: ['color=series', 'layout=dodged', 'yValue=percent'],
    render: () => (
      <HistogramVariationChart
        histogramProps={{ color: 'series', layout: 'dodged', yValue: 'percent' }}
        axes={percentAxes}
        legend={seriesLegend}
      />
    ),
  },
  {
    id: 'layout-dodged-static',
    title: 'Dodged without series',
    description: 'With a static color, dodged looks the same as stacked.',
    dataset: 'standard',
    coverage: ['layout=dodged'],
    render: () => <HistogramVariationChart histogramProps={{ layout: 'dodged' }} />,
  },
];

const densityCurveVariations: Variation[] = [
  {
    id: 'density-curve',
    title: 'Density curve',
    description: 'A smoothed curve over the bars, scaled to the bar heights.',
    dataset: 'standard',
    coverage: ['densityCurve=true'],
    render: () => <HistogramVariationChart histogramProps={{ densityCurve: true }} />,
  },
  {
    id: 'density-curve-stacked',
    title: 'Density curve over stacked series',
    description: 'Stacked series get one neutral curve for the whole histogram.',
    dataset: 'standard',
    coverage: ['densityCurve=true', 'color=series', 'layout=stacked'],
    render: () => (
      <HistogramVariationChart histogramProps={{ densityCurve: true, color: 'series' }} legend={seriesLegend} />
    ),
  },
  {
    id: 'density-curve-overlaid',
    title: 'Density curves over overlaid series',
    description: 'Overlaid series get one curve each in the series color.',
    dataset: 'standard',
    coverage: ['densityCurve=true', 'color=series', 'layout=overlaid'],
    render: () => (
      <HistogramVariationChart
        histogramProps={{ densityCurve: true, color: 'series', layout: 'overlaid' }}
        legend={seriesLegend}
      />
    ),
  },
  {
    id: 'density-curve-dodged',
    title: 'Density curves over dodged series',
    description: 'Dodged series get one curve each in the series color.',
    dataset: 'standard',
    coverage: ['densityCurve=true', 'color=series', 'layout=dodged'],
    render: () => (
      <HistogramVariationChart
        histogramProps={{ densityCurve: true, color: 'series', layout: 'dodged' }}
        legend={seriesLegend}
      />
    ),
  },
  {
    id: 'density-curve-percent',
    title: 'Density curve with percent',
    description: 'The curve follows percent bar heights.',
    dataset: 'standard',
    coverage: ['densityCurve=true', 'yValue=percent'],
    render: () => (
      <HistogramVariationChart histogramProps={{ densityCurve: true, yValue: 'percent' }} axes={percentAxes} />
    ),
  },
  {
    id: 'density-curve-density',
    title: 'Density curve with density',
    description: 'With yValue="density" the curve is the unscaled estimate.',
    dataset: 'standard',
    coverage: ['densityCurve=true', 'yValue=density'],
    render: () => <HistogramVariationChart histogramProps={{ densityCurve: true, yValue: 'density' }} />,
  },
  {
    id: 'density-curve-cumulative',
    title: 'Cumulative density curve',
    description: 'With cumulative, the curve accumulates and ends at the last bar.',
    dataset: 'standard',
    coverage: ['densityCurve=true', 'cumulative=true', 'yValue=percent'],
    render: () => (
      <HistogramVariationChart
        histogramProps={{ densityCurve: true, cumulative: true, yValue: 'percent' }}
        axes={percentAxes}
      />
    ),
  },
  {
    id: 'density-curve-edges',
    title: 'Density curve with uneven bins',
    description: 'With binEdges the curve needs yValue="density"; it follows the uneven bars.',
    dataset: 'standard',
    coverage: ['densityCurve=true', 'binEdges=[quantiles]', 'yValue=density'],
    render: () => (
      <HistogramVariationChart
        histogramProps={(data) => ({ densityCurve: true, binEdges: getQuantileEdges(data), yValue: 'density' })}
      />
    ),
  },
  {
    id: 'density-curve-edges-count',
    title: 'Density curve hidden with uneven count bins',
    description: 'With binEdges and count bars no curve is drawn, since the bins have no single width.',
    dataset: 'standard',
    coverage: ['densityCurve=true', 'binEdges=[quantiles]', 'yValue=count'],
    render: () => (
      <HistogramVariationChart histogramProps={(data) => ({ densityCurve: true, binEdges: getQuantileEdges(data) })} />
    ),
  },
];

const yValueVariations: Variation[] = [
  {
    id: 'y-percent',
    title: 'Percent',
    description: 'Bar heights are each bin’s share of rows; the left axis is auto-titled "Percent".',
    dataset: 'standard',
    coverage: ['yValue=percent', 'Axis.labelFormat=percentage'],
    render: () => <HistogramVariationChart histogramProps={{ yValue: 'percent' }} axes={percentAxes} />,
  },
  {
    id: 'y-percent-series',
    title: 'Percent by series',
    description: 'Each series’ shares sum to 100%, stacked per bin.',
    dataset: 'standard',
    coverage: ['yValue=percent', 'color=series'],
    render: () => (
      <HistogramVariationChart
        histogramProps={{ yValue: 'percent', color: 'series' }}
        axes={percentAxes}
        legend={seriesLegend}
      />
    ),
  },
  {
    id: 'y-density',
    title: 'Density',
    description: 'Share divided by bin width; the left axis is auto-titled "Density".',
    dataset: 'standard',
    coverage: ['yValue=density'],
    render: () => <HistogramVariationChart histogramProps={{ yValue: 'density' }} />,
  },
  {
    id: 'y-density-edges',
    title: 'Density with uneven bins',
    description: 'Wide quantile bins are shorter than narrow ones with the same share.',
    dataset: 'standard',
    coverage: ['yValue=density', 'binEdges=[quantiles]'],
    render: () => (
      <HistogramVariationChart histogramProps={(data) => ({ yValue: 'density', binEdges: getQuantileEdges(data) })} />
    ),
  },
  {
    id: 'cumulative-count',
    title: 'Cumulative count',
    description: 'Bars accumulate counts left to right; the left axis is auto-titled "Cumulative count".',
    dataset: 'standard',
    coverage: ['cumulative=true', 'yValue=count'],
    render: () => <HistogramVariationChart histogramProps={{ cumulative: true }} />,
  },
  {
    id: 'cumulative-percent',
    title: 'Cumulative percent',
    description: 'The last bar reaches 100%; the left axis is auto-titled "Cumulative percent".',
    dataset: 'standard',
    coverage: ['cumulative=true', 'yValue=percent'],
    render: () => (
      <HistogramVariationChart histogramProps={{ cumulative: true, yValue: 'percent' }} axes={percentAxes} />
    ),
  },
  {
    id: 'cumulative-density',
    title: 'Cumulative density',
    description: 'With density, cumulative bars show the cumulative share.',
    dataset: 'standard',
    coverage: ['cumulative=true', 'yValue=density'],
    render: () => <HistogramVariationChart histogramProps={{ cumulative: true, yValue: 'density' }} />,
  },
  {
    id: 'cumulative-series',
    title: 'Cumulative stacked series',
    description: 'Each series accumulates separately, then stacks.',
    dataset: 'standard',
    coverage: ['cumulative=true', 'color=series'],
    render: () => (
      <HistogramVariationChart histogramProps={{ cumulative: true, color: 'series' }} legend={seriesLegend} />
    ),
  },
];

const twoDimensionalAxes = customAxes({}, { title: 'y', numberFormat: 'shortNumber' });

const twoDimensionalVariations: Variation[] = [
  {
    id: 'two-d',
    title: '2D histogram',
    description: 'A grid of cells binned on value and y, colored by count, with a gradient legend titled "Count".',
    dataset: 'standard',
    coverage: ['yMetric=y', 'cellColors=sequentialCerulean9', 'cellLegend=true', 'cellLegendTitle=auto'],
    render: () => <HistogramVariationChart histogramProps={{ yMetric: 'y' }} axes={twoDimensionalAxes} />,
  },
  {
    id: 'two-d-bin-count',
    title: '2D with few bins',
    description: 'At most 5 bins on each axis.',
    dataset: 'standard',
    coverage: ['yMetric=y', 'binCount=5', 'yBinCount=5'],
    render: () => (
      <HistogramVariationChart histogramProps={{ yMetric: 'y', binCount: 5, yBinCount: 5 }} axes={twoDimensionalAxes} />
    ),
  },
  {
    id: 'draw-in-sweep',
    title: 'Sweep draw-in',
    description: 'Bars rise one after another from left to right. Turn on the drawIn animation switch to see it.',
    dataset: 'standard',
    coverage: ['drawInEffect=sweep'],
    render: () => <HistogramVariationChart histogramProps={{ drawInEffect: 'sweep' }} />,
  },
  {
    id: 'draw-in-fade',
    title: 'Fade draw-in',
    description: 'Bars fade in at full height. Turn on the drawIn animation switch to see it.',
    dataset: 'standard',
    coverage: ['drawInEffect=fade'],
    render: () => <HistogramVariationChart histogramProps={{ drawInEffect: 'fade' }} />,
  },
  {
    id: 'two-d-draw-in-sweep',
    title: '2D sweep draw-in',
    description: 'Cells fade in from left to right.',
    dataset: 'standard',
    coverage: ['yMetric=y', 'drawInEffect=sweep'],
    render: () => (
      <HistogramVariationChart histogramProps={{ yMetric: 'y', drawInEffect: 'sweep' }} axes={twoDimensionalAxes} />
    ),
  },
  {
    id: 'two-d-bin-size',
    title: '2D with fixed y bin size',
    description: 'Round y bin width that splits the y range into about 6 bins.',
    dataset: 'standard',
    coverage: ['yMetric=y', 'yBinSize=range/6'],
    render: () => (
      <HistogramVariationChart
        histogramProps={(data) => ({ yMetric: 'y', yBinSize: getRoundBinSize(data, 6, 'y') })}
        axes={twoDimensionalAxes}
      />
    ),
  },
  {
    id: 'two-d-extent',
    title: '2D with y extent',
    description: 'Bins y only between its 10th and 90th percentiles.',
    dataset: 'standard',
    coverage: ['yMetric=y', 'yExtent=[p10,p90]'],
    render: () => (
      <HistogramVariationChart
        histogramProps={(data) => ({
          yMetric: 'y',
          yExtent: [getQuantile(data, 0.1, 'y'), getQuantile(data, 0.9, 'y')],
        })}
        axes={twoDimensionalAxes}
      />
    ),
  },
  {
    id: 'two-d-cell-colors-magma',
    title: '2D Magma cells',
    description: 'Cells use the 9-step Magma scheme.',
    dataset: 'standard',
    coverage: ['yMetric=y', 'cellColors=sequentialMagma9'],
    render: () => (
      <HistogramVariationChart
        histogramProps={{ yMetric: 'y', cellColors: 'sequentialMagma9' }}
        axes={twoDimensionalAxes}
      />
    ),
  },
  {
    id: 'two-d-cell-colors-viridis',
    title: '2D Viridis cells, 16 steps',
    description: 'Cells use the 16-step Viridis scheme.',
    dataset: 'standard',
    coverage: ['yMetric=y', 'cellColors=sequentialViridis16'],
    render: () => (
      <HistogramVariationChart
        histogramProps={{ yMetric: 'y', cellColors: 'sequentialViridis16' }}
        axes={twoDimensionalAxes}
      />
    ),
  },
  {
    id: 'two-d-cell-colors-forest',
    title: '2D Forest cells, 5 steps',
    description: 'Cells use the 5-step Forest scheme.',
    dataset: 'standard',
    coverage: ['yMetric=y', 'cellColors=sequentialForest5'],
    render: () => (
      <HistogramVariationChart
        histogramProps={{ yMetric: 'y', cellColors: 'sequentialForest5' }}
        axes={twoDimensionalAxes}
      />
    ),
  },
  {
    id: 'two-d-legend-title',
    title: '2D custom legend title',
    description: 'The cell legend is titled "Sessions" instead of "Count".',
    dataset: 'standard',
    coverage: ['yMetric=y', 'cellLegendTitle=Sessions'],
    render: () => (
      <HistogramVariationChart
        histogramProps={{ yMetric: 'y', cellLegendTitle: 'Sessions' }}
        axes={twoDimensionalAxes}
      />
    ),
  },
  {
    id: 'two-d-no-legend',
    title: '2D without legend',
    description: 'cellLegend={false} hides the gradient legend and the cells take its space.',
    dataset: 'standard',
    coverage: ['yMetric=y', 'cellLegend=false'],
    render: () => (
      <HistogramVariationChart histogramProps={{ yMetric: 'y', cellLegend: false }} axes={twoDimensionalAxes} />
    ),
  },
  {
    id: 'two-d-weight',
    title: '2D weighted',
    description: 'Cells are colored by summed `duration`; the legend is auto-titled "Sum of duration".',
    dataset: 'standard',
    coverage: ['yMetric=y', 'weight=duration', 'cellLegendTitle=auto'],
    render: () => (
      <HistogramVariationChart histogramProps={{ yMetric: 'y', weight: 'duration' }} axes={twoDimensionalAxes} />
    ),
  },
  {
    id: 'two-d-ignores-1d-props',
    title: '2D ignores 1D-only props',
    description: 'orientation, densityCurve and yValue have no effect, so this matches the 2D histogram.',
    dataset: 'standard',
    coverage: ['yMetric=y', 'orientation=horizontal', 'densityCurve=true', 'yValue=percent'],
    render: () => (
      <HistogramVariationChart
        histogramProps={{ yMetric: 'y', orientation: 'horizontal', densityCurve: true, yValue: 'percent' }}
        axes={twoDimensionalAxes}
      />
    ),
  },
  {
    id: 'two-d-dark',
    title: '2D dark color scheme',
    description: 'The sequential cell scale keeps contrast on a dark background.',
    dataset: 'standard',
    coverage: ['yMetric=y', 'Chart.colorScheme=dark'],
    render: () => (
      <HistogramVariationChart
        histogramProps={{ yMetric: 'y' }}
        axes={twoDimensionalAxes}
        chartProps={{ backgroundColor: 'gray-25', colorScheme: 'dark' }}
      />
    ),
  },
];

const interactionVariations: Variation[] = [
  {
    id: 'inspect-default',
    title: 'ChartInspect',
    description: 'Hover a bar to show its bin; other bars fade.',
    dataset: 'standard',
    coverage: ['ChartInspect.children'],
    render: () => (
      <HistogramVariationChart>
        <ChartInspect>{inspectContent}</ChartInspect>
      </HistogramVariationChart>
    ),
  },
  {
    id: 'inspect-series',
    title: 'Inspect stacked series',
    description: 'Hovering a segment shows its series and bin.',
    dataset: 'standard',
    coverage: ['ChartInspect.children', 'color=series'],
    render: () => (
      <HistogramVariationChart histogramProps={{ color: 'series' }} legend={seriesLegend}>
        <ChartInspect>{inspectContent}</ChartInspect>
      </HistogramVariationChart>
    ),
  },
  {
    id: 'inspect-two-d',
    title: 'Inspect 2D cells',
    description: 'Hovering a cell shows its x and y bins and count.',
    dataset: 'standard',
    coverage: ['ChartInspect.children', 'yMetric=y'],
    render: () => (
      <HistogramVariationChart histogramProps={{ yMetric: 'y' }} axes={twoDimensionalAxes}>
        <ChartInspect>{inspect2DContent}</ChartInspect>
      </HistogramVariationChart>
    ),
  },
  {
    id: 'named-interactive',
    title: 'Named histogram',
    description: 'A custom name keeps hover and inspect working.',
    dataset: 'standard',
    coverage: ['name=latencyHistogram', 'ChartInspect'],
    render: () => (
      <HistogramVariationChart histogramProps={{ name: 'latencyHistogram' }}>
        <ChartInspect>{inspectContent}</ChartInspect>
      </HistogramVariationChart>
    ),
  },
  {
    id: 'popover-default',
    title: 'ChartPopover',
    description: 'Click a bar to open a popover and outline the selected bin.',
    dataset: 'standard',
    coverage: ['ChartPopover.children', 'ChartPopover.width=auto'],
    render: () => (
      <HistogramVariationChart>
        <ChartPopover width="auto">{popoverContent}</ChartPopover>
      </HistogramVariationChart>
    ),
  },
  {
    id: 'popover-fixed-size',
    title: 'Fixed-size popover',
    description: 'Popover is exactly 240 × 120px.',
    dataset: 'standard',
    coverage: ['ChartPopover.width=240', 'ChartPopover.height=120'],
    render: () => (
      <HistogramVariationChart>
        <ChartPopover height={120} width={240}>
          {popoverContent}
        </ChartPopover>
      </HistogramVariationChart>
    ),
  },
  {
    id: 'popover-bounds',
    title: 'Bounded popover',
    description: 'Auto-sized popover constrained by min/max sizes with custom padding and margin.',
    dataset: 'standard',
    coverage: [
      'ChartPopover.minWidth',
      'ChartPopover.maxWidth',
      'ChartPopover.minHeight',
      'ChartPopover.maxHeight',
      'ChartPopover.containerPadding',
      'ChartPopover.contentMargin',
    ],
    render: () => (
      <HistogramVariationChart>
        <ChartPopover
          containerPadding={24}
          contentMargin={16}
          maxHeight={160}
          maxWidth={260}
          minHeight={80}
          minWidth={180}
        >
          {popoverContent}
        </ChartPopover>
      </HistogramVariationChart>
    ),
  },
  {
    id: 'popover-right-click',
    title: 'Right-click popover',
    description: 'Opens the popover on right click instead of left click.',
    dataset: 'standard',
    coverage: ['ChartPopover.rightClick=true'],
    render: () => (
      <HistogramVariationChart>
        <ChartPopover rightClick>{popoverContent}</ChartPopover>
      </HistogramVariationChart>
    ),
  },
  {
    id: 'popover-open-change',
    title: 'Popover onOpenChange',
    description: 'Open and close the popover; the latest open state is shown below the chart.',
    dataset: 'standard',
    coverage: ['ChartPopover.onOpenChange'],
    render: () => (
      <CallbackVariation
        render={(log) => (
          <HistogramVariationChart>
            <ChartPopover onOpenChange={(isOpen) => log(`Popover open: ${isOpen}`)}>{popoverContent}</ChartPopover>
          </HistogramVariationChart>
        )}
      />
    ),
  },
  {
    id: 'on-click',
    title: 'onClick',
    description: 'Click a bar; the clicked bin is shown below the chart.',
    dataset: 'standard',
    coverage: ['onClick'],
    render: () => (
      <CallbackVariation
        render={(log) => (
          <HistogramVariationChart histogramProps={{ onClick: (datum) => log(`Clicked ${formatBin(datum)}`) }} />
        )}
      />
    ),
  },
];

const siblingVariations: Variation[] = [
  {
    id: 'axis-explicit-title',
    title: 'Explicit axis titles',
    description: 'A left axis title replaces the auto "Count" title.',
    dataset: 'standard',
    coverage: ['Axis.title=Sessions', 'Axis.grid', 'Axis.baseline', 'Axis.ticks'],
    render: () => <HistogramVariationChart axes={customAxes({ title: 'Value' }, { title: 'Sessions' })} />,
  },
  {
    id: 'axis-right',
    title: 'Right metric axis',
    description: 'A right axis also gets the auto title.',
    dataset: 'standard',
    coverage: ['Axis.position=right', 'Axis.title=auto'],
    render: () => <HistogramVariationChart axes={customAxes({}, { position: 'right' })} />,
  },
  {
    id: 'axis-range-x',
    title: 'Fixed x axis range',
    description: 'The bottom axis range is fixed to 0–600; bars past 600 are cut off.',
    dataset: 'standard',
    coverage: ['Axis.range=[0,600]'],
    render: () => <HistogramVariationChart axes={customAxes({ range: [0, 600] })} />,
  },
  {
    id: 'axis-range-y',
    title: 'Fixed y axis range',
    description: 'The left axis range is fixed to 0–50%.',
    dataset: 'standard',
    coverage: ['Axis.range=[0,0.5]', 'yValue=percent'],
    render: () => (
      <HistogramVariationChart
        histogramProps={{ yValue: 'percent' }}
        axes={customAxes({}, { labelFormat: 'percentage', range: [0, 0.5] })}
      />
    ),
  },
  {
    id: 'legend-position',
    title: 'Legend on the right',
    description: 'Right legend with a title for stacked series.',
    dataset: 'standard',
    coverage: ['Legend.position=right', 'Legend.title', 'color=series'],
    render: () => (
      <HistogramVariationChart
        histogramProps={{ color: 'series' }}
        legend={() => <Legend position="right" title="Device" />}
      />
    ),
  },
  {
    id: 'chart-title',
    title: 'Chart title',
    description: 'A Title sibling above the histogram.',
    dataset: 'standard',
    coverage: ['Title.text'],
    render: () => <HistogramVariationChart siblings={() => <Title text="Response time distribution" />} />,
  },
  {
    id: 'chart-colors',
    title: 'Custom colors',
    description: 'Overrides the categorical palette for stacked series.',
    dataset: 'standard',
    coverage: ['Chart.colors=[...]', 'color=series'],
    render: () => (
      <HistogramVariationChart
        histogramProps={{ color: 'series' }}
        chartProps={{ colors: ['indigo-900', 'magenta-600', 'seafoam-600'] }}
        legend={seriesLegend}
      />
    ),
  },
  {
    id: 'dark-background',
    title: 'Dark color scheme',
    description: 'Stacked series on a dark background.',
    dataset: 'standard',
    coverage: ['Chart.colorScheme=dark', 'Chart.backgroundColor=gray-25', 'color=series'],
    render: () => (
      <HistogramVariationChart
        histogramProps={{ color: 'series' }}
        chartProps={{ backgroundColor: 'gray-25', colorScheme: 'dark' }}
        legend={seriesLegend}
      />
    ),
  },
  {
    id: 'locale',
    title: 'German locale',
    description: 'Formats axis numbers with de-DE separators and translates the auto axis title.',
    dataset: 'largeValues',
    usesDashboardDataset: false,
    coverage: ['Chart.locale=de-DE', 'Axis.numberFormat'],
    render: () => (
      <HistogramVariationChart
        axes={customAxes({ numberFormat: ',.0f' })}
        chartProps={{ locale: 'de-DE' }}
        data={histogramVariationDatasets.largeValues}
      />
    ),
  },
  {
    id: 'empty-state',
    title: 'Empty data',
    description: 'Shows the empty state text when data is an empty array.',
    dataset: 'empty',
    usesDashboardDataset: false,
    coverage: ['Chart.emptyStateText', 'data=[]'],
    render: () => <HistogramVariationChart chartProps={{ emptyStateText: 'No requests' }} data={[]} />,
  },
  {
    id: 'loading',
    title: 'Loading',
    description: 'Shows the loading spinner in place of the chart.',
    dataset: 'standard',
    coverage: ['Chart.loading=true'],
    render: () => <HistogramVariationChart chartProps={{ loading: true }} />,
  },
];

export const histogramVariations: Variation[] = [
  ...binVariations,
  ...weightVariations,
  ...orientationVariations,
  ...colorVariations,
  ...yValueVariations,
  ...densityCurveVariations,
  ...twoDimensionalVariations,
  ...interactionVariations,
  ...siblingVariations,
];

export const HistogramDashboard = (): ReactElement => (
  <VariationDashboard
    variations={histogramVariations}
    coverage={dashboard.coverage}
    chartType="Histogram"
    datasets={histogramDatasetOptions}
    filters={histogramVariationFilters}
    getSizeDescription={(size) => `Chart: ${size} × ${Math.round(size * HISTOGRAM_ASPECT_RATIO)}px`}
    initialSize={360}
    initialDataset="standard"
    initialFilter="all"
    initialViewMode="axes"
    sizePresets={histogramSizePresets}
    animationControls={['drawIn']}
    viewModes={histogramViewModes}
  />
);

const histogramCoverage: PropCoverage<HistogramProps> = {
  binAnchor: ['bin-anchor', 'bin-anchor-zero', 'bin-anchor-edges-ignored'],
  binCount: ['defaults', 'bin-count-few', 'bin-count-many', 'bin-size-overrides-count', 'two-d-bin-count'],
  binEdges: ['bin-edges', 'bin-edges-overrides', 'y-density-edges', 'bin-anchor-edges-ignored', 'density-curve-edges'],
  binSize: ['bin-size', 'bin-size-overrides-count', 'bin-edges-overrides', 'bin-anchor'],
  cellColors: ['two-d', 'two-d-cell-colors-magma', 'two-d-cell-colors-viridis', 'two-d-cell-colors-forest'],
  cellLegend: ['two-d', 'two-d-no-legend'],
  cellLegendTitle: ['two-d', 'two-d-legend-title', 'two-d-weight'],
  children: ['inspect-default', 'popover-default'],
  color: ['defaults', 'color-static', 'color-series'],
  cumulative: [
    'defaults',
    'cumulative-count',
    'cumulative-percent',
    'cumulative-density',
    'cumulative-series',
    'weight-cumulative',
    'density-curve-cumulative',
  ],
  densityCurve: [
    'defaults',
    'density-curve',
    'density-curve-stacked',
    'density-curve-overlaid',
    'density-curve-dodged',
    'density-curve-percent',
    'density-curve-density',
    'density-curve-cumulative',
    'density-curve-edges',
    'density-curve-edges-count',
    'horizontal-density-curve',
    'weight-density-curve',
  ],
  drawInEffect: ['defaults', 'draw-in-sweep', 'draw-in-fade', 'two-d-draw-in-sweep', 'horizontal-draw-in-sweep'],
  extent: ['extent-inner', 'extent-wide', 'bin-edges-overrides'],
  layout: [
    'defaults',
    'color-series',
    'layout-overlaid',
    'layout-overlaid-static',
    'layout-dodged',
    'layout-dodged-percent',
    'layout-dodged-static',
    'horizontal-dodged',
  ],
  metric: ['defaults', 'custom-metric'],
  name: ['defaults', 'named-interactive'],
  onClick: ['on-click'],
  orientation: [
    'defaults',
    'horizontal',
    'horizontal-stacked',
    'horizontal-dodged',
    'horizontal-density-curve',
    'horizontal-percent',
    'two-d-ignores-1d-props',
  ],
  weight: [
    'weight-sum',
    'weight-percent',
    'weight-series',
    'weight-cumulative',
    'weight-density-curve',
    'two-d-weight',
  ],
  yBinCount: ['two-d-bin-count'],
  yBinSize: ['two-d-bin-size'],
  yExtent: ['two-d-extent'],
  yMetric: [
    'two-d',
    'two-d-bin-count',
    'two-d-bin-size',
    'two-d-extent',
    'two-d-cell-colors-magma',
    'two-d-no-legend',
    'two-d-weight',
    'two-d-ignores-1d-props',
    'two-d-dark',
    'inspect-two-d',
  ],
  yValue: [
    'defaults',
    'y-percent',
    'y-percent-series',
    'y-density',
    'cumulative-percent',
    'cumulative-density',
    'weight-percent',
    'density-curve-percent',
  ],
};
const chartInspectCoverage: PropCoverage<ChartInspectProps> = {
  children: ['inspect-default', 'inspect-series', 'inspect-two-d'],
  excludeDataKeys: { skip: 'Not read by the Histogram spec builder; bins aggregate rows' },
  highlightBy: { skip: 'Not read by the Histogram spec builder; only the hovered bin stays emphasized' },
  targets: { skip: 'Histogram has no dimension hover area; only the default item target applies' },
};
const chartPopoverCoverage: PropCoverage<ChartPopoverProps> = {
  children: ['popover-default'],
  containerPadding: ['popover-bounds'],
  contentMargin: ['popover-bounds'],
  height: ['popover-fixed-size', 'popover-bounds'],
  maxHeight: ['popover-bounds'],
  maxWidth: ['popover-bounds'],
  minHeight: ['popover-bounds'],
  minWidth: ['popover-bounds'],
  onOpenChange: ['popover-open-change'],
  rightClick: ['popover-right-click'],
  UNSAFE_highlightBy: { skip: 'Not read by the Histogram spec builder; only the clicked bin is outlined' },
  width: ['popover-default', 'popover-fixed-size'],
};
const axisCoverage: SiblingCoverage<AxisProps> = {
  baseline: ['axis-explicit-title'],
  grid: ['axis-explicit-title'],
  labelFormat: ['y-percent', 'cumulative-percent', 'horizontal-percent'],
  numberFormat: ['defaults', 'locale'],
  position: ['defaults', 'axis-right', 'horizontal'],
  range: ['axis-range-x', 'axis-range-y'],
  ticks: ['axis-explicit-title'],
  title: [
    'defaults',
    'y-percent',
    'y-density',
    'cumulative-count',
    'axis-explicit-title',
    'axis-right',
    'weight-sum',
    'horizontal',
    'horizontal-percent',
  ],
};
const legendCoverage: SiblingCoverage<LegendProps> = {
  position: ['color-series', 'legend-position'],
  title: ['color-series', 'legend-position', 'layout-dodged', 'horizontal-dodged'],
};
const titleCoverage: SiblingCoverage<TitleProps> = {
  text: ['chart-title'],
};
const chartCoverage: SiblingCoverage<ChartProps> = {
  animations: { skip: 'Covered by the dashboard animation switch' },
  animationTypes: { skip: 'Covered by the dashboard animation switch' },
  backgroundColor: ['dark-background', 'two-d-dark'],
  colors: ['chart-colors'],
  colorScheme: ['dark-background', 'two-d-dark'],
  emptyStateText: ['empty-state'],
  loading: ['loading'],
  locale: ['locale'],
  renderer: { skip: 'Covered by the dashboard Renderer control' },
};

export const dashboard: DashboardDefinition = {
  chartType: 'Histogram',
  variations: histogramVariations,
  coverage: {
    Histogram: histogramCoverage,
    ChartInspect: chartInspectCoverage,
    ChartPopover: chartPopoverCoverage,
    Axis: axisCoverage,
    Legend: legendCoverage,
    Title: titleCoverage,
    Chart: chartCoverage,
  },
};
