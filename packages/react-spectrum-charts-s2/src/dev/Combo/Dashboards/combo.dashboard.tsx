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
import {
  Axis,
  Bar,
  BarDirectLabel,
  ChartInspect,
  ChartPopover,
  Legend,
  Line,
  LineDirectLabel,
  LineForecast,
  LinePointAnnotation,
  ReferenceLine,
  Title,
} from '../../../components/index.js';
import useChartProps from '../../../hooks/useChartProps.js';
import { Combo } from '../../../pre-alpha/index.js';
import {
  AxisProps,
  BarDirectLabelProps,
  BarProps,
  ChartInspectProps,
  ChartPopoverProps,
  ChartProps,
  ComboProps,
  LegendProps,
  LineDirectLabelProps,
  LineForecastProps,
  LinePointAnnotationProps,
  LineProps,
  ReferenceLineProps,
  TitleProps,
} from '../../../types/index.js';
import {
  Variation,
  VariationDashboard,
  VariationFilter,
  VariationSizePreset,
  VariationViewMode,
  useVariationAnimations,
  useVariationDataset,
  useVariationRenderer,
  useVariationSize,
  useVariationViewMode,
} from '../../VariationDashboard.js';
import { DashboardDefinition, PropCoverage, SiblingCoverage } from '../../dashboardCoverage.js';
import {
  ComboVariationDatasetName,
  ComboVariationDatum,
  comboDatasetOptions,
  comboVariationDatasets,
  getComboSeries,
  getForecastStart,
  toChannelRows,
} from './comboVariationData.js';

const comboSizePresets: VariationSizePreset[] = [
  { label: 'XS', size: 160 },
  { label: 'S', size: 240 },
  { label: 'M', size: 360 },
  { label: 'L', size: 480 },
  { label: 'XL', size: 720 },
];

const comboViewModes: VariationViewMode[] = [
  { label: 'Axes', value: 'axes' },
  { label: 'Marks only', value: 'none' },
];

const dashboardAnimationTypes: ChartProps['animationTypes'] = ['hover'];
const COMBO_ASPECT_RATIO = 0.6;
const BAR_COLOR: BarProps['color'] = { value: 'categorical-100' };
const LINE_COLOR: LineProps['color'] = { value: 'categorical-200' };
const SECOND_LINE_COLOR: LineProps['color'] = { value: 'categorical-300' };

const MARKS = new Set(['Bar', 'Line']);
const MARK_CHILDREN = new Set([
  'BarDirectLabel',
  'ChartInspect',
  'ChartPopover',
  'LineDirectLabel',
  'LineForecast',
  'LinePointAnnotation',
]);
const SIBLINGS = new Set(['Axis', 'Chart', 'Legend', 'ReferenceLine', 'Title']);

const getCoverageComponent = (entry: string): string => entry.split(/[.=[]/)[0];
const coversAny =
  (components: Set<string>) =>
  ({ coverage }: Variation): boolean =>
    coverage.some((entry) => components.has(getCoverageComponent(entry)));
const coversComboProp = ({ coverage }: Variation): boolean =>
  coverage.some((entry) => /^[a-z]/.test(getCoverageComponent(entry)));

const comboVariationFilters: VariationFilter[] = [
  { label: 'All', value: 'all', matches: () => true },
  { label: 'Combo props', value: 'combo', matches: coversComboProp },
  { label: 'Bar & Line', value: 'marks', matches: coversAny(MARKS) },
  { label: 'Mark children', value: 'children', matches: coversAny(MARK_CHILDREN) },
  { label: 'Siblings & Chart', value: 'siblings', matches: coversAny(SIBLINGS) },
];

const formatDate = (datetime: unknown): string =>
  new Date(Number(datetime)).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });

const formatDatum = (datum: Datum): string =>
  `${String(datum.series)} · ${formatDate(datum.datetime)} · ${Number(datum.orders).toLocaleString('en-US')} orders`;

const barInspectContent = (datum: Datum): ReactNode => (
  <div>
    <div>{formatDate(datum.datetime)}</div>
    <div>Orders: {Number(datum.orders).toLocaleString('en-US')}</div>
  </div>
);

const lineInspectContent = (datum: Datum): ReactNode => (
  <div>
    <div>{formatDate(datum.datetime)}</div>
    <div>Visits: {Number(datum.visits).toLocaleString('en-US')}</div>
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

type ComboChartOverrides = Omit<Partial<ChartProps>, 'children' | 'data'>;
type DataFunction<T> = T | ((data: ComboVariationDatum[]) => T);

const resolve = <T,>(value: DataFunction<T> | undefined, data: ComboVariationDatum[]): T | undefined =>
  typeof value === 'function' ? (value as (data: ComboVariationDatum[]) => T)(data) : value;

interface ComboVariationChartProps {
  /** Fixed data, or a function deriving data from the active dataset. */
  data?: DataFunction<ComboVariationDatum[]>;
  /** Combo prop overrides; `dimension` defaults to `datetime`. */
  comboProps?: Omit<ComboProps, 'children'>;
  /** Replaces the default Bar (orders) and Line (visits) children; functions receive the active dataset. */
  marks?: DataFunction<ComboProps['children']>;
  /** Chart prop overrides; functions receive the active dataset. */
  chartProps?: DataFunction<ComboChartOverrides>;
  /** Replaces the default axes in every view mode. */
  axes?: (data: ComboVariationDatum[]) => ReactNode;
  /** Chart-level siblings such as Legend or Title. */
  siblings?: (data: ComboVariationDatum[]) => ReactNode;
}

const DefaultMarks = (): ReactElement[] => [
  <Bar key="bar" metric="orders" color={BAR_COLOR} />,
  <Line key="line" metric="visits" color={LINE_COLOR} scaleType="point" />,
];

const DefaultAxes = (): ReactElement[] => [
  <Axis key="dimension" position="bottom" baseline labelFormat="time" granularity="day" />,
  <Axis key="metric" position="left" grid numberFormat="shortNumber" />,
];

const ComboVariationChart = ({
  data,
  comboProps,
  marks,
  chartProps: chartPropOverrides,
  axes,
  siblings,
}: ComboVariationChartProps): ReactElement => {
  const selectedDataset = useVariationDataset();
  const size = useVariationSize();
  const viewMode = useVariationViewMode();
  const animations = useVariationAnimations();
  const renderer = useVariationRenderer();
  if (!selectedDataset || !(selectedDataset in comboVariationDatasets)) {
    throw new Error(`Unknown Combo variation dataset: ${selectedDataset}`);
  }
  const datasetData = comboVariationDatasets[selectedDataset as ComboVariationDatasetName];
  const chartData = resolve(data, datasetData) ?? datasetData;
  const chartProps = useChartProps({
    data: chartData,
    width: size,
    height: Math.round(size * COMBO_ASPECT_RATIO),
  });
  const showDefaultAxes = viewMode !== 'none';
  return (
    <Chart
      {...chartProps}
      animations={animations}
      animationTypes={animations === undefined ? undefined : dashboardAnimationTypes}
      renderer={renderer}
      {...resolve(chartPropOverrides, chartData)}
    >
      {axes ? axes(chartData) : showDefaultAxes && DefaultAxes()}
      {siblings?.(chartData)}
      <Combo dimension="datetime" {...comboProps}>
        {resolve(marks, chartData) ?? DefaultMarks()}
      </Combo>
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

const dualAxes = (rightAxisProps: Omit<AxisProps, 'position'> = {}) => (): ReactElement[] => [
  <Axis key="dimension" position="bottom" baseline labelFormat="time" granularity="day" />,
  <Axis key="left" position="left" grid numberFormat="shortNumber" title="Orders" />,
  <Axis key="right" position="right" name="rate" numberFormat=".0%" title="Conversion" {...rightAxisProps} />,
];

const categoricalAxes = (): ReactElement[] => [
  <Axis key="dimension" position="bottom" baseline />,
  <Axis key="metric" position="left" grid numberFormat="shortNumber" />,
];

const channelMarks = (barProps: Partial<BarProps> = {}, lineProps: Partial<LineProps> = {}) => (): ReactElement[] => [
  <Bar key="bar" metric="orders" color="series" {...barProps} />,
  <Line key="line" metric="visits" color="series" scaleType="point" {...lineProps} />,
];

const comboPropVariations: Variation[] = [
  {
    id: 'defaults',
    title: 'Defaults',
    description: 'No Combo props and default child colors: bars and line share categorical-100.',
    dataset: 'standard',
    coverage: ['dimension=datetime', 'name=combo0', 'Bar.color', 'Line.color', 'Line.scaleType=time'],
    render: () => (
      <ComboVariationChart
        comboProps={{ dimension: undefined }}
        marks={[<Bar key="bar" metric="orders" />, <Line key="line" metric="visits" />]}
      />
    ),
  },
  {
    id: 'basic',
    title: 'Bar and line',
    description: 'Orders as bars and visits as a point-scaled line centered on each bar.',
    dataset: 'standard',
    coverage: ['children=[Bar,Line]', 'dimension=datetime', 'Bar.metric', 'Line.metric', 'Line.scaleType=point'],
    render: () => <ComboVariationChart />,
  },
  {
    id: 'dimension-categorical',
    title: 'Categorical dimension',
    description: 'dimension="day" puts both marks on weekday labels.',
    dataset: 'standard',
    coverage: ['dimension=day'],
    render: () => <ComboVariationChart axes={categoricalAxes} comboProps={{ dimension: 'day' }} />,
  },
  {
    id: 'dimension-child-override',
    title: 'Child dimension wins',
    description: 'Combo says datetime but both children set dimension="day", so weekday labels show.',
    dataset: 'standard',
    coverage: ['dimension=datetime', 'Bar.dimension=day', 'Line.dimension=day'],
    render: () => (
      <ComboVariationChart
        axes={categoricalAxes}
        marks={[
          <Bar key="bar" dimension="day" metric="orders" color={BAR_COLOR} />,
          <Line key="line" dimension="day" metric="visits" color={LINE_COLOR} scaleType="point" />,
        ]}
      />
    ),
  },
  {
    id: 'name-custom',
    title: 'Custom combo name',
    description: 'name="traffic" prefixes child mark names; hovering either mark must still fade the other.',
    dataset: 'standard',
    coverage: ['name=traffic', 'ChartInspect.children'],
    render: () => (
      <ComboVariationChart
        comboProps={{ name: 'traffic' }}
        marks={[
          <Bar key="bar" metric="orders" color={BAR_COLOR}>
            <ChartInspect>{barInspectContent}</ChartInspect>
          </Bar>,
          <Line key="line" metric="visits" color={LINE_COLOR} scaleType="point">
            <ChartInspect>{lineInspectContent}</ChartInspect>
          </Line>,
        ]}
      />
    ),
  },
  {
    id: 'children-named',
    title: 'Named children with popover',
    description: 'Bar name="orders", Line name="visits"; clicking a bar must open its popover.',
    dataset: 'standard',
    coverage: ['Bar.name=orders', 'Line.name=visits', 'ChartPopover.children'],
    render: () => (
      <ComboVariationChart
        marks={[
          <Bar key="bar" name="orders" metric="orders" color={BAR_COLOR}>
            <ChartPopover>{popoverContent}</ChartPopover>
          </Bar>,
          <Line key="line" name="visits" metric="visits" color={LINE_COLOR} scaleType="point" />,
        ]}
      />
    ),
  },
  {
    id: 'children-bar-only',
    title: 'Bar only',
    description: 'A Combo with a single Bar child renders like a standalone bar chart.',
    dataset: 'standard',
    coverage: ['children=[Bar]'],
    render: () => <ComboVariationChart marks={<Bar metric="orders" color={BAR_COLOR} />} />,
  },
  {
    id: 'children-line-only',
    title: 'Line only',
    description: 'A Combo with a single Line child renders like a standalone line chart.',
    dataset: 'standard',
    coverage: ['children=[Line]'],
    render: () => <ComboVariationChart marks={<Line metric="visits" color={LINE_COLOR} scaleType="point" />} />,
  },
  {
    id: 'children-two-lines',
    title: 'Bar and two lines',
    description: 'Visits and returning visits as two lines over the order bars.',
    dataset: 'standard',
    coverage: ['children=[Bar,Line,Line]'],
    render: () => (
      <ComboVariationChart
        marks={[
          ...DefaultMarks(),
          <Line key="returning" metric="returningVisits" color={SECOND_LINE_COLOR} scaleType="point" />,
        ]}
      />
    ),
  },
  {
    id: 'children-line-first',
    title: 'Line declared first',
    description: 'Children order sets draw order: the line is drawn before (under) the bars.',
    dataset: 'standard',
    coverage: ['children=[Line,Bar]'],
    render: () => (
      <ComboVariationChart
        marks={[
          <Line key="line" metric="visits" color={LINE_COLOR} scaleType="point" />,
          <Bar key="bar" metric="orders" color={BAR_COLOR} />,
        ]}
        data={(data) => data.map((datum) => ({ ...datum, visits: datum.orders }))}
      />
    ),
  },
  {
    id: 'children-empty',
    title: 'No children',
    description: 'An empty Combo renders axes only, without errors.',
    dataset: 'standard',
    coverage: ['children=[]'],
    render: () => <ComboVariationChart marks={[]} />,
  },
];

const markVariations: Variation[] = [
  {
    id: 'line-scale-time',
    title: 'Time-scaled line',
    description: 'Line scaleType="time" uses a continuous x scale instead of the bar band centers.',
    dataset: 'standard',
    coverage: ['Line.scaleType=time'],
    render: () => (
      <ComboVariationChart
        marks={[
          <Bar key="bar" metric="orders" color={BAR_COLOR} />,
          <Line key="line" metric="visits" color={LINE_COLOR} scaleType="time" />,
        ]}
      />
    ),
  },
  {
    id: 'dual-axis',
    title: 'Dual axis',
    description: 'Conversion rate (0–1) on a right axis bound by Line metricAxis="rate".',
    dataset: 'standard',
    coverage: ['Line.metricAxis=rate', 'Axis.name=rate', 'Axis.position=right', 'Axis.title'],
    render: () => (
      <ComboVariationChart
        axes={dualAxes()}
        marks={[
          <Bar key="bar" metric="orders" color={BAR_COLOR} />,
          <Line key="line" metric="conversionRate" metricAxis="rate" color={LINE_COLOR} scaleType="point" />,
        ]}
      />
    ),
  },
  {
    id: 'dual-axis-both-named',
    title: 'Both marks on named axes',
    description: 'Bar metricAxis="orders" on the left and Line metricAxis="rate" on the right.',
    dataset: 'standard',
    coverage: ['Bar.metricAxis=orders', 'Line.metricAxis=rate', 'Axis.name=orders'],
    render: () => (
      <ComboVariationChart
        axes={() => [
          <Axis key="dimension" position="bottom" baseline labelFormat="time" granularity="day" />,
          <Axis key="left" position="left" name="orders" grid numberFormat="shortNumber" title="Orders" />,
          <Axis key="right" position="right" name="rate" numberFormat=".0%" title="Conversion" />,
        ]}
        marks={[
          <Bar key="bar" metric="orders" metricAxis="orders" color={BAR_COLOR} />,
          <Line key="line" metric="conversionRate" metricAxis="rate" color={LINE_COLOR} scaleType="point" />,
        ]}
      />
    ),
  },
  {
    id: 'dual-axis-inspect',
    title: 'Dual axis with inspect',
    description: 'Each mark has its own inspect content; hovering one fades the other.',
    dataset: 'standard',
    coverage: ['Line.metricAxis=rate', 'ChartInspect.children'],
    render: () => (
      <ComboVariationChart
        axes={dualAxes()}
        marks={[
          <Bar key="bar" metric="orders" color={BAR_COLOR}>
            <ChartInspect>{barInspectContent}</ChartInspect>
          </Bar>,
          <Line key="line" metric="conversionRate" metricAxis="rate" color={LINE_COLOR} scaleType="point">
            <ChartInspect>
              {(datum) => (
                <div>
                  <div>{formatDate(datum.datetime)}</div>
                  <div>Conversion: {(Number(datum.conversionRate) * 100).toFixed(1)}%</div>
                </div>
              )}
            </ChartInspect>
          </Line>,
        ]}
      />
    ),
  },
  {
    id: 'series-stacked',
    title: 'Stacked series with series lines',
    description: 'Bars and lines both color by series and share one color scale.',
    dataset: 'standard',
    coverage: ['Bar.color=series', 'Line.color=series', 'Bar.type=stacked'],
    render: () => <ComboVariationChart data={toChannelRows} marks={channelMarks()} />,
  },
  {
    id: 'series-dodged',
    title: 'Dodged series with series lines',
    description: 'Dodged bars per channel; the channel lines run through the band centers, not their own bars.',
    dataset: 'standard',
    coverage: ['Bar.type=dodged', 'Bar.color=series', 'Line.color=series'],
    render: () => <ComboVariationChart data={toChannelRows} marks={channelMarks({ type: 'dodged' })} />,
  },
  {
    id: 'series-total-line',
    title: 'Stacked bars with a total line',
    description: 'Stacked channel bars with a static-color line of the daily total.',
    dataset: 'standard',
    coverage: ['Bar.color=series', 'Line.metric=totalVisits'],
    render: () => (
      <ComboVariationChart
        data={toChannelRows}
        marks={[
          <Bar key="bar" metric="orders" color="series" />,
          <Line key="line" metric="totalVisits" color={{ value: 'gray-800' }} scaleType="point" />,
        ]}
      />
    ),
  },
  {
    id: 'line-styles',
    title: 'Dashed line over translucent bars',
    description: 'Line lineType="dashed" and Bar opacity 0.5 keep both marks readable.',
    dataset: 'standard',
    coverage: ['Line.lineType=dashed', 'Bar.opacity=0.5'],
    render: () => (
      <ComboVariationChart
        marks={[
          <Bar key="bar" metric="orders" color={BAR_COLOR} opacity={{ value: 0.5 }} />,
          <Line key="line" metric="visits" color={LINE_COLOR} lineType={{ value: 'dashed' }} scaleType="point" />,
        ]}
      />
    ),
  },
  {
    id: 'line-static-point',
    title: 'Static point and annotation',
    description: 'Marks the peak visits day with a static point and a LinePointAnnotation.',
    dataset: 'standard',
    coverage: ['Line.staticPoint=isPeak', 'LinePointAnnotation.textKey=note'],
    render: () => (
      <ComboVariationChart
        marks={[
          <Bar key="bar" metric="orders" color={BAR_COLOR} />,
          <Line key="line" metric="visits" color={LINE_COLOR} scaleType="point" staticPoint="isPeak">
            <LinePointAnnotation textKey="note" />
          </Line>,
        ]}
      />
    ),
  },
  {
    id: 'bar-horizontal',
    title: 'Horizontal bar child',
    description: 'Bar orientation="horizontal" in a combo; lines do not support a horizontal layout.',
    dataset: 'standard',
    coverage: ['Bar.orientation=horizontal'],
    render: () => (
      <ComboVariationChart
        axes={() => [
          <Axis key="dimension" position="left" baseline labelFormat="time" granularity="day" />,
          <Axis key="metric" position="bottom" grid numberFormat="shortNumber" />,
        ]}
        marks={[
          <Bar key="bar" metric="orders" color={BAR_COLOR} orientation="horizontal" />,
          <Line key="line" metric="visits" color={LINE_COLOR} scaleType="point" />,
        ]}
      />
    ),
  },
  {
    id: 'bar-trendline',
    title: 'Bar average trendline',
    description: 'A dashed average line for the bars alongside the visits line.',
    dataset: 'standard',
    coverage: ['Bar.trendlines=[average]'],
    render: () => (
      <ComboVariationChart
        marks={[
          <Bar key="bar" metric="orders" color={BAR_COLOR} trendlines={[{ method: 'average' }]} />,
          <Line key="line" metric="visits" color={LINE_COLOR} scaleType="point" />,
        ]}
      />
    ),
  },
];

const childVariations: Variation[] = [
  {
    id: 'bar-direct-labels',
    title: 'Bar direct labels',
    description: 'Order counts above each bar, beneath the visits line.',
    dataset: 'standard',
    coverage: ['BarDirectLabel.position=end-outside', 'BarDirectLabel.format=,.0f'],
    render: () => (
      <ComboVariationChart
        marks={[
          <Bar key="bar" metric="orders" color={BAR_COLOR}>
            <BarDirectLabel format=",.0f" />
          </Bar>,
          <Line key="line" metric="visits" color={LINE_COLOR} scaleType="point" />,
        ]}
      />
    ),
  },
  {
    id: 'line-direct-label',
    title: 'Line direct label',
    description: 'Labels the last visits value at the end of the line.',
    dataset: 'standard',
    coverage: ['LineDirectLabel.value=last', 'LineDirectLabel.prefix', 'LineDirectLabel.format'],
    render: () => (
      <ComboVariationChart
        marks={[
          <Bar key="bar" metric="orders" color={BAR_COLOR} />,
          <Line key="line" metric="visits" color={LINE_COLOR} scaleType="point">
            <LineDirectLabel value="last" prefix="Visits " format=",.0f" />
          </Line>,
        ]}
      />
    ),
  },
  {
    id: 'line-forecast',
    title: 'Line forecast',
    description: 'The visits line turns dashed from the forecast start over the bars.',
    dataset: 'standard',
    coverage: ['LineForecast.metric', 'LineForecast.start', 'LineForecast.label'],
    render: () => (
      <ComboVariationChart
        marks={(data) => [
          <Bar key="bar" metric="orders" color={BAR_COLOR} />,
          <Line key="line" metric="visits" color={LINE_COLOR} scaleType="point">
            <LineForecast metric="visitsForecast" start={getForecastStart(data)} label="Forecast" />
          </Line>,
        ]}
      />
    ),
  },
  {
    id: 'inspect-bar-only',
    title: 'Inspect on bar only',
    description: 'Hover a bar for inspect content; the line has no inspect, so it stays at full opacity.',
    dataset: 'standard',
    coverage: ['ChartInspect.children'],
    render: () => (
      <ComboVariationChart
        marks={[
          <Bar key="bar" metric="orders" color={BAR_COLOR}>
            <ChartInspect>{barInspectContent}</ChartInspect>
          </Bar>,
          <Line key="line" metric="visits" color={LINE_COLOR} scaleType="point" />,
        ]}
      />
    ),
  },
  {
    id: 'inspect-line-only',
    title: 'Inspect on line only',
    description: 'Hover near the line for inspect content; the bars have no inspect, so they stay at full opacity.',
    dataset: 'standard',
    coverage: ['ChartInspect.children'],
    render: () => (
      <ComboVariationChart
        marks={[
          <Bar key="bar" metric="orders" color={BAR_COLOR} />,
          <Line key="line" metric="visits" color={LINE_COLOR} scaleType="point">
            <ChartInspect>{lineInspectContent}</ChartInspect>
          </Line>,
        ]}
      />
    ),
  },
  {
    id: 'inspect-highlight-dimension',
    title: 'Bar inspect highlights dimension',
    description: 'Hovering a channel bar highlights every bar on that day.',
    dataset: 'standard',
    coverage: ['ChartInspect.highlightBy=dimension', 'Bar.type=dodged'],
    render: () => (
      <ComboVariationChart
        data={toChannelRows}
        marks={[
          <Bar key="bar" metric="orders" color="series" type="dodged">
            <ChartInspect highlightBy="dimension">{barInspectContent}</ChartInspect>
          </Bar>,
          <Line key="line" metric="totalVisits" color={{ value: 'gray-800' }} scaleType="point">
            <ChartInspect>{lineInspectContent}</ChartInspect>
          </Line>,
        ]}
      />
    ),
  },
  {
    id: 'inspect-highlight-series',
    title: 'Inspect highlights series',
    description: 'Hovering a channel keeps its bars and line emphasized.',
    dataset: 'standard',
    coverage: ['ChartInspect.highlightBy=series', 'Bar.color=series', 'Line.color=series'],
    render: () => (
      <ComboVariationChart
        data={toChannelRows}
        marks={[
          <Bar key="bar" metric="orders" color="series">
            <ChartInspect highlightBy="series">{barInspectContent}</ChartInspect>
          </Bar>,
          <Line key="line" metric="visits" color="series" scaleType="point">
            <ChartInspect highlightBy="series">{lineInspectContent}</ChartInspect>
          </Line>,
        ]}
      />
    ),
  },
  {
    id: 'inspect-dimension-area',
    title: 'Bar inspect on dimension area',
    description: 'Hovering anywhere in a day band inspects that bar.',
    dataset: 'standard',
    coverage: ['ChartInspect.targets=[dimensionArea]'],
    render: () => (
      <ComboVariationChart
        marks={[
          <Bar key="bar" metric="orders" color={BAR_COLOR}>
            <ChartInspect targets={['dimensionArea']}>{barInspectContent}</ChartInspect>
          </Bar>,
          <Line key="line" metric="visits" color={LINE_COLOR} scaleType="point" />,
        ]}
      />
    ),
  },
  {
    id: 'line-interaction-item',
    title: 'Line item interaction',
    description: 'Line interactionMode="item" only inspects when the pointer is on a point.',
    dataset: 'standard',
    coverage: ['Line.interactionMode=item', 'ChartInspect.children'],
    render: () => (
      <ComboVariationChart
        marks={[
          <Bar key="bar" metric="orders" color={BAR_COLOR}>
            <ChartInspect>{barInspectContent}</ChartInspect>
          </Bar>,
          <Line key="line" metric="visits" color={LINE_COLOR} scaleType="point" interactionMode="item">
            <ChartInspect>{lineInspectContent}</ChartInspect>
          </Line>,
        ]}
      />
    ),
  },
  {
    id: 'popover-both',
    title: 'Popovers on both marks',
    description: 'Click a bar or a line point to open that mark’s popover.',
    dataset: 'standard',
    coverage: ['ChartPopover.children', 'ChartPopover.width'],
    render: () => (
      <ComboVariationChart
        marks={[
          <Bar key="bar" metric="orders" color={BAR_COLOR}>
            <ChartPopover width={220}>{popoverContent}</ChartPopover>
          </Bar>,
          <Line key="line" metric="visits" color={LINE_COLOR} scaleType="point">
            <ChartPopover width={220}>
              {(datum, close) => (
                <div>
                  <div>Visits: {Number(datum.visits).toLocaleString('en-US')}</div>
                  <button type="button" onClick={close}>
                    Close
                  </button>
                </div>
              )}
            </ChartPopover>
          </Line>,
        ]}
      />
    ),
  },
];

const callbackVariations: Variation[] = [
  {
    id: 'on-click',
    title: 'onClick on both marks',
    description: 'Click a bar or a line point; the last clicked mark is shown below.',
    dataset: 'standard',
    coverage: ['Bar.onClick', 'Line.onClick'],
    render: () => (
      <CallbackVariation
        render={(log) => (
          <ComboVariationChart
            marks={[
              <Bar
                key="bar"
                metric="orders"
                color={BAR_COLOR}
                onClick={(datum) => log(`Bar ${formatDatum(datum)}`)}
              />,
              <Line
                key="line"
                metric="visits"
                color={LINE_COLOR}
                scaleType="point"
                onClick={(datum) => log(`Line ${formatDate(datum.datetime)} · ${String(datum.visits)} visits`)}
              />,
            ]}
          />
        )}
      />
    ),
  },
  {
    id: 'on-click-named',
    title: 'onClick on named children',
    description: 'Bar name="orders" with onClick; clicking a bar must still log it.',
    dataset: 'standard',
    coverage: ['Bar.onClick', 'Bar.name=orders'],
    render: () => (
      <CallbackVariation
        render={(log) => (
          <ComboVariationChart
            marks={[
              <Bar
                key="bar"
                name="orders"
                metric="orders"
                color={BAR_COLOR}
                onClick={(datum) => log(`Bar ${formatDatum(datum)}`)}
              />,
              <Line key="line" name="visits" metric="visits" color={LINE_COLOR} scaleType="point" />,
            ]}
          />
        )}
      />
    ),
  },
  {
    id: 'on-mouse-over-out',
    title: 'Bar onMouseOver and onMouseOut',
    description: 'Hover in and out of bars; the latest event is shown below.',
    dataset: 'standard',
    coverage: ['Bar.onMouseOver', 'Bar.onMouseOut'],
    render: () => (
      <CallbackVariation
        render={(log) => (
          <ComboVariationChart
            marks={[
              <Bar
                key="bar"
                metric="orders"
                color={BAR_COLOR}
                onMouseOver={(datum) => log(`Over ${formatDatum(datum)}`)}
                onMouseOut={(datum) => log(`Out ${formatDatum(datum)}`)}
              />,
              <Line key="line" metric="visits" color={LINE_COLOR} scaleType="point" />,
            ]}
          />
        )}
      />
    ),
  },
];

const siblingVariations: Variation[] = [
  {
    id: 'legend-series',
    title: 'Legend with shared series',
    description: 'One legend entry per channel; hovering an entry highlights its bars and line.',
    dataset: 'standard',
    coverage: ['Legend.highlight', 'Legend.position=bottom', 'Bar.color=series', 'Line.color=series'],
    render: () => (
      <ComboVariationChart data={toChannelRows} marks={channelMarks()} siblings={() => <Legend highlight />} />
    ),
  },
  {
    id: 'legend-toggleable',
    title: 'Toggleable legend',
    description: 'Click entries to hide a channel; Web starts hidden in both bars and line.',
    dataset: 'standard',
    coverage: ['Legend.isToggleable', 'Legend.defaultHiddenSeries=[first]'],
    render: () => (
      <ComboVariationChart
        data={toChannelRows}
        marks={channelMarks()}
        siblings={(data) => <Legend isToggleable defaultHiddenSeries={getComboSeries(data).slice(0, 1)} />}
      />
    ),
  },
  {
    id: 'legend-static-colors',
    title: 'Legend with static colors',
    description: 'Static child colors have no series facet, so the legend has no entries.',
    dataset: 'standard',
    coverage: ['Legend.title'],
    render: () => <ComboVariationChart siblings={() => <Legend title="Metric" />} />,
  },
  {
    id: 'axis-reference-line',
    title: 'Reference line',
    description: 'A target reference line on the metric axis crosses both marks.',
    dataset: 'standard',
    coverage: ['Axis.children', 'ReferenceLine.value=60', 'ReferenceLine.label'],
    render: () => (
      <ComboVariationChart
        axes={() => [
          <Axis key="dimension" position="bottom" baseline labelFormat="time" granularity="day" />,
          <Axis key="metric" position="left" grid numberFormat="shortNumber">
            <ReferenceLine value={60} label="Target" />
          </Axis>,
        ]}
      />
    ),
  },
  {
    id: 'axis-range',
    title: 'Fixed metric range',
    description: 'Axis range [0, 250] fixes the shared metric scale for both marks.',
    dataset: 'standard',
    coverage: ['Axis.range=[0,250]'],
    render: () => (
      <ComboVariationChart
        axes={() => [
          <Axis key="dimension" position="bottom" baseline labelFormat="time" granularity="day" />,
          <Axis key="metric" position="left" grid numberFormat="shortNumber" range={[0, 250]} />,
        ]}
      />
    ),
  },
  {
    id: 'chart-title',
    title: 'Chart title',
    description: 'Adds a Title sibling above the combo.',
    dataset: 'standard',
    coverage: ['Title.text'],
    render: () => <ComboVariationChart siblings={() => <Title text="Orders and visits" />} />,
  },
  {
    id: 'controlled-hidden-series',
    title: 'Controlled hidden series',
    description: 'Chart hiddenSeries hides the Web channel in both bars and line.',
    dataset: 'standard',
    coverage: ['Chart.hiddenSeries=[first]'],
    render: () => (
      <ComboVariationChart
        data={toChannelRows}
        marks={channelMarks()}
        chartProps={(data) => ({ hiddenSeries: getComboSeries(data).slice(0, 1) })}
        siblings={() => <Legend />}
      />
    ),
  },
  {
    id: 'controlled-highlighted-series',
    title: 'Controlled highlighted series',
    description: 'Chart highlightedSeries emphasizes the Web channel in both marks.',
    dataset: 'standard',
    coverage: ['Chart.highlightedSeries=first'],
    render: () => (
      <ComboVariationChart
        data={toChannelRows}
        marks={channelMarks()}
        chartProps={(data) => ({ highlightedSeries: getComboSeries(data)[0] })}
      />
    ),
  },
  {
    id: 'controlled-highlighted-item',
    title: 'Controlled highlighted item',
    description: 'Highlights the first bar by id using idKey="id" and highlightedItem.',
    dataset: 'standard',
    coverage: ['Chart.idKey=id', 'Chart.highlightedItem=first'],
    render: () => <ComboVariationChart chartProps={(data) => ({ idKey: 'id', highlightedItem: data[0]?.id })} />,
  },
  {
    id: 'chart-colors',
    title: 'Custom colors',
    description: 'Overrides the categorical palette used by the series facet of both marks.',
    dataset: 'standard',
    coverage: ['Chart.colors=[...]'],
    render: () => (
      <ComboVariationChart
        data={toChannelRows}
        marks={channelMarks()}
        chartProps={{ colors: ['indigo-900', 'orange-500'] }}
      />
    ),
  },
  {
    id: 'dark-background',
    title: 'Dark color scheme',
    description: 'Renders axes, bars, line and labels on a dark background.',
    dataset: 'standard',
    coverage: ['Chart.colorScheme=dark', 'Chart.backgroundColor=gray-25'],
    render: () => (
      <ComboVariationChart
        chartProps={{ backgroundColor: 'gray-25', colorScheme: 'dark' }}
        marks={[
          <Bar key="bar" metric="orders" color={BAR_COLOR}>
            <BarDirectLabel />
          </Bar>,
          <Line key="line" metric="visits" color={LINE_COLOR} scaleType="point">
            <LineDirectLabel value="last" />
          </Line>,
        ]}
      />
    ),
  },
  {
    id: 'locale',
    title: 'German locale',
    description: 'Formats axis numbers, dates and direct labels with de-DE conventions.',
    dataset: 'largeValues',
    usesDashboardDataset: false,
    coverage: ['Chart.locale=de-DE'],
    render: () => (
      <ComboVariationChart
        data={comboVariationDatasets.largeValues}
        axes={() => [
          <Axis key="dimension" position="bottom" baseline labelFormat="time" granularity="day" />,
          <Axis key="metric" position="left" grid numberFormat=",.0f" />,
        ]}
        chartProps={{ locale: 'de-DE' }}
        marks={[
          <Bar key="bar" metric="orders" color={BAR_COLOR}>
            <BarDirectLabel format="shortNumber" />
          </Bar>,
          <Line key="line" metric="visits" color={LINE_COLOR} scaleType="point" />,
        ]}
      />
    ),
  },
  {
    id: 'tooltip-anchor-mark',
    title: 'Inspect anchored to mark',
    description: 'Inspect content is placed above the hovered bar or point instead of following the cursor.',
    dataset: 'standard',
    coverage: ['Chart.tooltipAnchor=mark', 'Chart.tooltipPlacement=top'],
    render: () => (
      <ComboVariationChart
        chartProps={{ tooltipAnchor: 'mark', tooltipPlacement: 'top' }}
        marks={[
          <Bar key="bar" metric="orders" color={BAR_COLOR}>
            <ChartInspect>{barInspectContent}</ChartInspect>
          </Bar>,
          <Line key="line" metric="visits" color={LINE_COLOR} scaleType="point">
            <ChartInspect>{lineInspectContent}</ChartInspect>
          </Line>,
        ]}
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
    render: () => <ComboVariationChart chartProps={{ emptyStateText: 'No orders data' }} data={[]} />,
  },
  {
    id: 'loading',
    title: 'Loading',
    description: 'Shows the loading spinner in place of the chart.',
    dataset: 'standard',
    coverage: ['Chart.loading=true'],
    render: () => <ComboVariationChart chartProps={{ loading: true }} />,
  },
];

export const comboVariations: Variation[] = [
  ...comboPropVariations,
  ...markVariations,
  ...childVariations,
  ...callbackVariations,
  ...siblingVariations,
];

export const ComboDashboard = (): ReactElement => (
  <VariationDashboard
    variations={comboVariations}
    coverage={dashboard.coverage}
    chartType="Combo"
    datasets={comboDatasetOptions}
    filters={comboVariationFilters}
    getSizeDescription={(size) => `Chart: ${size} × ${Math.round(size * COMBO_ASPECT_RATIO)}px`}
    initialSize={360}
    initialDataset="standard"
    initialFilter="all"
    initialViewMode="axes"
    sizePresets={comboSizePresets}
    showAnimationControls
    viewModes={comboViewModes}
  />
);

const comboCoverage: PropCoverage<ComboProps> = {
  children: [
    'basic',
    'children-bar-only',
    'children-line-only',
    'children-two-lines',
    'children-line-first',
    'children-empty',
  ],
  dimension: ['defaults', 'basic', 'dimension-categorical', 'dimension-child-override'],
  name: ['defaults', 'name-custom', 'children-named'],
};

const barCoverage: SiblingCoverage<BarProps> = {
  children: ['bar-direct-labels', 'inspect-bar-only', 'children-named'],
  color: ['defaults', 'series-stacked', 'series-dodged', 'series-total-line'],
  dimension: ['basic', 'dimension-child-override'],
  metric: ['basic'],
  metricAxis: ['dual-axis-both-named'],
  name: ['children-named', 'on-click-named'],
  onClick: ['on-click', 'on-click-named'],
  onMouseOut: ['on-mouse-over-out'],
  onMouseOver: ['on-mouse-over-out'],
  opacity: ['line-styles'],
  orientation: ['bar-horizontal'],
  trendlines: ['bar-trendline'],
  type: ['series-stacked', 'series-dodged', 'inspect-highlight-dimension'],
};

const lineCoverage: SiblingCoverage<LineProps> = {
  children: ['line-direct-label', 'line-forecast', 'line-static-point', 'inspect-line-only'],
  color: ['defaults', 'series-stacked', 'series-dodged'],
  dimension: ['dimension-child-override'],
  interactionMode: ['line-interaction-item'],
  lineType: ['line-styles'],
  metric: ['basic', 'series-total-line'],
  metricAxis: ['dual-axis', 'dual-axis-both-named', 'dual-axis-inspect'],
  name: ['children-named', 'on-click-named'],
  onClick: ['on-click'],
  scaleType: ['defaults', 'basic', 'line-scale-time'],
  staticPoint: ['line-static-point'],
};

const barDirectLabelCoverage: SiblingCoverage<BarDirectLabelProps> = {
  format: ['bar-direct-labels', 'locale'],
  position: ['bar-direct-labels'],
};

const lineDirectLabelCoverage: SiblingCoverage<LineDirectLabelProps> = {
  format: ['line-direct-label'],
  prefix: ['line-direct-label'],
  value: ['line-direct-label', 'dark-background'],
};

const lineForecastCoverage: SiblingCoverage<LineForecastProps> = {
  label: ['line-forecast'],
  metric: ['line-forecast'],
  start: ['line-forecast'],
};

const linePointAnnotationCoverage: SiblingCoverage<LinePointAnnotationProps> = {
  textKey: ['line-static-point'],
};

const chartInspectCoverage: SiblingCoverage<ChartInspectProps> = {
  children: ['name-custom', 'dual-axis-inspect', 'inspect-bar-only', 'inspect-line-only'],
  highlightBy: ['inspect-highlight-dimension', 'inspect-highlight-series'],
  targets: ['inspect-dimension-area'],
};

const chartPopoverCoverage: SiblingCoverage<ChartPopoverProps> = {
  children: ['popover-both', 'children-named'],
  width: ['popover-both'],
};

const axisCoverage: SiblingCoverage<AxisProps> = {
  children: ['axis-reference-line'],
  name: ['dual-axis', 'dual-axis-both-named'],
  position: ['dual-axis', 'bar-horizontal'],
  range: ['axis-range'],
  title: ['dual-axis'],
};

const referenceLineCoverage: SiblingCoverage<ReferenceLineProps> = {
  label: ['axis-reference-line'],
  value: ['axis-reference-line'],
};

const legendCoverage: SiblingCoverage<LegendProps> = {
  defaultHiddenSeries: ['legend-toggleable'],
  highlight: ['legend-series'],
  isToggleable: ['legend-toggleable'],
  title: ['legend-static-colors'],
};

const titleCoverage: SiblingCoverage<TitleProps> = {
  text: ['chart-title'],
};

const chartCoverage: SiblingCoverage<ChartProps> = {
  animations: { skip: 'Covered by the dashboard Animations switch' },
  animationTypes: { skip: 'Covered by the dashboard Animations switch' },
  backgroundColor: ['dark-background'],
  colors: ['chart-colors'],
  colorScheme: ['dark-background'],
  emptyStateText: ['empty-state'],
  hiddenSeries: ['controlled-hidden-series'],
  highlightedItem: ['controlled-highlighted-item'],
  highlightedSeries: ['controlled-highlighted-series'],
  idKey: ['controlled-highlighted-item'],
  loading: ['loading'],
  locale: ['locale'],
  renderer: { skip: 'Covered by the dashboard Renderer control' },
  tooltipAnchor: ['tooltip-anchor-mark'],
  tooltipPlacement: ['tooltip-anchor-mark'],
};

export const dashboard: DashboardDefinition = {
  chartType: 'Combo',
  variations: comboVariations,
  coverage: {
    Combo: comboCoverage,
    Bar: barCoverage,
    Line: lineCoverage,
    BarDirectLabel: barDirectLabelCoverage,
    LineDirectLabel: lineDirectLabelCoverage,
    LineForecast: lineForecastCoverage,
    LinePointAnnotation: linePointAnnotationCoverage,
    ChartInspect: chartInspectCoverage,
    ChartPopover: chartPopoverCoverage,
    Axis: axisCoverage,
    ReferenceLine: referenceLineCoverage,
    Legend: legendCoverage,
    Title: titleCoverage,
    Chart: chartCoverage,
  },
};
