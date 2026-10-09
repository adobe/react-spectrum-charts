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
import { ReactElement, ReactNode } from 'react';

import { Datum } from '@spectrum-charts/vega-spec-builder-s2';

import { Chart } from '../../../Chart.js';
import { ChartInspect, Title } from '../../../components/index.js';
import useChartProps from '../../../hooks/useChartProps.js';
import { Bullet } from '../../../pre-alpha/index.js';
import { BulletProps, ChartInspectProps, ChartProps, TitleProps } from '../../../types/index.js';
import {
  Variation,
  VariationDashboard,
  VariationFilter,
  VariationSizePreset,
  VariationViewMode,
  useVariationDataset,
  useVariationRenderer,
  useVariationSize,
  useVariationViewMode,
} from '../../VariationDashboard.js';
import { DashboardDefinition, PropCoverage, SiblingCoverage } from '../../dashboardCoverage.js';
import {
  BulletVariationDatasetName,
  BulletVariationDatum,
  bulletDatasetOptions,
  bulletVariationDatasets,
  getBulletMax,
  getBulletThresholds,
} from './bulletVariationData.js';

const bulletSizePresets: VariationSizePreset[] = [
  { label: 'XS', size: 200 },
  { label: 'S', size: 280 },
  { label: 'M', size: 360 },
  { label: 'L', size: 480 },
  { label: 'XL', size: 720 },
];

const bulletViewModes: VariationViewMode[] = [
  { label: 'Plain', value: 'plain' },
  { label: 'Track', value: 'track' },
  { label: 'Thresholds', value: 'thresholds' },
];

const BULLET_CHILDREN = new Set(['ChartInspect']);
const SIBLINGS = new Set(['Chart', 'Title']);

const getCoverageComponent = (entry: string): string => entry.split(/[.=[]/)[0];
const coversAny =
  (components: Set<string>) =>
  ({ coverage }: Variation): boolean =>
    coverage.some((entry) => components.has(getCoverageComponent(entry)));
const isRowVariation = ({ coverage }: Variation): boolean => coverage.includes('direction=row');

const bulletVariationFilters: VariationFilter[] = [
  { label: 'All', value: 'all', matches: () => true },
  { label: 'Column', value: 'column', matches: (variation) => !isRowVariation(variation) },
  { label: 'Row', value: 'row', matches: isRowVariation },
  { label: 'Children', value: 'children', matches: coversAny(BULLET_CHILDREN) },
  { label: 'Siblings & Chart', value: 'siblings', matches: coversAny(SIBLINGS) },
];

const BULLET_GAP = 12;
const METRIC_AXIS_HEIGHT = 24;
const TITLE_HEIGHT = 36;

/** Mirrors the spec builder's bulletGroupHeight signal so each card is tall enough for its bullets. */
const getBulletGroupHeight = ({
  direction,
  labelPosition,
  showTarget = true,
  showTargetValue,
}: BulletProps): number => {
  const isSideColumn = labelPosition === 'side' && direction !== 'row';
  const labelSpace = isSideColumn ? 10 : 24;
  const targetValueSpace = showTarget && showTargetValue ? 20 : 0;
  return 24 + targetValueSpace + labelSpace;
};

/** Gets a chart height that fits every bullet group, plus the metric axis and title when present. */
const getBulletChartHeight = (rowCount: number, bulletProps: BulletProps, hasTitle: boolean): number => {
  const groupHeight = getBulletGroupHeight(bulletProps);
  const titleHeight = hasTitle ? TITLE_HEIGHT : 0;
  if (bulletProps.direction === 'row') return groupHeight + titleHeight;
  const rows = Math.max(rowCount, 1);
  const { metricAxis, showTarget = true, showTargetValue } = bulletProps;
  const hasMetricAxis = metricAxis && !(showTarget && showTargetValue);
  const axisHeight = hasMetricAxis ? METRIC_AXIS_HEIGHT : 0;
  return rows * groupHeight + (rows - 1) * BULLET_GAP + axisHeight + titleHeight;
};

const inspectContent = (datum: Datum): ReactNode => (
  <div>
    <div>{String(datum.graphLabel)}</div>
    <div>Current: {Number(datum.currentAmount).toLocaleString('en-US')}</div>
    <div>Target: {datum.target === null ? 'n/a' : Number(datum.target).toLocaleString('en-US')}</div>
  </div>
);

type BulletChartOverrides = Omit<Partial<ChartProps>, 'children' | 'data'>;
type DataFunction<T> = T | ((data: BulletVariationDatum[]) => T);

const resolve = <T,>(value: DataFunction<T> | undefined, data: BulletVariationDatum[]): T | undefined =>
  typeof value === 'function' ? (value as (data: BulletVariationDatum[]) => T)(data) : value;

/** Applies the dashboard Background view mode unless the variation sets its own track or thresholds. */
const getBackgroundProps = (
  viewMode: string | undefined,
  bulletProps: Omit<BulletProps, 'children'>,
  data: BulletVariationDatum[]
): Omit<BulletProps, 'children'> => {
  if ('track' in bulletProps || 'thresholds' in bulletProps) return {};
  if (viewMode === 'track') return { track: true };
  if (viewMode === 'thresholds') return { thresholds: getBulletThresholds(data) };
  return {};
};

interface BulletVariationChartProps extends Pick<BulletProps, 'children'> {
  /** Fixed data, or a function deriving data from the active dataset. */
  data?: DataFunction<BulletVariationDatum[]>;
  /** Bullet prop overrides; functions receive the active dataset. */
  bulletProps?: DataFunction<Omit<BulletProps, 'children'>>;
  /** Chart prop overrides; functions receive the active dataset. */
  chartProps?: DataFunction<BulletChartOverrides>;
  /** Chart-level Title rendered above the bullets. */
  title?: TitleProps;
}

const BulletVariationChart = ({
  data,
  bulletProps,
  children,
  chartProps: chartPropOverrides,
  title,
}: BulletVariationChartProps): ReactElement => {
  const selectedDataset = useVariationDataset();
  const size = useVariationSize();
  const viewMode = useVariationViewMode();
  const renderer = useVariationRenderer();
  if (!selectedDataset || !(selectedDataset in bulletVariationDatasets)) {
    throw new Error(`Unknown Bullet variation dataset: ${selectedDataset}`);
  }
  const datasetData = bulletVariationDatasets[selectedDataset as BulletVariationDatasetName];
  const chartData = resolve(data, datasetData) ?? datasetData;
  const ownBulletProps = resolve(bulletProps, chartData) ?? {};
  const resolvedBulletProps = { ...getBackgroundProps(viewMode, ownBulletProps, chartData), ...ownBulletProps };
  const chartProps = useChartProps({
    data: chartData,
    width: size,
    height: getBulletChartHeight(chartData.length, resolvedBulletProps, Boolean(title)),
  });
  return (
    <Chart {...chartProps} renderer={renderer} {...resolve(chartPropOverrides, chartData)}>
      {title && <Title {...title} />}
      <Bullet {...resolvedBulletProps}>{children}</Bullet>
    </Chart>
  );
};

const halfMax = (data: BulletVariationDatum[]): number => Number((getBulletMax(data) / 2).toPrecision(2));
const doubleMax = (data: BulletVariationDatum[]): number => Number((getBulletMax(data) * 2).toPrecision(2));

const toCustomKeyRows = (data: BulletVariationDatum[]): BulletVariationDatum[] =>
  data.map((datum) => ({ ...datum, kpi: datum.graphLabel.toUpperCase(), goal: datum.previous * 1.25 }));

const withInspectExclusion = (data: BulletVariationDatum[]): BulletVariationDatum[] =>
  data.map((datum, index) => ({ ...datum, excludeFromInspect: index === 0 }));

const negativeData = bulletVariationDatasets.negative;
const missingTargetData = bulletVariationDatasets.missingTarget;
const zeroValueData = bulletVariationDatasets.zeroValues;

const baseBulletVariations: Variation[] = [
  {
    id: 'defaults',
    title: 'Defaults',
    description: 'Column layout with top labels, target line, standard number format and blue-900 bars.',
    dataset: 'standard',
    coverage: [
      'color=blue-900',
      'metric=currentAmount',
      'dimension=graphLabel',
      'target=target',
      'direction=column',
      'labelPosition=top',
      'scaleType=normal',
      'showTarget=true',
      'showTargetValue=false',
      'numberFormat=standardNumber',
      'name=bullet0',
    ],
    render: () => <BulletVariationChart />,
  },
  {
    id: 'color-token',
    title: 'Spectrum color token',
    description: 'Resolves a Spectrum color name for the metric bar.',
    dataset: 'standard',
    coverage: ['color=purple-900'],
    render: () => <BulletVariationChart bulletProps={{ color: 'purple-900' }} />,
  },
  {
    id: 'color-css',
    title: 'CSS color',
    description: 'Passes a raw CSS color through to the metric bar.',
    dataset: 'standard',
    coverage: ['color=rgb(21, 164, 110)'],
    render: () => <BulletVariationChart bulletProps={{ color: 'rgb(21, 164, 110)' }} />,
  },
  {
    id: 'custom-keys',
    title: 'Custom metric, dimension and target keys',
    description: 'Plots `previous` against `goal`, labeled by an uppercase `kpi` key.',
    dataset: 'standard',
    coverage: ['metric=previous', 'dimension=kpi', 'target=goal'],
    render: () => (
      <BulletVariationChart
        data={toCustomKeyRows}
        bulletProps={{ metric: 'previous', dimension: 'kpi', target: 'goal' }}
      />
    ),
  },
  {
    id: 'direction-row',
    title: 'Row direction',
    description: 'Lays bullet groups out side by side in a single row.',
    dataset: 'standard',
    coverage: ['direction=row'],
    render: () => <BulletVariationChart bulletProps={{ direction: 'row' }} />,
  },
  {
    id: 'direction-row-side-labels',
    title: 'Row direction ignores side labels',
    description: 'labelPosition="side" falls back to top labels in row mode.',
    dataset: 'standard',
    coverage: ['direction=row', 'labelPosition=side'],
    render: () => <BulletVariationChart bulletProps={{ direction: 'row', labelPosition: 'side' }} />,
  },
  {
    id: 'label-side',
    title: 'Side labels',
    description: 'Dimension labels on the left axis and values on the right axis.',
    dataset: 'standard',
    coverage: ['labelPosition=side'],
    render: () => <BulletVariationChart bulletProps={{ labelPosition: 'side' }} />,
  },
  {
    id: 'label-side-target-value',
    title: 'Side labels with target values',
    description: 'Side axis labels shift up to stay aligned when target value labels are shown.',
    dataset: 'standard',
    coverage: ['labelPosition=side', 'showTargetValue=true'],
    render: () => <BulletVariationChart bulletProps={{ labelPosition: 'side', showTargetValue: true }} />,
  },
];

const scaleVariations: Variation[] = [
  {
    id: 'scale-fixed-below',
    title: 'Fixed scale below data',
    description: 'scaleType="fixed" pins the max to half the data max, so larger bars clamp at the end.',
    dataset: 'standard',
    coverage: ['scaleType=fixed', 'maxScaleValue=max/2'],
    render: () => (
      <BulletVariationChart bulletProps={(data) => ({ scaleType: 'fixed', maxScaleValue: halfMax(data) })} />
    ),
  },
  {
    id: 'scale-fixed-above',
    title: 'Fixed scale above data',
    description: 'scaleType="fixed" pins the max to twice the data max.',
    dataset: 'standard',
    coverage: ['scaleType=fixed', 'maxScaleValue=max*2'],
    render: () => (
      <BulletVariationChart bulletProps={(data) => ({ scaleType: 'fixed', maxScaleValue: doubleMax(data) })} />
    ),
  },
  {
    id: 'scale-fixed-invalid',
    title: 'Fixed scale with zero max',
    description: 'A non-positive maxScaleValue falls back to the normal data-driven scale.',
    dataset: 'standard',
    coverage: ['scaleType=fixed', 'maxScaleValue=0'],
    render: () => <BulletVariationChart bulletProps={{ scaleType: 'fixed', maxScaleValue: 0 }} />,
  },
  {
    id: 'scale-flexible-below',
    title: 'Flexible scale below data',
    description: 'Data overtakes the half-max maxScaleValue, so the scale follows the data.',
    dataset: 'standard',
    coverage: ['scaleType=flexible', 'maxScaleValue=max/2'],
    render: () => (
      <BulletVariationChart bulletProps={(data) => ({ scaleType: 'flexible', maxScaleValue: halfMax(data) })} />
    ),
  },
  {
    id: 'scale-flexible-above',
    title: 'Flexible scale above data',
    description: 'maxScaleValue of twice the data max wins until the data overtakes it.',
    dataset: 'standard',
    coverage: ['scaleType=flexible', 'maxScaleValue=max*2'],
    render: () => (
      <BulletVariationChart bulletProps={(data) => ({ scaleType: 'flexible', maxScaleValue: doubleMax(data) })} />
    ),
  },
  {
    id: 'metric-axis',
    title: 'Metric axis',
    description: 'Adds a shared scale axis below the column of bullets.',
    dataset: 'standard',
    coverage: ['metricAxis=true'],
    render: () => <BulletVariationChart bulletProps={{ metricAxis: true }} />,
  },
  {
    id: 'metric-axis-fixed-scale',
    title: 'Metric axis on a fixed scale',
    description: 'The axis follows a fixed max of twice the data max, using shortNumber labels.',
    dataset: 'standard',
    coverage: ['metricAxis=true', 'scaleType=fixed', 'numberFormat=shortNumber'],
    render: () => (
      <BulletVariationChart
        bulletProps={(data) => ({
          metricAxis: true,
          numberFormat: 'shortNumber',
          scaleType: 'fixed',
          maxScaleValue: doubleMax(data),
        })}
      />
    ),
  },
  {
    id: 'metric-axis-target-value',
    title: 'Metric axis with target values',
    description: 'The metric axis is suppressed when target value labels are shown.',
    dataset: 'standard',
    coverage: ['metricAxis=true', 'showTargetValue=true'],
    render: () => <BulletVariationChart bulletProps={{ metricAxis: true, showTargetValue: true }} />,
  },
  {
    id: 'metric-axis-hidden-target',
    title: 'Metric axis with hidden target',
    description: 'The metric axis stays visible because no target value label is drawn.',
    dataset: 'standard',
    coverage: ['metricAxis=true', 'showTarget=false', 'showTargetValue=true'],
    render: () => <BulletVariationChart bulletProps={{ metricAxis: true, showTarget: false, showTargetValue: true }} />,
  },
  {
    id: 'metric-axis-row',
    title: 'Metric axis in row direction',
    description: 'The metric axis is only drawn in column direction, so this matches plain row mode.',
    dataset: 'standard',
    coverage: ['metricAxis=true', 'direction=row'],
    render: () => <BulletVariationChart bulletProps={{ direction: 'row', metricAxis: true }} />,
  },
];

const targetVariations: Variation[] = [
  {
    id: 'hide-target',
    title: 'Hidden target',
    description: 'showTarget={false} removes the target line.',
    dataset: 'standard',
    coverage: ['showTarget=false'],
    render: () => <BulletVariationChart bulletProps={{ showTarget: false }} />,
  },
  {
    id: 'target-value',
    title: 'Target values',
    description: 'Labels each target line with its formatted value.',
    dataset: 'standard',
    coverage: ['showTargetValue=true'],
    render: () => <BulletVariationChart bulletProps={{ showTargetValue: true }} />,
  },
  {
    id: 'target-value-hidden-target',
    title: 'Target values with hidden target',
    description: 'Target value labels need the target line, so neither renders.',
    dataset: 'standard',
    coverage: ['showTarget=false', 'showTargetValue=true'],
    render: () => <BulletVariationChart bulletProps={{ showTarget: false, showTargetValue: true }} />,
  },
  {
    id: 'target-value-row',
    title: 'Target values in row direction',
    description: 'Target value labels under each bullet in a single row.',
    dataset: 'standard',
    coverage: ['direction=row', 'showTargetValue=true'],
    render: () => <BulletVariationChart bulletProps={{ direction: 'row', showTargetValue: true }} />,
  },
  {
    id: 'target-label',
    title: 'Target label key',
    description: 'Shows the pre-formatted `targetLabel` field instead of the target value.',
    dataset: 'standard',
    coverage: ['targetLabel=targetLabel', 'showTargetValue=true'],
    render: () => <BulletVariationChart bulletProps={{ showTargetValue: true, targetLabel: 'targetLabel' }} />,
  },
  {
    id: 'metric-label',
    title: 'Metric label key',
    description: 'Shows the pre-formatted `currentAmountLabel` field instead of the metric value.',
    dataset: 'standard',
    coverage: ['metricLabel=currentAmountLabel'],
    render: () => <BulletVariationChart bulletProps={{ metricLabel: 'currentAmountLabel' }} />,
  },
  {
    id: 'metric-label-side',
    title: 'Metric label key with side labels',
    description: 'The right-hand side axis reads the `currentAmountLabel` field.',
    dataset: 'standard',
    coverage: ['metricLabel=currentAmountLabel', 'labelPosition=side'],
    render: () => <BulletVariationChart bulletProps={{ labelPosition: 'side', metricLabel: 'currentAmountLabel' }} />,
  },
  {
    id: 'missing-target',
    title: 'Missing target',
    description: 'A null target draws no target line and labels it "No Target".',
    dataset: 'missingTarget',
    usesDashboardDataset: false,
    coverage: ['target=null', 'showTargetValue=true'],
    render: () => <BulletVariationChart data={missingTargetData} bulletProps={{ showTargetValue: true }} />,
  },
];

const numberFormatVariations: Variation[] = [
  {
    id: 'number-format-short-number',
    title: 'Short number format',
    description: 'Abbreviates metric and target values with K/M/B suffixes.',
    dataset: 'largeValues',
    usesDashboardDataset: false,
    coverage: ['numberFormat=shortNumber', 'showTargetValue=true'],
    render: () => (
      <BulletVariationChart
        data={bulletVariationDatasets.largeValues}
        bulletProps={{ numberFormat: 'shortNumber', showTargetValue: true }}
      />
    ),
  },
  {
    id: 'number-format-currency',
    title: 'Currency format',
    description: 'Formats metric and target values as dollars with cents.',
    dataset: 'standard',
    coverage: ['numberFormat=currency', 'showTargetValue=true'],
    render: () => <BulletVariationChart bulletProps={{ numberFormat: 'currency', showTargetValue: true }} />,
  },
  {
    id: 'number-format-short-currency',
    title: 'Short currency format',
    description: 'Abbreviated dollars on the values and side axis labels.',
    dataset: 'largeValues',
    usesDashboardDataset: false,
    coverage: ['numberFormat=shortCurrency', 'labelPosition=side', 'showTargetValue=true'],
    render: () => (
      <BulletVariationChart
        data={bulletVariationDatasets.largeValues}
        bulletProps={{ labelPosition: 'side', numberFormat: 'shortCurrency', showTargetValue: true }}
      />
    ),
  },
  {
    id: 'number-format-d3',
    title: 'd3 format specifier',
    description: 'Applies the ".1%" d3 specifier to metric and target values.',
    dataset: 'fractional',
    usesDashboardDataset: false,
    coverage: ['numberFormat=.1%', 'showTargetValue=true'],
    render: () => (
      <BulletVariationChart
        data={bulletVariationDatasets.fractional}
        bulletProps={{ numberFormat: '.1%', showTargetValue: true }}
      />
    ),
  },
];

const backgroundVariations: Variation[] = [
  {
    id: 'thresholds',
    title: 'Thresholds',
    description: 'Red, orange and green bands split the data range into thirds.',
    dataset: 'standard',
    coverage: ['thresholds=[3 bands]'],
    render: () => <BulletVariationChart bulletProps={(data) => ({ thresholds: getBulletThresholds(data) })} />,
  },
  {
    id: 'thresholds-open-ended',
    title: 'Single open-ended threshold',
    description: 'One band with only thresholdMin extends to the end of the scale.',
    dataset: 'standard',
    coverage: ['thresholds=[thresholdMin only]'],
    render: () => (
      <BulletVariationChart
        bulletProps={(data) => ({
          thresholds: [{ thresholdMin: getBulletThresholds(data)[2].thresholdMin, fill: 'rgb(21, 164, 110)' }],
        })}
      />
    ),
  },
  {
    id: 'threshold-bar-color',
    title: 'Threshold bar color',
    description: 'Colors each metric bar with the threshold band its value falls in.',
    dataset: 'standard',
    coverage: ['thresholds=[3 bands]', 'thresholdBarColor=true'],
    render: () => (
      <BulletVariationChart
        bulletProps={(data) => ({ thresholds: getBulletThresholds(data), thresholdBarColor: true })}
      />
    ),
  },
  {
    id: 'threshold-bar-color-no-thresholds',
    title: 'Threshold bar color without thresholds',
    description: 'thresholdBarColor has no effect without thresholds, so bars keep the color prop.',
    dataset: 'standard',
    coverage: ['thresholdBarColor=true', 'thresholds=[]'],
    render: () => <BulletVariationChart bulletProps={{ thresholds: [], thresholdBarColor: true }} />,
  },
  {
    id: 'thresholds-row',
    title: 'Thresholds in row direction',
    description: 'Threshold bands stay within each bullet group in row mode.',
    dataset: 'standard',
    coverage: ['thresholds=[3 bands]', 'direction=row'],
    render: () => (
      <BulletVariationChart bulletProps={(data) => ({ direction: 'row', thresholds: getBulletThresholds(data) })} />
    ),
  },
  {
    id: 'thresholds-target-value',
    title: 'Thresholds with target values',
    description: 'Bands shift up to make room for target value labels.',
    dataset: 'standard',
    coverage: ['thresholds=[3 bands]', 'showTargetValue=true'],
    render: () => (
      <BulletVariationChart
        bulletProps={(data) => ({ showTargetValue: true, thresholds: getBulletThresholds(data) })}
      />
    ),
  },
  {
    id: 'thresholds-and-track',
    title: 'Thresholds take precedence over track',
    description: 'Setting both draws only the threshold bands.',
    dataset: 'standard',
    coverage: ['thresholds=[3 bands]', 'track=true'],
    render: () => (
      <BulletVariationChart bulletProps={(data) => ({ thresholds: getBulletThresholds(data), track: true })} />
    ),
  },
  {
    id: 'track',
    title: 'Track',
    description: 'A flat gray track sits behind each metric bar.',
    dataset: 'standard',
    coverage: ['track=true'],
    render: () => <BulletVariationChart bulletProps={{ track: true }} />,
  },
  {
    id: 'track-row',
    title: 'Track in row direction',
    description: 'Tracks span each bullet group width in row mode.',
    dataset: 'standard',
    coverage: ['track=true', 'direction=row'],
    render: () => <BulletVariationChart bulletProps={{ direction: 'row', track: true }} />,
  },
  {
    id: 'track-target-value',
    title: 'Track with target values',
    description: 'The track shifts up with the bar when target value labels are shown.',
    dataset: 'standard',
    coverage: ['track=true', 'showTargetValue=true'],
    render: () => <BulletVariationChart bulletProps={{ showTargetValue: true, track: true }} />,
  },
];

const dataVariations: Variation[] = [
  {
    id: 'negative-values',
    title: 'Negative values',
    description: 'Negative metrics extend left of zero with rounded left corners.',
    dataset: 'negative',
    usesDashboardDataset: false,
    coverage: ['metric<0', 'track=true'],
    render: () => <BulletVariationChart data={negativeData} bulletProps={{ track: true }} />,
  },
  {
    id: 'negative-thresholds',
    title: 'Negative values with thresholds',
    description: 'Threshold bands with an open lower bound start at the negative scale minimum.',
    dataset: 'negative',
    usesDashboardDataset: false,
    coverage: ['metric<0', 'thresholds=[3 bands]', 'thresholdBarColor=true'],
    render: () => (
      <BulletVariationChart
        data={negativeData}
        bulletProps={{ thresholds: getBulletThresholds(negativeData), thresholdBarColor: true }}
      />
    ),
  },
  {
    id: 'zero-values',
    title: 'Zero metric and target',
    description: 'A zero metric draws no bar and a zero target sits on the baseline.',
    dataset: 'zeroValues',
    usesDashboardDataset: false,
    coverage: ['metric=0', 'target=0', 'showTargetValue=true'],
    render: () => <BulletVariationChart data={zeroValueData} bulletProps={{ showTargetValue: true, track: true }} />,
  },
];

const childVariations: Variation[] = [
  {
    id: 'inspect-default',
    title: 'ChartInspect',
    description: 'Hover a bar or target to inspect the row.',
    dataset: 'standard',
    coverage: ['ChartInspect.children'],
    render: () => (
      <BulletVariationChart>
        <ChartInspect>{inspectContent}</ChartInspect>
      </BulletVariationChart>
    ),
  },
  {
    id: 'inspect-thresholds',
    title: 'ChartInspect with thresholds',
    description: 'A transparent hover area over the bands also opens the inspect.',
    dataset: 'standard',
    coverage: ['ChartInspect.children', 'thresholds=[3 bands]'],
    render: () => (
      <BulletVariationChart bulletProps={(data) => ({ thresholds: getBulletThresholds(data) })}>
        <ChartInspect>{inspectContent}</ChartInspect>
      </BulletVariationChart>
    ),
  },
  {
    id: 'inspect-track',
    title: 'ChartInspect with track',
    description: 'A transparent hover area over the track also opens the inspect.',
    dataset: 'standard',
    coverage: ['ChartInspect.children', 'track=true', 'showTargetValue=true'],
    render: () => (
      <BulletVariationChart bulletProps={{ showTargetValue: true, track: true }}>
        <ChartInspect>{inspectContent}</ChartInspect>
      </BulletVariationChart>
    ),
  },
  {
    id: 'inspect-thresholds-hidden-target',
    title: 'ChartInspect with thresholds and hidden target',
    description: 'The threshold hover area ignores showTargetValue when the target is hidden.',
    dataset: 'standard',
    coverage: ['ChartInspect.children', 'thresholds=[3 bands]', 'showTarget=false', 'showTargetValue=true'],
    render: () => (
      <BulletVariationChart
        bulletProps={(data) => ({ showTarget: false, showTargetValue: true, thresholds: getBulletThresholds(data) })}
      >
        <ChartInspect>{inspectContent}</ChartInspect>
      </BulletVariationChart>
    ),
  },
  {
    id: 'inspect-exclude-keys',
    title: 'ChartInspect excluded rows',
    description: 'The first row sets excludeFromInspect, so hovering it opens nothing.',
    dataset: 'standard',
    coverage: ['ChartInspect.excludeDataKeys=[excludeFromInspect]'],
    render: () => (
      <BulletVariationChart data={withInspectExclusion}>
        <ChartInspect excludeDataKeys={['excludeFromInspect']}>{inspectContent}</ChartInspect>
      </BulletVariationChart>
    ),
  },
  {
    id: 'named-interactive',
    title: 'Named interactive bullet',
    description: 'A custom name prefixes the interactive mark names.',
    dataset: 'standard',
    coverage: ['name=kpiBullet', 'ChartInspect.children'],
    render: () => (
      <BulletVariationChart bulletProps={{ name: 'kpiBullet' }}>
        <ChartInspect>{inspectContent}</ChartInspect>
      </BulletVariationChart>
    ),
  },
];

const chartVariations: Variation[] = [
  {
    id: 'chart-title',
    title: 'Chart title',
    description: 'Adds a start-aligned Title sibling above the bullets.',
    dataset: 'standard',
    coverage: ['Title.text', 'Title.position=start', 'Title.orient=top'],
    render: () => <BulletVariationChart title={{ text: 'Quarterly KPIs', position: 'start', orient: 'top' }} />,
  },
  {
    id: 'chart-title-styled',
    title: 'Styled bottom title',
    description: 'A centered, larger, normal-weight Title below the bullets.',
    dataset: 'standard',
    coverage: ['Title.position=middle', 'Title.orient=bottom', 'Title.fontSize=18', 'Title.fontWeight=normal'],
    render: () => (
      <BulletVariationChart
        title={{ text: 'Quarterly KPIs', position: 'middle', orient: 'bottom', fontSize: 18, fontWeight: 'normal' }}
      />
    ),
  },
  {
    id: 'dark-background',
    title: 'Dark color scheme',
    description: 'Labels, target and track on a dark background.',
    dataset: 'standard',
    coverage: ['Chart.colorScheme=dark', 'Chart.backgroundColor=gray-25', 'track=true', 'showTargetValue=true'],
    render: () => (
      <BulletVariationChart
        chartProps={{ backgroundColor: 'gray-25', colorScheme: 'dark' }}
        bulletProps={{ showTargetValue: true, track: true }}
      />
    ),
  },
  {
    id: 'dark-side-labels',
    title: 'Dark side labels and metric axis',
    description: 'Side axis labels and the metric axis on a dark background.',
    dataset: 'standard',
    coverage: ['Chart.colorScheme=dark', 'labelPosition=side', 'metricAxis=true'],
    render: () => (
      <BulletVariationChart
        chartProps={{ backgroundColor: 'gray-25', colorScheme: 'dark' }}
        bulletProps={{ labelPosition: 'side', metricAxis: true }}
      />
    ),
  },
  {
    id: 'locale',
    title: 'German locale',
    description: 'Formats values and target values with de-DE separators.',
    dataset: 'largeValues',
    usesDashboardDataset: false,
    coverage: ['Chart.locale=de-DE', 'numberFormat=,.2f', 'showTargetValue=true'],
    render: () => (
      <BulletVariationChart
        data={bulletVariationDatasets.largeValues}
        chartProps={{ locale: 'de-DE' }}
        bulletProps={{ numberFormat: ',.2f', showTargetValue: true }}
      />
    ),
  },
  {
    id: 'tooltip-anchor-mark',
    title: 'Inspect anchored to mark',
    description: 'tooltipAnchor="mark" places the inspect above the hovered mark.',
    dataset: 'standard',
    coverage: ['Chart.tooltipAnchor=mark', 'Chart.tooltipPlacement=top', 'ChartInspect.children'],
    render: () => (
      <BulletVariationChart chartProps={{ tooltipAnchor: 'mark', tooltipPlacement: 'top' }}>
        <ChartInspect>{inspectContent}</ChartInspect>
      </BulletVariationChart>
    ),
  },
  {
    id: 'chart-padding',
    title: 'Chart padding',
    description: 'Adds 24px of Vega padding around the bullets.',
    dataset: 'standard',
    coverage: ['Chart.padding=24'],
    render: () => <BulletVariationChart chartProps={{ padding: 24 }} />,
  },
  {
    id: 'empty-state',
    title: 'Empty data',
    description: 'Shows the empty state text when data is an empty array.',
    dataset: 'empty',
    usesDashboardDataset: false,
    coverage: ['Chart.emptyStateText', 'data=[]'],
    render: () => <BulletVariationChart data={[]} chartProps={{ emptyStateText: 'No KPI data' }} />,
  },
  {
    id: 'loading',
    title: 'Loading',
    description: 'Shows the loading spinner in place of the bullets.',
    dataset: 'standard',
    coverage: ['Chart.loading=true'],
    render: () => <BulletVariationChart chartProps={{ loading: true }} />,
  },
];

export const bulletVariations: Variation[] = [
  ...baseBulletVariations,
  ...scaleVariations,
  ...targetVariations,
  ...numberFormatVariations,
  ...backgroundVariations,
  ...dataVariations,
  ...childVariations,
  ...chartVariations,
];

export const BulletDashboard = (): ReactElement => (
  <VariationDashboard
    variations={bulletVariations}
    coverage={dashboard.coverage}
    chartType="Bullet"
    datasets={bulletDatasetOptions}
    filters={bulletVariationFilters}
    getSizeDescription={(size) => `Chart width: ${size}px`}
    initialSize={360}
    initialDataset="standard"
    initialFilter="all"
    initialViewMode="plain"
    sizePresets={bulletSizePresets}
    viewModes={bulletViewModes}
  />
);

const bulletCoverage: PropCoverage<BulletProps> = {
  children: ['inspect-default', 'inspect-thresholds', 'inspect-track', 'inspect-thresholds-hidden-target'],
  color: ['defaults', 'color-token', 'color-css'],
  dimension: ['defaults', 'custom-keys'],
  direction: ['defaults', 'direction-row', 'direction-row-side-labels', 'thresholds-row', 'track-row'],
  labelPosition: ['defaults', 'label-side', 'label-side-target-value', 'direction-row-side-labels'],
  maxScaleValue: [
    'scale-fixed-below',
    'scale-fixed-above',
    'scale-fixed-invalid',
    'scale-flexible-below',
    'scale-flexible-above',
  ],
  metric: ['defaults', 'custom-keys', 'negative-values', 'zero-values'],
  metricAxis: [
    'metric-axis',
    'metric-axis-fixed-scale',
    'metric-axis-target-value',
    'metric-axis-hidden-target',
    'metric-axis-row',
  ],
  metricLabel: ['metric-label', 'metric-label-side'],
  name: ['defaults', 'named-interactive'],
  numberFormat: [
    'defaults',
    'number-format-short-number',
    'number-format-currency',
    'number-format-short-currency',
    'number-format-d3',
    'locale',
  ],
  scaleType: ['defaults', 'scale-fixed-below', 'scale-fixed-above', 'scale-flexible-below', 'scale-flexible-above'],
  showTarget: ['defaults', 'hide-target', 'target-value-hidden-target'],
  showTargetValue: ['target-value', 'target-value-hidden-target', 'target-value-row', 'missing-target'],
  target: ['defaults', 'custom-keys', 'missing-target', 'zero-values'],
  targetLabel: ['target-label'],
  thresholdBarColor: ['threshold-bar-color', 'threshold-bar-color-no-thresholds', 'negative-thresholds'],
  thresholds: [
    'thresholds',
    'thresholds-open-ended',
    'thresholds-row',
    'thresholds-target-value',
    'thresholds-and-track',
    'negative-thresholds',
  ],
  track: ['track', 'track-row', 'track-target-value', 'thresholds-and-track'],
};

const chartInspectCoverage: PropCoverage<ChartInspectProps> = {
  children: [
    'inspect-default',
    'inspect-thresholds',
    'inspect-track',
    'inspect-thresholds-hidden-target',
    'named-interactive',
  ],
  excludeDataKeys: ['inspect-exclude-keys'],
  highlightBy: { skip: 'Bullet marks have no hover highlight encoding, so every mode looks the same' },
  targets: { skip: 'Bullet has no dimension hover area; only the item target applies' },
};

const titleCoverage: SiblingCoverage<TitleProps> = {
  fontSize: ['chart-title-styled'],
  fontWeight: ['chart-title-styled'],
  orient: ['chart-title', 'chart-title-styled'],
  position: ['chart-title', 'chart-title-styled'],
  text: ['chart-title', 'chart-title-styled'],
};

const chartCoverage: SiblingCoverage<ChartProps> = {
  animations: { skip: 'Bullet has no hover or draw-in animations' },
  animationTypes: { skip: 'Bullet has no hover or draw-in animations' },
  backgroundColor: ['dark-background', 'dark-side-labels'],
  colors: { skip: 'Bullet colors come from the color and thresholds props, not the chart palette' },
  colorScheme: ['dark-background', 'dark-side-labels'],
  emptyStateText: ['empty-state'],
  hiddenSeries: { skip: 'Bullet has no series facet to hide' },
  highlightedItem: { skip: 'Bullet marks have no highlight encoding' },
  highlightedSeries: { skip: 'Bullet has no series facet to highlight' },
  idKey: { skip: 'Only used for controlled highlighting, which Bullet does not support' },
  loading: ['loading'],
  locale: ['locale'],
  padding: ['chart-padding'],
  renderer: { skip: 'Covered by the dashboard Renderer control' },
  tooltipAnchor: ['tooltip-anchor-mark'],
  tooltipPlacement: ['tooltip-anchor-mark'],
};

export const dashboard: DashboardDefinition = {
  chartType: 'Bullet',
  variations: bulletVariations,
  coverage: {
    Bullet: bulletCoverage,
    ChartInspect: chartInspectCoverage,
    Title: titleCoverage,
    Chart: chartCoverage,
  },
};
