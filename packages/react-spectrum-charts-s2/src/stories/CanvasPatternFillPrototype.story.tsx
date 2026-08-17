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
import React, { ReactElement, useState } from 'react';

import { StoryFn } from '@storybook/react';
import { Spec } from 'vega';

import { TABLE } from '@spectrum-charts/constants';

import { Chart } from '../Chart';
import useChartProps from '../hooks/useChartProps';
import { bindWithProps } from '../test-utils';
import { PatternFillValue, registerPatternFill } from '../utils';
import { barData } from './components/Bar/data';

const patternValue = (pattern: string): PatternFillValue => ({ pattern });

// Throwaway stories validating the canvas pattern-fill interception (planning/specs/chart/pattern-fill-rendering.json)
// against a real browser, including edge cases from the spec. Uses UNSAFE_vegaSpec since no real mark prop exists
// yet to drive this fill value through normal chart composition - delete once a real Pattern Scale prop lands.

const ResizableWrapper = ({ children }: { children: ReactElement }): ReactElement => (
  <div
    style={{
      width: 800,
      minWidth: 200,
      maxWidth: 1400,
      height: 500,
      minHeight: 200,
      maxHeight: 800,
      border: '2px solid var(--spectrum-gray-400)',
      padding: 16,
      resize: 'both',
      overflow: 'hidden',
    }}
  >
    {children}
  </div>
);

const drawStripeTile = (baseColor: string, stripeColor: string) => (ctx: CanvasRenderingContext2D, { width, height }: { width: number; height: number }) => {
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = stripeColor;
  ctx.fillRect(0, 0, width, height / 2);
};

const drawDotsTile = (baseColor: string, dotColor: string) => (ctx: CanvasRenderingContext2D, { width, height }: { width: number; height: number }) => {
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = dotColor;
  ctx.beginPath();
  ctx.arc(width / 2, height / 2, Math.min(width, height) / 4, 0, Math.PI * 2);
  ctx.fill();
};

const drawCrosshatchTile = (baseColor: string, lineColor: string) => (ctx: CanvasRenderingContext2D, { width, height }: { width: number; height: number }) => {
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(width / 2, 0);
  ctx.lineTo(width / 2, height);
  ctx.moveTo(0, height / 2);
  ctx.lineTo(width, height / 2);
  ctx.stroke();
};

const TILE_SIZE = { width: 10, height: 10 };

const candyStripeId = 'candy-stripe';
const dotsId = 'dots';
const crosshatchId = 'crosshatch';
const identityLightId = 'identity-light';
const identityDarkId = 'identity-dark';

registerPatternFill({ id: candyStripeId, tileSize: TILE_SIZE, rotation: 45, draw: drawStripeTile('#2680eb', '#ffffff') });
registerPatternFill({ id: dotsId, tileSize: TILE_SIZE, draw: drawDotsTile('#e68619', '#ffffff') });
registerPatternFill({ id: crosshatchId, tileSize: TILE_SIZE, draw: drawCrosshatchTile('#d34fa1', '#ffffff') });
// Two separate registered identities standing in for "the resolved color changed" (e.g. a colorScheme swap) -
// a real PatternScale would derive the id from the resolved color, so a change in color is naturally a new id.
registerPatternFill({ id: identityLightId, tileSize: TILE_SIZE, rotation: 45, draw: drawStripeTile('#2680eb', '#ffffff') });
registerPatternFill({ id: identityDarkId, tileSize: TILE_SIZE, rotation: 45, draw: drawStripeTile('#0b1e3d', '#5aa9ff') });

const buildBarSpec = (
  fill: Record<string, unknown>,
  options?: {
    hoverFillOpacity?: number;
    extraScales?: Record<string, unknown>[];
    extraSignals?: Record<string, unknown>[];
  }
): Spec =>
  ({
    $schema: 'https://vega.github.io/schema/vega/v5.json',
    signals: options?.extraSignals ?? [],
    scales: [
      { name: 'xscale', type: 'band', domain: { data: TABLE, field: 'browser' }, range: 'width', padding: 0.1, round: true },
      { name: 'yscale', domain: { data: TABLE, field: 'downloads' }, nice: true, range: 'height' },
      ...(options?.extraScales ?? []),
    ],
    axes: [
      { orient: 'bottom', scale: 'xscale' },
      { orient: 'left', scale: 'yscale' },
    ],
    marks: [
      {
        type: 'rect',
        from: { data: TABLE },
        encode: {
          enter: {
            x: { scale: 'xscale', field: 'browser' },
            width: { scale: 'xscale', band: 1 },
            y: { scale: 'yscale', field: 'downloads' },
            y2: { scale: 'yscale', value: 0 },
            fill,
          },
          ...(options?.hoverFillOpacity !== undefined && {
            update: { fillOpacity: { value: 1 } },
            hover: { fillOpacity: { value: options.hoverFillOpacity } },
          }),
        },
      },
    ],
  }) as unknown as Spec;

// Dodged by region (like DodgedStacked's operatingSystem), stacked by period within each region's bar (like
// DodgedStacked's version) - previous period segment candy-striped, current period segment solid.
const dodgedStackedPeriodData = barData.flatMap(({ browser, downloads }) =>
  (['East', 'West'] as const).flatMap((region, i) => {
    const current = Math.round(downloads * (i === 0 ? 0.6 : 0.4));
    const previous = Math.round(current * 0.8);
    return [
      { browser, region, period: 'Previous', value: previous },
      { browser, region, period: 'Current', value: current },
    ];
  })
);

const dodgedStackedPeriodChartData = [
  { name: TABLE, values: dodgedStackedPeriodData },
  {
    name: 'stacked',
    source: TABLE,
    transform: [{ type: 'stack', groupby: ['browser', 'region'], sort: { field: 'period', order: 'descending' }, field: 'value' }],
  },
];

// Vega's canonical grouped-bar shape: an outer xscale (browser) facets into per-browser groups, each with its
// own inner xsubscale (region) sized from the outer band's width - the rects inside stack by period via the
// stack transform's y0/y1, with fill resolved from a real ordinal scale so the legend generates natively.
const dodgedStackedPeriodSpec: Spec = {
  $schema: 'https://vega.github.io/schema/vega/v5.json',
  // Vega's scale-range parser rejects literal objects in a `range: [...]` array (the same restriction that
  // applies to Gradient objects) - the structured pattern-fill value is carried through a signal instead.
  signals: [{ name: 'periodPatternRange', value: [patternValue(candyStripeId), '#2680eb'] }],
  scales: [
    { name: 'xscale', type: 'band', range: 'width', domain: { data: TABLE, field: 'browser' } },
    { name: 'yscale', domain: { data: 'stacked', field: 'y1' }, nice: true, zero: true, range: 'height' },
    {
      name: 'periodScale',
      type: 'ordinal',
      domain: ['Previous', 'Current'],
      range: { signal: 'periodPatternRange' },
    },
  ],
  axes: [
    { orient: 'bottom', scale: 'xscale' },
    { orient: 'left', scale: 'yscale' },
  ],
  legends: [{ fill: 'periodScale', title: 'Period', symbolType: 'square' }],
  marks: [
    {
      type: 'group',
      from: { facet: { data: 'stacked', name: 'facetedBrowser', groupby: 'browser' } },
      encode: { enter: { x: { scale: 'xscale', field: 'browser' } } },
      signals: [{ name: 'width', update: "bandwidth('xscale')" }],
      scales: [
        {
          name: 'xsubscale',
          type: 'band',
          range: 'width',
          domain: { data: 'facetedBrowser', field: 'region' },
          paddingInner: 0.1,
        },
      ],
      marks: [
        {
          type: 'rect',
          from: { data: 'facetedBrowser' },
          encode: {
            enter: {
              x: { scale: 'xsubscale', field: 'region' },
              width: { scale: 'xsubscale', band: 1 },
              y: { scale: 'yscale', field: 'y0' },
              y2: { scale: 'yscale', field: 'y1' },
              fill: { scale: 'periodScale', field: 'period' },
            },
          },
        },
      ],
    },
  ],
} as unknown as Spec;

export default {
  title: 'RSC/Chart/CanvasPatternFillPrototype',
  component: Chart,
};

const CanvasPatternFillStory: StoryFn<typeof Chart> = (args): ReactElement => {
  const chartProps = useChartProps(args);
  return (
    <ResizableWrapper>
      <Chart {...chartProps} />
    </ResizableWrapper>
  );
};

const baseArgs = {
  data: barData,
  width: 'auto',
  height: '100%',
  renderer: 'canvas' as const,
};

const CandyStripeBar = bindWithProps(CanvasPatternFillStory);
CandyStripeBar.args = {
  ...baseArgs,
  description: 'A bar chart with a candy-stripe canvas pattern fill instead of a solid color.',
  UNSAFE_vegaSpec: buildBarSpec({ value: patternValue(candyStripeId) }),
};

// Modeled on Bar/Features/Dodged Bar's DodgedStacked story (dodge by region, stack by period instead of
// operatingSystem/version): previous period segment candy-striped, current period segment solid, with a real
// legend (from periodScale) labeling "Previous"/"Current".
const DodgedStackedPeriodComparison = bindWithProps(CanvasPatternFillStory);
DodgedStackedPeriodComparison.args = {
  ...baseArgs,
  data: dodgedStackedPeriodChartData,
  description: 'Dodged by region, stacked by period - previous candy-striped, current solid, with a legend.',
  UNSAFE_vegaSpec: dodgedStackedPeriodSpec,
};

// Edge case: many marks resolving to only a few distinct pattern identities, via an ordinal scale (the direction
// pattern fills are headed - see project memory). Chrome/Edge share the stripe id, Firefox/Explorer share dots,
// exercising both distinct-identity rendering and per-identity cache reuse in one chart.
const MultiplePatternsScale = bindWithProps(CanvasPatternFillStory);
MultiplePatternsScale.args = {
  ...baseArgs,
  description: 'Multiple distinct pattern identities on one chart, resolved via an ordinal scale like color.',
  UNSAFE_vegaSpec: buildBarSpec(
    { scale: 'patternScale', field: 'browser' },
    {
      // Vega's scale-range parser rejects literal objects in a `range: [...]` array (the same restriction
      // that applies to Gradient objects) - the structured pattern-fill values are carried through a signal.
      extraSignals: [
        {
          name: 'patternScaleRange',
          value: [
            patternValue(candyStripeId),
            patternValue(dotsId),
            patternValue(crosshatchId),
            patternValue(candyStripeId),
            patternValue(dotsId),
          ],
        },
      ],
      extraScales: [
        {
          name: 'patternScale',
          type: 'ordinal',
          domain: { data: TABLE, field: 'browser' },
          range: { signal: 'patternScaleRange' },
        },
      ],
    }
  ),
};

// Edge case: opacity/highlight compositing over a pattern fill (hover in this raw spec stands in for the
// legend/controlled-highlight case, which all drive opacity the same way). Hovering a bar should dim it
// without the pattern disappearing or rendering incorrectly.
const HoverOpacityCompositing = bindWithProps(CanvasPatternFillStory);
HoverOpacityCompositing.args = {
  ...baseArgs,
  description: 'Hovering a bar dims it via fillOpacity - the pattern should stay visible underneath, just dimmer.',
  UNSAFE_vegaSpec: buildBarSpec({ value: patternValue(candyStripeId) }, { hoverFillOpacity: 0.3 }),
};

// Edge case: a changed resolved color/identity must produce a visually distinct pattern rather than reusing a
// stale cached one. Compare these two stories side by side - each renders once, but both share the same
// underlying mechanism, so an implementation that ignored identity would render them the same.
const PatternIdentityLight = bindWithProps(CanvasPatternFillStory);
PatternIdentityLight.args = {
  ...baseArgs,
  description: 'Resolved identity "light" - compare against PatternIdentityDark.',
  UNSAFE_vegaSpec: buildBarSpec({ value: patternValue(identityLightId) }),
};

const PatternIdentityDark = bindWithProps(CanvasPatternFillStory);
PatternIdentityDark.args = {
  ...baseArgs,
  description: 'Resolved identity "dark" - compare against PatternIdentityLight.',
  UNSAFE_vegaSpec: buildBarSpec({ value: patternValue(identityDarkId) }),
};

// Edge case: the view is destroyed and recreated (a new canvas element). Forces a full unmount/remount via a
// React key, verifying the interception re-engages cleanly on the fresh canvas with no stale/leaked state.
const RemountStress = (): ReactElement => {
  const [remountKey, setRemountKey] = useState(0);
  const chartProps = useChartProps({
    ...baseArgs,
    UNSAFE_vegaSpec: buildBarSpec({ value: patternValue(candyStripeId) }),
  });
  return (
    <div>
      <button onClick={() => setRemountKey((key) => key + 1)}>Remount chart</button>
      <ResizableWrapper>
        <Chart key={remountKey} {...chartProps} />
      </ResizableWrapper>
    </div>
  );
};

export {
  CandyStripeBar,
  DodgedStackedPeriodComparison,
  MultiplePatternsScale,
  HoverOpacityCompositing,
  PatternIdentityLight,
  PatternIdentityDark,
  RemountStress,
};
