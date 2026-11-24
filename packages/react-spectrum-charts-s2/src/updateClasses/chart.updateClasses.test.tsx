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
import { Spec } from 'vega';

import { Chart } from '../Chart.js';
import { Axis, Bar, Legend, Line } from '../components/index.js';
import { Scatter } from '../lab/index.js';
import { UpdateCases, describeUpdateClasses, noopCallback, updateCaseData, withDrawIn } from '../test-utils/index.js';
import { ChartProps } from '../types/index.js';
import { CHART_PROP_UPDATE_CLASSES } from './chartPropUpdateClasses.js';

// hoisted so a parent re-render keeps the same children; a legend that isn't toggleable follows hiddenSeries
const children = [
  <Axis key="left" position="left" />,
  <Axis key="bottom" position="bottom" />,
  <Line key="line" dimension="datetime" metric="value" color="series" scaleType="linear" />,
  <Legend key="legend" />,
];

const withoutLegend = children.slice(0, 3);

const facetedLine = [
  <Line key="line" dimension="datetime" metric="value" color="series" lineType="series" opacity="series" scaleType="linear" />,
  <Legend key="legend" symbolShape="series" />,
];

const facetedScatter = [<Scatter key="scatter" dimension="x" metric="value" color="series" lineWidth="series" size="series" />];

const bar = [<Bar key="bar" dimension="category" metric="value" color="series" />];

const vegaSpec = (fill: string): Spec => ({
  data: [{ name: 'table', values: [{ x: 1 }, { x: 2 }] }],
  marks: [{ type: 'rect', from: { data: 'table' }, encode: { enter: { x: { field: 'x' }, width: { value: 5 }, height: { value: 5 }, fill: { value: fill } } } }],
});

const cases: UpdateCases<ChartProps> = {
  accessibleNavigation: { a: { children: bar }, b: { children: bar, accessibleNavigation: true } },
  animations: { a: { animations: false }, b: { animations: true }, setup: withDrawIn },
  animationTypes: { a: { animations: true }, b: { animations: true, animationTypes: ['hover'] }, setup: withDrawIn },
  backgroundColor: { b: { backgroundColor: 'gray-100' } },
  chartHeight: { skip: 'set by Chart from height' },
  chartWidth: { skip: 'set by Chart from width' },
  children: { b: { children: withoutLegend } },
  colors: { b: { colors: ['#ff0000', '#0000ff'] } },
  colorScheme: { b: { colorScheme: 'dark' } },
  config: { b: { config: { background: '#eeeeee' } } },
  data: { b: { data: updateCaseData.map((row) => ({ ...row, value: row.value * 2 })) } },
  dataTestId: { b: { dataTestId: 'update-case' } },
  debug: { skip: 'only logs the spec' },
  description: { b: { description: 'Value over time by series' } },
  emptyStateText: { b: { emptyStateText: 'Nothing to show' } },
  height: [{ b: { height: 350 } }, { a: { height: 100 }, b: { height: 600 } }],
  hiddenSeries: { b: { hiddenSeries: ['a'] } },
  highlightedItem: [
    { a: { idKey: 'id' }, b: { idKey: 'id', highlightedItem: 2 } },
    { a: { idKey: 'id', highlightedItem: 2 }, b: { idKey: 'id', highlightedItem: 5 } },
  ],
  highlightedSeries: [
    { b: { highlightedSeries: 'a' } },
    { a: { highlightedSeries: 'a' }, b: { highlightedSeries: 'b' } },
  ],
  idKey: { b: { idKey: 'id' } },
  lineTypes: { a: { children: facetedLine }, b: { children: facetedLine, lineTypes: ['dashed', 'solid'] } },
  lineWidths: { a: { children: facetedScatter }, b: { children: facetedScatter, lineWidths: ['S', 'L'] } },
  loading: { a: { loading: true }, b: { loading: false } },
  locale: { b: { locale: 'de-DE' } },
  maxHeight: { a: { height: '100%' }, b: { height: '100%', maxHeight: 250 } },
  maxWidth: { a: { width: 'auto' }, b: { width: 'auto', maxWidth: 300 } },
  minHeight: { a: { height: '100%' }, b: { height: '100%', minHeight: 600 } },
  minWidth: { a: { width: 'auto' }, b: { width: 'auto', minWidth: 600 } },
  onVegaViewReady: { b: { onVegaViewReady: noopCallback } },
  opacities: { a: { children: facetedLine }, b: { children: facetedLine, opacities: [0.5, 0.8] } },
  padding: { b: { padding: 12 } },
  renderer: { b: { renderer: 'canvas' } },
  symbolShapes: { a: { children: facetedLine }, b: { children: facetedLine, symbolShapes: ['circle', 'square'] } },
  symbolSizes: { a: { children: facetedScatter }, b: { children: facetedScatter, symbolSizes: ['S', 'L'] } },
  title: { b: { title: 'Retitled' } },
  tooltipAnchor: { b: { tooltipAnchor: 'mark' } },
  tooltipPlacement: { b: { tooltipPlacement: 'bottom' } },
  UNSAFE_vegaSpec: {
    a: { UNSAFE_vegaSpec: vegaSpec('red'), children: undefined },
    b: { UNSAFE_vegaSpec: vegaSpec('blue'), children: undefined },
  },
  width: { b: { width: 500 } },
};

describeUpdateClasses<ChartProps>(
  'Chart',
  CHART_PROP_UPDATE_CLASSES,
  ({ onVegaViewReady, ...props }, harnessReady) => (
    <Chart
      data={updateCaseData}
      width={400}
      height={300}
      animations={false}
      {...props}
      onVegaViewReady={(view) => {
        harnessReady(view);
        onVegaViewReady?.(view);
      }}
    >
      {'children' in props ? props.children : children}
    </Chart>
  ),
  cases
);
