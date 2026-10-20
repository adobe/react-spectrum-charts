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

import { Button, ButtonGroup, Content, Heading, Text } from '@react-spectrum/s2';

import {
  Axis,
  Bar,
  BarDirectLabel,
  ChartInspect,
  ChartPopover,
  Legend,
  ReferenceLine,
  Title,
} from '@spectrum-charts/react-spectrum-charts-s2';

import { DocsChart as Chart } from '../components/examples/DocsChart';
import { PlaygroundControl, PreviewSize, PropPlayground } from '../components/examples/PropPlayground';
import {
  barChangeData,
  barChannelCalloutData,
  barChannelData,
  barChannelDeviceData,
  barChannelVisitorData,
  barGoalData,
  barMonthlyData,
  barRegionData,
  barSessionsOrdersData,
  barZeroData,
  emptyData,
} from '../components/examples/data';
import { withSource } from '../components/examples/elementToJsx';

// Every example aims for a 480×288 plot, capped so the whole chart fits the preview.
const PLOT_WIDTH = 480;
const MAX_PREVIEW_WIDTH = 512;
const PLOT_HEIGHT = 288;
const METRIC_AXIS_WIDTH = 11;
const AXIS_HEIGHT = 24;
const AXIS_TITLE_WIDTH = 30;
const AXIS_TITLE_HEIGHT = 25;
// Approximate width of one category label character at the axis label size.
const LABEL_CHAR_WIDTH = 7;
// Time labels are short, like "Jan" or "2025".
const TIME_LABEL_LENGTH = 4;
const BOTTOM_LEGEND_HEIGHT = 64;
const LEGEND_TITLE_HEIGHT = 22;
const SIDE_LEGEND_WIDTH = 115;
const TITLE_HEIGHT = 40;

type Datum = Record<string, unknown>;
type Orientation = 'vertical' | 'horizontal';
type BarType = 'stacked' | 'dodged';
type LegendPosition = 'right' | 'bottom' | 'left' | 'top';
type AnimationType = 'hover' | 'drawIn';
type LabelPosition = 'start' | 'middle' | 'end' | 'end-outside';
type HighlightBy = 'item' | 'series' | 'dimension';
type Target = 'item' | 'dimensionArea';

const findElements = (node: ReactNode, name: string): ReactElement<Record<string, unknown>>[] =>
  Children.toArray(node).flatMap((child) => {
    if (!isValidElement(child)) return [];
    const element = child as ReactElement<Record<string, unknown>>;
    const type = element.type as { displayName?: string; name?: string };
    const matches = (type.displayName ?? type.name) === name ? [element] : [];
    return [...matches, ...findElements(element.props.children as ReactNode, name)];
  });

/**
 * Gets the room an axis takes beside or below the plot.
 * @param axis axis element
 * @param isCategoryAxis whether the axis shows the bar categories
 * @param labelLength length of the longest category label
 * @returns width for left/right axes, height for top/bottom axes
 */
const getAxisSize = (axis: ReactElement<Record<string, unknown>>, isCategoryAxis: boolean, labelLength: number) => {
  const isSide = ['left', 'right'].includes(String(axis.props.position));
  if (!isSide) return AXIS_HEIGHT + (axis.props.title ? AXIS_TITLE_HEIGHT : 0);
  const labelWidth = isCategoryAxis ? labelLength * LABEL_CHAR_WIDTH : 0;
  return METRIC_AXIS_WIDTH + labelWidth + (axis.props.title ? AXIS_TITLE_WIDTH : 0);
};

/**
 * Sizes a bar example around a 480×288 plot, leaving room for axes, legend, and title.
 * @param element chart element
 * @returns preview width and height
 */
const getBarPreviewSize = (element: ReactElement): PreviewSize => {
  const { children, data = [] } = element.props as { children?: ReactNode; data?: Datum[] };
  const bar = findElements(children, 'Bar')[0];
  const isHorizontal = bar?.props.orientation === 'horizontal';
  // Diverging bars draw their category labels on the zero baseline, inside the plot.
  const isDiverging = Boolean(bar?.props.diverging);
  const dimension = String(bar?.props.dimension ?? 'category');
  const labelLength =
    bar?.props.dimensionDataType === 'time'
      ? TIME_LABEL_LENGTH
      : Math.max(0, ...data.map((datum) => String(datum[dimension] ?? '').length));
  let width = PLOT_WIDTH;
  let height = PLOT_HEIGHT;
  for (const axis of findElements(children, 'Axis')) {
    const isSide = ['left', 'right'].includes(String(axis.props.position));
    const size = getAxisSize(axis, isSide === isHorizontal && !isDiverging, labelLength);
    if (isSide) width += size;
    else height += size;
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

/**
 * Renders the category and value axes for a bar orientation.
 * @param orientation bar orientation
 * @param dimensionTitle category axis title
 * @param metricTitle value axis title
 * @param metricProps extra props for the value axis
 * @param metricChildren children for the value axis, like ReferenceLine
 * @returns axis elements
 */
const renderAxes = (
  orientation: unknown,
  dimensionTitle: string,
  metricTitle: string,
  metricProps: Record<string, unknown> = {},
  metricChildren?: ComponentProps<typeof Axis>['children']
) => {
  const isHorizontal = orientation === 'horizontal';
  return [
    <Axis key="dimension" position={isHorizontal ? 'left' : 'bottom'} baseline title={dimensionTitle || undefined} />,
    <Axis key="metric" position={isHorizontal ? 'bottom' : 'left'} grid title={metricTitle} {...metricProps}>
      {metricChildren}
    </Axis>,
  ];
};

const orientationControl: PlaygroundControl = {
  group: 'Bar',
  name: 'orientation',
  type: 'select',
  options: ['vertical', 'horizontal'],
  defaultValue: 'vertical',
};

const barControls: PlaygroundControl[] = [
  orientationControl,
  {
    group: 'Bar',
    name: 'series',
    label: 'Series',
    doc: 'Bar.color',
    type: 'select',
    options: ['by device', 'single'],
    defaultValue: 'by device',
  },
  {
    group: 'Bar',
    name: 'type',
    type: 'select',
    options: ['stacked', 'dodged'],
    defaultValue: 'stacked',
    isDisabled: (values) => values.series === 'single',
  },
  {
    group: 'Legend',
    name: 'legend',
    label: 'Position',
    doc: 'Legend.position',
    type: 'select',
    options: ['none', 'bottom', 'right', 'left', 'top'],
    defaultValue: 'bottom',
  },
  { group: 'Title', name: 'title', label: 'Text', doc: 'Title.text', type: 'text', defaultValue: 'Visits by channel' },
];

/**
 * Playground for the top-level Bar props and its common siblings.
 * @returns playground element
 */
export const BarPlayground = () => (
  <PropPlayground
    previewSize={getBarPreviewSize}
    controls={barControls}
    render={({ orientation, type, series = 'by device', legend = 'bottom', title = 'Visits by channel' }) => {
      const hasSeries = series !== 'single';
      return (
        <Chart data={hasSeries ? barChannelDeviceData : barChannelData}>
          {optional(title) && <Title text={String(title)} />}
          {renderAxes(orientation, 'Channel', 'Visits')}
          <Bar
            dimension="channel"
            metric="visits"
            color={hasSeries ? 'device' : undefined}
            orientation={orientation as Orientation | undefined}
            type={hasSeries ? (type as BarType | undefined) : undefined}
          />
          {hasSeries && legend !== 'none' && <Legend position={legend as LegendPosition} />}
        </Chart>
      );
    }}
  />
);

const statesControls: PlaygroundControl[] = [
  { name: 'state', type: 'select', options: ['all zeros', 'empty', 'loading'], defaultValue: 'all zeros' },
  {
    name: 'emptyStateText',
    type: 'text',
    defaultValue: 'No visits yet',
    isDisabled: (values) => values.state !== 'empty',
  },
];

/**
 * Playground for zero-value, empty, and loading bar charts.
 * @returns playground element
 */
export const BarStatesPlayground = () => (
  <PropPlayground
    previewSize={getBarPreviewSize}
    controls={statesControls}
    component="Chart"
    render={({ state = 'all zeros', emptyStateText }) => {
      const dataByState: Record<string, Datum[]> = { 'all zeros': barZeroData, empty: emptyData };
      return (
        <Chart
          data={dataByState[String(state)] ?? barChannelData}
          loading={state === 'loading' ? true : undefined}
          emptyStateText={state === 'empty' ? String(emptyStateText ?? 'No visits yet') : undefined}
        >
          {renderAxes('vertical', 'Channel', 'Visits')}
          <Bar dimension="channel" metric="visits" />
        </Chart>
      );
    }}
  />
);

const timeControls: PlaygroundControl[] = [orientationControl];

/**
 * Playground for bars with date categories.
 * @returns playground element
 */
export const BarTimePlayground = () => (
  <PropPlayground
    previewSize={getBarPreviewSize}
    controls={timeControls}
    component="Bar"
    render={({ orientation }) => {
      const isHorizontal = orientation === 'horizontal';
      return (
        <Chart data={barMonthlyData}>
          <Axis
            position={isHorizontal ? 'left' : 'bottom'}
            baseline
            title="Month"
            labelFormat="time"
            granularity="month"
          />
          <Axis position={isHorizontal ? 'bottom' : 'left'} grid title="Visits" />
          <Bar
            dimension="month"
            metric="visits"
            dimensionDataType="time"
            orientation={orientation as Orientation | undefined}
          />
        </Chart>
      );
    }}
  />
);

const orientationControls: PlaygroundControl[] = [{ ...orientationControl, defaultValue: 'horizontal' }];

/**
 * Playground for vertical and horizontal bars.
 * @returns playground element
 */
export const BarOrientationPlayground = () => (
  <PropPlayground
    previewSize={getBarPreviewSize}
    controls={orientationControls}
    component="Bar"
    render={({ orientation = 'horizontal' }) => (
      <Chart data={barChannelData}>
        {renderAxes(orientation, 'Channel', 'Visits')}
        <Bar dimension="channel" metric="visits" orientation={orientation as Orientation} />
      </Chart>
    )}
  />
);

const stackControls: PlaygroundControl[] = [
  { name: 'type', type: 'select', options: ['stacked', 'dodged'], defaultValue: 'stacked' },
  {
    name: 'order',
    type: 'select',
    options: ['none', 'stackOrder'],
    defaultValue: 'none',
    isDisabled: (values) => values.type === 'dodged',
  },
  orientationControl,
];

/**
 * Playground for stacked and dodged bars.
 * @returns playground element
 */
export const BarStackPlayground = () => (
  <PropPlayground
    previewSize={getBarPreviewSize}
    controls={stackControls}
    component="Bar"
    render={({ type, order, orientation }) => (
      <Chart data={barChannelDeviceData}>
        {renderAxes(orientation, 'Channel', 'Visits')}
        <Bar
          dimension="channel"
          metric="visits"
          color="device"
          type={type as BarType | undefined}
          order={type === 'dodged' ? undefined : optional(order)}
          orientation={orientation as Orientation | undefined}
        />
        <Legend />
      </Chart>
    )}
  />
);

const dodgedStackedColors = [
  ['blue-900', 'blue-500'],
  ['fuchsia-900', 'fuchsia-500'],
];

const dodgedStackedControls: PlaygroundControl[] = [
  { name: 'groupedPadding', type: 'number', min: 0, max: 0.9, step: 0.05, defaultValue: 0.4 },
  orientationControl,
];

/**
 * Playground for bars that are dodged by one field and stacked by another.
 * @returns playground element
 */
export const BarDodgedStackedPlayground = () => (
  <PropPlayground
    previewSize={getBarPreviewSize}
    controls={dodgedStackedControls}
    component="Bar"
    render={({ groupedPadding, orientation }) => (
      <Chart data={barChannelVisitorData} colors={dodgedStackedColors}>
        {renderAxes(orientation, 'Channel', 'Visits')}
        <Bar
          dimension="channel"
          metric="visits"
          color={['device', 'visitor']}
          type="dodged"
          groupedPadding={groupedPadding as number | undefined}
          orientation={orientation as Orientation | undefined}
        />
        <Legend />
      </Chart>
    )}
  />
);

const spacingControls: PlaygroundControl[] = [
  { name: 'paddingRatio', type: 'number', min: 0, max: 0.9, step: 0.05, defaultValue: 0.4 },
  { name: 'paddingOuter', type: 'select', options: ['auto', '0', '0.2', '0.5', '1'], defaultValue: 'auto' },
];

/**
 * Playground for space between and around bars.
 * @returns playground element
 */
export const BarSpacingPlayground = () => (
  <PropPlayground
    previewSize={getBarPreviewSize}
    controls={spacingControls}
    component="Bar"
    render={({ paddingRatio, paddingOuter }) => (
      <Chart data={barChannelData}>
        {renderAxes('vertical', 'Channel', 'Visits')}
        <Bar
          dimension="channel"
          metric="visits"
          paddingRatio={paddingRatio as number | undefined}
          paddingOuter={paddingOuter && paddingOuter !== 'auto' ? Number(paddingOuter) : undefined}
        />
      </Chart>
    )}
  />
);

const appearanceControls: PlaygroundControl[] = [
  { name: 'hasSquareCorners', type: 'boolean', defaultValue: false },
  { name: 'opacity', type: 'number', min: 0.1, max: 1, step: 0.1, defaultValue: 1 },
  { name: 'lineWidth', type: 'number', min: 0, max: 6, step: 1, defaultValue: 0 },
  {
    name: 'lineType',
    type: 'select',
    options: ['solid', 'dashed', 'dotted'],
    defaultValue: 'solid',
    isDisabled: (values) => !values.lineWidth,
  },
];

/**
 * Playground for bar corners, opacity, and borders.
 * @returns playground element
 */
export const BarAppearancePlayground = () => (
  <PropPlayground
    previewSize={getBarPreviewSize}
    controls={appearanceControls}
    component="Bar"
    render={({ hasSquareCorners, opacity, lineWidth, lineType }) => (
      <Chart data={barChannelData}>
        {renderAxes('vertical', 'Channel', 'Visits')}
        <Bar
          dimension="channel"
          metric="visits"
          hasSquareCorners={hasSquareCorners as boolean | undefined}
          opacity={opacity === undefined ? undefined : { value: Number(opacity) }}
          lineWidth={lineWidth as number | undefined}
          lineType={lineType ? { value: lineType as 'dashed' | 'dotted' } : undefined}
        />
      </Chart>
    )}
  />
);

const colorOverrideControls: PlaygroundControl[] = [
  { name: 'colorOverride', label: 'colorOverride="statusColor"', type: 'boolean', defaultValue: true },
];

/**
 * Playground for coloring each bar from a data field.
 * @returns playground element
 */
export const BarColorOverridePlayground = () => (
  <PropPlayground
    previewSize={getBarPreviewSize}
    controls={colorOverrideControls}
    component="Bar"
    render={({ colorOverride = true }) => (
      <Chart data={barGoalData}>
        {renderAxes('vertical', 'Channel', 'Visits')}
        <Bar dimension="channel" metric="visits" colorOverride={colorOverride ? 'statusColor' : undefined} />
      </Chart>
    )}
  />
);

const divergingControls: PlaygroundControl[] = [
  { name: 'diverging', type: 'boolean', defaultValue: true },
  { ...orientationControl, defaultValue: 'horizontal' },
];

/**
 * Playground for bars that diverge from zero with labels on the baseline.
 * @returns playground element
 */
export const BarDivergingPlayground = () => (
  <PropPlayground
    previewSize={getBarPreviewSize}
    controls={divergingControls}
    component="Bar"
    render={({ diverging = true, orientation = 'horizontal' }) => (
      <Chart data={barChangeData}>
        {/* The category title moves with the axis to the zero line, so it's left off while diverging. */}
        {renderAxes(orientation, diverging ? '' : 'Channel', 'Change', { labelFormat: 'percentage' })}
        <Bar
          dimension="channel"
          metric="change"
          colorOverride="changeColor"
          diverging={diverging as boolean}
          orientation={orientation as Orientation}
        />
      </Chart>
    )}
  />
);

const dualAxisControls: PlaygroundControl[] = [{ name: 'dualMetricAxis', type: 'boolean', defaultValue: true }];

/**
 * Playground for scaling the last series against a second value axis.
 * @returns playground element
 */
export const BarDualAxisPlayground = () => (
  <PropPlayground
    previewSize={getBarPreviewSize}
    controls={dualAxisControls}
    component="Bar"
    render={({ dualMetricAxis = true }) => (
      <Chart data={barSessionsOrdersData}>
        <Axis position="bottom" baseline title="Channel" />
        <Axis position="left" grid title="Sessions" />
        {dualMetricAxis !== false && <Axis position="right" title="Orders" />}
        <Bar
          dimension="channel"
          metric="value"
          color="series"
          type="dodged"
          dualMetricAxis={dualMetricAxis as boolean}
        >
          <ChartInspect />
        </Bar>
        <Legend />
      </Chart>
    )}
  />
);

const trellisControls: PlaygroundControl[] = [
  {
    name: 'trellisOrientation',
    type: 'select',
    options: ['horizontal', 'vertical'],
    defaultValue: 'horizontal',
  },
  { name: 'trellisPadding', type: 'number', min: 0, max: 0.6, step: 0.05, defaultValue: 0.2 },
  orientationControl,
  { name: 'type', type: 'select', options: ['stacked', 'dodged'], defaultValue: 'stacked' },
];

/**
 * Playground for splitting bars into a small multiple per region.
 * @returns playground element
 */
export const BarTrellisPlayground = () => (
  <PropPlayground
    previewSize={getBarPreviewSize}
    controls={trellisControls}
    component="Bar"
    render={({ trellisOrientation, trellisPadding, orientation, type }) => (
      <Chart data={barRegionData}>
        {renderAxes(orientation, 'Channel', 'Visits')}
        <Bar
          dimension="channel"
          metric="visits"
          color="device"
          trellis="region"
          trellisOrientation={trellisOrientation as Orientation | undefined}
          trellisPadding={trellisPadding as number | undefined}
          orientation={orientation as Orientation | undefined}
          type={type as BarType | undefined}
        />
        <Legend />
      </Chart>
    )}
  />
);

const directLabelControls: PlaygroundControl[] = [
  {
    name: 'position',
    type: 'select',
    options: ['end-outside', 'end', 'middle', 'start'],
    defaultValue: 'end-outside',
  },
  { name: 'format', type: 'select', options: [',.2~f', '.3~s', ',.1f'], defaultValue: ',.2~f' },
  {
    name: 'overflow',
    type: 'select',
    options: ['default', 'hide', 'spill'],
    defaultValue: 'default',
    isDisabled: (values) => !values.position || values.position === 'end-outside',
  },
  { name: 'dataKey', type: 'select', options: ['none', 'callout'], defaultValue: 'none' },
  orientationControl,
];

/**
 * Playground for BarDirectLabel props.
 * @returns playground element
 */
export const BarDirectLabelPlayground = () => (
  <PropPlayground
    previewSize={getBarPreviewSize}
    controls={directLabelControls}
    component="BarDirectLabel"
    render={({ position, format, overflow, dataKey, orientation }) => (
      <Chart data={optional(dataKey) ? barChannelCalloutData : barChannelData}>
        {renderAxes(orientation, 'Channel', 'Visits')}
        <Bar dimension="channel" metric="visits" orientation={orientation as Orientation | undefined}>
          <BarDirectLabel
            position={position as LabelPosition | undefined}
            format={format as string | undefined}
            overflow={overflow === 'default' ? undefined : (overflow as 'hide' | 'spill')}
            dataKey={optional(dataKey)}
          />
        </Bar>
      </Chart>
    )}
  />
);

const referenceLineControls: PlaygroundControl[] = [
  { group: 'ReferenceLine', name: 'value', type: 'select', options: ['5000', '8000', '10000'], defaultValue: '8000' },
  { group: 'ReferenceLine', name: 'label', type: 'text', defaultValue: 'Goal' },
  orientationControl,
];

/**
 * Playground for a reference line on the value axis.
 * @returns playground element
 */
export const BarReferenceLinePlayground = () => (
  <PropPlayground
    previewSize={getBarPreviewSize}
    controls={referenceLineControls}
    render={({ value = '8000', label = 'Goal', orientation }) => (
      <Chart data={barChannelData}>
        {renderAxes(
          orientation,
          'Channel',
          'Visits',
          {},
          <ReferenceLine value={Number(value)} label={optional(label)} />
        )}
        <Bar dimension="channel" metric="visits" orientation={orientation as Orientation | undefined} />
      </Chart>
    )}
  />
);

const legendControls: PlaygroundControl[] = [
  { name: 'position', type: 'select', options: ['bottom', 'right', 'left', 'top'], defaultValue: 'bottom' },
  { name: 'isToggleable', type: 'boolean', defaultValue: true },
  { name: 'highlight', type: 'boolean', defaultValue: false },
];

/**
 * Playground for Legend props with bars.
 * @returns playground element
 */
export const BarLegendPlayground = () => (
  <PropPlayground
    previewSize={getBarPreviewSize}
    controls={legendControls}
    component="Legend"
    render={({ position, isToggleable = true, highlight }) => (
      <Chart data={barChannelDeviceData}>
        {renderAxes('vertical', 'Channel', 'Visits')}
        <Bar dimension="channel" metric="visits" color="device" />
        <Legend
          title="Device"
          position={position as LegendPosition | undefined}
          isToggleable={isToggleable as boolean}
          highlight={highlight as boolean | undefined}
        />
      </Chart>
    )}
  />
);

const hiddenSeriesControls: PlaygroundControl[] = [
  { name: 'hiddenSeries', type: 'select', options: ['none', 'Mobile', 'Mobile, Tablet'], defaultValue: 'Mobile' },
  { group: 'Bar', name: 'type', type: 'select', options: ['stacked', 'dodged'], defaultValue: 'stacked' },
];

/**
 * Playground for hiding series from outside the chart.
 * @returns playground element
 */
export const BarHiddenSeriesPlayground = () => (
  <PropPlayground
    previewSize={getBarPreviewSize}
    controls={hiddenSeriesControls}
    component="Chart"
    render={({ hiddenSeries = 'Mobile', type }) => (
      <Chart data={barChannelDeviceData} hiddenSeries={toList(hiddenSeries)}>
        {renderAxes('vertical', 'Channel', 'Visits')}
        <Bar dimension="channel" metric="visits" color="device" type={type as BarType | undefined} />
        <Legend />
      </Chart>
    )}
  />
);

const inspectContent = withSource(
  (datum: Datum) => (
    <div>
      {String(datum.channel)}, {String(datum.device)}: {Number(datum.visits).toLocaleString('en-US')} visits
    </div>
  ),
  '(datum) => (\n  <div>\n    {datum.channel}, {datum.device}: {datum.visits} visits\n  </div>\n)'
);

const popoverContent = withSource(
  (datum: Datum, close: () => void) => (
    <>
      <Heading level={4}>{String(datum.channel)}</Heading>
      <Content>
        <Text>
          {String(datum.device)}: {Number(datum.visits).toLocaleString('en-US')} visits
        </Text>
      </Content>
      <ButtonGroup UNSAFE_style={{ marginTop: 16 }}>
        <Button variant="secondary" size="S" onPress={close}>
          Close
        </Button>
      </ButtonGroup>
    </>
  ),
  `(datum, close) => (
  <>
    <Heading level={4}>{datum.channel}</Heading>
    <Content>
      <Text>{datum.device}: {datum.visits} visits</Text>
    </Content>
    <ButtonGroup UNSAFE_style={{ marginTop: 16 }}>
      <Button variant="secondary" size="S" onPress={close}>Close</Button>
    </ButtonGroup>
  </>
)`,
  { '@react-spectrum/s2': ['Button', 'ButtonGroup', 'Content', 'Heading', 'Text'] }
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
    name: 'targets',
    type: 'select',
    options: ['item', 'dimensionArea, item'],
    defaultValue: 'item',
    isDisabled: (values) => values.inspect === false,
  },
  { group: 'ChartPopover', name: 'popover', label: 'Show', doc: 'ChartPopover', type: 'boolean', defaultValue: true },
  {
    group: 'ChartPopover',
    name: 'rightClick',
    type: 'boolean',
    defaultValue: false,
    isDisabled: (values) => values.popover === false,
  },
  { group: 'Bar', name: 'type', type: 'select', options: ['stacked', 'dodged'], defaultValue: 'stacked' },
];

/**
 * Playground for Bar hover and click interactions.
 * @returns playground element
 */
export const BarInteractionPlayground = () => (
  <PropPlayground
    previewSize={getBarPreviewSize}
    controls={interactionControls}
    render={({ inspect, highlightBy, targets, popover, rightClick, type }) => (
      <Chart data={barChannelDeviceData}>
        {renderAxes('vertical', 'Channel', 'Visits')}
        <Bar dimension="channel" metric="visits" color="device" type={type as BarType | undefined}>
          {inspect !== false && (
            <ChartInspect
              highlightBy={highlightBy as HighlightBy | undefined}
              targets={toList(targets) as Target[] | undefined}
            >
              {inspectContent}
            </ChartInspect>
          )}
          {popover !== false && (
            <ChartPopover rightClick={rightClick as boolean | undefined}>{popoverContent}</ChartPopover>
          )}
        </Bar>
        <Legend />
      </Chart>
    )}
  />
);

const highlightControls: PlaygroundControl[] = [
  {
    group: 'Chart',
    name: 'highlightedSeries',
    type: 'select',
    options: ['none', 'Desktop', 'Mobile', 'Tablet'],
    defaultValue: 'none',
  },
  {
    group: 'Chart',
    name: 'highlightedItem',
    type: 'select',
    options: ['none', 'social-mobile', 'search-desktop, email-desktop'],
    defaultValue: 'none',
  },
];

/**
 * Playground for controlled highlighting from outside the chart.
 * @returns playground element
 */
export const BarHighlightPlayground = () => (
  <PropPlayground
    previewSize={getBarPreviewSize}
    controls={highlightControls}
    render={({ highlightedSeries, highlightedItem }) => {
      const items = toList(highlightedItem);
      return (
        <Chart
          data={barChannelDeviceData}
          highlightedSeries={optional(highlightedSeries)}
          idKey={items ? 'id' : undefined}
          highlightedItem={items && items.length === 1 ? items[0] : items}
        >
          {renderAxes('vertical', 'Channel', 'Visits')}
          <Bar dimension="channel" metric="visits" color="device">
            <ChartInspect />
          </Bar>
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
  { group: 'Bar', name: 'type', type: 'select', options: ['stacked', 'dodged'], defaultValue: 'stacked' },
  orientationControl,
];

/**
 * Playground for the Bar draw-in animation.
 * @returns playground element
 */
export const BarAnimationPlayground = () => (
  <PropPlayground
    previewSize={getBarPreviewSize}
    replay
    controls={animationControls}
    render={({ drawIn = true, type, orientation }) => {
      const animationTypes: AnimationType[] | undefined = drawIn ? undefined : ['hover'];
      return (
        <Chart data={barChannelDeviceData} animationTypes={animationTypes}>
          {renderAxes(orientation, 'Channel', 'Visits')}
          <Bar
            dimension="channel"
            metric="visits"
            color="device"
            type={type as BarType | undefined}
            orientation={orientation as Orientation | undefined}
          />
          <Legend />
        </Chart>
      );
    }}
  />
);
