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
import { Axis, ChartInspect, ChartPopover, Legend, Line, ReferenceLine, Title } from '../../../components/index.js';
import useChartProps from '../../../hooks/useChartProps.js';
import { Area } from '../../../pre-alpha/index.js';
import {
  AreaProps,
  AxisProps,
  ChartInspectProps,
  ChartPopoverProps,
  ChartProps,
  LegendProps,
  TitleProps,
} from '../../../types/index.js';
import { ReferenceLineProps } from '../../../types/axis/referenceLine.types.js';
import {
  Variation,
  VariationDashboard,
  VariationFilter,
  VariationSizePreset,
  VariationViewMode,
  useVariationDataset,
  useVariationRenderer,
  useVariationSize,
  useVariationViewMode,
} from '../../VariationDashboard.js';
import { DashboardDefinition, PropCoverage, SiblingCoverage } from '../../dashboardCoverage.js';
import {
  AreaVariationDatasetName,
  AreaVariationDatum,
  areaDatasetOptions,
  areaVariationDatasets,
  getAreaSeries,
  getFirstSeries,
  getPeakId,
} from './areaVariationData.js';

const areaSizePresets: VariationSizePreset[] = [
  { label: 'XS', size: 160 },
  { label: 'S', size: 240 },
  { label: 'M', size: 360 },
  { label: 'L', size: 480 },
  { label: 'XL', size: 720 },
];

const areaViewModes: VariationViewMode[] = [
  { label: 'Axes', value: 'axes' },
  { label: 'Axes and legend', value: 'axesLegend' },
  { label: 'Areas only', value: 'none' },
];

const AREA_ASPECT_RATIO = 0.6;

const AREA_CHILDREN = new Set(['ChartInspect', 'ChartPopover']);
const SIBLINGS = new Set(['Axis', 'Chart', 'Legend', 'Line', 'ReferenceLine', 'Title']);

const getCoverageComponent = (entry: string): string => entry.split(/[.=[]/)[0];
const coversAny =
  (components: Set<string>) =>
  ({ coverage }: Variation): boolean =>
    coverage.some((entry) => components.has(getCoverageComponent(entry)));
const coversAreaProp = ({ coverage }: Variation): boolean =>
  coverage.some((entry) => /^[a-z]/.test(getCoverageComponent(entry)));

const areaVariationFilters: VariationFilter[] = [
  { label: 'All', value: 'all', matches: () => true },
  { label: 'Area props', value: 'area', matches: coversAreaProp },
  { label: 'Children', value: 'children', matches: coversAny(AREA_CHILDREN) },
  { label: 'Siblings & Chart', value: 'siblings', matches: coversAny(SIBLINGS) },
];

const singleAreaData = areaVariationDatasets.single;
const negativeAreaData = areaVariationDatasets.negative;
const gapAreaData = areaVariationDatasets.gaps;
const unevenAreaData = areaVariationDatasets.uneven;
const denseAreaData = areaVariationDatasets.dense;
const largeAreaData = areaVariationDatasets.largeValues;

const formatWeek = (datetime: unknown): string =>
  new Date(Number(datetime)).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });

const formatDatum = (datum: Datum): string =>
  `${String(datum.series)} · ${formatWeek(datum.datetime)} · ${Number(datum.value).toLocaleString('en-US')}`;

const inspectContent = (datum: Datum): ReactNode => (
  <div>
    <div>{String(datum.series)}</div>
    <div>Week of {formatWeek(datum.datetime)}</div>
    <div>{Number(datum.value).toLocaleString('en-US')} sessions</div>
  </div>
);

const bandInspectContent = (datum: Datum): ReactNode => (
  <div>
    <div>{String(datum.series)}</div>
    <div>Week of {formatWeek(datum.datetime)}</div>
    <div>
      {Number(datum.low).toLocaleString('en-US')} – {Number(datum.high).toLocaleString('en-US')}
    </div>
  </div>
);

const popoverContent = (datum: Datum, close: () => void): ReactNode => (
  <div>
    <div>{formatDatum(datum)}</div>
    <button type="button" onClick={close}>
      Close
    </button>
  </div>
);

type AreaChartOverrides = Omit<Partial<ChartProps>, 'children' | 'data'>;
type DataFunction<T> = T | ((data: AreaVariationDatum[]) => T);

const resolve = <T,>(value: DataFunction<T> | undefined, data: AreaVariationDatum[]): T | undefined =>
  typeof value === 'function' ? (value as (data: AreaVariationDatum[]) => T)(data) : value;

interface AreaVariationChartProps extends Pick<AreaProps, 'children'> {
  /** Fixed data, or a function deriving data from the active dataset. */
  data?: DataFunction<AreaVariationDatum[]>;
  /** Area prop overrides. */
  areaProps?: DataFunction<Omit<AreaProps, 'children'>>;
  /** Chart prop overrides; functions receive the active dataset. */
  chartProps?: DataFunction<AreaChartOverrides>;
  /** Replaces the default axes in every view mode. */
  axes?: (data: AreaVariationDatum[]) => ReactNode;
  /** Replaces the default legend in every view mode. */
  legend?: (data: AreaVariationDatum[]) => ReactNode;
  /** Extra chart-level siblings such as Title, or marks drawn before the area. */
  siblings?: (data: AreaVariationDatum[]) => ReactNode;
}

const timeAxes = (
  metricAxisProps: Omit<AxisProps, 'position'> = {},
  dimensionAxisProps: Omit<AxisProps, 'position'> = {}
): ReactElement[] => [
  <Axis key="dimension" position="bottom" baseline labelFormat="time" {...dimensionAxisProps} />,
  <Axis key="metric" position="left" grid numberFormat="shortNumber" {...metricAxisProps} />,
];

const AreaVariationChart = ({
  data,
  areaProps,
  children,
  chartProps: chartPropOverrides,
  axes,
  legend,
  siblings,
}: AreaVariationChartProps): ReactElement => {
  const selectedDataset = useVariationDataset();
  const size = useVariationSize();
  const viewMode = useVariationViewMode();
  const renderer = useVariationRenderer();
  if (!selectedDataset || !(selectedDataset in areaVariationDatasets)) {
    throw new Error(`Unknown Area variation dataset: ${selectedDataset}`);
  }
  const datasetData = areaVariationDatasets[selectedDataset as AreaVariationDatasetName];
  const chartData = resolve(data, datasetData) ?? datasetData;
  const chartProps = useChartProps({
    data: chartData,
    width: size,
    height: Math.round(size * AREA_ASPECT_RATIO),
  });
  const showDefaultAxes = viewMode !== 'none';
  let legendNode: ReactNode = null;
  if (legend) {
    legendNode = legend(chartData);
  } else if (viewMode === 'axesLegend') {
    legendNode = <Legend highlight />;
  }
  return (
    <Chart {...chartProps} renderer={renderer} {...resolve(chartPropOverrides, chartData)}>
      {axes ? axes(chartData) : showDefaultAxes && timeAxes()}
      {siblings?.(chartData)}
      <Area {...resolve(areaProps, chartData)}>{children}</Area>
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

const categoricalAxes = (title: string) => (): ReactElement[] => [
  <Axis key="dimension" position="bottom" baseline title={title} />,
  <Axis key="metric" position="left" grid numberFormat="shortNumber" />,
];

const baseAreaVariations: Variation[] = [
  {
    id: 'defaults',
    title: 'Defaults',
    description: 'Single series with every Area default: datetime × value, colored by series, 0.8 opacity.',
    dataset: 'single',
    usesDashboardDataset: false,
    coverage: ['color=series', 'dimension=datetime', 'metric=value', 'opacity=0.8', 'scaleType=time', 'name=area0'],
    render: () => <AreaVariationChart data={singleAreaData} />,
  },
  {
    id: 'stacked',
    title: 'Stacked by series',
    description: 'Each series gets a categorical color and stacks on the previous one.',
    dataset: 'standard',
    coverage: ['color=series'],
    render: () => <AreaVariationChart areaProps={{ color: 'series' }} />,
  },
  {
    id: 'metric-previous',
    title: 'Custom metric',
    description: 'Stacks the `previous` field (80% of value) instead of `value`.',
    dataset: 'standard',
    coverage: ['metric=previous'],
    render: () => <AreaVariationChart areaProps={{ metric: 'previous' }} />,
  },
  {
    id: 'color-custom-key',
    title: 'Custom color key',
    description: 'Colors and stacks by a `source` field copied from series.',
    dataset: 'standard',
    coverage: ['color=source'],
    render: () => (
      <AreaVariationChart
        areaProps={{ color: 'source' }}
        data={(data) => data.map((datum) => ({ ...datum, source: datum.series }))}
        legend={() => <Legend color="source" />}
      />
    ),
  },
  {
    id: 'dimension-date-string',
    title: 'Date string dimension',
    description: 'Parses `date` strings (YYYY-MM-DD) on the time scale.',
    dataset: 'standard',
    coverage: ['dimension=date', 'scaleType=time'],
    render: () => <AreaVariationChart areaProps={{ dimension: 'date' }} />,
  },
  {
    id: 'stack-order',
    title: 'Stack order',
    description: 'Higher `order` values stack on top, so the first series sits on top.',
    dataset: 'standard',
    coverage: ['order=order'],
    render: () => <AreaVariationChart areaProps={{ order: 'order' }} />,
  },
  {
    id: 'opacity-low',
    title: 'Low opacity',
    description: 'opacity 0.4 lightens every area fill.',
    dataset: 'standard',
    coverage: ['opacity=0.4'],
    render: () => <AreaVariationChart areaProps={{ opacity: 0.4 }} />,
  },
  {
    id: 'opacity-full',
    title: 'Full opacity',
    description: 'opacity 1 draws solid fills.',
    dataset: 'standard',
    coverage: ['opacity=1'],
    render: () => <AreaVariationChart areaProps={{ opacity: 1 }} />,
  },
  {
    id: 'scale-linear',
    title: 'Linear scale',
    description: 'Plots against the numeric `week` field with true spacing.',
    dataset: 'standard',
    coverage: ['scaleType=linear', 'dimension=week'],
    render: () => (
      <AreaVariationChart axes={categoricalAxes('Week')} areaProps={{ dimension: 'week', scaleType: 'linear' }} />
    ),
  },
  {
    id: 'scale-point',
    title: 'Point scale',
    description: 'Plots against the `label` strings, evenly spaced.',
    dataset: 'standard',
    coverage: ['scaleType=point', 'dimension=label'],
    render: () => (
      <AreaVariationChart axes={categoricalAxes('Week')} areaProps={{ dimension: 'label', scaleType: 'point' }} />
    ),
  },
  {
    id: 'padding-time',
    title: 'Time scale padding',
    description: 'padding 32 adds 32px before the first and after the last week.',
    dataset: 'standard',
    coverage: ['padding=32', 'scaleType=time'],
    render: () => <AreaVariationChart areaProps={{ padding: 32 }} />,
  },
  {
    id: 'padding-point',
    title: 'Point scale padding',
    description: 'padding 0 removes the default half-step padding, so the areas meet both axes.',
    dataset: 'standard',
    coverage: ['padding=0', 'scaleType=point'],
    render: () => (
      <AreaVariationChart
        axes={categoricalAxes('Week')}
        areaProps={{ dimension: 'label', padding: 0, scaleType: 'point' }}
      />
    ),
  },
  {
    id: 'band-single',
    title: 'Floating band',
    description: 'metricStart/metricEnd draw a band from `low` to `high` instead of stacking from zero.',
    dataset: 'single',
    usesDashboardDataset: false,
    coverage: ['metricStart=low', 'metricEnd=high'],
    render: () => <AreaVariationChart data={singleAreaData} areaProps={{ metricStart: 'low', metricEnd: 'high' }} />,
  },
  {
    id: 'band-multi',
    title: 'Overlapping bands',
    description: 'Each series gets its own unstacked band; overlaps blend.',
    dataset: 'standard',
    coverage: ['metricStart=low', 'metricEnd=high', 'color=series'],
    render: () => <AreaVariationChart areaProps={{ metricStart: 'low', metricEnd: 'high', opacity: 0.5 }} />,
  },
  {
    id: 'band-with-line',
    title: 'Band with line',
    description: 'A Line of `value` drawn over its low–high band.',
    dataset: 'single',
    usesDashboardDataset: false,
    coverage: ['metricStart=low', 'metricEnd=high', 'Line'],
    render: () => (
      <AreaVariationChart
        data={singleAreaData}
        areaProps={{ metricStart: 'low', metricEnd: 'high', opacity: 0.3 }}
        siblings={() => <Line color="series" />}
      />
    ),
  },
  {
    id: 'two-areas',
    title: 'Two Area marks',
    description: 'A faint `previous` area behind the current `value` area; marks are named area0 and area1.',
    dataset: 'single',
    usesDashboardDataset: false,
    coverage: ['metric=previous', 'opacity=0.3'],
    render: () => (
      <AreaVariationChart
        data={singleAreaData}
        areaProps={{ opacity: 0.6 }}
        siblings={() => <Area metric="previous" opacity={0.3} />}
      />
    ),
  },
  {
    id: 'negative',
    title: 'Negative values',
    description: 'Positive and negative values stack away from zero.',
    dataset: 'negative',
    usesDashboardDataset: false,
    coverage: ['metric=value'],
    render: () => <AreaVariationChart data={negativeAreaData} />,
  },
  {
    id: 'gaps-stacked',
    title: 'Stacked with gaps',
    description: 'Undefined values are stacked as zero, so the area dips to its baseline.',
    dataset: 'gaps',
    usesDashboardDataset: false,
    coverage: ['metric=value'],
    render: () => <AreaVariationChart data={gapAreaData} />,
  },
  {
    id: 'gaps-band',
    title: 'Band with gaps',
    description: 'Undefined low/high values break the floating band.',
    dataset: 'gaps',
    usesDashboardDataset: false,
    coverage: ['metricStart=low', 'metricEnd=high'],
    render: () => (
      <AreaVariationChart data={getFirstSeries(gapAreaData)} areaProps={{ metricStart: 'low', metricEnd: 'high' }} />
    ),
  },
  {
    id: 'uneven-sampling',
    title: 'Uneven sampling',
    description: 'Series sampled on different weeks; missing weeks are not imputed, so stack edges do not meet.',
    dataset: 'uneven',
    usesDashboardDataset: false,
    coverage: ['metric=value'],
    render: () => <AreaVariationChart data={unevenAreaData} legend={() => <Legend />} />,
  },
  {
    id: 'dense',
    title: 'Dense stack',
    description: 'Eight series across 52 weeks.',
    dataset: 'dense',
    usesDashboardDataset: false,
    coverage: ['color=series'],
    render: () => <AreaVariationChart data={denseAreaData} />,
  },
];

const childVariations: Variation[] = [
  {
    id: 'named-inspect',
    title: 'Named area with inspect',
    description: 'Sets a custom mark name; hover must still show inspect.',
    dataset: 'standard',
    coverage: ['name=sessions', 'ChartInspect.children'],
    render: () => (
      <AreaVariationChart areaProps={{ name: 'sessions' }}>
        <ChartInspect>{inspectContent}</ChartInspect>
      </AreaVariationChart>
    ),
  },
  {
    id: 'inspect-default',
    title: 'ChartInspect',
    description: 'Hover an area to show inspect content, a point and a rule at the nearest week.',
    dataset: 'standard',
    coverage: ['ChartInspect.children', 'ChartInspect.highlightBy=item', 'ChartInspect.targets=[item]'],
    render: () => (
      <AreaVariationChart>
        <ChartInspect>{inspectContent}</ChartInspect>
      </AreaVariationChart>
    ),
  },
  {
    id: 'inspect-highlight-series',
    title: 'Inspect highlights series',
    description: 'Hovering keeps the hovered series emphasized and fades the others.',
    dataset: 'standard',
    coverage: ['ChartInspect.highlightBy=series'],
    render: () => (
      <AreaVariationChart>
        <ChartInspect highlightBy="series">{inspectContent}</ChartInspect>
      </AreaVariationChart>
    ),
  },
  {
    id: 'inspect-highlight-dimension',
    title: 'Inspect highlights dimension',
    description: 'Hovering marks every series at the hovered week.',
    dataset: 'standard',
    coverage: ['ChartInspect.highlightBy=dimension'],
    render: () => (
      <AreaVariationChart>
        <ChartInspect highlightBy="dimension">{inspectContent}</ChartInspect>
      </AreaVariationChart>
    ),
  },
  {
    id: 'inspect-highlight-keys',
    title: 'Inspect highlights by keys',
    description: 'Highlights every series sharing the hovered `channel` value.',
    dataset: 'standard',
    coverage: ['ChartInspect.highlightBy=[channel]'],
    render: () => (
      <AreaVariationChart>
        <ChartInspect highlightBy={['channel']}>{inspectContent}</ChartInspect>
      </AreaVariationChart>
    ),
  },
  {
    id: 'inspect-target-dimension-area',
    title: 'Inspect dimension area target',
    description: 'Area ignores the dimensionArea target; hovering still shows item inspect.',
    dataset: 'standard',
    coverage: ['ChartInspect.targets=[dimensionArea,item]'],
    render: () => (
      <AreaVariationChart>
        <ChartInspect targets={['dimensionArea', 'item']}>{inspectContent}</ChartInspect>
      </AreaVariationChart>
    ),
  },
  {
    id: 'inspect-exclude-keys',
    title: 'Inspect with excluded data',
    description: 'The first series has `excludeFromInspect`, so hovering it shows no inspect.',
    dataset: 'standard',
    coverage: ['ChartInspect.excludeDataKeys=[excludeFromInspect]'],
    render: () => (
      <AreaVariationChart>
        <ChartInspect excludeDataKeys={['excludeFromInspect']}>{inspectContent}</ChartInspect>
      </AreaVariationChart>
    ),
  },
  {
    id: 'inspect-band',
    title: 'Inspect on a floating band',
    description: 'Hover the band; the point sits on its upper edge.',
    dataset: 'single',
    usesDashboardDataset: false,
    coverage: ['ChartInspect.children', 'metricStart=low', 'metricEnd=high'],
    render: () => (
      <AreaVariationChart data={singleAreaData} areaProps={{ metricStart: 'low', metricEnd: 'high' }}>
        <ChartInspect>{bandInspectContent}</ChartInspect>
      </AreaVariationChart>
    ),
  },
  {
    id: 'popover-default',
    title: 'ChartPopover',
    description: 'Click an area to open a popover; the clicked series gets a selection border.',
    dataset: 'standard',
    coverage: ['ChartPopover.children', 'ChartPopover.width=auto'],
    render: () => (
      <AreaVariationChart>
        <ChartPopover width="auto">{popoverContent}</ChartPopover>
      </AreaVariationChart>
    ),
  },
  {
    id: 'popover-fixed-size',
    title: 'Fixed-size popover',
    description: 'Popover is exactly 240 × 120px.',
    dataset: 'standard',
    coverage: ['ChartPopover.width=240', 'ChartPopover.height=120'],
    render: () => (
      <AreaVariationChart>
        <ChartPopover height={120} width={240}>
          {popoverContent}
        </ChartPopover>
      </AreaVariationChart>
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
      <AreaVariationChart>
        <ChartPopover
          containerPadding={24}
          contentMargin={16}
          height="auto"
          maxHeight={160}
          maxWidth={220}
          minHeight={100}
          minWidth={180}
          width="auto"
        >
          {popoverContent}
        </ChartPopover>
      </AreaVariationChart>
    ),
  },
  {
    id: 'popover-right-click',
    title: 'Right-click popover',
    description: 'Opens the popover on right click instead of left click.',
    dataset: 'standard',
    coverage: ['ChartPopover.rightClick=true'],
    render: () => (
      <AreaVariationChart>
        <ChartPopover rightClick>{popoverContent}</ChartPopover>
      </AreaVariationChart>
    ),
  },
  {
    id: 'popover-highlight-series',
    title: 'Popover highlights series',
    description: 'While open, the clicked series stays highlighted.',
    dataset: 'standard',
    coverage: ['ChartPopover.UNSAFE_highlightBy=series'],
    render: () => (
      <AreaVariationChart>
        <ChartPopover UNSAFE_highlightBy="series">{popoverContent}</ChartPopover>
      </AreaVariationChart>
    ),
  },
  {
    id: 'popover-highlight-dimension',
    title: 'Popover highlights dimension',
    description: 'Area ignores dimension highlighting; only the clicked series stays highlighted.',
    dataset: 'standard',
    coverage: ['ChartPopover.UNSAFE_highlightBy=dimension'],
    render: () => (
      <AreaVariationChart>
        <ChartPopover UNSAFE_highlightBy="dimension">{popoverContent}</ChartPopover>
      </AreaVariationChart>
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
          <AreaVariationChart>
            <ChartPopover onOpenChange={(isOpen) => log(`Popover open: ${isOpen}`)}>{popoverContent}</ChartPopover>
          </AreaVariationChart>
        )}
      />
    ),
  },
  {
    id: 'inspect-and-popover',
    title: 'Inspect and popover',
    description: 'Hover shows inspect; click opens a popover.',
    dataset: 'standard',
    coverage: ['ChartInspect.children', 'ChartPopover.children'],
    render: () => (
      <AreaVariationChart>
        <ChartInspect>{inspectContent}</ChartInspect>
        <ChartPopover width="auto">{popoverContent}</ChartPopover>
      </AreaVariationChart>
    ),
  },
];

const axisVariations: Variation[] = [
  {
    id: 'axis-titles-format',
    title: 'Axis titles and number format',
    description: 'Titled axes with ticks; the metric axis uses compact numbers for billions.',
    dataset: 'largeValues',
    usesDashboardDataset: false,
    coverage: ['Axis.title', 'Axis.numberFormat=shortNumber', 'Axis.grid', 'Axis.baseline', 'Axis.ticks'],
    render: () => (
      <AreaVariationChart
        axes={() => timeAxes({ title: 'Revenue' }, { ticks: true, title: 'Week' })}
        data={largeAreaData}
      />
    ),
  },
  {
    id: 'axis-currency',
    title: 'Currency metric axis',
    description: 'Formats the metric axis as compact currency.',
    dataset: 'largeValues',
    usesDashboardDataset: false,
    coverage: ['Axis.numberFormat=shortCurrency', 'Axis.currencyCode=EUR'],
    render: () => (
      <AreaVariationChart
        axes={() => timeAxes({ currencyCode: 'EUR', numberFormat: 'shortCurrency' })}
        data={largeAreaData}
      />
    ),
  },
  {
    id: 'axis-granularity',
    title: 'Monthly time labels',
    description: 'Time axis labeled by month instead of by day.',
    dataset: 'dense',
    usesDashboardDataset: false,
    coverage: ['Axis.labelFormat=time', 'Axis.granularity=month'],
    render: () => <AreaVariationChart axes={() => timeAxes({}, { granularity: 'month' })} data={denseAreaData} />,
  },
  {
    id: 'axis-range',
    title: 'Fixed metric range',
    description: 'Pins the metric axis to 0–20,000.',
    dataset: 'standard',
    coverage: ['Axis.range=[0,20000]'],
    render: () => <AreaVariationChart axes={() => timeAxes({ range: [0, 20000] })} />,
  },
  {
    id: 'axis-tick-limits',
    title: 'Tick count limit',
    description: 'At most three metric ticks.',
    dataset: 'standard',
    coverage: ['Axis.tickCountLimit=3'],
    render: () => <AreaVariationChart axes={() => timeAxes({ tickCountLimit: 3 })} />,
  },
  {
    id: 'axis-right',
    title: 'Right metric axis',
    description: 'Metric axis on the right instead of the left.',
    dataset: 'standard',
    coverage: ['Axis.position=right'],
    render: () => (
      <AreaVariationChart
        axes={() => [
          <Axis key="bottom" position="bottom" baseline labelFormat="time" />,
          <Axis key="right" position="right" grid numberFormat="shortNumber" />,
        ]}
      />
    ),
  },
  {
    id: 'axis-reference-lines',
    title: 'Reference lines',
    description: 'A labeled goal and a secondary small prior-average line on the metric axis.',
    dataset: 'standard',
    coverage: [
      'Axis.children',
      'ReferenceLine.value',
      'ReferenceLine.label',
      'ReferenceLine.secondary',
      'ReferenceLine.size=S',
    ],
    render: () => (
      <AreaVariationChart
        axes={() => [
          <Axis key="bottom" position="bottom" baseline labelFormat="time" />,
          <Axis key="left" position="left" grid numberFormat="shortNumber">
            <ReferenceLine label="Goal" value={10000} />
            <ReferenceLine label="Prior avg" secondary size="S" value={6000} />
          </Axis>,
        ]}
      />
    ),
  },
];

const legendVariations: Variation[] = [
  {
    id: 'legend-default',
    title: 'Legend',
    description: 'Default bottom legend; hovering an entry highlights its area.',
    dataset: 'standard',
    coverage: ['Legend.position=bottom', 'Legend.highlight'],
    render: () => <AreaVariationChart legend={() => <Legend highlight />} />,
  },
  {
    id: 'legend-right-title',
    title: 'Right legend with title',
    description: 'Moves the legend to the right and adds a title.',
    dataset: 'standard',
    coverage: ['Legend.position=right', 'Legend.title'],
    render: () => <AreaVariationChart legend={() => <Legend position="right" title="Channel" />} />,
  },
  {
    id: 'legend-toggleable',
    title: 'Toggleable legend',
    description: 'Click entries to hide series; the first series starts hidden and the stack closes the gap.',
    dataset: 'standard',
    coverage: ['Legend.isToggleable', 'Legend.defaultHiddenSeries=[first]'],
    render: () => (
      <AreaVariationChart
        legend={(data) => <Legend defaultHiddenSeries={getAreaSeries(data).slice(0, 1)} isToggleable />}
      />
    ),
  },
  {
    id: 'legend-hidden-entries',
    title: 'Hidden legend entry',
    description: 'Omits the last series from the legend while its area still renders.',
    dataset: 'standard',
    coverage: ['Legend.hiddenEntries=[last]'],
    render: () => <AreaVariationChart legend={(data) => <Legend hiddenEntries={getAreaSeries(data).slice(-1)} />} />,
  },
  {
    id: 'legend-labels',
    title: 'Custom legend labels',
    description: 'Replaces series names with longer labels truncated at 80px.',
    dataset: 'standard',
    coverage: ['Legend.legendLabels', 'Legend.labelLimit=80'],
    render: () => (
      <AreaVariationChart
        legend={(data) => (
          <Legend
            labelLimit={80}
            legendLabels={getAreaSeries(data).map((series) => ({ seriesName: series, label: `${series} sessions` }))}
          />
        )}
      />
    ),
  },
  {
    id: 'legend-descriptions',
    title: 'Legend descriptions',
    description: 'Hover a legend entry to see its description tooltip.',
    dataset: 'standard',
    coverage: ['Legend.descriptions'],
    render: () => (
      <AreaVariationChart
        legend={(data) => (
          <Legend
            descriptions={getAreaSeries(data).map((series) => ({
              seriesName: series,
              description: `Sessions from ${series} sources`,
            }))}
          />
        )}
      />
    ),
  },
];

const chartVariations: Variation[] = [
  {
    id: 'chart-title',
    title: 'Chart title',
    description: 'Adds a Title sibling above the chart.',
    dataset: 'standard',
    coverage: ['Title.text'],
    render: () => <AreaVariationChart siblings={() => <Title text="Weekly sessions by channel" />} />,
  },
  {
    id: 'controlled-hidden-series',
    title: 'Controlled hidden series',
    description: 'Hides the first series through the Chart hiddenSeries prop.',
    dataset: 'standard',
    coverage: ['Chart.hiddenSeries=[first]'],
    render: () => (
      <AreaVariationChart
        chartProps={(data) => ({ hiddenSeries: getAreaSeries(data).slice(0, 1) })}
        legend={() => <Legend />}
      />
    ),
  },
  {
    id: 'controlled-highlighted-series',
    title: 'Controlled highlighted series',
    description: 'Highlights the first series through the Chart highlightedSeries prop.',
    dataset: 'standard',
    coverage: ['Chart.highlightedSeries=first'],
    render: () => <AreaVariationChart chartProps={(data) => ({ highlightedSeries: getAreaSeries(data)[0] })} />,
  },
  {
    id: 'controlled-highlighted-item',
    title: 'Controlled highlighted item',
    description: 'Marks the first series peak with a point and rule using idKey="id" and highlightedItem.',
    dataset: 'standard',
    coverage: ['Chart.idKey=id', 'Chart.highlightedItem=peak'],
    render: () => <AreaVariationChart chartProps={(data) => ({ idKey: 'id', highlightedItem: getPeakId(data) })} />,
  },
  {
    id: 'controlled-highlighted-item-inspect',
    title: 'Controlled highlighted item with inspect',
    description: 'Starts with the first series peak highlighted; hovering replaces it.',
    dataset: 'standard',
    coverage: ['Chart.idKey=id', 'Chart.highlightedItem=peak', 'ChartInspect.children'],
    render: () => (
      <AreaVariationChart chartProps={(data) => ({ idKey: 'id', highlightedItem: getPeakId(data) })}>
        <ChartInspect>{inspectContent}</ChartInspect>
      </AreaVariationChart>
    ),
  },
  {
    id: 'chart-colors',
    title: 'Custom colors',
    description: 'Overrides the categorical palette.',
    dataset: 'standard',
    coverage: ['Chart.colors=[...]'],
    render: () => (
      <AreaVariationChart chartProps={{ colors: ['indigo-900', 'magenta-600', 'seafoam-600', 'orange-500'] }} />
    ),
  },
  {
    id: 'dark-background',
    title: 'Dark color scheme',
    description: 'Renders axes and areas on a dark background.',
    dataset: 'standard',
    coverage: ['Chart.colorScheme=dark', 'Chart.backgroundColor=gray-25'],
    render: () => (
      <AreaVariationChart chartProps={{ backgroundColor: 'gray-25', colorScheme: 'dark' }} legend={() => <Legend />}>
        <ChartInspect>{inspectContent}</ChartInspect>
      </AreaVariationChart>
    ),
  },
  {
    id: 'locale',
    title: 'German locale',
    description: 'Formats axis numbers and month names with de-DE conventions.',
    dataset: 'standard',
    coverage: ['Chart.locale=de-DE'],
    render: () => (
      <AreaVariationChart
        axes={() => timeAxes({ numberFormat: ',.0f' }, { granularity: 'month' })}
        chartProps={{ locale: 'de-DE' }}
      />
    ),
  },
  {
    id: 'tooltip-anchor-mark',
    title: 'Inspect anchored to mark',
    description: 'Inspect content is placed above the hovered point instead of following the cursor.',
    dataset: 'standard',
    coverage: ['Chart.tooltipAnchor=mark', 'Chart.tooltipPlacement=top'],
    render: () => (
      <AreaVariationChart chartProps={{ tooltipAnchor: 'mark', tooltipPlacement: 'top' }}>
        <ChartInspect>{inspectContent}</ChartInspect>
      </AreaVariationChart>
    ),
  },
  {
    id: 'empty-state',
    title: 'Empty data',
    description: 'Shows the empty state text when data is an empty array.',
    dataset: 'empty',
    usesDashboardDataset: false,
    coverage: ['Chart.emptyStateText', 'data=[]'],
    render: () => <AreaVariationChart chartProps={{ emptyStateText: 'No sessions data' }} data={[]} />,
  },
  {
    id: 'loading',
    title: 'Loading',
    description: 'Shows the loading spinner in place of the chart.',
    dataset: 'standard',
    coverage: ['Chart.loading=true'],
    render: () => <AreaVariationChart chartProps={{ loading: true }} />,
  },
];

export const areaVariations: Variation[] = [
  ...baseAreaVariations,
  ...childVariations,
  ...axisVariations,
  ...legendVariations,
  ...chartVariations,
];

export const AreaDashboard = (): ReactElement => (
  <VariationDashboard
    variations={areaVariations}
    coverage={dashboard.coverage}
    chartType="Area"
    datasets={areaDatasetOptions}
    filters={areaVariationFilters}
    getSizeDescription={(size) => `Chart: ${size} × ${Math.round(size * AREA_ASPECT_RATIO)}px`}
    initialSize={360}
    initialDataset="standard"
    initialFilter="all"
    initialViewMode="axes"
    sizePresets={areaSizePresets}
    viewModes={areaViewModes}
  />
);

const areaCoverage: PropCoverage<AreaProps> = {
  children: ['inspect-default', 'popover-default', 'inspect-and-popover'],
  color: ['defaults', 'stacked', 'color-custom-key', 'band-multi'],
  dimension: ['defaults', 'dimension-date-string', 'scale-linear', 'scale-point'],
  metric: ['defaults', 'metric-previous', 'two-areas', 'negative', 'gaps-stacked'],
  metricEnd: ['band-single', 'band-multi', 'band-with-line', 'gaps-band', 'inspect-band'],
  metricStart: ['band-single', 'band-multi', 'band-with-line', 'gaps-band', 'inspect-band'],
  name: ['defaults', 'named-inspect', 'two-areas'],
  opacity: ['defaults', 'opacity-low', 'opacity-full', 'two-areas'],
  order: ['stack-order'],
  padding: ['padding-time', 'padding-point'],
  scaleType: ['defaults', 'scale-linear', 'scale-point', 'padding-point'],
};

const chartInspectCoverage: PropCoverage<ChartInspectProps> = {
  children: ['inspect-default', 'named-inspect', 'inspect-band', 'inspect-and-popover'],
  excludeDataKeys: ['inspect-exclude-keys'],
  highlightBy: ['inspect-default', 'inspect-highlight-series', 'inspect-highlight-dimension', 'inspect-highlight-keys'],
  targets: ['inspect-default', 'inspect-target-dimension-area'],
};

const chartPopoverCoverage: PropCoverage<ChartPopoverProps> = {
  children: ['popover-default', 'inspect-and-popover'],
  containerPadding: ['popover-bounds'],
  contentMargin: ['popover-bounds'],
  height: ['popover-fixed-size', 'popover-bounds'],
  maxHeight: ['popover-bounds'],
  maxWidth: ['popover-bounds'],
  minHeight: ['popover-bounds'],
  minWidth: ['popover-bounds'],
  onOpenChange: ['popover-open-change'],
  rightClick: ['popover-right-click'],
  UNSAFE_highlightBy: ['popover-highlight-series', 'popover-highlight-dimension'],
  width: ['popover-default', 'popover-fixed-size'],
};

const axisCoverage: SiblingCoverage<AxisProps> = {
  baseline: ['axis-titles-format'],
  children: ['axis-reference-lines'],
  currencyCode: ['axis-currency'],
  granularity: ['axis-granularity', 'locale'],
  grid: ['axis-titles-format'],
  labelFormat: ['defaults', 'axis-granularity'],
  numberFormat: ['axis-titles-format', 'axis-currency', 'locale'],
  position: ['defaults', 'axis-right'],
  range: ['axis-range'],
  tickCountLimit: ['axis-tick-limits'],
  ticks: ['axis-titles-format'],
  title: ['axis-titles-format', 'scale-linear'],
};

const legendCoverage: SiblingCoverage<LegendProps> = {
  color: ['color-custom-key'],
  defaultHiddenSeries: ['legend-toggleable'],
  descriptions: ['legend-descriptions'],
  hiddenEntries: ['legend-hidden-entries'],
  highlight: ['legend-default'],
  isToggleable: ['legend-toggleable'],
  labelLimit: ['legend-labels'],
  legendLabels: ['legend-labels'],
  position: ['legend-default', 'legend-right-title'],
  title: ['legend-right-title'],
};

const referenceLineCoverage: SiblingCoverage<ReferenceLineProps> = {
  label: ['axis-reference-lines'],
  position: { skip: 'Only supported on band scales; Area has no band axis' },
  secondary: ['axis-reference-lines'],
  size: ['axis-reference-lines'],
  value: ['axis-reference-lines'],
};

const titleCoverage: SiblingCoverage<TitleProps> = {
  text: ['chart-title'],
};

const chartCoverage: SiblingCoverage<ChartProps> = {
  animations: { skip: 'Area has no S2 animations' },
  animationTypes: { skip: 'Area has no S2 animations' },
  backgroundColor: ['dark-background'],
  colors: ['chart-colors'],
  colorScheme: ['dark-background'],
  emptyStateText: ['empty-state'],
  hiddenSeries: ['controlled-hidden-series'],
  highlightedItem: ['controlled-highlighted-item', 'controlled-highlighted-item-inspect'],
  highlightedSeries: ['controlled-highlighted-series'],
  idKey: ['controlled-highlighted-item', 'controlled-highlighted-item-inspect'],
  loading: ['loading'],
  locale: ['locale'],
  opacities: { skip: 'Area opacity is a number, not a facet' },
  renderer: { skip: 'Covered by the dashboard Renderer control' },
  tooltipAnchor: ['tooltip-anchor-mark'],
  tooltipPlacement: ['tooltip-anchor-mark'],
};

export const dashboard: DashboardDefinition = {
  chartType: 'Area',
  variations: areaVariations,
  coverage: {
    Area: areaCoverage,
    ChartInspect: chartInspectCoverage,
    ChartPopover: chartPopoverCoverage,
    Axis: axisCoverage,
    Legend: legendCoverage,
    ReferenceLine: referenceLineCoverage,
    Title: titleCoverage,
    Chart: chartCoverage,
  },
};
