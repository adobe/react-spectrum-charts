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

import { ChartData } from '@spectrum-charts/vega-spec-builder-s2';

import { Chart } from '../../../Chart.js';
import { ChartInspect, ChartPopover } from '../../../components/index.js';
import useChartProps from '../../../hooks/useChartProps.js';
import { Donut, DonutSummary, SegmentLabel } from '../../../pre-alpha/index.js';
import { booleanDonutData, zeroDonutData } from '../../../storyShared/Donut/data.js';
import {
  ChartInspectProps,
  ChartPopoverProps,
  ChartProps,
  DonutProps,
  DonutSummaryProps,
  LegendProps,
  SegmentLabelProps,
} from '../../../types/index.js';
import {
  Variation,
  VariationDashboard,
  VariationFilter,
  VariationSizePreset,
  VariationViewMode,
  useVariationDataset,
  useVariationSize,
  useVariationViewMode,
} from '../../VariationDashboard.js';
import { DashboardDefinition, PropCoverage, SiblingCoverage } from '../../dashboardCoverage.js';
import { getContainerWidthForDiameter, getEffectiveDiameter } from '../Regressions/ResponsiveDonut.js';
import {
  DonutVariationDatasetName,
  DonutVariationDatum,
  donutDatasetOptions,
  donutVariationDatasets,
  getLargestDonutSeries,
} from './donutVariationData.js';

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

const isSemicircleVariation = ({ coverage }: Variation): boolean => coverage.includes('variant=semicircle');

const donutVariationFilters: VariationFilter[] = [
  { label: 'All', value: 'all', matches: () => true },
  { label: 'Full', value: 'full', matches: (variation) => !isSemicircleVariation(variation) },
  { label: 'Semicircle', value: 'semicircle', matches: isSemicircleVariation },
];

const getDonutContainerSize = (diameter: number, viewMode?: string): number => {
  if (viewMode === 'none') {
    return diameter + 4;
  }
  return getContainerWidthForDiameter(diameter);
};

const getEffectiveDonutDiameter = (containerSize: number, viewMode?: string): number => {
  if (viewMode === 'none') {
    return containerSize - 4;
  }
  return Math.max(0, getEffectiveDiameter(containerSize));
};

interface DonutVariationChartProps extends Pick<DonutProps, 'children'> {
  data?: ChartData[];
  donutProps?: DonutProps;
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
      : getLargestDonutSeries(chartData as DonutVariationDatum[], emphasizedItemCount);
  const chartProps = useChartProps({ data: chartData, width: chartSize, height: chartSize, colors });
  let dashboardSegmentLabel: ReactElement | null = null;
  if (viewMode === 'direct') {
    dashboardSegmentLabel = <SegmentLabel value valueFormat="shortNumber" />;
  } else if (viewMode === 'advanced') {
    dashboardSegmentLabel = <SegmentLabel percent showValueRow swatch value={false} />;
  }
  return (
    <Chart {...chartProps}>
      <Donut {...donutProps} emphasizedItems={emphasizedItems}>
        {children}
        {dashboardSegmentLabel}
      </Donut>
    </Chart>
  );
};

export const donutVariations: Variation[] = [
  {
    id: 'defaults',
    title: 'Defaults',
    description: 'Uses the default metric, color, hole ratio, and boolean mode.',
    dataset: 'canonical',
    coverage: ['metric=value', 'color=series', 'holeRatio=0.85', 'isBoolean=false'],
    render: () => <DonutVariationChart />,
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
    id: 'emphasized-multiple',
    title: 'Multiple emphasized items',
    description: 'Keeps multiple categorical segments in color and swaps all remaining segments to gray.',
    dataset: 'canonical',
    coverage: ['emphasizedItems=[Chrome,Firefox]'],
    render: () => (
      <DonutVariationChart emphasizedItemCount={2}>
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
    id: 'segment-label-value',
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
    id: 'segment-label-value-format',
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
    id: 'segment-label-percent',
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
    id: 'segment-label-percent-format',
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
    id: 'segment-label-swatch',
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
    id: 'segment-label-value-row',
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
    id: 'segment-label-total',
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
    id: 'segment-label-key',
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
    id: 'segment-label-modes',
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
        <ChartInspect />
        <ChartPopover width="auto" />
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
  {
    id: 'semicircle',
    title: 'Semicircle',
    description: 'Renders the selected dataset across the lower half of the donut.',
    dataset: 'canonical',
    coverage: ['variant=semicircle'],
    render: () => <DonutVariationChart donutProps={{ variant: 'semicircle' }} />,
  },
  {
    id: 'semicircle-formatted-summary',
    title: 'Semicircle with formatted summary',
    description: 'Adds a labeled and explicitly formatted summary to the semicircle.',
    dataset: 'canonical',
    coverage: ['variant=semicircle', 'DonutSummary.label', 'DonutSummary.numberFormat'],
    render: () => (
      <DonutVariationChart donutProps={{ variant: 'semicircle' }}>
        <DonutSummary label="Visitors" numberFormat="standardNumber" />
      </DonutVariationChart>
    ),
  },
  {
    id: 'semicircle-hidden-value-summary',
    title: 'Semicircle with label and delta',
    description: 'Hides the summary value while retaining its label and sentiment delta.',
    dataset: 'canonical',
    coverage: ['variant=semicircle', 'DonutSummary.label', 'DonutSummary.hideValue=true', 'DonutSummary.delta'],
    render: () => (
      <DonutVariationChart donutProps={{ variant: 'semicircle' }}>
        <DonutSummary delta={0.025} hideValue label="Visitors" />
      </DonutVariationChart>
    ),
  },
  {
    id: 'semicircle-all-summary-options',
    title: 'Semicircle with all summary options',
    description: 'Renders a semicircle with every DonutSummary option configured.',
    dataset: 'canonical',
    coverage: [
      'variant=semicircle',
      'DonutSummary.label',
      'DonutSummary.numberFormat',
      'DonutSummary.hideValue=false',
      'DonutSummary.delta',
    ],
    render: () => (
      <DonutVariationChart donutProps={{ variant: 'semicircle' }}>
        <DonutSummary delta={0.025} hideValue={false} label="Visitors" numberFormat="standardNumber" />
      </DonutVariationChart>
    ),
  },
];

export const DonutDashboard = (): ReactElement => (
  <VariationDashboard
    variations={donutVariations}
    chartType="Donut"
    datasets={donutDatasetOptions}
    filters={donutVariationFilters}
    getSizeDescription={(size, viewMode) =>
      `Effective donut diameter: ${Math.round(getEffectiveDonutDiameter(size, viewMode))}px`
    }
    initialSize={getDonutContainerSize(200, 'none')}
    initialDataset="standard"
    initialFilter="all"
    initialViewMode="none"
    resolvePresetSize={getDonutContainerSize}
    sizePresets={donutSizePresets}
    viewModes={donutViewModes}
  />
);

const donutCoverage: PropCoverage<DonutProps> = {
  children: ['summary-format', 'segment-label-value', 'interactive-children'],
  color: ['defaults', 'boolean'],
  emphasizedItems: ['emphasized-single', 'emphasized-multiple'],
  hideDeemphasizedLabels: ['hidden-deemphasized-labels'],
  holeRatio: ['defaults', 'pie', 'wide-ring'],
  isBoolean: ['boolean'],
  metric: ['defaults', 'boolean'],
  name: { skip: 'TODO: no variation sets name yet' },
  sortOrder: { skip: 'TODO: no variation for sortOrder="data" yet' },
  variant: ['semicircle'],
};

const donutSummaryCoverage: PropCoverage<DonutSummaryProps> = {
  delta: ['summary-positive-delta', 'summary-negative-delta', 'semicircle-hidden-value-summary'],
  hideValue: ['summary-hidden-value', 'semicircle-hidden-value-summary'],
  label: ['summary-format', 'summary-negative-delta'],
  numberFormat: ['summary-format', 'semicircle-formatted-summary'],
};

const segmentLabelCoverage: PropCoverage<SegmentLabelProps> = {
  labelKey: ['segment-label-key'],
  labelMode: ['segment-label-modes', 'hidden-deemphasized-labels'],
  percent: ['segment-label-percent'],
  percentFormat: ['segment-label-percent-format'],
  showTotal: ['segment-label-total'],
  showValueRow: ['segment-label-value-row'],
  swatch: ['segment-label-swatch'],
  value: ['segment-label-value'],
  valueFormat: ['segment-label-value-format'],
};

const chartInspectCoverage: SiblingCoverage<ChartInspectProps> = {
  children: ['interactive-children'],
};

const chartPopoverCoverage: SiblingCoverage<ChartPopoverProps> = {
  children: ['interactive-children'],
  width: ['interactive-children'],
};

const legendCoverage: SiblingCoverage<LegendProps> = {
  highlight: { skip: 'TODO: no Legend variation yet' },
  isToggleable: { skip: 'TODO: no Legend variation yet' },
};

const chartCoverage: SiblingCoverage<ChartProps> = {
  colors: ['boolean'],
  hiddenSeries: { skip: 'TODO: no hidden-series variation yet' },
  highlightedItem: { skip: 'TODO: no controlled-highlight variation yet' },
};

export const dashboard: DashboardDefinition = {
  chartType: 'Donut',
  variations: donutVariations,
  coverage: {
    Donut: donutCoverage,
    DonutSummary: donutSummaryCoverage,
    SegmentLabel: segmentLabelCoverage,
    ChartInspect: chartInspectCoverage,
    ChartPopover: chartPopoverCoverage,
    Legend: legendCoverage,
    Chart: chartCoverage,
  },
};
