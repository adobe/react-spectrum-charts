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
import React, { Children, ReactElement, ReactNode, isValidElement } from 'react';

import { ChartInspect, Title } from '@spectrum-charts/react-spectrum-charts-s2';
import { Bullet } from '@spectrum-charts/react-spectrum-charts-s2/lab';

import { DocsChart as Chart } from '../components/examples/DocsChart';
import { PlaygroundControl, PreviewSize, PropPlayground } from '../components/examples/PropPlayground';
import {
  bulletRevenueData,
  bulletScoreData,
  bulletScoreThresholds,
  bulletStorageData,
  emptyData,
} from '../components/examples/data';
import { withSource } from '../components/examples/elementToJsx';

// Bullet has no dev dashboard: every example is 480px wide and exactly as tall as its bullets.
const PREVIEW_WIDTH = 480;
const BAND_HEIGHT = 24;
const TOP_LABEL_HEIGHT = 24;
const SIDE_LABEL_HEIGHT = 10;
const TARGET_VALUE_HEIGHT = 20;
const ROW_GAP = 12;
// Room for the metric axis labels below the last bullet.
const METRIC_AXIS_HEIGHT = 24;
// Room for the corner radius and target line stroke at the bottom of the last bullet.
const EDGE = 4;
const TITLE_HEIGHT = 32;
// Empty and loading states get the height of three bullets.
const MIN_ROWS = 3;

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

/**
 * Sizes a bullet example to the height of its bullets, leaving room for the metric axis and title.
 * @param element chart element
 * @returns preview width and height
 */
const getBulletPreviewSize = (element: ReactElement): PreviewSize => {
  const { children, data } = element.props as { children?: ReactNode; data?: unknown[] };
  const props = findElement(children, 'Bullet')?.props ?? {};
  const rows = Math.max(data?.length ?? 0, MIN_ROWS);
  const isRow = props.direction === 'row';
  const showTargetValue = props.showTarget !== false && Boolean(props.showTargetValue);
  const labelHeight = props.labelPosition === 'side' && !isRow ? SIDE_LABEL_HEIGHT : TOP_LABEL_HEIGHT;
  const bulletHeight = BAND_HEIGHT + labelHeight + (showTargetValue ? TARGET_VALUE_HEIGHT : 0);
  let height = isRow ? bulletHeight : rows * bulletHeight + (rows - 1) * ROW_GAP;
  if (props.metricAxis && !isRow && !showTargetValue) height += METRIC_AXIS_HEIGHT;
  height += EDGE + (findElement(children, 'Title') ? TITLE_HEIGHT : 0);
  return { width: PREVIEW_WIDTH, height };
};

type Locale = 'en-US' | 'de-DE' | 'fr-FR';
type Direction = 'row' | 'column';
type LabelPosition = 'side' | 'top';
type ScaleType = 'normal' | 'fixed' | 'flexible';

/** Converts a "none" select value to undefined. */
const optional = (value: unknown) => (!value || value === 'none' ? undefined : String(value));

const bulletControls: PlaygroundControl[] = [
  { group: 'Bullet', name: 'direction', type: 'select', options: ['column', 'row'], defaultValue: 'column' },
  {
    group: 'Bullet',
    name: 'labelPosition',
    type: 'select',
    options: ['top', 'side'],
    defaultValue: 'top',
    isDisabled: (values) => values.direction === 'row',
  },
  {
    group: 'Bullet',
    name: 'color',
    type: 'select',
    options: ['blue-900', 'purple-900', 'green-900'],
    defaultValue: 'blue-900',
  },
  { group: 'Bullet', name: 'showTargetValue', type: 'boolean', defaultValue: false },
  { group: 'Bullet', name: 'track', type: 'boolean', defaultValue: true },
  {
    group: 'Title',
    name: 'title',
    label: 'Text',
    doc: 'Title.text',
    type: 'text',
    defaultValue: 'Customer health',
  },
];

/**
 * Playground for the top-level Bullet props and a title.
 * @returns playground element
 */
export const BulletPlayground = () => (
  <PropPlayground
    previewSize={getBulletPreviewSize}
    controls={bulletControls}
    render={({ direction, labelPosition, color, showTargetValue, track = true, title = 'Customer health' }) => (
      <Chart data={bulletScoreData}>
        {optional(title) && <Title text={String(title)} />}
        <Bullet
          metric="score"
          dimension="kpi"
          target="goal"
          direction={direction as Direction | undefined}
          labelPosition={direction === 'row' ? undefined : (labelPosition as LabelPosition | undefined)}
          color={color as string | undefined}
          showTargetValue={showTargetValue as boolean | undefined}
          track={track as boolean | undefined}
        />
      </Chart>
    )}
  />
);

const statesControls: PlaygroundControl[] = [
  { name: 'state', type: 'select', options: ['empty', 'loading'], defaultValue: 'empty' },
  {
    name: 'emptyStateText',
    type: 'text',
    defaultValue: 'No KPI data',
    isDisabled: (values) => values.state !== 'empty',
  },
];

/**
 * Playground for empty and loading bullets.
 * @returns playground element
 */
export const BulletStatesPlayground = () => (
  <PropPlayground
    previewSize={getBulletPreviewSize}
    controls={statesControls}
    component="Chart"
    render={({ state = 'empty', emptyStateText }) => (
      <Chart
        data={state === 'empty' ? emptyData : bulletScoreData}
        loading={state === 'loading' ? true : undefined}
        emptyStateText={state === 'empty' ? String(emptyStateText ?? 'No KPI data') : undefined}
      >
        <Bullet track metric="score" dimension="kpi" target="goal" />
      </Chart>
    )}
  />
);

const layoutControls: PlaygroundControl[] = [
  { name: 'direction', type: 'select', options: ['column', 'row'], defaultValue: 'column' },
  {
    name: 'labelPosition',
    type: 'select',
    options: ['top', 'side'],
    defaultValue: 'side',
    isDisabled: (values) => values.direction === 'row',
  },
];

/**
 * Playground for bullet direction and label position.
 * @returns playground element
 */
export const BulletLayoutPlayground = () => (
  <PropPlayground
    previewSize={getBulletPreviewSize}
    controls={layoutControls}
    component="Bullet"
    render={({ direction, labelPosition = 'side' }) => {
      const isRow = direction === 'row';
      return (
        <Chart data={bulletScoreData}>
          <Bullet
            track
            metric="score"
            dimension="kpi"
            target="goal"
            direction={direction as Direction | undefined}
            labelPosition={isRow || labelPosition === 'top' ? undefined : (labelPosition as LabelPosition)}
          />
        </Chart>
      );
    }}
  />
);

const targetControls: PlaygroundControl[] = [
  { name: 'showTarget', type: 'boolean', defaultValue: true },
  {
    name: 'showTargetValue',
    type: 'boolean',
    defaultValue: true,
    isDisabled: (values) => !values.showTarget,
  },
];

/**
 * Playground for the target line and its value label.
 * @returns playground element
 */
export const BulletTargetPlayground = () => (
  <PropPlayground
    previewSize={getBulletPreviewSize}
    controls={targetControls}
    component="Bullet"
    render={({ showTarget, showTargetValue = true }) => (
      <Chart data={bulletScoreData}>
        <Bullet
          track
          metric="score"
          dimension="kpi"
          target="goal"
          showTarget={showTarget as boolean | undefined}
          showTargetValue={showTarget === false ? undefined : (showTargetValue as boolean) || undefined}
        />
      </Chart>
    )}
  />
);

const scaleControls: PlaygroundControl[] = [
  { name: 'scaleType', type: 'select', options: ['normal', 'fixed', 'flexible'], defaultValue: 'fixed' },
  {
    name: 'maxScaleValue',
    type: 'number',
    min: 50,
    max: 150,
    step: 10,
    defaultValue: 100,
    isDisabled: (values) => values.scaleType === 'normal',
  },
  { name: 'metricAxis', type: 'boolean', defaultValue: true },
];

/**
 * Playground for the shared scale and metric axis.
 * @returns playground element
 */
export const BulletScalePlayground = () => (
  <PropPlayground
    previewSize={getBulletPreviewSize}
    controls={scaleControls}
    component="Bullet"
    render={({ scaleType = 'fixed', maxScaleValue, metricAxis = true }) => (
      <Chart data={bulletScoreData}>
        <Bullet
          track
          metric="score"
          dimension="kpi"
          target="goal"
          scaleType={scaleType === 'normal' ? undefined : (scaleType as ScaleType)}
          maxScaleValue={scaleType === 'normal' ? undefined : (maxScaleValue as number | undefined)}
          metricAxis={(metricAxis as boolean) || undefined}
        />
      </Chart>
    )}
  />
);

const thresholdControls: PlaygroundControl[] = [
  { name: 'thresholds', label: 'Show thresholds', type: 'boolean', defaultValue: true },
  {
    name: 'thresholdBarColor',
    type: 'boolean',
    defaultValue: false,
    isDisabled: (values) => !values.thresholds,
  },
  { name: 'track', type: 'boolean', defaultValue: true, isDisabled: (values) => Boolean(values.thresholds) },
];

/**
 * Playground for threshold bands, threshold bar colors, and the track.
 * @returns playground element
 */
export const BulletThresholdsPlayground = () => (
  <PropPlayground
    previewSize={getBulletPreviewSize}
    controls={thresholdControls}
    component="Bullet"
    render={({ thresholds = true, thresholdBarColor, track = true }) => (
      <Chart data={bulletScoreData}>
        <Bullet
          metric="score"
          dimension="kpi"
          target="goal"
          thresholds={thresholds ? bulletScoreThresholds : undefined}
          thresholdBarColor={thresholds ? (thresholdBarColor as boolean | undefined) : undefined}
          track={thresholds ? undefined : (track as boolean | undefined)}
        />
      </Chart>
    )}
  />
);

const numberFormatControls: PlaygroundControl[] = [
  {
    name: 'numberFormat',
    type: 'select',
    options: ['standardNumber', 'shortNumber', 'shortCurrency', 'currency', '$,.0f'],
    defaultValue: 'shortCurrency',
  },
  { group: 'Chart', name: 'locale', type: 'select', options: ['en-US', 'de-DE', 'fr-FR'], defaultValue: 'en-US' },
];

/**
 * Playground for number formats and locales.
 * @returns playground element
 */
export const BulletNumberFormatPlayground = () => (
  <PropPlayground
    previewSize={getBulletPreviewSize}
    controls={numberFormatControls}
    component="Bullet"
    render={({ numberFormat = 'shortCurrency', locale }) => (
      <Chart data={bulletRevenueData} locale={locale as Locale | undefined}>
        <Bullet
          track
          metric="revenue"
          dimension="region"
          target="target"
          numberFormat={numberFormat === 'standardNumber' ? undefined : String(numberFormat)}
          showTargetValue
        />
      </Chart>
    )}
  />
);

const customLabelControls: PlaygroundControl[] = [
  { name: 'metricLabel', type: 'select', options: ['none', 'usedLabel'], defaultValue: 'usedLabel' },
  { name: 'targetLabel', type: 'select', options: ['none', 'quotaLabel'], defaultValue: 'quotaLabel' },
];

/**
 * Playground for preformatted value and target labels.
 * @returns playground element
 */
export const BulletCustomLabelPlayground = () => (
  <PropPlayground
    previewSize={getBulletPreviewSize}
    controls={customLabelControls}
    component="Bullet"
    render={({ metricLabel = 'usedLabel', targetLabel = 'quotaLabel' }) => (
      <Chart data={bulletStorageData}>
        <Bullet
          track
          metric="used"
          dimension="volume"
          target="quota"
          metricLabel={optional(metricLabel)}
          targetLabel={optional(targetLabel)}
          showTargetValue
        />
      </Chart>
    )}
  />
);

const inspectContent = withSource(
  (datum: Record<string, unknown>) => (
    <div>
      {String(datum.kpi)}: {String(datum.score)} (goal {String(datum.goal)})
    </div>
  ),
  '(datum) => (\n  <div>\n    {datum.kpi}: {datum.score} (goal {datum.goal})\n  </div>\n)'
);

const inspectControls: PlaygroundControl[] = [
  { group: 'ChartInspect', name: 'inspect', label: 'Show', doc: 'ChartInspect', type: 'boolean', defaultValue: true },
  { group: 'Bullet', name: 'track', type: 'boolean', defaultValue: true },
];

/**
 * Playground for Bullet hover details.
 * @returns playground element
 */
export const BulletInspectPlayground = () => (
  <PropPlayground
    previewSize={getBulletPreviewSize}
    controls={inspectControls}
    render={({ inspect, track = true }) => (
      <Chart data={bulletScoreData}>
        <Bullet metric="score" dimension="kpi" target="goal" track={(track as boolean) || undefined}>
          {inspect !== false && <ChartInspect>{inspectContent}</ChartInspect>}
        </Bullet>
      </Chart>
    )}
  />
);
