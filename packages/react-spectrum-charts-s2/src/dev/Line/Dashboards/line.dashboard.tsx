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
  ChartActionBar,
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
import {
  AxisProps,
  ChartActionBarProps,
  ChartInspectProps,
  ChartPopoverProps,
  ChartProps,
  LegendProps,
  LineDirectLabelProps,
  LineForecastProps,
  LinePointAnnotationProps,
  LineProps,
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
import { renderActionBarContent } from '../../playgroundUtils.js';
import {
  LineVariationDatasetName,
  LineVariationDatum,
  getForecastStart,
  getLineSeries,
  lineDatasetOptions,
  lineVariationDatasets,
} from './lineVariationData.js';

const lineSizePresets: VariationSizePreset[] = [
  { label: 'XS', size: 160 },
  { label: 'S', size: 240 },
  { label: 'M', size: 360 },
  { label: 'L', size: 480 },
  { label: 'XL', size: 720 },
];

const lineViewModes: VariationViewMode[] = [
  { label: 'Axes', value: 'axes' },
  { label: 'Axes and legend', value: 'axesLegend' },
  { label: 'Line only', value: 'none' },
];

const dashboardAnimationTypes: ChartProps['animationTypes'] = ['hover', 'drawIn'];
const LINE_ASPECT_RATIO = 0.6;
const DAY_MS = 24 * 60 * 60 * 1000;

const LINE_CHILDREN = new Set([
  'ChartActionBar',
  'ChartInspect',
  'ChartPopover',
  'LineDirectLabel',
  'LineForecast',
  'LinePointAnnotation',
]);
const SIBLINGS = new Set(['Axis', 'AxisThumbnail', 'Chart', 'Legend', 'ReferenceLine', 'Title']);

const getCoverageComponent = (entry: string): string => entry.split(/[.=[]/)[0];
const coversAny =
  (components: Set<string>) =>
  ({ coverage }: Variation): boolean =>
    coverage.some((entry) => components.has(getCoverageComponent(entry)));
const coversLineProp = ({ coverage }: Variation): boolean =>
  coverage.some((entry) => /^[a-z]/.test(getCoverageComponent(entry)));

const lineVariationFilters: VariationFilter[] = [
  { label: 'All', value: 'all', matches: () => true },
  { label: 'Line props', value: 'line', matches: coversLineProp },
  { label: 'Children', value: 'children', matches: coversAny(LINE_CHILDREN) },
  { label: 'Siblings & Chart', value: 'siblings', matches: coversAny(SIBLINGS) },
];

const singleLineData = lineVariationDatasets.single;
const standardLineData = lineVariationDatasets.standard;
const sparseLineData = lineVariationDatasets.sparse;
const gapsLineData = lineVariationDatasets.gaps;
const largeLineData = lineVariationDatasets.largeValues;

const formatDatum = (datum: Datum): string => {
  const date = new Date(datum.datetime as number).toISOString().slice(0, 10);
  return `${String(datum.series)} · ${date} · ${String(datum.value)}`;
};

const inspectContent = (datum: Datum): ReactNode => (
  <div>
    <div>{String(datum.series)}</div>
    <div>{new Date(datum.datetime as number).toISOString().slice(0, 10)}</div>
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

type LineChartOverrides = Omit<Partial<ChartProps>, 'children' | 'data'>;
type DataFunction<T> = T | ((data: LineVariationDatum[]) => T);

const resolve = <T,>(value: DataFunction<T> | undefined, data: LineVariationDatum[]): T | undefined =>
  typeof value === 'function' ? (value as (data: LineVariationDatum[]) => T)(data) : value;

interface LineVariationChartProps extends Pick<LineProps, 'children'> {
  data?: LineVariationDatum[];
  /** Line prop overrides; `color` defaults to `series`. */
  lineProps?: DataFunction<Omit<LineProps, 'children'>>;
  /** Chart prop overrides; functions receive the active dataset. */
  chartProps?: DataFunction<LineChartOverrides>;
  /** Replaces the default axes in every view mode. */
  axes?: (data: LineVariationDatum[]) => ReactNode;
  /** Replaces the default legend in every view mode. */
  legend?: (data: LineVariationDatum[]) => ReactNode;
  /** Extra chart-level siblings such as Title. */
  siblings?: (data: LineVariationDatum[]) => ReactNode;
}

const DefaultAxes = (): ReactElement[] => [
  <Axis key="left" position="left" grid numberFormat="shortNumber" />,
  <Axis key="bottom" position="bottom" labelFormat="time" baseline ticks />,
];

const LineVariationChart = ({
  data,
  lineProps,
  children,
  chartProps: chartPropOverrides,
  axes,
  legend,
  siblings,
}: LineVariationChartProps): ReactElement => {
  const selectedDataset = useVariationDataset();
  const size = useVariationSize();
  const viewMode = useVariationViewMode();
  const animations = useVariationAnimations();
  const renderer = useVariationRenderer();
  if (!selectedDataset || !(selectedDataset in lineVariationDatasets)) {
    throw new Error(`Unknown Line variation dataset: ${selectedDataset}`);
  }
  const chartData = data ?? lineVariationDatasets[selectedDataset as LineVariationDatasetName];
  const chartProps = useChartProps({
    data: chartData,
    width: size,
    height: Math.round(size * LINE_ASPECT_RATIO),
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
      {axes ? axes(chartData) : showDefaultAxes && DefaultAxes()}
      {siblings?.(chartData)}
      <Line color="series" {...resolve(lineProps, chartData)}>
        {children}
      </Line>
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

const indexAxes = (): ReactElement[] => [
  <Axis key="left" position="left" grid numberFormat="shortNumber" />,
  <Axis key="bottom" position="bottom" baseline ticks title="Day" />,
];

const noAxes = (): null => null;

const baseLineVariations: Variation[] = [
  {
    id: 'defaults',
    title: 'Defaults',
    description: 'Single series with every Line default: static color, solid, time scale, nearest hover.',
    dataset: 'single',
    usesDashboardDataset: false,
    coverage: [
      'color={value:categorical-100}',
      'dimension=datetime',
      'metric=value',
      'lineType=solid',
      'lineCap=round',
      'scaleType=time',
      'interactionMode=nearest',
      'showHoverLabel=true',
      'name=line0',
    ],
    render: () => <LineVariationChart data={singleLineData} lineProps={{ color: undefined }} />,
  },
  {
    id: 'color-series',
    title: 'Color by series',
    description: 'Each series gets a categorical color.',
    dataset: 'standard',
    coverage: ['color=series'],
    render: () => <LineVariationChart />,
  },
  {
    id: 'metric-dimension-keys',
    title: 'Custom metric and dimension',
    description: 'Plots the `high` field against the 1-based `index` field on a linear scale.',
    dataset: 'standard',
    coverage: ['metric=high', 'dimension=index', 'scaleType=linear'],
    render: () => (
      <LineVariationChart axes={indexAxes} lineProps={{ metric: 'high', dimension: 'index', scaleType: 'linear' }} />
    ),
  },
  {
    id: 'scale-point',
    title: 'Point scale',
    description: 'Treats each index as a category with default point padding.',
    dataset: 'standard',
    coverage: ['scaleType=point', 'dimension=index'],
    render: () => <LineVariationChart axes={indexAxes} lineProps={{ dimension: 'index', scaleType: 'point' }} />,
  },
  {
    id: 'padding-point',
    title: 'Point scale padding',
    description: 'Point scale padding is a 0–1 ratio of the step.',
    dataset: 'standard',
    coverage: ['padding=0.5', 'scaleType=point'],
    render: () => (
      <LineVariationChart axes={indexAxes} lineProps={{ dimension: 'index', padding: 0.5, scaleType: 'point' }} />
    ),
  },
  {
    id: 'padding-time',
    title: 'Time scale padding',
    description: 'Continuous scale padding is in pixels.',
    dataset: 'standard',
    coverage: ['padding=32'],
    render: () => <LineVariationChart lineProps={{ padding: 32 }} />,
  },
  {
    id: 'line-type-series',
    title: 'Line type by series',
    description: 'Each series gets a different dash pattern.',
    dataset: 'standard',
    coverage: ['lineType=series'],
    render: () => <LineVariationChart lineProps={{ lineType: 'series' }} />,
  },
  {
    id: 'line-type-static',
    title: 'Static dashed line type',
    description: 'Every series uses the same dashed pattern.',
    dataset: 'standard',
    coverage: ['lineType={value:dashed}'],
    render: () => <LineVariationChart lineProps={{ lineType: { value: 'dashed' } }} />,
  },
  {
    id: 'opacity-static',
    title: 'Static opacity',
    description: 'Every series is drawn at 40% opacity.',
    dataset: 'standard',
    coverage: ['opacity={value:0.4}'],
    render: () => <LineVariationChart lineProps={{ opacity: { value: 0.4 } }} />,
  },
  {
    id: 'interpolate-monotone',
    title: 'Monotone interpolation',
    description: 'Smooths the line without overshooting the data.',
    dataset: 'standard',
    coverage: ['interpolate=monotone'],
    render: () => <LineVariationChart lineProps={{ interpolate: 'monotone' }} />,
  },
  {
    id: 'interpolate-step',
    title: 'Step-after interpolation',
    description: 'Holds each value until the next point.',
    dataset: 'standard',
    coverage: ['interpolate=step-after'],
    render: () => <LineVariationChart lineProps={{ interpolate: 'step-after' }} />,
  },
  {
    id: 'line-cap-square',
    title: 'Square line caps',
    description: 'Null values split each line; the segment ends use square caps.',
    dataset: 'gaps',
    usesDashboardDataset: false,
    coverage: ['lineCap=square', 'value=null'],
    render: () => <LineVariationChart data={gapsLineData} lineProps={{ lineCap: 'square' }} />,
  },
  {
    id: 'gradient',
    title: 'Gradient fill',
    description: 'Adds an area gradient under a single series.',
    dataset: 'single',
    usesDashboardDataset: false,
    coverage: ['gradient=true'],
    render: () => <LineVariationChart data={singleLineData} lineProps={{ gradient: true }} />,
  },
  {
    id: 'static-points',
    title: 'Static points',
    description: 'Draws a point on each series peak using the `isPeak` field.',
    dataset: 'standard',
    coverage: ['staticPoint=isPeak'],
    render: () => <LineVariationChart lineProps={{ staticPoint: 'isPeak' }} />,
  },
  {
    id: 'point-size',
    title: 'Static point size',
    description: 'Overrides the chart-size-based static point size.',
    dataset: 'standard',
    coverage: ['pointSize=100', 'staticPoint=isPeak'],
    render: () => <LineVariationChart lineProps={{ pointSize: 100, staticPoint: 'isPeak' }} />,
  },
  {
    id: 'sparkline',
    title: 'Sparkline',
    description: 'No axes; the last point of each series is marked.',
    dataset: 'single',
    usesDashboardDataset: false,
    coverage: ['isSparkline=true', 'isMethodLast=true', 'staticPoint=isLast'],
    render: () => (
      <LineVariationChart
        axes={noAxes}
        data={singleLineData.map((datum, index) => ({ ...datum, isLast: index === singleLineData.length - 1 }))}
        lineProps={{
          dimension: 'index',
          isMethodLast: true,
          isSparkline: true,
          scaleType: 'linear',
          staticPoint: 'isLast',
        }}
      />
    ),
  },
  {
    id: 'sparkline-peak',
    title: 'Sparkline with peak point',
    description: 'Sparkline that marks the peak instead of the last point.',
    dataset: 'single',
    usesDashboardDataset: false,
    coverage: ['isSparkline=true', 'isMethodLast=false'],
    render: () => (
      <LineVariationChart
        axes={noAxes}
        data={singleLineData}
        lineProps={{ dimension: 'index', isSparkline: true, scaleType: 'linear', staticPoint: 'isPeak' }}
      />
    ),
  },
];

const interactionVariations: Variation[] = [
  {
    id: 'interaction-item',
    title: 'Item interaction mode',
    description: 'Hover must be over a point instead of the nearest point.',
    dataset: 'standard',
    coverage: ['interactionMode=item', 'ChartInspect'],
    render: () => (
      <LineVariationChart lineProps={{ interactionMode: 'item' }}>
        <ChartInspect>{inspectContent}</ChartInspect>
      </LineVariationChart>
    ),
  },
  {
    id: 'dimension-hover',
    title: 'Dimension hover',
    description: 'Hovering highlights every series at the hovered date and labels each value.',
    dataset: 'standard',
    coverage: ['dimensionHover=true'],
    render: () => <LineVariationChart lineProps={{ dimensionHover: true }} />,
  },
  {
    id: 'hover-label-hidden',
    title: 'Hidden hover label',
    description: 'Hovering highlights the point without a value label.',
    dataset: 'standard',
    coverage: ['showHoverLabel=false'],
    render: () => <LineVariationChart lineProps={{ showHoverLabel: false }} />,
  },
  {
    id: 'hover-label-key',
    title: 'Hover label key',
    description: 'The hover label reads the pre-formatted `displayValue` field.',
    dataset: 'standard',
    coverage: ['hoverLabelKey=displayValue'],
    render: () => <LineVariationChart lineProps={{ hoverLabelKey: 'displayValue' }} />,
  },
  {
    id: 'dual-metric-axis',
    title: 'Dual metric axis',
    description: 'The last series is plotted against the right axis.',
    dataset: 'standard',
    coverage: ['dualMetricAxis=true', 'Axis.position=right'],
    render: () => (
      <LineVariationChart
        axes={() => [
          <Axis key="left" position="left" grid numberFormat="shortNumber" />,
          <Axis key="right" position="right" numberFormat="shortNumber" />,
          <Axis key="bottom" position="bottom" labelFormat="time" baseline ticks />,
        ]}
        lineProps={{ dualMetricAxis: true }}
      >
        <ChartInspect>{inspectContent}</ChartInspect>
      </LineVariationChart>
    ),
  },
  {
    id: 'named-interactive',
    title: 'Named line with popover',
    description: 'Sets a custom mark name; click must still open the popover.',
    dataset: 'standard',
    coverage: ['name=visits', 'ChartPopover'],
    render: () => (
      <LineVariationChart lineProps={{ name: 'visits' }}>
        <ChartPopover>{popoverContent}</ChartPopover>
      </LineVariationChart>
    ),
  },
  {
    id: 'on-click',
    title: 'onClick',
    description: 'Click a point; the last clicked datum is shown below the chart.',
    dataset: 'standard',
    coverage: ['onClick'],
    render: () => (
      <CallbackVariation
        render={(log) => (
          <LineVariationChart lineProps={{ onClick: (datum) => log(`Clicked ${formatDatum(datum)}`) }} />
        )}
      />
    ),
  },
  {
    id: 'context-menu-interaction',
    title: 'onContextMenu (interaction)',
    description: 'Right-click anywhere the line is interactive; the datum is shown below the chart.',
    dataset: 'standard',
    coverage: ['onContextMenu', 'contextMenuMode=interaction'],
    render: () => (
      <CallbackVariation
        render={(log) => (
          <LineVariationChart
            lineProps={{
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
    id: 'context-menu-item',
    title: 'onContextMenu (item)',
    description: 'Only a right-click directly on a point fires the callback.',
    dataset: 'standard',
    coverage: ['onContextMenu', 'contextMenuMode=item'],
    render: () => (
      <CallbackVariation
        render={(log) => (
          <LineVariationChart
            lineProps={{
              contextMenuMode: 'item',
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
    id: 'context-menu-dimension',
    title: 'onContextMenu (dimension)',
    description: 'Right-click fires for the hovered date across series.',
    dataset: 'standard',
    coverage: ['onContextMenu', 'contextMenuMode=dimension'],
    render: () => (
      <CallbackVariation
        render={(log) => (
          <LineVariationChart
            lineProps={{
              contextMenuMode: 'dimension',
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
];

const seriesVariations: Variation[] = [
  {
    id: 'primary-series-count',
    title: 'Primary series count',
    description: 'Only the first series keeps its color; the rest are gray.',
    dataset: 'standard',
    coverage: ['primarySeries=1'],
    render: () => <LineVariationChart lineProps={{ primarySeries: 1 }} />,
  },
  {
    id: 'primary-series-names',
    title: 'Primary series names',
    description: 'The last two series keep their color, regardless of color scale order.',
    dataset: 'standard',
    coverage: ['primarySeries=[last two]'],
    render: () => <LineVariationChart lineProps={(data) => ({ primarySeries: getLineSeries(data).slice(-2) })} />,
  },
  {
    id: 'other-series-color',
    title: 'Other series color',
    description: 'Non-primary series use gray-300 instead of the default gray.',
    dataset: 'standard',
    coverage: ['otherSeriesColor=gray-300', 'primarySeries=1'],
    render: () => <LineVariationChart lineProps={{ otherSeriesColor: 'gray-300', primarySeries: 1 }} />,
  },
  {
    id: 'alternate-segment',
    title: 'Alternate segment',
    description: 'Points flagged by `isEstimated` render with the default alternate line type.',
    dataset: 'standard',
    coverage: ['alternateSegmentKey=isEstimated'],
    render: () => <LineVariationChart lineProps={{ alternateSegmentKey: 'isEstimated' }} />,
  },
  {
    id: 'alternate-segment-styled',
    title: 'Styled alternate segment',
    description: 'Dotted estimated segment; hover shows the "(Estimated)" label suffix.',
    dataset: 'standard',
    coverage: ['alternateSegmentLineType=dotted', 'alternateSegmentLabel=(Estimated)'],
    render: () => (
      <LineVariationChart
        lineProps={{
          alternateSegmentKey: 'isEstimated',
          alternateSegmentLabel: '(Estimated)',
          alternateSegmentLineType: 'dotted',
        }}
      />
    ),
  },
  {
    id: 'metric-range',
    title: 'Metric range',
    description: 'Shades the band between the `low` and `high` fields around each line.',
    dataset: 'standard',
    coverage: ['metricRanges=[low..high]'],
    render: () => <LineVariationChart lineProps={{ metricRanges: [{ metricStart: 'low', metricEnd: 'high' }] }} />,
  },
  {
    id: 'metric-range-hover',
    title: 'Metric range on hover',
    description: 'The band and its dashed line only show for the hovered series and fit the axis.',
    dataset: 'standard',
    coverage: ['metricRanges.displayOnHover', 'metricRanges.scaleAxisToFit', 'metricRanges.lineType'],
    render: () => (
      <LineVariationChart
        lineProps={{
          metricRanges: [
            {
              displayOnHover: true,
              lineType: 'dashed',
              metricEnd: 'high',
              metricStart: 'low',
              rangeOpacity: 0.3,
              scaleAxisToFit: true,
            },
          ],
        }}
      />
    ),
  },
  {
    id: 'trendline-average',
    title: 'Average trendline',
    description: 'Adds a per-series average trendline.',
    dataset: 'standard',
    coverage: ['trendlines=[average]'],
    render: () => <LineVariationChart lineProps={{ trendlines: [{ method: 'average' }] }} />,
  },
  {
    id: 'trendline-linear-hover',
    title: 'Linear trendline on hover',
    description: 'Linear regression trendline that only shows for the hovered series.',
    dataset: 'standard',
    coverage: ['trendlines=[linear]', 'trendlines.displayOnHover'],
    render: () => <LineVariationChart lineProps={{ trendlines: [{ method: 'linear', displayOnHover: true }] }} />,
  },
  {
    id: 'trendline-moving-average',
    title: 'Moving average trendline',
    description: 'Three-day moving average; the first two days have no trendline.',
    dataset: 'standard',
    coverage: ['trendlines=[movingAverage-3]'],
    render: () => <LineVariationChart lineProps={{ trendlines: [{ method: 'movingAverage-3' }] }} />,
  },
];

const childVariations: Variation[] = [
  {
    id: 'inspect-default',
    title: 'ChartInspect',
    description: 'Hover a point to show inspect content.',
    dataset: 'standard',
    coverage: ['ChartInspect.children'],
    render: () => (
      <LineVariationChart>
        <ChartInspect>{inspectContent}</ChartInspect>
      </LineVariationChart>
    ),
  },
  {
    id: 'inspect-highlight-series',
    title: 'Inspect highlights series',
    description: 'Hovering keeps the whole series emphasized and fades the others.',
    dataset: 'standard',
    coverage: ['ChartInspect.highlightBy=series'],
    render: () => (
      <LineVariationChart>
        <ChartInspect highlightBy="series">{inspectContent}</ChartInspect>
      </LineVariationChart>
    ),
  },
  {
    id: 'inspect-highlight-dimension',
    title: 'Inspect highlights dimension',
    description: 'Hovering highlights every series at the hovered date.',
    dataset: 'standard',
    coverage: ['ChartInspect.highlightBy=dimension'],
    render: () => (
      <LineVariationChart>
        <ChartInspect highlightBy="dimension">{inspectContent}</ChartInspect>
      </LineVariationChart>
    ),
  },
  {
    id: 'inspect-highlight-keys',
    title: 'Inspect highlights by keys',
    description: 'Highlights every point sharing the hovered `isEstimated` value.',
    dataset: 'standard',
    coverage: ['ChartInspect.highlightBy=[isEstimated]'],
    render: () => (
      <LineVariationChart>
        <ChartInspect highlightBy={['isEstimated']}>{inspectContent}</ChartInspect>
      </LineVariationChart>
    ),
  },
  {
    id: 'inspect-highlight-item',
    title: 'Inspect highlights item',
    description: 'Only the hovered point is emphasized.',
    dataset: 'standard',
    coverage: ['ChartInspect.highlightBy=item'],
    render: () => (
      <LineVariationChart>
        <ChartInspect highlightBy="item">{inspectContent}</ChartInspect>
      </LineVariationChart>
    ),
  },
  {
    id: 'inspect-target-dimension-area',
    title: 'Inspect dimension area target',
    description: 'Hovering a date column shows inspect for that date.',
    dataset: 'standard',
    coverage: ['ChartInspect.targets=[dimensionArea]'],
    render: () => (
      <LineVariationChart>
        <ChartInspect targets={['dimensionArea']}>{inspectContent}</ChartInspect>
      </LineVariationChart>
    ),
  },
  {
    id: 'inspect-target-item',
    title: 'Inspect item target',
    description: 'Only hovering a point directly shows inspect.',
    dataset: 'standard',
    coverage: ['ChartInspect.targets=[item]'],
    render: () => (
      <LineVariationChart>
        <ChartInspect targets={['item']}>{inspectContent}</ChartInspect>
      </LineVariationChart>
    ),
  },
  {
    id: 'inspect-exclude-keys',
    title: 'Inspect with excluded data',
    description: 'The first series has `excludeFromInspect`, so hovering it shows no inspect.',
    dataset: 'standard',
    coverage: ['ChartInspect.excludeDataKeys=[excludeFromInspect]'],
    render: () => (
      <LineVariationChart>
        <ChartInspect excludeDataKeys={['excludeFromInspect']}>{inspectContent}</ChartInspect>
      </LineVariationChart>
    ),
  },
  {
    id: 'popover-default',
    title: 'ChartPopover',
    description: 'Click a point to open a popover sized to its content.',
    dataset: 'standard',
    coverage: ['ChartPopover.children', 'ChartPopover.width=auto'],
    render: () => (
      <LineVariationChart>
        <ChartPopover width="auto">{popoverContent}</ChartPopover>
      </LineVariationChart>
    ),
  },
  {
    id: 'popover-fixed-size',
    title: 'Fixed-size popover',
    description: 'Popover is exactly 240 × 120px.',
    dataset: 'standard',
    coverage: ['ChartPopover.width=240', 'ChartPopover.height=120'],
    render: () => (
      <LineVariationChart>
        <ChartPopover height={120} width={240}>
          {popoverContent}
        </ChartPopover>
      </LineVariationChart>
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
      <LineVariationChart>
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
      </LineVariationChart>
    ),
  },
  {
    id: 'popover-right-click',
    title: 'Right-click popover',
    description: 'Opens the popover on right click instead of left click.',
    dataset: 'standard',
    coverage: ['ChartPopover.rightClick=true'],
    render: () => (
      <LineVariationChart>
        <ChartPopover rightClick>{popoverContent}</ChartPopover>
      </LineVariationChart>
    ),
  },
  {
    id: 'popover-highlight-dimension',
    title: 'Popover highlights dimension',
    description: 'While open, every series at the clicked date stays highlighted.',
    dataset: 'standard',
    coverage: ['ChartPopover.UNSAFE_highlightBy=dimension'],
    render: () => (
      <LineVariationChart>
        <ChartPopover UNSAFE_highlightBy="dimension">{popoverContent}</ChartPopover>
      </LineVariationChart>
    ),
  },
  {
    id: 'popover-highlight-series',
    title: 'Popover highlights series',
    description: 'While open, the clicked series stays highlighted.',
    dataset: 'standard',
    coverage: ['ChartPopover.UNSAFE_highlightBy=series'],
    render: () => (
      <LineVariationChart>
        <ChartPopover UNSAFE_highlightBy="series">{popoverContent}</ChartPopover>
      </LineVariationChart>
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
          <LineVariationChart>
            <ChartPopover onOpenChange={(isOpen) => log(`Popover open: ${isOpen}`)}>{popoverContent}</ChartPopover>
          </LineVariationChart>
        )}
      />
    ),
  },
  {
    id: 'action-bar',
    title: 'ChartActionBar',
    description: 'Click a point to show the action bar.',
    dataset: 'standard',
    coverage: ['ChartActionBar.children', 'ChartActionBar.maxActions=4'],
    render: () => (
      <LineVariationChart>
        <ChartActionBar>{renderActionBarContent(['value'])}</ChartActionBar>
      </LineVariationChart>
    ),
  },
  {
    id: 'action-bar-emphasized-overflow',
    title: 'Emphasized action bar with overflow',
    description: 'Accent styling; the second action collapses into the overflow menu.',
    dataset: 'standard',
    coverage: ['ChartActionBar.isEmphasized=true', 'ChartActionBar.maxActions=1'],
    render: () => (
      <LineVariationChart>
        <ChartActionBar isEmphasized maxActions={1}>
          {renderActionBarContent(['value'])}
        </ChartActionBar>
      </LineVariationChart>
    ),
  },
  {
    id: 'action-bar-clear-selection',
    title: 'Action bar onClearSelection',
    description: 'Dismiss the action bar; the clear event is shown below the chart.',
    dataset: 'standard',
    coverage: ['ChartActionBar.onClearSelection'],
    render: () => (
      <CallbackVariation
        render={(log) => (
          <LineVariationChart>
            <ChartActionBar onClearSelection={() => log('Selection cleared')}>
              {renderActionBarContent(['value'])}
            </ChartActionBar>
          </LineVariationChart>
        )}
      />
    ),
  },
  {
    id: 'forecast',
    title: 'Forecast',
    description: 'Plots `actual`, then continues each series with the dashed `forecast` field.',
    dataset: 'standard',
    coverage: ['metric=actual', 'LineForecast.metric=forecast', 'LineForecast.start', 'LineForecast.label=Forecast'],
    render: () => (
      <LineVariationChart lineProps={{ metric: 'actual' }}>
        <LineForecast metric="forecast" start={getForecastStart(standardLineData)} />
      </LineVariationChart>
    ),
  },
  {
    id: 'forecast-label',
    title: 'Forecast with custom label',
    description: 'Renames the forecast region label to "Projected".',
    dataset: 'standard',
    coverage: ['LineForecast.label=Projected'],
    render: () => (
      <LineVariationChart lineProps={{ metric: 'actual' }}>
        <LineForecast label="Projected" metric="forecast" start={getForecastStart(standardLineData)} />
      </LineVariationChart>
    ),
  },
  {
    id: 'direct-label-defaults',
    title: 'LineDirectLabel defaults',
    description: 'Labels the last value of each series at the end of the line.',
    dataset: 'standard',
    coverage: ['LineDirectLabel.value=last', 'LineDirectLabel.position=end'],
    render: () => (
      <LineVariationChart>
        <LineDirectLabel />
      </LineVariationChart>
    ),
  },
  {
    id: 'direct-label-series-start',
    title: 'Series labels at start',
    description: 'Labels each series by name at the start of the line.',
    dataset: 'standard',
    coverage: ['LineDirectLabel.value=series', 'LineDirectLabel.position=start'],
    render: () => (
      <LineVariationChart>
        <LineDirectLabel position="start" value="series" />
      </LineVariationChart>
    ),
  },
  {
    id: 'direct-label-average-format',
    title: 'Formatted average labels',
    description: 'Average value with a d3 format, prefix and larger font; the first series is excluded.',
    dataset: 'standard',
    coverage: [
      'LineDirectLabel.value=average',
      'LineDirectLabel.format=,.0f',
      'LineDirectLabel.prefix=Avg ',
      'LineDirectLabel.fontSize=14',
      'LineDirectLabel.excludeSeries=[first]',
    ],
    render: () => (
      <LineVariationChart>
        <LineDirectLabel
          excludeSeries={getLineSeries(standardLineData).slice(0, 1)}
          fontSize={14}
          format=",.0f"
          prefix="Avg "
          value="average"
        />
      </LineVariationChart>
    ),
  },
  {
    id: 'point-annotation',
    title: 'LinePointAnnotation',
    description: 'Annotates each series peak with the default `annotation` text key and anchors.',
    dataset: 'standard',
    coverage: ['LinePointAnnotation.textKey=annotation', 'LinePointAnnotation.anchor=default', 'staticPoint=isPeak'],
    render: () => (
      <LineVariationChart lineProps={{ staticPoint: 'isPeak' }}>
        <LinePointAnnotation />
      </LineVariationChart>
    ),
  },
  {
    id: 'point-annotation-styled',
    title: 'Styled point annotation',
    description: 'Bottom-anchored annotation using `displayValue` text in the line color.',
    dataset: 'standard',
    coverage: [
      'LinePointAnnotation.anchor=bottom',
      'LinePointAnnotation.matchLineColor=true',
      'LinePointAnnotation.textKey=displayValue',
    ],
    render: () => (
      <LineVariationChart lineProps={{ staticPoint: 'isPeak' }}>
        <LinePointAnnotation anchor="bottom" matchLineColor textKey="displayValue" />
      </LineVariationChart>
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
      <LineVariationChart
        axes={() => [
          <Axis key="left" position="left" grid numberFormat="shortNumber" title="Revenue" />,
          <Axis key="bottom" position="bottom" labelFormat="time" baseline ticks title="Date" />,
        ]}
        data={largeLineData}
      />
    ),
  },
  {
    id: 'axis-granularity-month',
    title: 'Monthly granularity',
    description: 'Monthly data with month-granularity time labels.',
    dataset: 'sparse',
    usesDashboardDataset: false,
    coverage: ['Axis.labelFormat=time', 'Axis.granularity=month'],
    render: () => (
      <LineVariationChart
        axes={() => [
          <Axis key="left" position="left" grid numberFormat="shortNumber" />,
          <Axis key="bottom" position="bottom" labelFormat="time" granularity="month" baseline ticks />,
        ]}
        data={sparseLineData}
      />
    ),
  },
  {
    id: 'axis-range',
    title: 'Fixed metric range',
    description: 'Pins the metric axis to 0–10,000.',
    dataset: 'standard',
    coverage: ['Axis.range=[0,10000]'],
    render: () => (
      <LineVariationChart
        axes={() => [
          <Axis key="left" position="left" grid numberFormat="shortNumber" range={[0, 10000]} />,
          <Axis key="bottom" position="bottom" labelFormat="time" baseline ticks />,
        ]}
      />
    ),
  },
  {
    id: 'axis-tick-limits',
    title: 'Tick count limit and vertical labels',
    description: 'At most four metric ticks; dimension labels are rotated.',
    dataset: 'standard',
    coverage: ['Axis.tickCountLimit=4', 'Axis.labelOrientation=vertical'],
    render: () => (
      <LineVariationChart
        axes={() => [
          <Axis key="left" position="left" grid numberFormat="shortNumber" tickCountLimit={4} />,
          <Axis key="bottom" position="bottom" labelFormat="time" labelOrientation="vertical" baseline ticks />,
        ]}
      />
    ),
  },
  {
    id: 'axis-reference-lines',
    title: 'Reference lines',
    description: 'A labeled goal on the metric axis and a launch marker on the time axis.',
    dataset: 'standard',
    coverage: ['Axis.children', 'ReferenceLine.value', 'ReferenceLine.label'],
    render: () => (
      <LineVariationChart
        axes={(data) => [
          <Axis key="left" position="left" grid numberFormat="shortNumber">
            <ReferenceLine label="Goal" value={4000} />
          </Axis>,
          <Axis key="bottom" position="bottom" labelFormat="time" baseline ticks>
            <ReferenceLine label="Launch" value={Math.min(...data.map(({ datetime }) => datetime)) + 7 * DAY_MS} />
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
    render: () => <LineVariationChart legend={() => <Legend highlight />} />,
  },
  {
    id: 'legend-right-title',
    title: 'Right legend with title',
    description: 'Moves the legend to the right and adds a title.',
    dataset: 'standard',
    coverage: ['Legend.position=right', 'Legend.title'],
    render: () => <LineVariationChart legend={() => <Legend position="right" title="Channel" />} />,
  },
  {
    id: 'legend-line-type',
    title: 'Legend line type facet',
    description: 'Legend symbols match the per-series dash patterns.',
    dataset: 'standard',
    coverage: ['Legend.lineType=series', 'lineType=series'],
    render: () => <LineVariationChart legend={() => <Legend lineType="series" />} lineProps={{ lineType: 'series' }} />,
  },
  {
    id: 'legend-toggleable',
    title: 'Toggleable legend',
    description: 'Click entries to hide series; the first series starts hidden.',
    dataset: 'standard',
    coverage: ['Legend.isToggleable', 'Legend.defaultHiddenSeries=[first]'],
    render: () => (
      <LineVariationChart
        legend={(data) => <Legend defaultHiddenSeries={getLineSeries(data).slice(0, 1)} isToggleable />}
      />
    ),
  },
  {
    id: 'legend-hidden-entries',
    title: 'Hidden legend entry',
    description: 'Omits the last series from the legend while its line still renders.',
    dataset: 'standard',
    coverage: ['Legend.hiddenEntries=[last]'],
    render: () => <LineVariationChart legend={(data) => <Legend hiddenEntries={getLineSeries(data).slice(-1)} />} />,
  },
  {
    id: 'legend-labels',
    title: 'Custom legend labels',
    description: 'Replaces series names with longer labels truncated at 80px.',
    dataset: 'standard',
    coverage: ['Legend.legendLabels', 'Legend.labelLimit=80'],
    render: () => (
      <LineVariationChart
        legend={(data) => (
          <Legend
            labelLimit={80}
            legendLabels={getLineSeries(data).map((series) => ({ seriesName: series, label: `${series} visits` }))}
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
      <LineVariationChart
        legend={(data) => (
          <Legend
            descriptions={getLineSeries(data).map((series) => ({
              seriesName: series,
              description: `Daily visits from ${series}`,
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
    render: () => <LineVariationChart siblings={() => <Title text="Visits by channel" />} />,
  },
  {
    id: 'controlled-hidden-series',
    title: 'Controlled hidden series',
    description: 'Hides the first series through the Chart hiddenSeries prop.',
    dataset: 'standard',
    coverage: ['Chart.hiddenSeries=[first]'],
    render: () => (
      <LineVariationChart
        chartProps={(data) => ({ hiddenSeries: getLineSeries(data).slice(0, 1) })}
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
    render: () => <LineVariationChart chartProps={(data) => ({ highlightedSeries: getLineSeries(data)[0] })} />,
  },
  {
    id: 'controlled-highlighted-item',
    title: 'Controlled highlighted item',
    description: 'Highlights the first series peak by id using idKey="id" and highlightedItem.',
    dataset: 'standard',
    coverage: ['Chart.idKey=id', 'Chart.highlightedItem=peak'],
    render: () => (
      <LineVariationChart
        chartProps={(data) => ({ idKey: 'id', highlightedItem: data.find(({ isPeak }) => isPeak)?.id })}
      />
    ),
  },
  {
    id: 'chart-colors',
    title: 'Custom colors',
    description: 'Overrides the categorical palette.',
    dataset: 'standard',
    coverage: ['Chart.colors=[...]'],
    render: () => (
      <LineVariationChart chartProps={{ colors: ['indigo-900', 'magenta-600', 'seafoam-600', 'orange-500'] }} />
    ),
  },
  {
    id: 'chart-line-types',
    title: 'Chart line types',
    description: 'Custom dash patterns for the lineType facet.',
    dataset: 'standard',
    coverage: ['Chart.lineTypes', 'lineType=series'],
    render: () => (
      <LineVariationChart
        chartProps={{ lineTypes: ['solid', 'dotted', 'longDash', [2, 6]] }}
        lineProps={{ lineType: 'series' }}
      />
    ),
  },
  {
    id: 'chart-line-widths',
    title: 'Chart line widths',
    description: 'Thicker lines from the Chart lineWidths prop.',
    dataset: 'standard',
    coverage: ['Chart.lineWidths=[L]'],
    render: () => <LineVariationChart chartProps={{ lineWidths: ['L'] }} />,
  },
  {
    id: 'chart-opacities',
    title: 'Chart opacities',
    description: 'Per-series opacities from the opacity facet.',
    dataset: 'standard',
    coverage: ['Chart.opacities', 'opacity=series'],
    render: () => (
      <LineVariationChart chartProps={{ opacities: [1, 0.7, 0.45, 0.25] }} lineProps={{ opacity: 'series' }} />
    ),
  },
  {
    id: 'dark-background',
    title: 'Dark color scheme',
    description: 'Renders axes, labels and points on a dark background.',
    dataset: 'standard',
    coverage: ['Chart.colorScheme=dark', 'Chart.backgroundColor=gray-25'],
    render: () => (
      <LineVariationChart
        chartProps={{ backgroundColor: 'gray-25', colorScheme: 'dark' }}
        lineProps={{ staticPoint: 'isPeak' }}
      >
        <LineDirectLabel />
      </LineVariationChart>
    ),
  },
  {
    id: 'locale',
    title: 'German locale',
    description: 'Formats axis numbers and dates with de-DE conventions.',
    dataset: 'standard',
    coverage: ['Chart.locale=de-DE'],
    render: () => (
      <LineVariationChart chartProps={{ locale: 'de-DE' }}>
        <LineDirectLabel format=",.0f" />
      </LineVariationChart>
    ),
  },
  {
    id: 'tooltip-anchor-mark',
    title: 'Inspect anchored to mark',
    description: 'Inspect content is placed above the hovered point instead of following the cursor.',
    dataset: 'standard',
    coverage: ['Chart.tooltipAnchor=mark', 'Chart.tooltipPlacement=top'],
    render: () => (
      <LineVariationChart chartProps={{ tooltipAnchor: 'mark', tooltipPlacement: 'top' }}>
        <ChartInspect>{inspectContent}</ChartInspect>
      </LineVariationChart>
    ),
  },
  {
    id: 'empty-state',
    title: 'Empty data',
    description: 'Shows the empty state text when data is an empty array.',
    dataset: 'empty',
    usesDashboardDataset: false,
    coverage: ['Chart.emptyStateText', 'data=[]'],
    render: () => <LineVariationChart chartProps={{ emptyStateText: 'No visits data' }} data={[]} />,
  },
  {
    id: 'loading',
    title: 'Loading',
    description: 'Shows the loading spinner in place of the chart.',
    dataset: 'standard',
    coverage: ['Chart.loading=true'],
    render: () => <LineVariationChart chartProps={{ loading: true }} />,
  },
];

export const lineVariations: Variation[] = [
  ...baseLineVariations,
  ...interactionVariations,
  ...seriesVariations,
  ...childVariations,
  ...axisVariations,
  ...legendVariations,
  ...chartVariations,
];

export const LineDashboard = (): ReactElement => (
  <VariationDashboard
    variations={lineVariations}
    coverage={dashboard.coverage}
    chartType="Line"
    datasets={lineDatasetOptions}
    filters={lineVariationFilters}
    getSizeDescription={(size) => `Chart: ${size} × ${Math.round(size * LINE_ASPECT_RATIO)}px`}
    initialSize={360}
    initialDataset="standard"
    initialFilter="all"
    initialViewMode="axes"
    sizePresets={lineSizePresets}
    showAnimationControls
    viewModes={lineViewModes}
  />
);

const lineCoverage: PropCoverage<LineProps> = {
  alternateSegmentKey: ['alternate-segment', 'alternate-segment-styled'],
  alternateSegmentLabel: ['alternate-segment-styled'],
  alternateSegmentLineType: ['alternate-segment-styled'],
  children: [
    'inspect-default',
    'popover-default',
    'action-bar',
    'forecast',
    'direct-label-defaults',
    'point-annotation',
  ],
  color: ['defaults', 'color-series'],
  contextMenuMode: ['context-menu-interaction', 'context-menu-item', 'context-menu-dimension'],
  dimension: ['defaults', 'metric-dimension-keys', 'scale-point'],
  dimensionHover: ['dimension-hover'],
  dualMetricAxis: ['dual-metric-axis'],
  gradient: ['gradient'],
  hoverLabelKey: ['hover-label-key'],
  interactionMode: ['defaults', 'interaction-item'],
  interpolate: ['interpolate-monotone', 'interpolate-step'],
  isMethodLast: ['sparkline', 'sparkline-peak'],
  isSparkline: ['sparkline', 'sparkline-peak'],
  lineCap: ['defaults', 'line-cap-square'],
  lineType: ['defaults', 'line-type-series', 'line-type-static'],
  metric: ['defaults', 'metric-dimension-keys', 'forecast'],
  metricAxis: { skip: 'Secondary scale name for Combo; covered by the Combo dashboard' },
  metricRanges: ['metric-range', 'metric-range-hover'],
  name: ['defaults', 'named-interactive'],
  onClick: ['on-click'],
  onContextMenu: ['context-menu-interaction', 'context-menu-item', 'context-menu-dimension'],
  opacity: ['opacity-static', 'chart-opacities'],
  otherSeriesColor: ['other-series-color'],
  padding: ['padding-point', 'padding-time'],
  pointSize: ['point-size'],
  primarySeries: ['primary-series-count', 'primary-series-names'],
  scaleType: ['defaults', 'metric-dimension-keys', 'scale-point'],
  showHoverLabel: ['defaults', 'hover-label-hidden'],
  staticPoint: ['static-points', 'point-size', 'sparkline'],
  trendlines: ['trendline-average', 'trendline-linear-hover', 'trendline-moving-average'],
};

const chartActionBarCoverage: PropCoverage<ChartActionBarProps> = {
  children: ['action-bar'],
  isEmphasized: ['action-bar-emphasized-overflow'],
  maxActions: ['action-bar', 'action-bar-emphasized-overflow'],
  onClearSelection: ['action-bar-clear-selection'],
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

const lineForecastCoverage: PropCoverage<LineForecastProps> = {
  label: ['forecast', 'forecast-label'],
  metric: ['forecast'],
  start: ['forecast'],
};

const lineDirectLabelCoverage: PropCoverage<LineDirectLabelProps> = {
  excludeSeries: ['direct-label-average-format'],
  fontSize: ['direct-label-average-format'],
  format: ['direct-label-average-format', 'locale'],
  position: ['direct-label-defaults', 'direct-label-series-start'],
  prefix: ['direct-label-average-format'],
  value: ['direct-label-defaults', 'direct-label-series-start', 'direct-label-average-format'],
};

const linePointAnnotationCoverage: PropCoverage<LinePointAnnotationProps> = {
  anchor: ['point-annotation', 'point-annotation-styled'],
  matchLineColor: ['point-annotation-styled'],
  textKey: ['point-annotation', 'point-annotation-styled'],
};

const axisCoverage: SiblingCoverage<AxisProps> = {
  baseline: ['axis-titles-format'],
  children: ['axis-reference-lines'],
  granularity: ['axis-granularity-month'],
  grid: ['axis-titles-format'],
  labelFormat: ['axis-granularity-month'],
  labelOrientation: ['axis-tick-limits'],
  numberFormat: ['axis-titles-format'],
  position: ['dual-metric-axis'],
  range: ['axis-range'],
  tickCountLimit: ['axis-tick-limits'],
  ticks: ['axis-titles-format'],
  title: ['axis-titles-format'],
};

const legendCoverage: SiblingCoverage<LegendProps> = {
  defaultHiddenSeries: ['legend-toggleable'],
  descriptions: ['legend-descriptions'],
  hiddenEntries: ['legend-hidden-entries'],
  highlight: ['legend-default'],
  isToggleable: ['legend-toggleable'],
  labelLimit: ['legend-labels'],
  legendLabels: ['legend-labels'],
  lineType: ['legend-line-type'],
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
  lineWidths: ['chart-line-widths'],
  loading: ['loading'],
  locale: ['locale'],
  opacities: ['chart-opacities'],
  renderer: { skip: 'Covered by the dashboard Renderer control' },
  tooltipAnchor: ['tooltip-anchor-mark'],
  tooltipPlacement: ['tooltip-anchor-mark'],
};

export const dashboard: DashboardDefinition = {
  chartType: 'Line',
  variations: lineVariations,
  coverage: {
    Line: lineCoverage,
    ChartActionBar: chartActionBarCoverage,
    ChartInspect: chartInspectCoverage,
    ChartPopover: chartPopoverCoverage,
    LineForecast: lineForecastCoverage,
    LineDirectLabel: lineDirectLabelCoverage,
    LinePointAnnotation: linePointAnnotationCoverage,
    Axis: axisCoverage,
    Legend: legendCoverage,
    Title: titleCoverage,
    Chart: chartCoverage,
  },
};
