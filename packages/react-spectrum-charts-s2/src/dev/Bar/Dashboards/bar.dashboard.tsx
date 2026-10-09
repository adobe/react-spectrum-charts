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
  ReferenceLine,
  Title,
} from '../../../components/index.js';
import useChartProps from '../../../hooks/useChartProps.js';
import {
  AxisProps,
  BarDirectLabelProps,
  BarProps,
  ChartInspectProps,
  ChartPopoverProps,
  ChartProps,
  LegendProps,
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
  BarVariationDatasetName,
  BarVariationDatum,
  barDatasetOptions,
  barVariationDatasets,
  getBarSeries,
  getFirstSeries,
  toRegionRows,
  toSegmentRows,
} from './barVariationData.js';

const barSizePresets: VariationSizePreset[] = [
  { label: 'XS', size: 160 },
  { label: 'S', size: 240 },
  { label: 'M', size: 360 },
  { label: 'L', size: 480 },
  { label: 'XL', size: 720 },
];

const barViewModes: VariationViewMode[] = [
  { label: 'Axes', value: 'axes' },
  { label: 'Axes and legend', value: 'axesLegend' },
  { label: 'Bars only', value: 'none' },
];

const dashboardAnimationTypes: ChartProps['animationTypes'] = ['hover'];
const BAR_ASPECT_RATIO = 0.6;

const BAR_CHILDREN = new Set(['BarDirectLabel', 'ChartInspect', 'ChartPopover']);
const SIBLINGS = new Set(['Axis', 'Chart', 'Legend', 'ReferenceLine', 'Title']);

const getCoverageComponent = (entry: string): string => entry.split(/[.=[]/)[0];
const coversAny =
  (components: Set<string>) =>
  ({ coverage }: Variation): boolean =>
    coverage.some((entry) => components.has(getCoverageComponent(entry)));
const coversBarProp = ({ coverage }: Variation): boolean =>
  coverage.some((entry) => /^[a-z]/.test(getCoverageComponent(entry)));

const barVariationFilters: VariationFilter[] = [
  { label: 'All', value: 'all', matches: () => true },
  { label: 'Bar props', value: 'bar', matches: coversBarProp },
  { label: 'Children', value: 'children', matches: coversAny(BAR_CHILDREN) },
  { label: 'Siblings & Chart', value: 'siblings', matches: coversAny(SIBLINGS) },
];

const singleBarData = barVariationDatasets.single;
const negativeBarData = barVariationDatasets.negative;
const largeBarData = barVariationDatasets.largeValues;
const longLabelBarData = barVariationDatasets.longLabels;
const manyCategoryBarData = barVariationDatasets.manyCategories;
const denseBarData = barVariationDatasets.dense;

const formatDatum = (datum: Datum): string =>
  `${String(datum.series)} · ${String(datum.category)} · ${Number(datum.value).toLocaleString('en-US')}`;

const inspectContent = (datum: Datum): ReactNode => (
  <div>
    <div>{String(datum.series)}</div>
    <div>{String(datum.category)}</div>
    <div>{Number(datum.value).toLocaleString('en-US')}</div>
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

type BarChartOverrides = Omit<Partial<ChartProps>, 'children' | 'data'>;
type DataFunction<T> = T | ((data: BarVariationDatum[]) => T);

const resolve = <T,>(value: DataFunction<T> | undefined, data: BarVariationDatum[]): T | undefined =>
  typeof value === 'function' ? (value as (data: BarVariationDatum[]) => T)(data) : value;

interface BarVariationChartProps extends Pick<BarProps, 'children'> {
  /** Fixed data, or a function deriving data from the active dataset. */
  data?: DataFunction<BarVariationDatum[]>;
  /** Bar prop overrides; `color` defaults to `series`. */
  barProps?: DataFunction<Omit<BarProps, 'children'>>;
  /** Chart prop overrides; functions receive the active dataset. */
  chartProps?: DataFunction<BarChartOverrides>;
  /** Replaces the default axes in every view mode. */
  axes?: (data: BarVariationDatum[]) => ReactNode;
  /** Replaces the default legend in every view mode. */
  legend?: (data: BarVariationDatum[]) => ReactNode;
  /** Extra chart-level siblings such as Title. */
  siblings?: (data: BarVariationDatum[]) => ReactNode;
}

const DefaultAxes = (orientation: BarProps['orientation']): ReactElement[] => {
  const isHorizontal = orientation === 'horizontal';
  return [
    <Axis key="dimension" position={isHorizontal ? 'left' : 'bottom'} baseline />,
    <Axis key="metric" position={isHorizontal ? 'bottom' : 'left'} grid numberFormat="shortNumber" />,
  ];
};

const BarVariationChart = ({
  data,
  barProps,
  children,
  chartProps: chartPropOverrides,
  axes,
  legend,
  siblings,
}: BarVariationChartProps): ReactElement => {
  const selectedDataset = useVariationDataset();
  const size = useVariationSize();
  const viewMode = useVariationViewMode();
  const animations = useVariationAnimations();
  const renderer = useVariationRenderer();
  if (!selectedDataset || !(selectedDataset in barVariationDatasets)) {
    throw new Error(`Unknown Bar variation dataset: ${selectedDataset}`);
  }
  const datasetData = barVariationDatasets[selectedDataset as BarVariationDatasetName];
  const chartData = resolve(data, datasetData) ?? datasetData;
  const resolvedBarProps = resolve(barProps, chartData);
  const chartProps = useChartProps({
    data: chartData,
    width: size,
    height: Math.round(size * BAR_ASPECT_RATIO),
  });
  const showDefaultAxes = viewMode !== 'none';
  let legendNode: ReactNode = null;
  if (legend) {
    legendNode = legend(chartData);
  } else if (viewMode === 'axesLegend') {
    legendNode = <Legend highlight />;
  }
  return (
    <Chart
      {...chartProps}
      animations={animations}
      animationTypes={animations === undefined ? undefined : dashboardAnimationTypes}
      renderer={renderer}
      {...resolve(chartPropOverrides, chartData)}
    >
      {axes ? axes(chartData) : showDefaultAxes && DefaultAxes(resolvedBarProps?.orientation)}
      {siblings?.(chartData)}
      <Bar color="series" {...resolvedBarProps}>
        {children}
      </Bar>
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

const metricAxes =
  (metricAxisProps: Omit<AxisProps, 'position'>, dimensionAxisProps: Omit<AxisProps, 'position'> = {}) =>
  (): ReactElement[] =>
    [
      <Axis key="dimension" position="bottom" baseline {...dimensionAxisProps} />,
      <Axis key="metric" position="left" grid numberFormat="shortNumber" {...metricAxisProps} />,
    ];

const baseBarVariations: Variation[] = [
  {
    id: 'defaults',
    title: 'Defaults',
    description: 'Single series with every Bar default: static color, vertical, stacked, rounded corners.',
    dataset: 'single',
    usesDashboardDataset: false,
    coverage: [
      'color={value:categorical-100}',
      'dimension=category',
      'metric=value',
      'type=stacked',
      'orientation=vertical',
      'paddingRatio=0.4',
      'hasSquareCorners=false',
      'lineWidth=0',
      'name=bar0',
    ],
    render: () => <BarVariationChart data={singleBarData} barProps={{ color: undefined }} />,
  },
  {
    id: 'color-series',
    title: 'Stacked by series',
    description: 'Each series gets a categorical color and stacks on the previous one.',
    dataset: 'standard',
    coverage: ['color=series', 'type=stacked'],
    render: () => <BarVariationChart />,
  },
  {
    id: 'type-dodged',
    title: 'Dodged',
    description: 'Series sit side by side within each category.',
    dataset: 'standard',
    coverage: ['type=dodged'],
    render: () => <BarVariationChart barProps={{ type: 'dodged' }} />,
  },
  {
    id: 'orientation-horizontal',
    title: 'Horizontal stacked',
    description: 'Bars grow to the right; the dimension axis is on the left.',
    dataset: 'standard',
    coverage: ['orientation=horizontal', 'type=stacked'],
    render: () => <BarVariationChart barProps={{ orientation: 'horizontal' }} />,
  },
  {
    id: 'orientation-horizontal-dodged',
    title: 'Horizontal dodged',
    description: 'Horizontal bars side by side within each category.',
    dataset: 'standard',
    coverage: ['orientation=horizontal', 'type=dodged'],
    render: () => <BarVariationChart barProps={{ orientation: 'horizontal', type: 'dodged' }} />,
  },
  {
    id: 'metric-dimension-keys',
    title: 'Custom metric, dimension and color',
    description: 'Plots `previous` by series, colored by category.',
    dataset: 'standard',
    coverage: ['metric=previous', 'dimension=series', 'color=category'],
    render: () => <BarVariationChart barProps={{ color: 'category', dimension: 'series', metric: 'previous' }} />,
  },
  {
    id: 'dimension-time',
    title: 'Time dimension',
    description: 'Parses the `date` strings as UTC datetimes and labels them by day.',
    dataset: 'standard',
    coverage: ['dimensionDataType=time', 'dimension=date', 'Axis.labelFormat=time', 'Axis.granularity=day'],
    render: () => (
      <BarVariationChart
        axes={metricAxes({}, { granularity: 'day', labelFormat: 'time' })}
        barProps={{ dimension: 'date', dimensionDataType: 'time' }}
      />
    ),
  },
  {
    id: 'stack-order',
    title: 'Stack order',
    description: 'Higher `order` values stack on top, so the first series sits at the base.',
    dataset: 'standard',
    coverage: ['order=order'],
    render: () => <BarVariationChart barProps={{ order: 'order' }} />,
  },
  {
    id: 'dodged-stacked',
    title: 'Dodged and stacked',
    description: 'A dual color facet dodges by series and stacks New and Returning segments.',
    dataset: 'standard',
    coverage: ['color=[series,segment]', 'type=dodged'],
    render: () => (
      <BarVariationChart data={toSegmentRows} barProps={{ color: ['series', 'segment'], type: 'dodged' }} />
    ),
  },
  {
    id: 'padding-ratio',
    title: 'Narrow band padding',
    description: 'paddingRatio 0.1 makes the bars nearly touch.',
    dataset: 'standard',
    coverage: ['paddingRatio=0.1'],
    render: () => <BarVariationChart barProps={{ paddingRatio: 0.1 }} />,
  },
  {
    id: 'padding-outer',
    title: 'Outer padding',
    description: 'paddingOuter 0.6 adds space before the first and after the last category.',
    dataset: 'standard',
    coverage: ['paddingOuter=0.6'],
    render: () => <BarVariationChart barProps={{ paddingOuter: 0.6 }} />,
  },
  {
    id: 'grouped-padding',
    title: 'Grouped padding',
    description: 'Adds space between dodged bars within each category.',
    dataset: 'standard',
    coverage: ['groupedPadding=0.3', 'type=dodged'],
    render: () => <BarVariationChart barProps={{ groupedPadding: 0.3, type: 'dodged' }} />,
  },
  {
    id: 'square-corners',
    title: 'Square corners',
    description: 'Removes the rounded top corners.',
    dataset: 'standard',
    coverage: ['hasSquareCorners=true'],
    render: () => <BarVariationChart barProps={{ hasSquareCorners: true }} />,
  },
  {
    id: 'outlined',
    title: 'Dashed outline',
    description: 'Translucent fill with a 2px dashed border.',
    dataset: 'standard',
    coverage: ['lineWidth=2', 'lineType={value:dashed}', 'opacity={value:0.3}'],
    render: () => (
      <BarVariationChart barProps={{ lineType: { value: 'dashed' }, lineWidth: 2, opacity: { value: 0.3 } }} />
    ),
  },
  {
    id: 'line-type-series',
    title: 'Line type by series',
    description: 'Dodged outlined bars with a different dash pattern per series.',
    dataset: 'standard',
    coverage: ['lineType=series', 'lineWidth=2'],
    render: () => (
      <BarVariationChart barProps={{ lineType: 'series', lineWidth: 2, opacity: { value: 0.3 }, type: 'dodged' }} />
    ),
  },
  {
    id: 'opacity-series',
    title: 'Opacity by series',
    description: 'Every series shares one color and gets its own opacity.',
    dataset: 'standard',
    coverage: ['opacity=series'],
    render: () => <BarVariationChart barProps={{ color: { value: 'categorical-100' }, opacity: 'series' }} />,
  },
  {
    id: 'color-override',
    title: 'Color override',
    description: 'Each bar is filled from its `barColor` field: green when positive, red when negative.',
    dataset: 'negative',
    usesDashboardDataset: false,
    coverage: ['colorOverride=barColor'],
    render: () => <BarVariationChart data={getFirstSeries(negativeBarData)} barProps={{ colorOverride: 'barColor' }} />,
  },
  {
    id: 'diverging',
    title: 'Diverging',
    description: 'The dimension axis sits on zero and labels flip to the opposite side of each bar.',
    dataset: 'negative',
    usesDashboardDataset: false,
    coverage: ['diverging=true'],
    render: () => <BarVariationChart data={getFirstSeries(negativeBarData)} barProps={{ diverging: true }} />,
  },
  {
    id: 'diverging-horizontal',
    title: 'Horizontal diverging',
    description: 'Diverging bars grow left and right of a vertical zero baseline.',
    dataset: 'negative',
    usesDashboardDataset: false,
    coverage: ['diverging=true', 'orientation=horizontal', 'colorOverride=barColor'],
    render: () => (
      <BarVariationChart
        data={getFirstSeries(negativeBarData)}
        barProps={{ colorOverride: 'barColor', diverging: true, orientation: 'horizontal' }}
      />
    ),
  },
  {
    id: 'trellis',
    title: 'Trellis',
    description: 'One stacked chart per region, side by side.',
    dataset: 'standard',
    coverage: ['trellis=region', 'trellisOrientation=horizontal', 'trellisPadding=0.2'],
    render: () => <BarVariationChart data={toRegionRows} barProps={{ trellis: 'region' }} />,
  },
  {
    id: 'trellis-vertical',
    title: 'Vertical trellis with padding',
    description: 'Horizontal dodged bars with regions stacked vertically and extra space between them.',
    dataset: 'standard',
    coverage: ['trellisOrientation=vertical', 'trellisPadding=0.5', 'orientation=horizontal'],
    render: () => (
      <BarVariationChart
        data={toRegionRows}
        barProps={{
          orientation: 'horizontal',
          trellis: 'region',
          trellisOrientation: 'vertical',
          trellisPadding: 0.5,
          type: 'dodged',
        }}
      />
    ),
  },
  {
    id: 'dual-metric-axis',
    title: 'Dual metric axis',
    description: 'The last series is scaled against the right axis.',
    dataset: 'standard',
    coverage: ['dualMetricAxis=true', 'type=dodged', 'Axis.position=right'],
    render: () => (
      <BarVariationChart
        axes={() => [
          <Axis key="bottom" position="bottom" baseline />,
          <Axis key="left" position="left" grid numberFormat="shortNumber" />,
          <Axis key="right" position="right" numberFormat="shortNumber" />,
        ]}
        barProps={{ dualMetricAxis: true, type: 'dodged' }}
      >
        <ChartInspect>{inspectContent}</ChartInspect>
      </BarVariationChart>
    ),
  },
  {
    id: 'trendline-average',
    title: 'Average trendline',
    description: 'A dashed average line per series over dodged bars.',
    dataset: 'standard',
    coverage: ['trendlines=[average]'],
    render: () => <BarVariationChart barProps={{ trendlines: [{ method: 'average' }], type: 'dodged' }} />,
  },
];

const callbackBarProps = (log: (message: string) => void): Partial<BarProps> => ({
  onMouseOver: (datum) => log(`Over ${formatDatum(datum)}`),
  onMouseOut: (datum) => log(`Out ${formatDatum(datum)}`),
});

const interactionVariations: Variation[] = [
  {
    id: 'named-interactive',
    title: 'Named bar with popover',
    description: 'Sets a custom mark name; click must still open the popover.',
    dataset: 'standard',
    coverage: ['name=signups', 'ChartPopover'],
    render: () => (
      <BarVariationChart barProps={{ name: 'signups' }}>
        <ChartPopover>{popoverContent}</ChartPopover>
      </BarVariationChart>
    ),
  },
  {
    id: 'on-click',
    title: 'onClick',
    description: 'Click a bar; the last clicked datum is shown below the chart.',
    dataset: 'standard',
    coverage: ['onClick'],
    render: () => (
      <CallbackVariation
        render={(log) => <BarVariationChart barProps={{ onClick: (datum) => log(`Clicked ${formatDatum(datum)}`) }} />}
      />
    ),
  },
  {
    id: 'on-context-menu',
    title: 'onContextMenu',
    description: 'Right-click a bar; the datum is shown below the chart.',
    dataset: 'standard',
    coverage: ['onContextMenu'],
    render: () => (
      <CallbackVariation
        render={(log) => (
          <BarVariationChart
            barProps={{
              onContextMenu: (event, datum) => {
                event.preventDefault();
                log(`Context menu ${formatDatum(datum)}`);
              },
            }}
          />
        )}
      />
    ),
  },
  {
    id: 'on-mouse-over-out',
    title: 'onMouseOver and onMouseOut',
    description: 'Hover in and out of bars; the latest event is shown below the chart.',
    dataset: 'standard',
    coverage: ['onMouseOver', 'onMouseOut'],
    render: () => <CallbackVariation render={(log) => <BarVariationChart barProps={callbackBarProps(log)} />} />,
  },
];

const childVariations: Variation[] = [
  {
    id: 'direct-label-default',
    title: 'BarDirectLabel',
    description: 'Labels each bar value outside its tip.',
    dataset: 'standard',
    coverage: ['BarDirectLabel.position=end-outside', 'type=dodged'],
    render: () => (
      <BarVariationChart barProps={{ type: 'dodged' }}>
        <BarDirectLabel />
      </BarVariationChart>
    ),
  },
  {
    id: 'direct-label-stacked',
    title: 'Stacked direct labels',
    description: 'Labels every stacked segment in its middle.',
    dataset: 'standard',
    coverage: ['BarDirectLabel.position=middle', 'type=stacked'],
    render: () => (
      <BarVariationChart barProps={{ orientation: 'horizontal' }}>
        <BarDirectLabel position="middle" />
      </BarVariationChart>
    ),
  },
  {
    id: 'direct-label-end',
    title: 'Direct labels inside the tip',
    description: 'Horizontal bars labeled inside, 8px from the tip.',
    dataset: 'single',
    usesDashboardDataset: false,
    coverage: ['BarDirectLabel.position=end', 'orientation=horizontal'],
    render: () => (
      <BarVariationChart data={singleBarData} barProps={{ orientation: 'horizontal' }}>
        <BarDirectLabel position="end" />
      </BarVariationChart>
    ),
  },
  {
    id: 'direct-label-start-format',
    title: 'Formatted direct labels at start',
    description: 'Compact numbers near the baseline; labels that do not fit spill past the tip.',
    dataset: 'single',
    usesDashboardDataset: false,
    coverage: ['BarDirectLabel.position=start', 'BarDirectLabel.format=shortNumber'],
    render: () => (
      <BarVariationChart data={singleBarData}>
        <BarDirectLabel format="shortNumber" position="start" />
      </BarVariationChart>
    ),
  },
  {
    id: 'direct-label-diverging',
    title: 'Diverging direct labels',
    description: 'Labels sit outside the tip on both sides of zero.',
    dataset: 'negative',
    usesDashboardDataset: false,
    coverage: ['BarDirectLabel.format=,.0f', 'diverging=true'],
    render: () => (
      <BarVariationChart data={getFirstSeries(negativeBarData)} barProps={{ diverging: true }}>
        <BarDirectLabel format=",.0f" />
      </BarVariationChart>
    ),
  },
  {
    id: 'direct-label-overflow-hide',
    title: 'Direct labels hide when they do not fit',
    description: 'Middle labels on thin dodged bars hide instead of overflowing.',
    dataset: 'dense',
    usesDashboardDataset: false,
    coverage: ['BarDirectLabel.overflow=hide'],
    render: () => (
      <BarVariationChart data={denseBarData} barProps={{ type: 'dodged' }}>
        <BarDirectLabel position="middle" />
      </BarVariationChart>
    ),
  },
  {
    id: 'direct-label-overflow-spill',
    title: 'Direct labels spill past the tip',
    description: 'Labels that do not fit move outside the tip; ones that would overlap hide.',
    dataset: 'dense',
    usesDashboardDataset: false,
    coverage: ['BarDirectLabel.overflow=spill'],
    render: () => (
      <BarVariationChart data={denseBarData} barProps={{ type: 'dodged' }}>
        <BarDirectLabel position="end" overflow="spill" />
      </BarVariationChart>
    ),
  },
  {
    id: 'direct-label-data-key',
    title: 'Direct label on one bar',
    description: 'Only the bar flagged by `callout` is labeled.',
    dataset: 'standard',
    coverage: ['BarDirectLabel.dataKey'],
    render: () => (
      <BarVariationChart barProps={{ type: 'dodged' }}>
        <BarDirectLabel dataKey="callout" />
      </BarVariationChart>
    ),
  },
  {
    id: 'inspect-default',
    title: 'ChartInspect',
    description: 'Hover a bar to show inspect content.',
    dataset: 'standard',
    coverage: ['ChartInspect.children'],
    render: () => (
      <BarVariationChart>
        <ChartInspect>{inspectContent}</ChartInspect>
      </BarVariationChart>
    ),
  },
  {
    id: 'inspect-highlight-series',
    title: 'Inspect highlights series',
    description: 'Hovering keeps the whole series emphasized and fades the others.',
    dataset: 'standard',
    coverage: ['ChartInspect.highlightBy=series'],
    render: () => (
      <BarVariationChart>
        <ChartInspect highlightBy="series">{inspectContent}</ChartInspect>
      </BarVariationChart>
    ),
  },
  {
    id: 'inspect-highlight-dimension',
    title: 'Inspect highlights dimension',
    description: 'Hovering highlights every series in the hovered category.',
    dataset: 'standard',
    coverage: ['ChartInspect.highlightBy=dimension'],
    render: () => (
      <BarVariationChart barProps={{ type: 'dodged' }}>
        <ChartInspect highlightBy="dimension">{inspectContent}</ChartInspect>
      </BarVariationChart>
    ),
  },
  {
    id: 'inspect-highlight-keys',
    title: 'Inspect highlights by keys',
    description: 'Highlights every bar sharing the hovered `order` value.',
    dataset: 'standard',
    coverage: ['ChartInspect.highlightBy=[order]'],
    render: () => (
      <BarVariationChart>
        <ChartInspect highlightBy={['order']}>{inspectContent}</ChartInspect>
      </BarVariationChart>
    ),
  },
  {
    id: 'inspect-highlight-item',
    title: 'Inspect highlights item',
    description: 'Only the hovered bar is emphasized.',
    dataset: 'standard',
    coverage: ['ChartInspect.highlightBy=item'],
    render: () => (
      <BarVariationChart>
        <ChartInspect highlightBy="item">{inspectContent}</ChartInspect>
      </BarVariationChart>
    ),
  },
  {
    id: 'inspect-target-dimension-area',
    title: 'Inspect dimension area target',
    description: 'Hovering anywhere in a category band shows inspect for that category.',
    dataset: 'standard',
    coverage: ['ChartInspect.targets=[dimensionArea]'],
    render: () => (
      <BarVariationChart>
        <ChartInspect targets={['dimensionArea']}>{inspectContent}</ChartInspect>
      </BarVariationChart>
    ),
  },
  {
    id: 'inspect-target-item',
    title: 'Inspect item target',
    description: 'Only hovering a bar directly shows inspect.',
    dataset: 'standard',
    coverage: ['ChartInspect.targets=[item]'],
    render: () => (
      <BarVariationChart>
        <ChartInspect targets={['item']}>{inspectContent}</ChartInspect>
      </BarVariationChart>
    ),
  },
  {
    id: 'inspect-exclude-keys',
    title: 'Inspect with excluded data',
    description: 'The first series has `excludeFromInspect`, so hovering it shows no inspect.',
    dataset: 'standard',
    coverage: ['ChartInspect.excludeDataKeys=[excludeFromInspect]'],
    render: () => (
      <BarVariationChart>
        <ChartInspect excludeDataKeys={['excludeFromInspect']}>{inspectContent}</ChartInspect>
      </BarVariationChart>
    ),
  },
  {
    id: 'popover-default',
    title: 'ChartPopover',
    description: 'Click a bar to open a popover sized to its content.',
    dataset: 'standard',
    coverage: ['ChartPopover.children', 'ChartPopover.width=auto'],
    render: () => (
      <BarVariationChart>
        <ChartPopover width="auto">{popoverContent}</ChartPopover>
      </BarVariationChart>
    ),
  },
  {
    id: 'popover-fixed-size',
    title: 'Fixed-size popover',
    description: 'Popover is exactly 240 × 120px.',
    dataset: 'standard',
    coverage: ['ChartPopover.width=240', 'ChartPopover.height=120'],
    render: () => (
      <BarVariationChart>
        <ChartPopover height={120} width={240}>
          {popoverContent}
        </ChartPopover>
      </BarVariationChart>
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
      <BarVariationChart>
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
      </BarVariationChart>
    ),
  },
  {
    id: 'popover-right-click',
    title: 'Right-click popover',
    description: 'Opens the popover on right click instead of left click.',
    dataset: 'standard',
    coverage: ['ChartPopover.rightClick=true'],
    render: () => (
      <BarVariationChart>
        <ChartPopover rightClick>{popoverContent}</ChartPopover>
      </BarVariationChart>
    ),
  },
  {
    id: 'popover-highlight-dimension',
    title: 'Popover highlights dimension',
    description: 'While open, every series in the clicked category stays highlighted.',
    dataset: 'standard',
    coverage: ['ChartPopover.UNSAFE_highlightBy=dimension'],
    render: () => (
      <BarVariationChart barProps={{ type: 'dodged' }}>
        <ChartPopover UNSAFE_highlightBy="dimension">{popoverContent}</ChartPopover>
      </BarVariationChart>
    ),
  },
  {
    id: 'popover-highlight-series',
    title: 'Popover highlights series',
    description: 'While open, the clicked series stays highlighted.',
    dataset: 'standard',
    coverage: ['ChartPopover.UNSAFE_highlightBy=series'],
    render: () => (
      <BarVariationChart>
        <ChartPopover UNSAFE_highlightBy="series">{popoverContent}</ChartPopover>
      </BarVariationChart>
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
          <BarVariationChart>
            <ChartPopover onOpenChange={(isOpen) => log(`Popover open: ${isOpen}`)}>{popoverContent}</ChartPopover>
          </BarVariationChart>
        )}
      />
    ),
  },
];

const axisVariations: Variation[] = [
  {
    id: 'axis-titles-format',
    title: 'Axis titles and number format',
    description: 'Titled axes; the metric axis uses compact numbers for billions.',
    dataset: 'largeValues',
    usesDashboardDataset: false,
    coverage: ['Axis.title', 'Axis.numberFormat=shortNumber', 'Axis.grid', 'Axis.baseline', 'Axis.ticks'],
    render: () => (
      <BarVariationChart
        axes={metricAxes({ title: 'Revenue' }, { ticks: true, title: 'Channel' })}
        barProps={{ type: 'dodged' }}
        data={largeBarData}
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
      <BarVariationChart
        axes={metricAxes({ currencyCode: 'EUR', numberFormat: 'shortCurrency' })}
        barProps={{ type: 'dodged' }}
        data={largeBarData}
      />
    ),
  },
  {
    id: 'axis-range',
    title: 'Fixed metric range',
    description: 'Pins the metric axis to 0–10,000.',
    dataset: 'standard',
    coverage: ['Axis.range=[0,10000]'],
    render: () => <BarVariationChart axes={metricAxes({ range: [0, 10000] })} />,
  },
  {
    id: 'axis-tick-limits',
    title: 'Tick count limit and vertical labels',
    description: 'At most four metric ticks; forty dimension labels are rotated.',
    dataset: 'manyCategories',
    usesDashboardDataset: false,
    coverage: ['Axis.tickCountLimit=4', 'Axis.labelOrientation=vertical'],
    render: () => (
      <BarVariationChart
        axes={metricAxes({ tickCountLimit: 4 }, { labelOrientation: 'vertical' })}
        data={manyCategoryBarData}
      />
    ),
  },
  {
    id: 'axis-label-limit',
    title: 'Truncated dimension labels',
    description: 'Long category names on a horizontal bar are truncated at 120px.',
    dataset: 'longLabels',
    usesDashboardDataset: false,
    coverage: ['Axis.labelLimit=120', 'Axis.truncateLabels', 'orientation=horizontal'],
    render: () => (
      <BarVariationChart
        axes={() => [
          <Axis key="left" position="left" baseline labelLimit={120} truncateLabels />,
          <Axis key="bottom" position="bottom" grid numberFormat="shortNumber" />,
        ]}
        barProps={{ orientation: 'horizontal', type: 'dodged' }}
        data={longLabelBarData}
      />
    ),
  },
  {
    id: 'axis-reference-lines',
    title: 'Reference lines',
    description: 'A labeled goal on the metric axis and a marker on the Social category.',
    dataset: 'standard',
    coverage: ['Axis.children', 'ReferenceLine.value', 'ReferenceLine.label'],
    render: () => (
      <BarVariationChart
        axes={(data) => [
          <Axis key="bottom" position="bottom" baseline>
            <ReferenceLine label="Focus" value={data[Math.min(2, data.length - 1)]?.category ?? ''} />
          </Axis>,
          <Axis key="left" position="left" grid numberFormat="shortNumber">
            <ReferenceLine label="Goal" value={6000} />
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
    description: 'Default bottom legend with hover highlight.',
    dataset: 'standard',
    coverage: ['Legend.position=bottom', 'Legend.highlight'],
    render: () => <BarVariationChart legend={() => <Legend highlight />} />,
  },
  {
    id: 'legend-right-title',
    title: 'Right legend with title',
    description: 'Moves the legend to the right and adds a title.',
    dataset: 'standard',
    coverage: ['Legend.position=right', 'Legend.title'],
    render: () => <BarVariationChart legend={() => <Legend position="right" title="Source" />} />,
  },
  {
    id: 'legend-opacity',
    title: 'Legend opacity facet',
    description: 'Legend symbols match the per-series opacities.',
    dataset: 'standard',
    coverage: ['Legend.opacity=series', 'opacity=series'],
    render: () => (
      <BarVariationChart
        barProps={{ color: { value: 'categorical-100' }, opacity: 'series' }}
        legend={() => <Legend opacity="series" />}
      />
    ),
  },
  {
    id: 'legend-toggleable',
    title: 'Toggleable legend',
    description: 'Click entries to hide series; the first series starts hidden.',
    dataset: 'standard',
    coverage: ['Legend.isToggleable', 'Legend.defaultHiddenSeries=[first]'],
    render: () => (
      <BarVariationChart
        legend={(data) => <Legend defaultHiddenSeries={getBarSeries(data).slice(0, 1)} isToggleable />}
      />
    ),
  },
  {
    id: 'legend-hidden-entries',
    title: 'Hidden legend entry',
    description: 'Omits the last series from the legend while its bars still render.',
    dataset: 'standard',
    coverage: ['Legend.hiddenEntries=[last]'],
    render: () => <BarVariationChart legend={(data) => <Legend hiddenEntries={getBarSeries(data).slice(-1)} />} />,
  },
  {
    id: 'legend-labels',
    title: 'Custom legend labels',
    description: 'Replaces series names with longer labels truncated at 80px.',
    dataset: 'standard',
    coverage: ['Legend.legendLabels', 'Legend.labelLimit=80'],
    render: () => (
      <BarVariationChart
        legend={(data) => (
          <Legend
            labelLimit={80}
            legendLabels={getBarSeries(data).map((series) => ({ seriesName: series, label: `${series} sign-ups` }))}
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
      <BarVariationChart
        legend={(data) => (
          <Legend
            descriptions={getBarSeries(data).map((series) => ({
              seriesName: series,
              description: `Sign-ups from ${series} sources`,
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
    render: () => <BarVariationChart siblings={() => <Title text="Sign-ups by channel" />} />,
  },
  {
    id: 'controlled-hidden-series',
    title: 'Controlled hidden series',
    description: 'Hides the first series through the Chart hiddenSeries prop.',
    dataset: 'standard',
    coverage: ['Chart.hiddenSeries=[first]'],
    render: () => (
      <BarVariationChart
        chartProps={(data) => ({ hiddenSeries: getBarSeries(data).slice(0, 1) })}
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
    render: () => <BarVariationChart chartProps={(data) => ({ highlightedSeries: getBarSeries(data)[0] })} />,
  },
  {
    id: 'controlled-highlighted-item',
    title: 'Controlled highlighted item',
    description: 'Highlights the first bar by id using idKey="id" and highlightedItem.',
    dataset: 'standard',
    coverage: ['Chart.idKey=id', 'Chart.highlightedItem=first'],
    render: () => <BarVariationChart chartProps={(data) => ({ idKey: 'id', highlightedItem: data[0]?.id })} />,
  },
  {
    id: 'chart-colors',
    title: 'Custom colors',
    description: 'Overrides the categorical palette.',
    dataset: 'standard',
    coverage: ['Chart.colors=[...]'],
    render: () => (
      <BarVariationChart chartProps={{ colors: ['indigo-900', 'magenta-600', 'seafoam-600', 'orange-500'] }} />
    ),
  },
  {
    id: 'chart-line-types',
    title: 'Chart line types',
    description: 'Custom dash patterns for the outline lineType facet.',
    dataset: 'standard',
    coverage: ['Chart.lineTypes', 'lineType=series'],
    render: () => (
      <BarVariationChart
        chartProps={{ lineTypes: ['solid', 'dotted', [2, 6]] }}
        barProps={{ lineType: 'series', lineWidth: 2, opacity: { value: 0.3 }, type: 'dodged' }}
      />
    ),
  },
  {
    id: 'chart-opacities',
    title: 'Chart opacities',
    description: 'Custom opacities for the opacity facet.',
    dataset: 'standard',
    coverage: ['Chart.opacities', 'opacity=series'],
    render: () => (
      <BarVariationChart
        chartProps={{ opacities: [1, 0.6, 0.3] }}
        barProps={{ color: { value: 'categorical-100' }, opacity: 'series' }}
      />
    ),
  },
  {
    id: 'dark-background',
    title: 'Dark color scheme',
    description: 'Renders axes, bars and labels on a dark background.',
    dataset: 'standard',
    coverage: ['Chart.colorScheme=dark', 'Chart.backgroundColor=gray-25'],
    render: () => (
      <BarVariationChart chartProps={{ backgroundColor: 'gray-25', colorScheme: 'dark' }} barProps={{ type: 'dodged' }}>
        <BarDirectLabel format="shortNumber" />
      </BarVariationChart>
    ),
  },
  {
    id: 'locale',
    title: 'German locale',
    description: 'Formats axis numbers and direct labels with de-DE conventions.',
    dataset: 'standard',
    coverage: ['Chart.locale=de-DE', 'BarDirectLabel.format=,.0f'],
    render: () => (
      <BarVariationChart
        axes={metricAxes({ numberFormat: ',.0f' })}
        barProps={{ type: 'dodged' }}
        chartProps={{ locale: 'de-DE' }}
      >
        <BarDirectLabel format=",.0f" />
      </BarVariationChart>
    ),
  },
  {
    id: 'tooltip-anchor-mark',
    title: 'Inspect anchored to mark',
    description: 'Inspect content is placed above the hovered bar instead of following the cursor.',
    dataset: 'standard',
    coverage: ['Chart.tooltipAnchor=mark', 'Chart.tooltipPlacement=top'],
    render: () => (
      <BarVariationChart chartProps={{ tooltipAnchor: 'mark', tooltipPlacement: 'top' }}>
        <ChartInspect>{inspectContent}</ChartInspect>
      </BarVariationChart>
    ),
  },
  {
    id: 'empty-state',
    title: 'Empty data',
    description: 'Shows the empty state text when data is an empty array.',
    dataset: 'empty',
    usesDashboardDataset: false,
    coverage: ['Chart.emptyStateText', 'data=[]'],
    render: () => <BarVariationChart chartProps={{ emptyStateText: 'No sign-ups data' }} data={[]} />,
  },
  {
    id: 'loading',
    title: 'Loading',
    description: 'Shows the loading spinner in place of the chart.',
    dataset: 'standard',
    coverage: ['Chart.loading=true'],
    render: () => <BarVariationChart chartProps={{ loading: true }} />,
  },
];

export const barVariations: Variation[] = [
  ...baseBarVariations,
  ...interactionVariations,
  ...childVariations,
  ...axisVariations,
  ...legendVariations,
  ...chartVariations,
];

export const BarDashboard = (): ReactElement => (
  <VariationDashboard
    variations={barVariations}
    coverage={dashboard.coverage}
    chartType="Bar"
    datasets={barDatasetOptions}
    filters={barVariationFilters}
    getSizeDescription={(size) => `Chart: ${size} × ${Math.round(size * BAR_ASPECT_RATIO)}px`}
    initialSize={360}
    initialDataset="standard"
    initialFilter="all"
    initialViewMode="axes"
    sizePresets={barSizePresets}
    showAnimationControls
    viewModes={barViewModes}
  />
);

const barCoverage: PropCoverage<BarProps> = {
  children: ['direct-label-default', 'inspect-default', 'popover-default'],
  color: ['defaults', 'color-series', 'metric-dimension-keys', 'dodged-stacked'],
  colorOverride: ['color-override', 'diverging-horizontal'],
  dimension: ['defaults', 'metric-dimension-keys', 'dimension-time'],
  dimensionDataType: ['dimension-time'],
  diverging: ['defaults', 'diverging', 'diverging-horizontal', 'direct-label-diverging'],
  dualMetricAxis: ['dual-metric-axis'],
  groupedPadding: ['grouped-padding'],
  hasSquareCorners: ['defaults', 'square-corners'],
  lineType: ['outlined', 'line-type-series', 'chart-line-types'],
  lineWidth: ['defaults', 'outlined', 'line-type-series'],
  metric: ['defaults', 'metric-dimension-keys'],
  metricAxis: { skip: 'Secondary scale name for Combo; covered by the Combo dashboard' },
  name: ['defaults', 'named-interactive'],
  onClick: ['on-click'],
  onContextMenu: ['on-context-menu'],
  onMouseOut: ['on-mouse-over-out'],
  onMouseOver: ['on-mouse-over-out'],
  opacity: ['outlined', 'opacity-series', 'chart-opacities'],
  order: ['stack-order'],
  orientation: ['defaults', 'orientation-horizontal', 'orientation-horizontal-dodged'],
  paddingOuter: ['padding-outer'],
  paddingRatio: ['defaults', 'padding-ratio'],
  trellis: ['trellis', 'trellis-vertical'],
  trellisOrientation: ['trellis', 'trellis-vertical'],
  trellisPadding: ['trellis', 'trellis-vertical'],
  trendlines: ['trendline-average'],
  type: ['defaults', 'type-dodged', 'dodged-stacked'],
};

const barDirectLabelCoverage: PropCoverage<BarDirectLabelProps> = {
  dataKey: ['direct-label-data-key'],
  format: ['direct-label-start-format', 'direct-label-diverging', 'locale'],
  overflow: ['direct-label-overflow-hide', 'direct-label-overflow-spill'],
  position: ['direct-label-default', 'direct-label-stacked', 'direct-label-end', 'direct-label-start-format'],
};

const chartInspectCoverage: PropCoverage<ChartInspectProps> = {
  children: ['inspect-default'],
  excludeDataKeys: ['inspect-exclude-keys'],
  highlightBy: [
    'inspect-highlight-item',
    'inspect-highlight-series',
    'inspect-highlight-dimension',
    'inspect-highlight-keys',
  ],
  targets: ['inspect-target-dimension-area', 'inspect-target-item'],
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
  UNSAFE_highlightBy: ['popover-highlight-dimension', 'popover-highlight-series'],
  width: ['popover-default', 'popover-fixed-size'],
};

const axisCoverage: SiblingCoverage<AxisProps> = {
  baseline: ['axis-titles-format'],
  children: ['axis-reference-lines'],
  currencyCode: ['axis-currency'],
  granularity: ['dimension-time'],
  grid: ['axis-titles-format'],
  labelFormat: ['dimension-time'],
  labelLimit: ['axis-label-limit'],
  labelOrientation: ['axis-tick-limits'],
  numberFormat: ['axis-titles-format', 'axis-currency'],
  position: ['orientation-horizontal', 'dual-metric-axis'],
  range: ['axis-range'],
  tickCountLimit: ['axis-tick-limits'],
  ticks: ['axis-titles-format'],
  title: ['axis-titles-format'],
  truncateLabels: ['axis-label-limit'],
};

const legendCoverage: SiblingCoverage<LegendProps> = {
  defaultHiddenSeries: ['legend-toggleable'],
  descriptions: ['legend-descriptions'],
  hiddenEntries: ['legend-hidden-entries'],
  highlight: ['legend-default'],
  isToggleable: ['legend-toggleable'],
  labelLimit: ['legend-labels'],
  legendLabels: ['legend-labels'],
  opacity: ['legend-opacity'],
  position: ['legend-default', 'legend-right-title'],
  title: ['legend-right-title'],
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
  lineTypes: ['chart-line-types'],
  loading: ['loading'],
  locale: ['locale'],
  opacities: ['chart-opacities'],
  renderer: { skip: 'Covered by the dashboard Renderer control' },
  tooltipAnchor: ['tooltip-anchor-mark'],
  tooltipPlacement: ['tooltip-anchor-mark'],
};

export const dashboard: DashboardDefinition = {
  chartType: 'Bar',
  variations: barVariations,
  coverage: {
    Bar: barCoverage,
    BarDirectLabel: barDirectLabelCoverage,
    ChartInspect: chartInspectCoverage,
    ChartPopover: chartPopoverCoverage,
    Axis: axisCoverage,
    Legend: legendCoverage,
    Title: titleCoverage,
    Chart: chartCoverage,
  },
};
