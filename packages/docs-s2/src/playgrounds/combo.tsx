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

import { Axis, Bar, ChartInspect, ChartPopover, Legend, Line, Title } from '@spectrum-charts/react-spectrum-charts-s2';
import { Combo } from '@spectrum-charts/react-spectrum-charts-s2/lab';

import { DocsChart as Chart } from '../components/examples/DocsChart';
import { PlaygroundControl, PreviewSize, PropPlayground } from '../components/examples/PropPlayground';
import { comboDeviceData, comboTrafficData, emptyData } from '../components/examples/data';
import { withSource } from '../components/examples/elementToJsx';

// Every example aims for a 480 × 288 plot, capped so the whole chart fits the preview.
const PLOT_WIDTH = 480;
const MAX_PREVIEW_WIDTH = 512;
const PLOT_HEIGHT = 288;
const LEFT_AXIS_WIDTH = 40;
const RIGHT_AXIS_WIDTH = 40;
const AXIS_TITLE_WIDTH = 24;
// Room for day labels plus the month sub-label.
const BOTTOM_AXIS_HEIGHT = 44;
const SIDE_LEGEND_WIDTH = 104;
const BOTTOM_LEGEND_HEIGHT = 40;
const TITLE_HEIGHT = 34;

const findElement = (node: ReactNode, name: string): ReactElement<Record<string, unknown>> | undefined => {
  for (const child of Children.toArray(node)) {
    if (!isValidElement(child)) continue;
    const element = child as ReactElement<Record<string, unknown>>;
    const type = element.type as { displayName?: string; name?: string };
    if ((type.displayName ?? type.name) === name) return element;
    const match = findElement(element.props.children as ReactNode, name);
    if (match) return match;
  }
  return undefined;
};

const findAxis = (node: ReactNode, position: string): ReactElement<Record<string, unknown>> | undefined =>
  Children.toArray(node).find(
    (child) =>
      isValidElement(child) &&
      (child.type as { displayName?: string }).displayName === 'Axis' &&
      (child.props as { position?: string }).position === position
  ) as ReactElement<Record<string, unknown>> | undefined;

/**
 * Sizes a combo example around a 480 × 288 plot, leaving room for axes, legend, and title.
 * @param element chart element
 * @returns preview width and height
 */
const getComboPreviewSize = (element: ReactElement): PreviewSize => {
  const children = (element.props as { children?: ReactNode }).children;
  const getAxisWidth = (position: string) => {
    const axis = findAxis(children, position);
    if (!axis) return 0;
    return (position === 'left' ? LEFT_AXIS_WIDTH : RIGHT_AXIS_WIDTH) + (axis.props.title ? AXIS_TITLE_WIDTH : 0);
  };
  const legend = findElement(children, 'Legend');
  const legendPosition = (legend?.props.position as string | undefined) ?? 'bottom';
  const isSideLegend = Boolean(legend) && ['left', 'right'].includes(legendPosition);
  const hasTitle = Boolean(findElement(children, 'Title'));
  return {
    width: Math.min(
      PLOT_WIDTH + getAxisWidth('left') + getAxisWidth('right') + (isSideLegend ? SIDE_LEGEND_WIDTH : 0),
      MAX_PREVIEW_WIDTH
    ),
    height:
      PLOT_HEIGHT +
      (findAxis(children, 'bottom') ? BOTTOM_AXIS_HEIGHT : 0) +
      (legend && !isSideLegend ? BOTTOM_LEGEND_HEIGHT : 0) +
      (hasTitle ? TITLE_HEIGHT : 0),
  };
};

type Locale = 'en-US' | 'de-DE' | 'fr-FR';
type LegendPosition = 'right' | 'bottom' | 'left' | 'top';
type ScaleType = 'point' | 'time';

const devices = ['Desktop', 'Mobile', 'Tablet'];

/** Converts a "none" select value to undefined. */
const optional = (value: unknown) => (!value || value === 'none' ? undefined : String(value));

/** Splits a comma-separated select value into a list. */
const toList = (value: unknown) => optional(value)?.split(', ');

const comboControls: PlaygroundControl[] = [
  {
    group: 'Line',
    name: 'ownAxis',
    label: 'Own axis',
    doc: 'Line.metricAxis',
    type: 'boolean',
    defaultValue: true,
  },
  {
    group: 'Line',
    name: 'scaleType',
    doc: 'Line.scaleType',
    type: 'select',
    options: ['point', 'time'],
    defaultValue: 'point',
  },
  { group: 'Title', name: 'title', label: 'Text', doc: 'Title.text', type: 'text', defaultValue: 'Sessions and conversion' },
];

/**
 * Playground for a bar and line combo with a second axis.
 * @returns playground element
 */
export const ComboPlayground = () => (
  <PropPlayground
    previewSize={getComboPreviewSize}
    controls={comboControls}
    render={({ ownAxis = true, scaleType = 'point', title = 'Sessions and conversion' }) => (
      <Chart data={comboTrafficData}>
        {optional(title) && <Title text={String(title)} />}
        <Axis position="left" title="Sessions" grid />
        {ownAxis !== false && <Axis position="right" name="rate" title="Conversion rate" numberFormat=".1%" />}
        <Axis position="bottom" labelFormat="time" baseline ticks />
        <Combo>
          <Bar metric="sessions" />
          <Line
            metric="conversionRate"
            metricAxis={ownAxis !== false ? 'rate' : undefined}
            color={{ value: 'categorical-200' }}
            scaleType={scaleType as ScaleType}
          />
        </Combo>
      </Chart>
    )}
  />
);

const axesControls: PlaygroundControl[] = [
  {
    group: 'Line',
    name: 'metric',
    doc: 'Line.metric',
    type: 'select',
    options: ['orders', 'conversionRate'],
    defaultValue: 'orders',
  },
  {
    group: 'Line',
    name: 'metricAxis',
    doc: 'Line.metricAxis',
    type: 'select',
    options: ['none', 'secondary'],
    defaultValue: 'secondary',
  },
];

/**
 * Playground for plotting the line on the shared axis or on its own axis.
 * @returns playground element
 */
export const ComboAxesPlayground = () => (
  <PropPlayground
    previewSize={getComboPreviewSize}
    controls={axesControls}
    component="Line"
    render={({ metric = 'orders', metricAxis = 'secondary' }) => {
      const metricAxisName = optional(metricAxis);
      const isRate = metric === 'conversionRate';
      return (
        <Chart data={comboTrafficData}>
          <Axis position="left" grid />
          {metricAxisName && (
            <Axis position="right" name={metricAxisName} numberFormat={isRate ? '.1%' : undefined} />
          )}
          <Axis position="bottom" labelFormat="time" baseline ticks />
          <Combo>
            <Bar metric="sessions" />
            <Line
              metric={String(metric)}
              metricAxis={metricAxisName}
              color={{ value: 'categorical-200' }}
              scaleType="point"
            />
          </Combo>
        </Chart>
      );
    }}
  />
);

const childControls: PlaygroundControl[] = [
  { group: 'Bar', name: 'type', doc: 'Bar.type', type: 'select', options: ['stacked', 'dodged'], defaultValue: 'stacked' },
  {
    group: 'Line',
    name: 'scaleType',
    doc: 'Line.scaleType',
    type: 'select',
    options: ['point', 'time'],
    defaultValue: 'point',
  },
];

/**
 * Playground for Bar and Line props inside a combo, with one series per device.
 * @returns playground element
 */
export const ComboChildrenPlayground = () => (
  <PropPlayground
    previewSize={getComboPreviewSize}
    controls={childControls}
    render={({ type = 'stacked', scaleType = 'point' }) => (
      <Chart data={comboDeviceData}>
        <Axis position="left" grid />
        <Axis position="right" name="rate" numberFormat=".1%" />
        <Axis position="bottom" labelFormat="time" baseline ticks />
        <Combo>
          <Bar metric="sessions" color="device" type={type as 'stacked' | 'dodged'} />
          <Line
            metric="conversionRate"
            metricAxis="rate"
            color="device"
            scaleType={scaleType as ScaleType}
          />
        </Combo>
        <Legend />
      </Chart>
    )}
  />
);

const legendControls: PlaygroundControl[] = [
  { name: 'position', type: 'select', options: ['bottom', 'right', 'left', 'top'], defaultValue: 'bottom' },
  { name: 'isToggleable', type: 'boolean', defaultValue: true },
  { name: 'highlight', type: 'boolean', defaultValue: true },
];

/**
 * Playground for Legend props with a combo.
 * @returns playground element
 */
export const ComboLegendPlayground = () => (
  <PropPlayground
    previewSize={getComboPreviewSize}
    controls={legendControls}
    component="Legend"
    render={({ position, isToggleable = true, highlight = true }) => (
      <Chart data={comboDeviceData}>
        <Axis position="left" grid />
        <Axis position="right" name="rate" numberFormat=".1%" />
        <Axis position="bottom" labelFormat="time" baseline ticks />
        <Combo>
          <Bar metric="sessions" color="device" />
          <Line metric="conversionRate" metricAxis="rate" color="device" scaleType="point" />
        </Combo>
        <Legend
          position={(position ?? 'bottom') as LegendPosition}
          isToggleable={isToggleable as boolean}
          highlight={highlight as boolean}
        />
      </Chart>
    )}
  />
);

const hiddenSeriesControls: PlaygroundControl[] = [
  { name: 'hiddenSeries', type: 'select', options: ['none', 'Desktop', 'Desktop, Tablet'], defaultValue: 'Desktop' },
];

/**
 * Playground for hiding series from outside the chart.
 * @returns playground element
 */
export const ComboHiddenSeriesPlayground = () => (
  <PropPlayground
    previewSize={getComboPreviewSize}
    controls={hiddenSeriesControls}
    component="Chart"
    render={({ hiddenSeries = 'Desktop' }) => (
      <Chart data={comboDeviceData} hiddenSeries={toList(hiddenSeries)}>
        <Axis position="left" grid />
        <Axis position="right" name="rate" numberFormat=".1%" />
        <Axis position="bottom" labelFormat="time" baseline ticks />
        <Combo>
          <Bar metric="sessions" color="device" />
          <Line metric="conversionRate" metricAxis="rate" color="device" scaleType="point" />
        </Combo>
        <Legend />
      </Chart>
    )}
  />
);

const highlightControls: PlaygroundControl[] = [
  { name: 'highlightedSeries', type: 'select', options: ['none', ...devices], defaultValue: 'Mobile' },
];

/**
 * Playground for controlled series highlighting from outside the chart.
 * @returns playground element
 */
export const ComboHighlightPlayground = () => (
  <PropPlayground
    previewSize={getComboPreviewSize}
    controls={highlightControls}
    component="Chart"
    render={({ highlightedSeries = 'Mobile' }) => (
      <Chart data={comboDeviceData} highlightedSeries={optional(highlightedSeries)}>
        <Axis position="left" grid />
        <Axis position="right" name="rate" numberFormat=".1%" />
        <Axis position="bottom" labelFormat="time" baseline ticks />
        <Combo>
          <Bar metric="sessions" color="device" />
          <Line metric="conversionRate" metricAxis="rate" color="device" scaleType="point" />
        </Combo>
        <Legend />
      </Chart>
    )}
  />
);

const barContent = withSource(
  (datum: Record<string, unknown>) => (
    <>
      <Heading level={4}>Sessions</Heading>
      <Content>
        <Text>{Number(datum.sessions).toLocaleString()}</Text>
      </Content>
    </>
  ),
  '(datum) => (\n  <>\n    <Heading level={4}>Sessions</Heading>\n    <Content>\n      <Text>{datum.sessions.toLocaleString()}</Text>\n    </Content>\n  </>\n)',
  { '@react-spectrum/s2': ['Content', 'Heading', 'Text'] }
);

const lineContent = withSource(
  (datum: Record<string, unknown>) => (
    <>
      <Heading level={4}>Conversion rate</Heading>
      <Content>
        <Text>{(Number(datum.conversionRate) * 100).toFixed(1)}%</Text>
      </Content>
    </>
  ),
  '(datum) => (\n  <>\n    <Heading level={4}>Conversion rate</Heading>\n    <Content>\n      <Text>{(datum.conversionRate * 100).toFixed(1)}%</Text>\n    </Content>\n  </>\n)',
  { '@react-spectrum/s2': ['Content', 'Heading', 'Text'] }
);

const interactionControls: PlaygroundControl[] = [
  { group: 'ChartInspect', name: 'inspect', label: 'Show', doc: 'ChartInspect', type: 'boolean', defaultValue: true },
  { group: 'ChartPopover', name: 'popover', label: 'Show', doc: 'ChartPopover', type: 'boolean', defaultValue: true },
  {
    group: 'ChartPopover',
    name: 'content',
    doc: 'ChartPopover.children',
    type: 'select',
    options: ['default', 'custom'],
    defaultValue: 'custom',
  },
  { group: 'ChartPopover', name: 'rightClick', type: 'boolean', defaultValue: false },
];

/**
 * Playground for hover and click interactions on both combo marks.
 * @returns playground element
 */
export const ComboInteractionPlayground = () => (
  <PropPlayground
    previewSize={getComboPreviewSize}
    controls={interactionControls}
    render={({ inspect, popover, content = 'custom', rightClick }) => {
      const isCustom = content === 'custom';
      return (
        <Chart data={comboTrafficData}>
          <Axis position="left" title="Sessions" grid />
          <Axis position="right" name="rate" title="Conversion rate" numberFormat=".1%" />
          <Axis position="bottom" labelFormat="time" baseline ticks />
          <Combo>
            <Bar metric="sessions">
              {inspect !== false && <ChartInspect />}
              {popover !== false && (
                <ChartPopover width="auto" rightClick={rightClick as boolean | undefined}>
                  {isCustom ? barContent : undefined}
                </ChartPopover>
              )}
            </Bar>
            <Line metric="conversionRate" metricAxis="rate" color={{ value: 'categorical-200' }} scaleType="point">
              {inspect !== false && <ChartInspect />}
              {popover !== false && (
                <ChartPopover width="auto" rightClick={rightClick as boolean | undefined}>
                  {isCustom ? lineContent : undefined}
                </ChartPopover>
              )}
            </Line>
          </Combo>
        </Chart>
      );
    }}
  />
);

const localeControls: PlaygroundControl[] = [
  { group: 'Chart', name: 'locale', type: 'select', options: ['en-US', 'de-DE', 'fr-FR'], defaultValue: 'de-DE' },
  {
    group: 'Axis',
    name: 'numberFormat',
    label: 'Left numberFormat',
    doc: 'Axis.numberFormat',
    type: 'select',
    options: ['shortNumber', 'standardNumber'],
    defaultValue: 'standardNumber',
  },
];

/**
 * Playground for locale-aware axis labels in a combo.
 * @returns playground element
 */
export const ComboLocalePlayground = () => (
  <PropPlayground
    previewSize={getComboPreviewSize}
    controls={localeControls}
    render={({ locale = 'de-DE', numberFormat = 'standardNumber' }) => (
      <Chart data={comboTrafficData} locale={locale as Locale}>
        <Axis position="left" numberFormat={String(numberFormat)} grid />
        <Axis position="right" name="rate" numberFormat=".1%" />
        <Axis position="bottom" labelFormat="time" baseline ticks />
        <Combo>
          <Bar metric="sessions" />
          <Line metric="conversionRate" metricAxis="rate" color={{ value: 'categorical-200' }} scaleType="point" />
        </Combo>
      </Chart>
    )}
  />
);

const statesControls: PlaygroundControl[] = [
  { name: 'state', type: 'select', options: ['empty', 'loading'], defaultValue: 'empty' },
  {
    name: 'emptyStateText',
    type: 'text',
    defaultValue: 'No traffic data',
    isDisabled: (values) => values.state === 'loading',
  },
];

/**
 * Playground for empty and loading combos.
 * @returns playground element
 */
export const ComboStatesPlayground = () => (
  <PropPlayground
    previewSize={getComboPreviewSize}
    controls={statesControls}
    component="Chart"
    render={({ state = 'empty', emptyStateText }) => {
      const isLoading = state === 'loading';
      return (
        <Chart
          data={isLoading ? comboTrafficData : emptyData}
          loading={isLoading ? true : undefined}
          emptyStateText={isLoading ? undefined : String(emptyStateText ?? 'No traffic data')}
        >
          <Axis position="left" grid />
          <Axis position="right" name="rate" numberFormat=".1%" />
          <Axis position="bottom" labelFormat="time" baseline ticks />
          <Combo>
            <Bar metric="sessions" />
            <Line metric="conversionRate" metricAxis="rate" color={{ value: 'categorical-200' }} scaleType="point" />
          </Combo>
        </Chart>
      );
    }}
  />
);
