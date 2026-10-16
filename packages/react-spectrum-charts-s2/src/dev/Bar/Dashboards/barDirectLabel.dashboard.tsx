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
import { ReactElement, useState } from 'react';

import { Chart } from '../../../Chart.js';
import { Axis, Bar, BarDirectLabel, ChartInspect, Legend } from '../../../components/index.js';
import useChartProps from '../../../hooks/useChartProps.js';
import { BarDirectLabelProps, BarProps, ChartProps } from '../../../types/index.js';
import {
  Variation,
  VariationDashboard,
  useVariationAnimations,
  useVariationRenderer,
  useVariationSize,
  useVariationViewMode,
} from '../../VariationDashboard.js';
import { DashboardDefinition } from '../../dashboardCoverage.js';

interface LabelDatum extends Record<string, unknown> {
  id: string;
  category: string;
  series: string;
  group: string;
  panel: string;
  value: number;
  callout: boolean;
}

const makeData = (values: number[], seriesCount = 1): LabelDatum[] =>
  values.flatMap((value, category) =>
    Array.from({ length: seriesCount }, (_, series) => ({
      id: `${category}-${series}`,
      category: String.fromCharCode(65 + category),
      series: `Series ${series + 1}`,
      group: `Group ${(series % 2) + 1}`,
      panel: category % 2 ? 'Panel 2' : 'Panel 1',
      value: value * (1 - series * 0.1),
      callout: category === values.length - 1 && series === 0,
    }))
  );

const signedData = makeData([100, 5, 0, -5, -100]);
const denseData = makeData([100000000, 100000000, 100000000, 100000000]);
const groupedData = makeData([100, 20, 70, 5], 3);
const performanceData = makeData(
  Array.from({ length: 8 }, (_, i) => 10 + ((i * 17) % 80)),
  3
);

interface LabelChartProps {
  data?: LabelDatum[];
  bar?: Omit<BarProps, 'children'>;
  labels?: BarDirectLabelProps[];
  chart?: Partial<Pick<ChartProps, 'backgroundColor' | 'colorScheme' | 'colors'>>;
  dynamic?: boolean;
}

const LabelChart = ({
  data = signedData,
  bar,
  labels = [{}],
  chart,
  dynamic = false,
}: LabelChartProps): ReactElement => {
  const size = useVariationSize();
  const animations = useVariationAnimations();
  const mode = useVariationViewMode();
  const renderer = useVariationRenderer();
  const [updated, setUpdated] = useState(false);
  const chartData = updated
    ? data.map((row, index) => ({ ...row, value: index === 0 ? row.value : row.value / 100, callout: !row.callout }))
    : data;
  const props = useChartProps({ data: chartData, width: size, height: Math.max(280, Math.round(size * 0.8)) });
  const animationTypes: ChartProps['animationTypes'] = mode === 'drawIn' ? ['drawIn'] : ['hover'];
  const horizontal = bar?.orientation === 'horizontal';
  return (
    <div>
      {dynamic && (
        <button type="button" onClick={() => setUpdated((value) => !value)}>
          Toggle values and selection
        </button>
      )}
      <Chart
        {...props}
        {...chart}
        animations={animations}
        animationTypes={animationTypes}
        renderer={renderer}
        idKey="id"
      >
        <Axis position={horizontal ? 'left' : 'bottom'} baseline />
        <Axis position={horizontal ? 'bottom' : 'left'} grid numberFormat="shortNumber" />
        <Bar dimension="category" metric="value" color="series" {...bar}>
          {labels.map((label, index) => (
            <BarDirectLabel key={index} {...label} />
          ))}
          <ChartInspect />
        </Bar>
        <Legend highlight isToggleable />
      </Chart>
    </div>
  );
};

const positions: BarDirectLabelProps['position'][] = ['start', 'middle', 'end', 'end-outside'];
const positionCases: Variation[] = (['vertical', 'horizontal'] as const).flatMap((orientation) =>
  positions.map((position) => ({
    id: `${orientation}-${position}`,
    title: `${orientation}: ${position}`,
    description: 'Check positive and negative tips, thin bars, and the default overflow policy.',
    dataset: 'signed',
    usesDashboardDataset: false,
    coverage: [`position=${position}`, `orientation=${orientation}`],
    render: () => <LabelChart bar={{ orientation }} labels={[{ position }]} />,
  }))
);

const layoutCases: Variation[] = (['vertical', 'horizontal'] as const).flatMap((orientation) =>
  [
    { name: 'dodged', props: { type: 'dodged' as const } },
    { name: 'stacked', props: { type: 'stacked' as const } },
    { name: 'dodged-stacked', props: { type: 'dodged' as const, color: ['series', 'group'] as [string, string] } },
    { name: 'trellis', props: { type: 'dodged' as const, trellis: 'panel' } },
  ].map(({ name, props }) => ({
    id: `${orientation}-${name}`,
    title: `${orientation}: ${name}`,
    description: 'Labels follow actual segments; outside labels avoid neighboring bars and categories.',
    dataset: 'grouped',
    usesDashboardDataset: false,
    coverage: [`layout=${name}`, `orientation=${orientation}`],
    render: () => (
      <LabelChart
        data={groupedData}
        bar={{ ...props, orientation }}
        labels={[{ position: 'end', overflow: 'spill' }]}
      />
    ),
  }))
);

const collisionCases: Variation[] = [
  ...(['vertical', 'horizontal'] as const).map((orientation) => ({
    id: `${orientation}-domain-extremes`,
    title: `${orientation}: both domain extremes`,
    description: 'Outside labels stay visible beyond the maximum positive and negative tips.',
    dataset: 'signed extremes',
    coverage: ['domain edge', `orientation=${orientation}`],
    render: () => <LabelChart data={makeData([-100, 100])} bar={{ orientation }} />,
  })),
  ...(['vertical', 'horizontal'] as const).map((orientation) => ({
    id: `${orientation}-signed-stacks`,
    title: `${orientation}: signed stack segments`,
    description:
      'Inside labels fit individual positive and negative segments; spilling labels avoid adjacent segments.',
    dataset: 'signed stacks',
    coverage: ['stacked', 'signed', 'overflow=spill'],
    render: () => (
      <LabelChart
        data={makeData([100, 5, -5, -100], 3)}
        bar={{ type: 'stacked', orientation }}
        labels={[{ position: 'end', overflow: 'spill' }]}
      />
    ),
  })),
  {
    id: 'neighbor-collisions',
    title: 'Neighboring categories collide',
    description: 'At small widths only non-overlapping labels survive. Widen the chart to restore them.',
    dataset: 'equal large values',
    coverage: ['outside collision', 'resize'],
    render: () => <LabelChart data={denseData} bar={{ type: 'dodged' }} />,
  },
  {
    id: 'selected-candidate',
    title: 'Excluded labels do not reserve space',
    description: 'Only D is selected. Its label remains visible even where excluded labels would collide.',
    dataset: 'equal large values',
    coverage: ['dataKey', 'outside collision'],
    render: () => <LabelChart data={denseData} bar={{ type: 'dodged' }} labels={[{ dataKey: 'callout' }]} />,
  },
  {
    id: 'bar-obstacle',
    title: 'Labels avoid taller neighboring bars',
    description: 'A long label beside a taller bar hides rather than painting over that bar.',
    dataset: 'large values',
    coverage: ['bar collision'],
    render: () => <LabelChart data={makeData([90000000, 100000000, 90000000, 100000000])} bar={{ type: 'dodged' }} />,
  },
  {
    id: 'inside-hide',
    title: 'Inside labels hide when too narrow',
    description: 'Currency labels must fit both the segment length and thickness.',
    dataset: 'grouped',
    coverage: ['overflow=hide', 'format'],
    render: () => (
      <LabelChart
        data={groupedData}
        bar={{ type: 'dodged' }}
        labels={[{ position: 'middle', format: 'currency', overflow: 'hide' }]}
      />
    ),
  },
  {
    id: 'spill-and-fit',
    title: 'Inside-fit labels do not enter outside layout',
    description: 'Large bars keep labels inside; short bars spill only when their outside position is free.',
    dataset: 'signed',
    coverage: ['overflow=spill', 'inside fit'],
    render: () => <LabelChart labels={[{ position: 'end', overflow: 'spill' }]} />,
  },
  {
    id: 'multiple-labels',
    title: 'Multiple label sets share obstacles',
    description: 'The selected currency label avoids labels placed by the first child.',
    dataset: 'large values',
    coverage: ['multiple children', 'dataKey', 'format'],
    render: () => (
      <LabelChart data={denseData} bar={{ type: 'dodged' }} labels={[{}, { dataKey: 'callout', format: 'currency' }]} />
    ),
  },
  {
    id: 'dark-background',
    title: 'Halos respect the chart background',
    description: 'Outside halos use the background signal and fade with their label.',
    dataset: 'signed',
    coverage: ['background', 'halo opacity'],
    render: () => <LabelChart chart={{ backgroundColor: '#202020', colorScheme: 'dark' }} />,
  },
  {
    id: 'dynamic-selection',
    title: 'Values and selection update without remounting',
    description: 'Toggle the data, then resize: fit tests, candidates, and selection must refresh.',
    dataset: 'grouped',
    coverage: ['data update', 'dataKey', 'resize'],
    render: () => (
      <LabelChart
        data={groupedData}
        bar={{ type: 'dodged' }}
        labels={[{ position: 'end', overflow: 'spill', dataKey: 'callout' }]}
        dynamic
      />
    ),
  },
];

const performanceCases: Variation[] = [
  { id: 'perf-none', title: 'Animation baseline: no labels', labels: [] },
  { id: 'perf-inside', title: 'Animation: inside labels only', labels: [{ position: 'middle' as const }] },
  { id: 'perf-outside', title: 'Animation: outside collision layout', labels: [{}] },
  {
    id: 'perf-spill',
    title: 'Animation: inside labels with spill',
    labels: [{ position: 'end' as const, overflow: 'spill' as const }],
  },
  { id: 'perf-selected', title: 'Animation: one selected label', labels: [{ dataKey: 'callout' }] },
].map(({ id, title, labels }) => ({
  id,
  title,
  description: 'Same 24 bars. Compare draw-in replay and hover dimming with the no-label baseline.',
  dataset: '24 bars',
  usesDashboardDataset: false,
  coverage: ['animation comparison'],
  render: () => <LabelChart data={performanceData} bar={{ type: 'dodged' }} labels={labels} />,
}));

export const barDirectLabelRegressions = [...positionCases, ...layoutCases, ...collisionCases, ...performanceCases];

export const dashboard: DashboardDefinition = {
  chartType: 'Bar direct label regressions',
  variations: barDirectLabelRegressions,
  coverage: {
    BarDirectLabel: {
      position: positionCases.map(({ id }) => id),
      overflow: ['inside-hide', 'spill-and-fit'],
      dataKey: ['selected-candidate', 'dynamic-selection'],
      format: ['inside-hide', 'multiple-labels'],
    },
  },
};

export const BarDirectLabelRegressionDashboard = (): ReactElement => {
  const [replay, setReplay] = useState(0);
  return (
    <div>
      <button type="button" onClick={() => setReplay((value) => value + 1)}>
        Replay draw-in
      </button>
      <VariationDashboard
        key={replay}
        chartType={dashboard.chartType}
        variations={dashboard.variations}
        coverage={dashboard.coverage}
        initialSize={320}
        sizePresets={[
          { label: 'XS', size: 160 },
          { label: 'S', size: 240 },
          { label: 'M', size: 320 },
          { label: 'L', size: 480 },
          { label: 'XL', size: 640 },
        ]}
        showAnimationControls
        initialViewMode="hover"
        viewModes={[
          { value: 'hover', label: 'Hover opacity' },
          { value: 'drawIn', label: 'Draw-in' },
        ]}
        filters={[
          { value: 'all', label: 'All regressions', matches: () => true },
          {
            value: 'positions',
            label: 'Positions and signs',
            matches: ({ id }) => positionCases.some((variation) => variation.id === id),
          },
          {
            value: 'layouts',
            label: 'Layouts',
            matches: ({ id }) => layoutCases.some((variation) => variation.id === id),
          },
          {
            value: 'collisions',
            label: 'Collision and updates',
            matches: ({ id }) => collisionCases.some((variation) => variation.id === id),
          },
          { value: 'performance', label: 'Animation comparisons', matches: ({ id }) => id.startsWith('perf-') },
        ]}
      />
    </div>
  );
};
