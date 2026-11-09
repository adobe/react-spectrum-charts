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
import React, { Children, ComponentProps, ReactElement, ReactNode, isValidElement } from 'react';

import { Content, Heading, Text } from '@react-spectrum/s2';
import {
  Axis,
  ChartInspect,
  ChartPopover,
  Legend,
  Line,
  LineDirectLabel,
  LineForecast,
  ReferenceLine,
  Title,
} from '@spectrum-charts/react-spectrum-charts-s2';

import { DocsChart as Chart } from '../components/examples/DocsChart';
import { PlaygroundControl, PreviewSize, PropPlayground } from '../components/examples/PropPlayground';
import {
  emptyData,
  lineDate,
  lineDualAxisData,
  lineEstimatedData,
  lineForecastData,
  lineMilestoneData,
  lineRangeData,
  lineSessionLengthData,
  lineTrafficData,
  lineVisitsData,
  lineWeekdayData,
} from '../components/examples/data';
import { withSource } from '../components/examples/elementToJsx';

// A 480px-wide plot at a 0.6 aspect ratio, capped so the whole chart fits the preview.
const PLOT_WIDTH = 480;
const MAX_PREVIEW_WIDTH = 512;
const PLOT_HEIGHT = 288;
const SIDE_AXIS_WIDTH = 48;
const BOTTOM_AXIS_HEIGHT = 48;
const AXIS_TITLE_SIZE = 24;
const SIDE_LEGEND_WIDTH = 150;
const BOTTOM_LEGEND_HEIGHT = 40;
const LEGEND_TITLE_HEIGHT = 24;
const TITLE_HEIGHT = 40;
const SPARKLINE_SIZE = { width: 200, height: 60 };

// Mar 8 and Mar 11, the seventh and tenth days of the sample data.
const HIGHLIGHT_DATE = lineDate(6);
const FORECAST_START = lineDate(9);

type LineProps = ComponentProps<typeof Line>;
type Locale = 'en-US' | 'de-DE' | 'fr-FR';
type LegendPosition = 'right' | 'bottom' | 'left' | 'top';
type AnimationType = 'hover' | 'drawIn';

const findElements = (node: ReactNode, name: string): ReactElement<Record<string, unknown>>[] =>
  Children.toArray(node).flatMap((child) => {
    if (!isValidElement(child)) return [];
    const element = child as ReactElement<Record<string, unknown>>;
    const type = element.type as { displayName?: string; name?: string };
    const matches = (type.displayName ?? type.name) === name ? [element] : [];
    return [...matches, ...findElements(element.props.children as ReactNode, name)];
  });

/**
 * Sizes a line example around a 480×288 plot, leaving room for axes, legend, and title.
 * @param element chart element
 * @returns preview width and height
 */
const getLinePreviewSize = (element: ReactElement): PreviewSize => {
  const children = (element.props as { children?: ReactNode }).children;
  if (findElements(children, 'Line')[0]?.props.isSparkline) return SPARKLINE_SIZE;
  let width = PLOT_WIDTH;
  let height = PLOT_HEIGHT;
  for (const axis of findElements(children, 'Axis')) {
    const isSide = ['left', 'right'].includes(axis.props.position as string);
    const titleSize = axis.props.title ? AXIS_TITLE_SIZE : 0;
    if (isSide) width += SIDE_AXIS_WIDTH + titleSize;
    else height += BOTTOM_AXIS_HEIGHT + titleSize;
  }
  const legend = findElements(children, 'Legend')[0];
  if (legend) {
    const position = (legend.props.position as string | undefined) ?? 'bottom';
    if (['left', 'right'].includes(position)) width += SIDE_LEGEND_WIDTH;
    else height += BOTTOM_LEGEND_HEIGHT + (legend.props.title ? LEGEND_TITLE_HEIGHT : 0);
  }
  if (findElements(children, 'Title').length) height += TITLE_HEIGHT;
  return { width: Math.min(width, MAX_PREVIEW_WIDTH), height };
};

/** Converts a "none" select value to undefined. */
const optional = (value: unknown) => (!value || value === 'none' ? undefined : String(value));

/** Splits a comma-separated select value into a list. */
const toList = (value: unknown) => optional(value)?.split(', ');

const channels = ['Organic search', 'Paid search', 'Email'];

/** Default axes for daily time-series examples. */
const timeAxes = [
  <Axis key="bottom" position="bottom" labelFormat="time" baseline ticks />,
  <Axis key="left" position="left" grid />,
];

const lineControls: PlaygroundControl[] = [
  {
    group: 'Line',
    name: 'interpolate',
    type: 'select',
    options: ['linear', 'monotone', 'step'],
    defaultValue: 'linear',
  },
  {
    group: 'LineDirectLabel',
    name: 'directLabel',
    label: 'Show',
    doc: 'LineDirectLabel',
    type: 'boolean',
    defaultValue: false,
  },
  {
    group: 'Legend',
    name: 'legend',
    label: 'Position',
    doc: 'Legend.position',
    type: 'select',
    options: ['none', 'bottom', 'right', 'top', 'left'],
    defaultValue: 'bottom',
  },
  { group: 'Title', name: 'title', label: 'Text', doc: 'Title.text', type: 'text', defaultValue: 'Visits by channel' },
];

/**
 * Playground for the top-level Line props and its common siblings.
 * @returns playground element
 */
export const LinePlayground = () => (
  <PropPlayground
    previewSize={getLinePreviewSize}
    controls={lineControls}
    render={({ interpolate, directLabel, legend, title = 'Visits by channel' }) => (
      <Chart data={lineTrafficData}>
        {optional(title) && <Title text={String(title)} />}
        {timeAxes}
        <Line color="series" interpolate={interpolate as LineProps['interpolate']}>
          <ChartInspect />
          {directLabel === true && <LineDirectLabel value="series" />}
        </Line>
        {legend !== 'none' && <Legend position={(legend ?? 'bottom') as LegendPosition} />}
      </Chart>
    )}
  />
);

const statesControls: PlaygroundControl[] = [
  { name: 'state', type: 'select', options: ['empty', 'loading'], defaultValue: 'empty' },
  {
    name: 'emptyStateText',
    type: 'text',
    defaultValue: 'No visits yet',
    isDisabled: (values) => values.state === 'loading',
  },
];

/**
 * Playground for empty and loading line charts.
 * @returns playground element
 */
export const LineStatesPlayground = () => (
  <PropPlayground
    previewSize={getLinePreviewSize}
    controls={statesControls}
    component="Chart"
    render={({ state = 'empty', emptyStateText }) => (
      <Chart
        data={state === 'loading' ? lineTrafficData : emptyData}
        loading={state === 'loading' ? true : undefined}
        emptyStateText={state === 'empty' ? String(emptyStateText ?? 'No visits yet') : undefined}
      >
        {timeAxes}
        <Line color="series" />
      </Chart>
    )}
  />
);

const seriesControls: PlaygroundControl[] = [
  { name: 'lineType', type: 'select', options: ['none', 'series'], defaultValue: 'none' },
  { name: 'opacity', type: 'select', options: ['none', 'series'], defaultValue: 'none' },
];

/**
 * Playground for faceting series by color, line type, and opacity.
 * @returns playground element
 */
export const LineSeriesPlayground = () => (
  <PropPlayground
    previewSize={getLinePreviewSize}
    controls={seriesControls}
    component="Line"
    render={({ lineType, opacity }) => (
      <Chart data={lineTrafficData}>
        {timeAxes}
        <Line color="series" lineType={optional(lineType)} opacity={optional(opacity)} />
        <Legend />
      </Chart>
    )}
  />
);

const interpolateControls: PlaygroundControl[] = [
  {
    name: 'interpolate',
    type: 'select',
    options: ['linear', 'monotone', 'basis', 'cardinal', 'catmull-rom', 'natural', 'step', 'step-before', 'step-after'],
    defaultValue: 'monotone',
  },
];

/**
 * Playground for line interpolation methods.
 * @returns playground element
 */
export const LineInterpolatePlayground = () => (
  <PropPlayground
    previewSize={getLinePreviewSize}
    controls={interpolateControls}
    component="Line"
    render={({ interpolate = 'monotone' }) => (
      <Chart data={lineMilestoneData}>
        {timeAxes}
        <Line interpolate={interpolate as LineProps['interpolate']} staticPoint="isMilestone" />
      </Chart>
    )}
  />
);

const gradientControls: PlaygroundControl[] = [
  { name: 'gradient', type: 'boolean', defaultValue: true },
  { name: 'opacity', type: 'number', min: 0.2, max: 1, step: 0.1, defaultValue: 1 },
];

/**
 * Playground for the gradient fill under a line.
 * @returns playground element
 */
export const LineGradientPlayground = () => (
  <PropPlayground
    previewSize={getLinePreviewSize}
    controls={gradientControls}
    component="Line"
    render={({ gradient = true, opacity }) => (
      <Chart data={lineVisitsData}>
        {timeAxes}
        <Line
          gradient={gradient as boolean}
          opacity={opacity === undefined ? undefined : { value: opacity as number }}
        />
      </Chart>
    )}
  />
);

const sizeControls: PlaygroundControl[] = [
  { group: 'Chart', name: 'width', type: 'number', min: 240, max: 500, step: 20, defaultValue: 480 },
];

/**
 * Playground for how chart width scales line strokes and points.
 * @returns playground element
 */
export const LineSizePlayground = () => (
  <PropPlayground
    controls={sizeControls}
    render={({ width }) => (
      <Chart data={lineMilestoneData} width={(width ?? 480) as number} height={300}>
        {timeAxes}
        <Line staticPoint="isMilestone" />
      </Chart>
    )}
  />
);

const pointControls: PlaygroundControl[] = [
  { name: 'staticPoint', type: 'select', options: ['none', 'isMilestone'], defaultValue: 'isMilestone' },
  { name: 'pointSize', type: 'select', options: ['auto', '36', '100', '196'], defaultValue: 'auto' },
];

/**
 * Playground for always-visible points on a line.
 * @returns playground element
 */
export const LinePointPlayground = () => (
  <PropPlayground
    previewSize={getLinePreviewSize}
    controls={pointControls}
    component="Line"
    render={({ staticPoint = 'isMilestone', pointSize }) => (
      <Chart data={lineMilestoneData}>
        {timeAxes}
        <Line
          staticPoint={optional(staticPoint)}
          pointSize={pointSize && pointSize !== 'auto' ? Number(pointSize) : undefined}
        />
      </Chart>
    )}
  />
);

const sparklineControls: PlaygroundControl[] = [
  { name: 'isMethodLast', type: 'boolean', defaultValue: true },
  { name: 'gradient', type: 'boolean', defaultValue: true },
];

/**
 * Playground for sparklines.
 * @returns playground element
 */
export const LineSparklinePlayground = () => (
  <PropPlayground
    previewSize={getLinePreviewSize}
    controls={sparklineControls}
    component="Line"
    render={({ isMethodLast = true, gradient = true }) => (
      <Chart data={lineVisitsData}>
        <Line isSparkline isMethodLast={isMethodLast as boolean} gradient={gradient as boolean} />
      </Chart>
    )}
  />
);

const popoverContent = withSource(
  (datum: Record<string, unknown>) => (
    <Content>
      <Heading level={4} UNSAFE_style={{ margin: 0 }}>
        {String(datum.series)}
      </Heading>
      <Text>{Number(datum.value).toLocaleString()} visits</Text>
    </Content>
  ),
  '(datum) => (\n  <Content>\n    <Heading level={4} UNSAFE_style={{ margin: 0 }}>\n      {datum.series}\n    </Heading>\n    <Text>{datum.value.toLocaleString()} visits</Text>\n  </Content>\n)',
  { '@react-spectrum/s2': ['Content', 'Heading', 'Text'] }
);

const segmentControls: PlaygroundControl[] = [
  { name: 'alternateSegmentKey', type: 'select', options: ['none', 'isEstimated'], defaultValue: 'isEstimated' },
  {
    name: 'alternateSegmentLineType',
    type: 'select',
    options: ['dotted', 'dashed', 'shortDash'],
    defaultValue: 'dotted',
  },
];

/**
 * Playground for alternate line segments, such as estimated values.
 * @returns playground element
 */
export const LineSegmentPlayground = () => (
  <PropPlayground
    previewSize={getLinePreviewSize}
    controls={segmentControls}
    component="Line"
    render={({ alternateSegmentKey = 'isEstimated', alternateSegmentLineType }) => (
      <Chart data={lineEstimatedData}>
        {timeAxes}
        <Line
          color="series"
          alternateSegmentKey={optional(alternateSegmentKey)}
          alternateSegmentLineType={alternateSegmentLineType as LineProps['alternateSegmentLineType']}
        >
          <ChartPopover width="auto">{popoverContent}</ChartPopover>
        </Line>
      </Chart>
    )}
  />
);

const primarySeriesControls: PlaygroundControl[] = [
  {
    name: 'primarySeries',
    type: 'select',
    options: ['none', '1', '2', 'Email'],
    defaultValue: '1',
  },
  { name: 'otherSeriesColor', type: 'select', options: ['gray-400', 'gray-300', 'gray-600'], defaultValue: 'gray-400' },
];

/**
 * Playground for emphasizing primary series and graying out the rest.
 * @returns playground element
 */
export const LinePrimarySeriesPlayground = () => (
  <PropPlayground
    previewSize={getLinePreviewSize}
    controls={primarySeriesControls}
    component="Line"
    render={({ primarySeries = '1', otherSeriesColor }) => {
      const primary = optional(primarySeries);
      return (
        <Chart data={lineTrafficData}>
          {timeAxes}
          <Line
            color="series"
            primarySeries={primary && /^\d+$/.test(primary) ? Number(primary) : toList(primary)}
            otherSeriesColor={otherSeriesColor as string | undefined}
          >
            <LineDirectLabel value="series" />
          </Line>
        </Chart>
      );
    }}
  />
);

const scaleTypeControls: PlaygroundControl[] = [
  { name: 'scaleType', type: 'select', options: ['time', 'linear', 'point'], defaultValue: 'time' },
];

const SCALE_TYPE_EXAMPLES = {
  time: { data: lineTrafficData, dimension: 'datetime' },
  linear: { data: lineSessionLengthData, dimension: 'minutes' },
  point: { data: lineWeekdayData, dimension: 'weekday' },
};

/**
 * Renders the scale type example for a scale type.
 * @param scaleType line scale type
 * @param padding x scale padding
 * @returns chart element
 */
const renderScaleTypeChart = (scaleType: unknown, padding?: number) => {
  const type = scaleType as keyof typeof SCALE_TYPE_EXAMPLES;
  const { data, dimension } = SCALE_TYPE_EXAMPLES[type];
  return (
    <Chart data={data}>
      <Axis position="bottom" baseline ticks labelFormat={type === 'time' ? 'time' : undefined} />
      <Axis position="left" grid />
      <Line color="series" dimension={dimension} scaleType={type} padding={padding} />
      <Legend />
    </Chart>
  );
};

/**
 * Playground for time, linear, and point x scales.
 * @returns playground element
 */
export const LineScaleTypePlayground = () => (
  <PropPlayground
    previewSize={getLinePreviewSize}
    controls={scaleTypeControls}
    component="Line"
    render={({ scaleType = 'time' }) => renderScaleTypeChart(scaleType)}
  />
);

const paddingControls: PlaygroundControl[] = [
  { name: 'padding', type: 'number', min: 0, max: 48, step: 4, defaultValue: 24 },
];

/**
 * Playground for the space between the first and last points and the plot edges.
 * @returns playground element
 */
export const LinePaddingPlayground = () => (
  <PropPlayground
    previewSize={getLinePreviewSize}
    controls={paddingControls}
    component="Line"
    render={({ padding = 24 }) => renderScaleTypeChart('time', padding as number)}
  />
);

const dualAxisControls: PlaygroundControl[] = [{ name: 'dualMetricAxis', type: 'boolean', defaultValue: true }];

/**
 * Playground for plotting the last series against a second y-axis.
 * @returns playground element
 */
export const LineDualAxisPlayground = () => (
  <PropPlayground
    previewSize={getLinePreviewSize}
    controls={dualAxisControls}
    component="Line"
    render={({ dualMetricAxis = true }) => (
      <Chart data={lineDualAxisData}>
        <Axis position="bottom" labelFormat="time" baseline ticks />
        <Axis position="left" grid />
        {dualMetricAxis ? <Axis position="right" /> : null}
        <Line color="series" dualMetricAxis={dualMetricAxis as boolean}>
          <ChartInspect />
        </Line>
        <Legend />
      </Chart>
    )}
  />
);

const hoverControls: PlaygroundControl[] = [
  { name: 'interactionMode', type: 'select', options: ['nearest', 'item'], defaultValue: 'nearest' },
  { name: 'dimensionHover', type: 'boolean', defaultValue: false },
  { name: 'showHoverLabel', type: 'boolean', defaultValue: true },
];

/**
 * Playground for how hovering picks and labels points.
 * @returns playground element
 */
export const LineHoverPlayground = () => (
  <PropPlayground
    previewSize={getLinePreviewSize}
    controls={hoverControls}
    component="Line"
    render={({ interactionMode, dimensionHover, showHoverLabel }) => (
      <Chart data={lineTrafficData}>
        {timeAxes}
        <Line
          color="series"
          interactionMode={interactionMode as LineProps['interactionMode']}
          dimensionHover={dimensionHover as boolean | undefined}
          showHoverLabel={showHoverLabel as boolean | undefined}
        >
          <ChartPopover width="auto">{popoverContent}</ChartPopover>
        </Line>
      </Chart>
    )}
  />
);

const metricRangeControls: PlaygroundControl[] = [
  { group: 'metricRanges', name: 'rangeOpacity', type: 'number', min: 0, max: 1, step: 0.1, defaultValue: 0.2 },
  {
    group: 'metricRanges',
    name: 'lineType',
    type: 'select',
    options: ['dashed', 'solid', 'dotted'],
    defaultValue: 'dashed',
  },
  { group: 'metricRanges', name: 'displayOnHover', type: 'boolean', defaultValue: false },
  { group: 'metricRanges', name: 'scaleAxisToFit', type: 'boolean', defaultValue: true },
];

/**
 * Playground for a shaded range around a line.
 * @returns playground element
 */
export const LineMetricRangePlayground = () => (
  <PropPlayground
    previewSize={getLinePreviewSize}
    controls={metricRangeControls}
    component="Line"
    render={({ rangeOpacity, lineType, displayOnHover, scaleAxisToFit = true }) => (
      <Chart data={lineRangeData}>
        {timeAxes}
        <Line
          metricRanges={[
            {
              metric: 'forecast',
              metricStart: 'low',
              metricEnd: 'high',
              rangeOpacity: rangeOpacity as number | undefined,
              lineType: lineType as 'dashed' | undefined,
              displayOnHover: displayOnHover as boolean | undefined,
              scaleAxisToFit: scaleAxisToFit as boolean | undefined,
            },
          ]}
        >
          <LineForecast metric="forecast" start={FORECAST_START} />
          <ChartInspect />
        </Line>
      </Chart>
    )}
  />
);

const directLabelControls: PlaygroundControl[] = [
  { name: 'value', type: 'select', options: ['last', 'average', 'series'], defaultValue: 'last' },
  { name: 'position', type: 'select', options: ['end', 'start'], defaultValue: 'end' },
  { name: 'format', type: 'select', options: [',.2~f', ',.1f', '.2s'], defaultValue: ',.2~f' },
  { name: 'prefix', type: 'text', defaultValue: '' },
  { name: 'excludeSeries', type: 'select', options: ['none', 'Email'], defaultValue: 'none' },
];

/**
 * Playground for LineDirectLabel props.
 * @returns playground element
 */
export const LineDirectLabelPlayground = () => (
  <PropPlayground
    previewSize={getLinePreviewSize}
    controls={directLabelControls}
    component="LineDirectLabel"
    render={({ value, position, format, prefix, excludeSeries }) => (
      <Chart data={lineTrafficData}>
        {timeAxes}
        <Line color="series">
          <LineDirectLabel
            value={value as 'average' | undefined}
            position={position as 'start' | undefined}
            format={format as string | undefined}
            prefix={optional(prefix)}
            excludeSeries={toList(excludeSeries)}
          />
        </Line>
      </Chart>
    )}
  />
);

const FORECAST_STARTS: Record<string, number> = {
  'Mar 9': lineDate(7),
  'Mar 10': lineDate(8),
  'Mar 11': FORECAST_START,
  'Mar 12': lineDate(10),
};

const forecastControls: PlaygroundControl[] = [
  { name: 'start', type: 'select', options: Object.keys(FORECAST_STARTS), defaultValue: 'Mar 11' },
  { name: 'label', type: 'text', defaultValue: 'Forecast' },
];

/**
 * Playground for LineForecast props.
 * @returns playground element
 */
export const LineForecastPlayground = () => (
  <PropPlayground
    previewSize={getLinePreviewSize}
    controls={forecastControls}
    component="LineForecast"
    render={({ start = 'Mar 11', label }) => (
      <Chart data={lineForecastData}>
        {timeAxes}
        <Line>
          <LineForecast metric="forecast" start={FORECAST_STARTS[String(start)]} label={label as string | undefined} />
          <ChartInspect />
        </Line>
      </Chart>
    )}
  />
);

const axisControls: PlaygroundControl[] = [
  { group: 'Axis', name: 'title', label: 'Titles', doc: 'Axis.title', type: 'boolean', defaultValue: false },
  {
    group: 'Axis',
    name: 'granularity',
    type: 'select',
    options: ['day', 'week'],
    defaultValue: 'day',
  },
  {
    group: 'Axis',
    name: 'numberFormat',
    type: 'select',
    options: ['shortNumber', 'standardNumber'],
    defaultValue: 'shortNumber',
  },
  {
    group: 'ReferenceLine',
    name: 'referenceLine',
    label: 'Show',
    doc: 'ReferenceLine',
    type: 'boolean',
    defaultValue: true,
  },
  { group: 'Chart', name: 'locale', type: 'select', options: ['en-US', 'de-DE', 'fr-FR'], defaultValue: 'en-US' },
];

/**
 * Playground for axes and reference lines on a line chart.
 * @returns playground element
 */
export const LineAxisPlayground = () => (
  <PropPlayground
    previewSize={getLinePreviewSize}
    controls={axisControls}
    render={({ title, granularity, numberFormat, referenceLine, locale }) => (
      <Chart data={lineTrafficData} locale={locale as Locale | undefined}>
        <Axis
          position="bottom"
          labelFormat="time"
          granularity={granularity as 'week' | undefined}
          baseline
          ticks
          title={title ? 'Day' : undefined}
        />
        <Axis
          position="left"
          grid
          numberFormat={numberFormat as string | undefined}
          title={title ? 'Visits' : undefined}
        >
          {referenceLine !== false && <ReferenceLine value={5000} label="Target" />}
        </Axis>
        <Line color="series">
          <ChartInspect />
        </Line>
      </Chart>
    )}
  />
);

const legendControls: PlaygroundControl[] = [
  { name: 'position', type: 'select', options: ['bottom', 'right', 'top', 'left'], defaultValue: 'bottom' },
  { name: 'isToggleable', type: 'boolean', defaultValue: true },
  { name: 'highlight', type: 'boolean', defaultValue: true },
];

/**
 * Playground for Legend props with a line chart.
 * @returns playground element
 */
export const LineLegendPlayground = () => (
  <PropPlayground
    previewSize={getLinePreviewSize}
    controls={legendControls}
    component="Legend"
    render={({ position, isToggleable = true, highlight = true }) => (
      <Chart data={lineTrafficData}>
        {timeAxes}
        <Line color="series" />
        <Legend
          title="Channel"
          position={position as LegendPosition | undefined}
          isToggleable={isToggleable as boolean}
          highlight={highlight as boolean}
        />
      </Chart>
    )}
  />
);

const hiddenSeriesControls: PlaygroundControl[] = [
  { name: 'hiddenSeries', type: 'select', options: ['none', 'Email', 'Paid search, Email'], defaultValue: 'Email' },
];

/**
 * Playground for hiding series from outside the chart.
 * @returns playground element
 */
export const LineHiddenSeriesPlayground = () => (
  <PropPlayground
    previewSize={getLinePreviewSize}
    controls={hiddenSeriesControls}
    component="Chart"
    render={({ hiddenSeries = 'Email' }) => (
      <Chart data={lineTrafficData} hiddenSeries={toList(hiddenSeries)}>
        {timeAxes}
        <Line color="series" />
        <Legend />
      </Chart>
    )}
  />
);

const inspectContent = withSource(
  (datum: Record<string, unknown>) => <div>{Number(datum.value).toLocaleString()} visits</div>,
  '(datum) => <div>{datum.value.toLocaleString()} visits</div>'
);

const interactionControls: PlaygroundControl[] = [
  { group: 'ChartInspect', name: 'inspect', label: 'Show', doc: 'ChartInspect', type: 'boolean', defaultValue: true },
  {
    group: 'ChartInspect',
    name: 'highlightBy',
    type: 'select',
    options: ['item', 'series', 'dimension'],
    defaultValue: 'item',
    isDisabled: (values) => values.inspect === false,
  },
  {
    group: 'ChartInspect',
    name: 'content',
    doc: 'ChartInspect.children',
    type: 'select',
    options: ['default', 'custom'],
    defaultValue: 'default',
    isDisabled: (values) => values.inspect === false,
  },
  { group: 'ChartPopover', name: 'popover', label: 'Show', doc: 'ChartPopover', type: 'boolean', defaultValue: true },
  { group: 'ChartPopover', name: 'rightClick', type: 'boolean', defaultValue: false },
];

/**
 * Playground for Line hover and click interactions.
 * @returns playground element
 */
export const LineInteractionPlayground = () => (
  <PropPlayground
    previewSize={getLinePreviewSize}
    controls={interactionControls}
    render={({ inspect, highlightBy, content, popover, rightClick }) => (
      <Chart data={lineTrafficData}>
        {timeAxes}
        <Line color="series">
          {inspect !== false && (
            <ChartInspect highlightBy={highlightBy as 'series' | undefined}>
              {content === 'custom' ? inspectContent : undefined}
            </ChartInspect>
          )}
          {popover !== false && (
            <ChartPopover width="auto" rightClick={rightClick as boolean | undefined}>
              {popoverContent}
            </ChartPopover>
          )}
        </Line>
      </Chart>
    )}
  />
);

const highlightControls: PlaygroundControl[] = [
  {
    group: 'Chart',
    name: 'highlightedSeries',
    type: 'select',
    options: ['none', ...channels],
    defaultValue: 'none',
    isDisabled: (values) => optional(values.highlightedItem) !== undefined,
  },
  {
    group: 'Chart',
    name: 'highlightedItem',
    type: 'select',
    options: ['none', 'Mar 8'],
    defaultValue: 'none',
    isDisabled: (values) => optional(values.highlightedSeries) !== undefined,
  },
];

/**
 * Playground for controlled highlighting from outside the chart.
 * @returns playground element
 */
export const LineHighlightPlayground = () => (
  <PropPlayground
    previewSize={getLinePreviewSize}
    controls={highlightControls}
    render={({ highlightedSeries, highlightedItem }) => {
      const series = optional(highlightedSeries);
      const item = !series && optional(highlightedItem) ? HIGHLIGHT_DATE : undefined;
      return (
        <Chart
          data={lineTrafficData}
          highlightedSeries={item ? undefined : series}
          idKey={item ? 'datetime' : undefined}
          highlightedItem={item}
        >
          {timeAxes}
          <Line color="series">
            <ChartInspect />
          </Line>
          <Legend highlight />
        </Chart>
      );
    }}
  />
);

const animationControls: PlaygroundControl[] = [
  {
    group: 'Chart',
    name: 'drawIn',
    label: "animationTypes 'drawIn'",
    doc: 'Chart.animationTypes',
    type: 'boolean',
    defaultValue: true,
  },
  {
    group: 'Chart',
    name: 'hover',
    label: "animationTypes 'hover'",
    doc: 'Chart.animationTypes',
    type: 'boolean',
    defaultValue: true,
  },
];

/**
 * Playground for Line draw-in and hover animations.
 * @returns playground element
 */
export const LineAnimationPlayground = () => (
  <PropPlayground
    previewSize={getLinePreviewSize}
    replay
    controls={animationControls}
    render={({ drawIn = true, hover = true }) => {
      const types: AnimationType[] = [];
      if (hover) types.push('hover');
      if (drawIn) types.push('drawIn');
      const animationTypes = hover && drawIn ? undefined : types;
      return (
        <Chart data={lineTrafficData} animationTypes={animationTypes}>
          {timeAxes}
          <Line color="series">
            <ChartInspect />
          </Line>
          <Legend />
        </Chart>
      );
    }}
  />
);
