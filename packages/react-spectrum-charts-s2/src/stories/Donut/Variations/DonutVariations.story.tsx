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
import { ReactElement } from 'react';

import { StoryFn } from '@storybook/react';

import {
  DONUT_ADVANCED_LABEL_RING_GAP,
  DONUT_LABEL_MAX_ANCHOR_OFFSET_RATIO,
  DONUT_LABEL_RING_GAP,
} from '@spectrum-charts/constants';
import { ChartData, Datum } from '@spectrum-charts/vega-spec-builder-s2';

import { Chart } from '../../../Chart';
import { ChartInspect, ChartPopover } from '../../../components';
import useChartProps from '../../../hooks/useChartProps';
import { Donut, DonutSummary, SegmentLabel } from '../../../pre-alpha';
import { bindWithProps } from '../../../test-utils';
import { ChartProps, DonutProps, SegmentLabelProps } from '../../../types';
import {
  Variation,
  VariationDashboard,
  VariationSizePreset,
  VariationViewMode,
  useVariationDataset,
  useVariationSize,
  useVariationViewMode,
} from '../../VariationDashboard';
import { basicDonutData, booleanDonutData, zeroDonutData } from '../../components/Donut/data';
import { DonutVariationDatasetName, donutDatasetOptions, donutVariationDatasets } from './donutVariationData';

export default {
  title: 'React Spectrum Charts 2/Donut/Variations',
  component: Donut,
  parameters: {
    controls: { disable: true },
    layout: 'fullscreen',
  },
};

const alternateFieldData = basicDonutData.map(({ browser, count }) => ({
  category: browser,
  total: count,
}));

const donutSizePresets: VariationSizePreset[] = [
  { label: 'XS', size: 60 },
  { label: 'S', size: 120 },
  { label: 'M', size: 160 },
  { label: 'L', size: 200 },
  { label: 'XL', size: 400 },
];

const donutViewModes: VariationViewMode[] = [
  { label: 'No added labels', value: 'none' },
  { label: 'Direct labels', value: 'direct' },
  { label: 'Advanced labels', value: 'advanced' },
];

const segmentLabelScenarioIds: Record<keyof SegmentLabelProps, string> = {
  labelMode: 'segment-label-modes',
  labelKey: 'segment-label-key',
  percent: 'segment-label-percent',
  percentFormat: 'segment-label-percent-format',
  swatch: 'segment-label-swatch',
  value: 'segment-label-value',
  valueFormat: 'segment-label-value-format',
  showValueRow: 'segment-label-value-row',
  showTotal: 'segment-label-total',
};

const getDonutLabelRingGap = (viewMode?: string): number =>
  viewMode === 'advanced' ? DONUT_ADVANCED_LABEL_RING_GAP : DONUT_LABEL_RING_GAP;

const getDonutContainerSize = (diameter: number, viewMode?: string): number => {
  if (viewMode === 'none') {
    return diameter + 4;
  }
  return diameter * (1 + DONUT_LABEL_MAX_ANCHOR_OFFSET_RATIO) + 4 + 2 * getDonutLabelRingGap(viewMode);
};

const getEffectiveDonutDiameter = (containerSize: number, viewMode?: string): number => {
  if (viewMode === 'none') {
    return containerSize - 4;
  }
  const rawRadius = containerSize / 2 - 2;
  const reservedRadius = (rawRadius - getDonutLabelRingGap(viewMode)) / (1 + DONUT_LABEL_MAX_ANCHOR_OFFSET_RATIO);
  return Math.max(0, 2 * reservedRadius);
};

interface DonutVariationChartProps {
  data?: ChartData[];
  donutProps?: DonutProps;
  children?: DonutProps['children'];
  colors?: ChartProps['colors'];
  emphasizedItemCount?: number;
  size?: number;
}

const DonutVariationChart = ({
  data,
  donutProps,
  children,
  colors,
  emphasizedItemCount,
  size,
}: DonutVariationChartProps): ReactElement => {
  const selectedDataset = useVariationDataset();
  const dashboardSize = useVariationSize();
  const viewMode = useVariationViewMode();
  if (!selectedDataset || !(selectedDataset in donutVariationDatasets)) {
    throw new Error(`Unknown Donut variation dataset: ${selectedDataset}`);
  }
  const chartData = data ?? donutVariationDatasets[selectedDataset as DonutVariationDatasetName];
  const chartSize = size ?? dashboardSize;
  const emphasizedItems =
    emphasizedItemCount === undefined
      ? donutProps?.emphasizedItems
      : chartData
          .slice(0, emphasizedItemCount)
          .map((datum) => ('series' in datum ? datum.series : undefined))
          .filter((series): series is string => typeof series === 'string');
  const chartProps = useChartProps({ data: chartData, width: chartSize, height: chartSize, colors });
  const dashboardSegmentLabel =
    viewMode === 'direct' ? (
      <SegmentLabel value valueFormat="shortNumber" />
    ) : viewMode === 'advanced' ? (
      <SegmentLabel percent showValueRow swatch value={false} />
    ) : null;
  return (
    <Chart {...chartProps}>
      <Donut {...donutProps} emphasizedItems={emphasizedItems}>
        {children}
        {dashboardSegmentLabel}
      </Donut>
    </Chart>
  );
};

const dialogContent = (datum: Datum): ReactElement => (
  <div>
    <div>Series: {datum.series}</div>
    <div>Value: {datum.value}</div>
  </div>
);

const variations: Variation[] = [
  {
    id: 'defaults',
    title: 'Defaults',
    description: 'Uses the default metric, color, hole ratio, start angle, and boolean mode.',
    dataset: 'canonical',
    coverage: ['metric=value', 'color=series', 'holeRatio=0.85', 'startAngle=0', 'isBoolean=false'],
    render: () => <DonutVariationChart />,
  },
  {
    id: 'alternate-fields-and-name',
    title: 'Alternate fields and name',
    description: 'Maps non-default data keys and assigns an explicit mark name.',
    dataset: 'alternate-fields',
    usesDashboardDataset: false,
    coverage: ['metric=total', 'color=category', 'name'],
    render: () => (
      <DonutVariationChart
        data={alternateFieldData}
        donutProps={{ color: 'category', metric: 'total', name: 'alternate-fields-donut' }}
      />
    ),
  },
  {
    id: 'pie',
    title: 'Pie',
    description: 'Removes the inner radius completely.',
    dataset: 'canonical',
    coverage: ['holeRatio=0'],
    render: () => <DonutVariationChart donutProps={{ holeRatio: 0 }} />,
  },
  {
    id: 'wide-ring',
    title: 'Wide ring',
    description: 'Exercises a non-default inner-to-outer radius ratio.',
    dataset: 'canonical',
    coverage: ['holeRatio=0.5'],
    render: () => <DonutVariationChart donutProps={{ holeRatio: 0.5 }} />,
  },
  {
    id: 'rotated',
    title: 'Rotated start angle',
    description: 'Starts the first segment one quarter-turn clockwise from the default.',
    dataset: 'canonical',
    coverage: ['startAngle=PI/2'],
    render: () => <DonutVariationChart donutProps={{ startAngle: Math.PI / 2 }} />,
  },
  {
    id: 'boolean',
    title: 'Boolean donut',
    description: 'Displays the first of two values as a percentage and forces the remainder to gray.',
    dataset: 'boolean',
    usesDashboardDataset: false,
    coverage: ['isBoolean=true'],
    render: () => (
      <DonutVariationChart
        data={booleanDonutData}
        colors={['green-800']}
        donutProps={{ color: 'id', isBoolean: true, metric: 'value' }}
      >
        <DonutSummary label="Success rate" />
      </DonutVariationChart>
    ),
  },
  {
    id: 'emphasized-single',
    title: 'Single emphasized item',
    description: 'Keeps one categorical segment in color and swaps all remaining segments to gray.',
    dataset: 'canonical',
    coverage: ['emphasizedItems=[Chrome]'],
    render: () => (
      <DonutVariationChart emphasizedItemCount={1}>
        <SegmentLabel valueFormat="shortNumber" />
      </DonutVariationChart>
    ),
  },
  {
    id: 'emphasized-custom-other',
    title: 'Multiple emphasized items',
    description: 'Uses multiple emphasized values and overrides the fallback segment color.',
    dataset: 'canonical',
    coverage: ['emphasizedItems=[Chrome,Firefox]', 'otherItemColor=blue-200'],
    render: () => (
      <DonutVariationChart donutProps={{ otherItemColor: 'blue-200' }} emphasizedItemCount={2}>
        <SegmentLabel valueFormat="shortNumber" />
      </DonutVariationChart>
    ),
  },
  {
    id: 'hidden-deemphasized-labels',
    title: 'Hidden de-emphasized labels',
    description: 'Shows the emphasized label treatment while suppressing labels for all gray segments.',
    dataset: 'canonical',
    coverage: ['hideDeemphasizedLabels=true', 'labelMode=emphasized', 'labelMode=deemphasized'],
    render: () => (
      <DonutVariationChart donutProps={{ hideDeemphasizedLabels: true }} emphasizedItemCount={1}>
        <SegmentLabel labelMode="emphasized" percent swatch value={false} />
        <SegmentLabel labelMode="deemphasized" value valueFormat="shortNumber" />
      </DonutVariationChart>
    ),
  },
  {
    id: 'summary-format',
    title: 'Formatted summary',
    description: 'Shows a labeled center value with an explicit number format.',
    dataset: 'canonical',
    coverage: ['DonutSummary.label', 'DonutSummary.numberFormat'],
    render: () => (
      <DonutVariationChart>
        <DonutSummary label="Visitors" numberFormat="standardNumber" />
      </DonutVariationChart>
    ),
  },
  {
    id: 'summary-hidden-value',
    title: 'Summary without value',
    description: 'Keeps the center label while hiding the calculated metric.',
    dataset: 'canonical',
    coverage: ['DonutSummary.hideValue=true'],
    render: () => (
      <DonutVariationChart>
        <DonutSummary hideValue label="Visitors" />
      </DonutVariationChart>
    ),
  },
  {
    id: 'summary-positive-delta',
    title: 'Positive summary delta',
    description: 'Adds a positive sentiment delta below the center summary.',
    dataset: 'canonical',
    coverage: ['DonutSummary.delta>0'],
    render: () => (
      <DonutVariationChart>
        <DonutSummary delta={0.025} label="Visitors" />
      </DonutVariationChart>
    ),
  },
  {
    id: 'summary-negative-delta',
    title: 'Negative summary delta',
    description: 'Adds a negative sentiment delta without a summary label.',
    dataset: 'canonical',
    coverage: ['DonutSummary.delta<0', 'DonutSummary.label=undefined'],
    render: () => (
      <DonutVariationChart>
        <DonutSummary delta={-0.074} />
      </DonutVariationChart>
    ),
  },
  {
    id: segmentLabelScenarioIds.value,
    title: 'SegmentLabel defaults',
    description: 'Shows the category and metric value using every default SegmentLabel option.',
    dataset: 'canonical',
    coverage: [
      'value=true',
      'valueFormat=standardNumber',
      'percent=false',
      'swatch=false',
      'showValueRow=false',
      'showTotal=false',
    ],
    render: () => (
      <DonutVariationChart>
        <SegmentLabel />
      </DonutVariationChart>
    ),
  },
  {
    id: segmentLabelScenarioIds.valueFormat,
    title: 'Segment value format',
    description: 'Formats the primary segment metric using compact notation.',
    dataset: 'canonical',
    coverage: ['valueFormat=shortNumber'],
    render: () => (
      <DonutVariationChart>
        <SegmentLabel valueFormat="shortNumber" />
      </DonutVariationChart>
    ),
  },
  {
    id: segmentLabelScenarioIds.percent,
    title: 'Segment percentage',
    description: 'Replaces the primary metric value with the default whole-number percentage.',
    dataset: 'canonical',
    coverage: ['percent=true', 'percentFormat=.0%', 'value=false'],
    render: () => (
      <DonutVariationChart>
        <SegmentLabel percent value={false} />
      </DonutVariationChart>
    ),
  },
  {
    id: segmentLabelScenarioIds.percentFormat,
    title: 'Percentage format',
    description: 'Shows percentages with one decimal place.',
    dataset: 'canonical',
    coverage: ['percent=true', 'percentFormat=.1%', 'value=false'],
    render: () => (
      <DonutVariationChart>
        <SegmentLabel percent percentFormat=".1%" value={false} />
      </DonutVariationChart>
    ),
  },
  {
    id: segmentLabelScenarioIds.swatch,
    title: 'Segment swatch',
    description: 'Adds the segment color swatch without enabling a secondary value row.',
    dataset: 'canonical',
    coverage: ['swatch=true', 'showValueRow=false'],
    render: () => (
      <DonutVariationChart>
        <SegmentLabel swatch value={false} />
      </DonutVariationChart>
    ),
  },
  {
    id: segmentLabelScenarioIds.showValueRow,
    title: 'Secondary value row',
    description: 'Moves the segment metric to a dedicated detail row below the category.',
    dataset: 'canonical',
    coverage: ['showValueRow=true', 'showTotal=false', 'value=false'],
    render: () => (
      <DonutVariationChart>
        <SegmentLabel showValueRow value={false} valueFormat="shortNumber" />
      </DonutVariationChart>
    ),
  },
  {
    id: segmentLabelScenarioIds.showTotal,
    title: 'Secondary value row with total',
    description: 'Appends the donut total to each segment value in the detail row.',
    dataset: 'canonical',
    coverage: ['showValueRow=true', 'showTotal=true', 'value=false'],
    render: () => (
      <DonutVariationChart>
        <SegmentLabel showTotal showValueRow value={false} valueFormat="shortNumber" />
      </DonutVariationChart>
    ),
  },
  {
    id: segmentLabelScenarioIds.labelKey,
    title: 'Alternate segment label key',
    description: 'Reads visible labels from a field other than the donut color facet.',
    dataset: 'canonical',
    coverage: ['labelKey=displayName', 'value=false'],
    render: () => (
      <DonutVariationChart>
        <SegmentLabel labelKey="displayName" value={false} />
      </DonutVariationChart>
    ),
  },
  {
    id: segmentLabelScenarioIds.labelMode,
    title: 'Emphasized and de-emphasized label modes',
    description: 'Uses separate label treatments for the colored segment and the remaining gray segments.',
    dataset: 'canonical',
    coverage: ['labelMode=emphasized', 'labelMode=deemphasized'],
    render: () => (
      <DonutVariationChart donutProps={{ hideDeemphasizedLabels: false }} emphasizedItemCount={1}>
        <SegmentLabel labelMode="emphasized" percent showValueRow swatch value={false} />
        <SegmentLabel labelMode="deemphasized" value valueFormat="shortNumber" />
      </DonutVariationChart>
    ),
  },
  {
    id: 'interactive-children',
    title: 'Inspect and popover',
    description: 'Hover a segment for inspect content and click it for the persistent popover.',
    dataset: 'canonical',
    coverage: ['ChartInspect', 'ChartPopover'],
    render: () => (
      <DonutVariationChart>
        <ChartInspect>{dialogContent}</ChartInspect>
        <ChartPopover width="auto">{dialogContent}</ChartPopover>
      </DonutVariationChart>
    ),
  },
  {
    id: 'zero-values',
    title: 'All-zero values',
    description: 'Confirms child configurations remain legible when every metric value is zero.',
    dataset: 'zero-values',
    usesDashboardDataset: false,
    coverage: ['empty-state ring', 'DonutSummary', 'SegmentLabel'],
    render: () => (
      <DonutVariationChart data={zeroDonutData} donutProps={{ color: 'browser', metric: 'count' }}>
        <DonutSummary label="Visitors" />
        <SegmentLabel percent value />
      </DonutVariationChart>
    ),
  },
];

const DashboardStory: StoryFn = (): ReactElement => (
  <VariationDashboard
    variations={variations}
    chartType="Donut"
    datasets={donutDatasetOptions}
    getSizeDescription={(size, viewMode) =>
      `Effective donut diameter: ${Math.round(getEffectiveDonutDiameter(size, viewMode))}px`
    }
    initialSize={getDonutContainerSize(200, 'none')}
    initialDataset="standard"
    initialViewMode="none"
    resolvePresetSize={getDonutContainerSize}
    sizePresets={donutSizePresets}
    viewModes={donutViewModes}
  />
);

const PropVariations = bindWithProps(DashboardStory);

export { PropVariations };
