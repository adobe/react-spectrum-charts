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
import { Content, Heading, Text } from '@react-spectrum/s2';
import React, { Children, ReactElement, ReactNode, isValidElement } from 'react';

import {
  Axis,
  ChartInspect,
  ChartPopover,
  Legend,
  Line,
  ReferenceLine,
  Title,
} from '@spectrum-charts/react-spectrum-charts-s2';
import { Area } from '@spectrum-charts/react-spectrum-charts-s2/lab';

import { DocsChart as Chart } from '../components/examples/DocsChart';
import { PlaygroundControl, PreviewSize, PropPlayground } from '../components/examples/PropPlayground';
import {
  channelSessionsData,
  emptyData,
  forecastData,
  installsData,
  temperatureData,
  temperatureGapData,
  weekdayVisitsData,
} from '../components/examples/data';
import { withSource } from '../components/examples/elementToJsx';

// Every example aims for a 480 x 288 plot, capped so the whole chart fits the preview.
const PLOT_WIDTH = 480;
const MAX_PREVIEW_WIDTH = 512;
const PLOT_HEIGHT = 288;
const LEFT_AXIS_WIDTH = 40;
const LEFT_AXIS_TITLE_WIDTH = 24;
// Time axes label two rows: the tick and its parent period.
const TIME_AXIS_HEIGHT = 50;
const BOTTOM_AXIS_HEIGHT = 30;
const BOTTOM_AXIS_TITLE_HEIGHT = 24;
const SIDE_LEGEND_WIDTH = 140;
const BOTTOM_LEGEND_HEIGHT = 60;
const BOTTOM_LEGEND_TITLE_HEIGHT = 20;
const TITLE_HEIGHT = 40;

type ElementWithProps = ReactElement<Record<string, unknown>>;

const findElements = (node: ReactNode, name: string): ElementWithProps[] =>
  Children.toArray(node).flatMap((child) => {
    if (!isValidElement(child)) return [];
    const element = child as ElementWithProps;
    const type = element.type as { displayName?: string; name?: string };
    const matches = (type.displayName ?? type.name) === name ? [element] : [];
    return [...matches, ...findElements(element.props.children as ReactNode, name)];
  });

/**
 * Sizes an area example around a 480 x 288 plot, leaving room for axes, legend, and title.
 * @param element chart element
 * @returns preview width and height
 */
const getAreaPreviewSize = (element: ReactElement): PreviewSize => {
  const children = (element.props as { children?: ReactNode }).children;
  const axes = findElements(children, 'Axis');
  const leftAxis = axes.find((axis) => axis.props.position === 'left');
  const bottomAxis = axes.find((axis) => axis.props.position === 'bottom');
  const [legend] = findElements(children, 'Legend');
  const legendPosition = (legend?.props.position as string | undefined) ?? 'bottom';
  const isSideLegend = Boolean(legend) && ['left', 'right'].includes(legendPosition);
  let width = PLOT_WIDTH;
  let height = PLOT_HEIGHT;
  if (leftAxis) width += LEFT_AXIS_WIDTH + (leftAxis.props.title ? LEFT_AXIS_TITLE_WIDTH : 0);
  if (bottomAxis) {
    height += bottomAxis.props.labelFormat === 'time' ? TIME_AXIS_HEIGHT : BOTTOM_AXIS_HEIGHT;
    if (bottomAxis.props.title) height += BOTTOM_AXIS_TITLE_HEIGHT;
  }
  if (isSideLegend) width += SIDE_LEGEND_WIDTH;
  else if (legend) height += BOTTOM_LEGEND_HEIGHT + (legend.props.title ? BOTTOM_LEGEND_TITLE_HEIGHT : 0);
  if (findElements(children, 'Title').length) height += TITLE_HEIGHT;
  return { width: Math.min(width, MAX_PREVIEW_WIDTH), height };
};

type Granularity = 'day' | 'week' | 'month';
type LegendPosition = 'right' | 'bottom' | 'left' | 'top';
type Locale = 'en-US' | 'de-DE' | 'fr-FR';

const channels = [...new Set(channelSessionsData.map((datum) => datum.channel))];

/** Converts a "none" select value to undefined. */
const optional = (value: unknown) => (!value || value === 'none' ? undefined : String(value));

/** Splits a comma-separated select value into a list. */
const toList = (value: unknown) => optional(value)?.split(', ');

const sessionsContent = withSource(
  (datum: Record<string, unknown>) => (
    <div>
      {String(datum.channel)}: {String(datum.sessions)} sessions
    </div>
  ),
  '(datum) => (\n  <div>\n    {datum.channel}: {datum.sessions} sessions\n  </div>\n)'
);

const sessionsPopoverContent = withSource(
  (datum: Record<string, unknown>) => (
    <>
      <Heading level={4}>{String(datum.channel)}</Heading>
      <Content>
        <Text>{Number(datum.sessions).toLocaleString()} sessions</Text>
      </Content>
    </>
  ),
  '(datum) => (\n  <>\n    <Heading level={4}>{datum.channel}</Heading>\n    <Content>\n      <Text>{datum.sessions.toLocaleString()} sessions</Text>\n    </Content>\n  </>\n)',
  { '@react-spectrum/s2': ['Content', 'Heading', 'Text'] }
);

const areaControls: PlaygroundControl[] = [
  { group: 'Area', name: 'opacity', type: 'number', min: 0, max: 1, step: 0.1, defaultValue: 0.8 },
  {
    group: 'ChartInspect',
    name: 'inspect',
    label: 'Show',
    doc: 'ChartInspect',
    type: 'boolean',
    defaultValue: true,
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
  {
    group: 'Title',
    name: 'title',
    label: 'Text',
    doc: 'Title.text',
    type: 'text',
    defaultValue: 'Sessions by channel',
  },
];

/**
 * Playground for the top-level Area props and its common siblings.
 * @returns playground element
 */
export const AreaPlayground = () => (
  <PropPlayground
    previewSize={getAreaPreviewSize}
    controls={areaControls}
    render={({ opacity, inspect, legend, title = 'Sessions by channel' }) => (
      <Chart data={channelSessionsData}>
        {optional(title) && <Title text={String(title)} />}
        <Axis position="left" grid />
        <Axis position="bottom" labelFormat="time" granularity="week" baseline />
        <Area metric="sessions" color="channel" opacity={opacity as number | undefined}>
          {inspect !== false && <ChartInspect>{sessionsContent}</ChartInspect>}
        </Area>
        {legend !== 'none' && <Legend title="Channel" position={(legend ?? 'bottom') as LegendPosition} />}
      </Chart>
    )}
  />
);

const gapControls: PlaygroundControl[] = [
  {
    name: 'metrics',
    label: 'Metric props',
    doc: 'Area.metricStart',
    type: 'select',
    options: ['metric', 'metricStart, metricEnd'],
    defaultValue: 'metric',
  },
];

/**
 * Playground for how missing values render in stacked and floating areas.
 * @returns playground element
 */
export const AreaGapPlayground = () => (
  <PropPlayground
    previewSize={getAreaPreviewSize}
    controls={gapControls}
    component="Area"
    render={({ metrics = 'metric' }) => (
      <Chart data={temperatureGapData}>
        <Axis position="left" grid />
        <Axis position="bottom" labelFormat="time" baseline />
        {metrics === 'metric' ? <Area metric="high" /> : <Area metricStart="low" metricEnd="high" />}
      </Chart>
    )}
  />
);

const statesControls: PlaygroundControl[] = [
  { name: 'state', type: 'select', options: ['empty', 'loading'], defaultValue: 'empty' },
  {
    name: 'emptyStateText',
    type: 'text',
    defaultValue: 'No sessions in this range',
    isDisabled: (values) => values.state === 'loading',
  },
];

/**
 * Playground for empty and loading area charts.
 * @returns playground element
 */
export const AreaStatesPlayground = () => (
  <PropPlayground
    previewSize={getAreaPreviewSize}
    controls={statesControls}
    component="Chart"
    render={({ state = 'empty', emptyStateText }) => (
      <Chart
        data={state === 'empty' ? emptyData : channelSessionsData}
        loading={state === 'loading' ? true : undefined}
        emptyStateText={state === 'empty' ? String(emptyStateText ?? 'No sessions in this range') : undefined}
      >
        <Axis position="left" grid />
        <Axis position="bottom" labelFormat="time" baseline />
        <Area metric="sessions" color="channel" />
      </Chart>
    )}
  />
);

const orderControls: PlaygroundControl[] = [
  { name: 'order', type: 'select', options: ['none', 'stackOrder'], defaultValue: 'stackOrder' },
];

/**
 * Playground for choosing which series stacks on top.
 * @returns playground element
 */
export const AreaOrderPlayground = () => (
  <PropPlayground
    previewSize={getAreaPreviewSize}
    controls={orderControls}
    component="Area"
    render={({ order = 'stackOrder' }) => (
      <Chart data={channelSessionsData}>
        <Axis position="left" grid />
        <Axis position="bottom" labelFormat="time" granularity="week" baseline />
        <Area metric="sessions" color="channel" order={optional(order)} />
        <Legend />
      </Chart>
    )}
  />
);

const floatingContent = withSource(
  (datum: Record<string, unknown>) => (
    <div>
      {String(datum.city)}: {String(datum.low)}° to {String(datum.high)}°
    </div>
  ),
  '(datum) => (\n  <div>\n    {datum.city}: {datum.low}° to {datum.high}°\n  </div>\n)'
);

const floatingControls: PlaygroundControl[] = [
  { name: 'opacity', type: 'number', min: 0, max: 1, step: 0.1, defaultValue: 0.5 },
];

/**
 * Playground for floating areas drawn between two fields.
 * @returns playground element
 */
export const AreaFloatingPlayground = () => (
  <PropPlayground
    previewSize={getAreaPreviewSize}
    controls={floatingControls}
    component="Area"
    render={({ opacity }) => (
      <Chart data={temperatureData}>
        <Axis position="left" grid title="Temperature (°F)" />
        <Axis position="bottom" labelFormat="time" baseline />
        <Area metricStart="low" metricEnd="high" color="city" opacity={(opacity ?? 0.5) as number}>
          <ChartInspect>{floatingContent}</ChartInspect>
        </Area>
        <Legend />
      </Chart>
    )}
  />
);

const bandLineControls: PlaygroundControl[] = [
  { group: 'Area', name: 'opacity', type: 'number', min: 0, max: 1, step: 0.1, defaultValue: 0.3 },
  { group: 'Line', name: 'line', label: 'Show', doc: 'Line', type: 'boolean', defaultValue: true },
];

/**
 * Playground for a floating area behind a line, like a forecast band.
 * @returns playground element
 */
export const AreaBandLinePlayground = () => (
  <PropPlayground
    previewSize={getAreaPreviewSize}
    controls={bandLineControls}
    render={({ opacity, line }) => (
      <Chart data={forecastData}>
        <Axis position="left" grid />
        <Axis position="bottom" labelFormat="time" granularity="week" baseline />
        <Area metricStart="low" metricEnd="high" opacity={(opacity ?? 0.3) as number} />
        {line !== false && <Line metric="visits" />}
      </Chart>
    )}
  />
);

/**
 * Renders the example for one scale type.
 * @param scaleType area scale type
 * @param padding optional area padding
 * @returns chart element
 */
const renderScaleTypeChart = (scaleType: unknown, padding?: number) => {
  if (scaleType === 'linear') {
    return (
      <Chart data={installsData}>
        <Axis position="left" grid />
        <Axis position="bottom" title="Days since launch" baseline />
        <Area dimension="day" metric="installs" color="platform" scaleType="linear" padding={padding} />
        <Legend />
      </Chart>
    );
  }
  if (scaleType === 'point') {
    return (
      <Chart data={weekdayVisitsData}>
        <Axis position="left" grid />
        <Axis position="bottom" baseline />
        <Area dimension="day" metric="visits" color="device" scaleType="point" padding={padding} />
        <Legend />
      </Chart>
    );
  }
  return (
    <Chart data={channelSessionsData}>
      <Axis position="left" grid />
      <Axis position="bottom" labelFormat="time" granularity="week" baseline />
      <Area metric="sessions" color="channel" padding={padding} />
      <Legend />
    </Chart>
  );
};

const scaleTypeControls: PlaygroundControl[] = [
  { name: 'scaleType', type: 'select', options: ['time', 'linear', 'point'], defaultValue: 'time' },
];

/**
 * Playground for time, linear, and point dimension scales.
 * @returns playground element
 */
export const AreaScaleTypePlayground = () => (
  <PropPlayground
    previewSize={getAreaPreviewSize}
    controls={scaleTypeControls}
    component="Area"
    render={({ scaleType }) => renderScaleTypeChart(scaleType)}
  />
);

const paddingControls: PlaygroundControl[] = [
  { name: 'scaleType', type: 'select', options: ['time', 'point'], defaultValue: 'point' },
  {
    name: 'pointPadding',
    label: 'padding (point)',
    doc: 'Area.padding',
    type: 'number',
    min: 0,
    max: 1,
    step: 0.1,
    defaultValue: 0.5,
    isDisabled: (values) => values.scaleType === 'time',
  },
  {
    name: 'pixelPadding',
    label: 'padding (time)',
    doc: 'Area.padding',
    type: 'number',
    min: 0,
    max: 48,
    step: 4,
    defaultValue: 0,
    isDisabled: (values) => values.scaleType !== 'time',
  },
];

/**
 * Playground for the space between the first and last points and the plot edges.
 * @returns playground element
 */
export const AreaPaddingPlayground = () => (
  <PropPlayground
    previewSize={getAreaPreviewSize}
    controls={paddingControls}
    component="Area"
    render={({ scaleType = 'point', pointPadding, pixelPadding }) =>
      renderScaleTypeChart(scaleType, (scaleType === 'time' ? pixelPadding : pointPadding) as number | undefined)
    }
  />
);

const axisControls: PlaygroundControl[] = [
  {
    group: 'Bottom axis',
    name: 'granularity',
    doc: 'Axis.granularity',
    type: 'select',
    options: ['day', 'week', 'month'],
    defaultValue: 'week',
  },
  {
    group: 'Left axis',
    name: 'numberFormat',
    doc: 'Axis.numberFormat',
    type: 'select',
    options: ['shortNumber', 'standardNumber'],
    defaultValue: 'shortNumber',
  },
  { group: 'Left axis', name: 'grid', doc: 'Axis.grid', type: 'boolean', defaultValue: true },
  { group: 'Left axis', name: 'title', doc: 'Axis.title', type: 'text', defaultValue: 'Sessions' },
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
 * Playground for Axis props with a stacked area.
 * @returns playground element
 */
export const AreaAxisPlayground = () => (
  <PropPlayground
    previewSize={getAreaPreviewSize}
    controls={axisControls}
    render={({ granularity = 'week', numberFormat, grid = true, title = 'Sessions', referenceLine, locale }) => (
      <Chart data={channelSessionsData} locale={locale as Locale | undefined}>
        <Axis position="left" grid={grid as boolean} title={optional(title)} numberFormat={numberFormat as string}>
          {referenceLine !== false && <ReferenceLine value={9000} label="Goal" />}
        </Axis>
        <Axis position="bottom" labelFormat="time" granularity={granularity as Granularity} baseline />
        <Area metric="sessions" color="channel" />
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
 * Playground for Legend props with a stacked area.
 * @returns playground element
 */
export const AreaLegendPlayground = () => (
  <PropPlayground
    previewSize={getAreaPreviewSize}
    controls={legendControls}
    component="Legend"
    render={({ position, isToggleable = true, highlight = true }) => (
      <Chart data={channelSessionsData}>
        <Axis position="left" grid />
        <Axis position="bottom" labelFormat="time" granularity="week" baseline />
        <Area metric="sessions" color="channel" />
        <Legend
          title="Channel"
          position={(position ?? 'bottom') as LegendPosition}
          isToggleable={isToggleable as boolean}
          highlight={highlight as boolean}
        />
      </Chart>
    )}
  />
);

const hiddenSeriesControls: PlaygroundControl[] = [
  {
    name: 'hiddenSeries',
    type: 'select',
    options: ['none', 'Organic search', 'Paid search, Email'],
    defaultValue: 'Organic search',
  },
];

/**
 * Playground for hiding series from outside the chart.
 * @returns playground element
 */
export const AreaHiddenSeriesPlayground = () => (
  <PropPlayground
    previewSize={getAreaPreviewSize}
    controls={hiddenSeriesControls}
    component="Chart"
    render={({ hiddenSeries = 'Organic search' }) => (
      <Chart data={channelSessionsData} hiddenSeries={toList(hiddenSeries)}>
        <Axis position="left" grid />
        <Axis position="bottom" labelFormat="time" granularity="week" baseline />
        <Area metric="sessions" color="channel" />
        <Legend />
      </Chart>
    )}
  />
);

const interactionControls: PlaygroundControl[] = [
  { group: 'ChartInspect', name: 'inspect', label: 'Show', doc: 'ChartInspect', type: 'boolean', defaultValue: true },
  {
    group: 'ChartInspect',
    name: 'highlightBy',
    doc: 'ChartInspect.highlightBy',
    type: 'select',
    options: ['item', 'series', 'dimension'],
    defaultValue: 'item',
    isDisabled: (values) => values.inspect === false,
  },
  { group: 'ChartPopover', name: 'popover', label: 'Show', doc: 'ChartPopover', type: 'boolean', defaultValue: true },
  {
    group: 'ChartPopover',
    name: 'rightClick',
    doc: 'ChartPopover.rightClick',
    type: 'boolean',
    defaultValue: false,
    isDisabled: (values) => values.popover === false,
  },
];

/**
 * Playground for Area hover and click interactions.
 * @returns playground element
 */
export const AreaInteractionPlayground = () => (
  <PropPlayground
    previewSize={getAreaPreviewSize}
    controls={interactionControls}
    render={({ inspect, highlightBy, popover, rightClick }) => (
      <Chart data={channelSessionsData}>
        <Axis position="left" grid />
        <Axis position="bottom" labelFormat="time" granularity="week" baseline />
        <Area metric="sessions" color="channel">
          {inspect !== false && (
            <ChartInspect highlightBy={highlightBy as 'series' | 'dimension' | undefined}>
              {sessionsContent}
            </ChartInspect>
          )}
          {popover !== false && (
            <ChartPopover width="auto" rightClick={rightClick as boolean | undefined}>
              {sessionsPopoverContent}
            </ChartPopover>
          )}
        </Area>
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
    options: ['none', ...channels],
    defaultValue: 'Paid search',
  },
];

/**
 * Playground for highlighting a series from outside the chart.
 * @returns playground element
 */
export const AreaHighlightPlayground = () => (
  <PropPlayground
    previewSize={getAreaPreviewSize}
    controls={highlightControls}
    render={({ highlightedSeries = 'Paid search' }) => (
      <Chart data={channelSessionsData} highlightedSeries={optional(highlightedSeries)}>
        <Axis position="left" grid />
        <Axis position="bottom" labelFormat="time" granularity="week" baseline />
        <Area metric="sessions" color="channel">
          <ChartInspect>{sessionsContent}</ChartInspect>
        </Area>
        <Legend highlight />
      </Chart>
    )}
  />
);

const weekLabels = ['none', 'Jan 13', 'Feb 10', 'Mar 10'];
const weekTimestamps: Record<string, number> = {
  'Jan 13': forecastData[1].datetime,
  'Feb 10': forecastData[5].datetime,
  'Mar 10': forecastData[9].datetime,
};

const highlightedItemControls: PlaygroundControl[] = [
  { group: 'Chart', name: 'highlightedItem', type: 'select', options: weekLabels, defaultValue: 'Feb 10' },
];

/**
 * Playground for highlighting a single row by ID.
 * @returns playground element
 */
export const AreaHighlightedItemPlayground = () => (
  <PropPlayground
    previewSize={getAreaPreviewSize}
    controls={highlightedItemControls}
    render={({ highlightedItem = 'Feb 10' }) => (
      <Chart data={forecastData} idKey="datetime" highlightedItem={weekTimestamps[String(highlightedItem)]}>
        <Axis position="left" grid />
        <Axis position="bottom" labelFormat="time" granularity="week" baseline />
        <Area metric="visits">
          <ChartInspect />
        </Area>
      </Chart>
    )}
  />
);
