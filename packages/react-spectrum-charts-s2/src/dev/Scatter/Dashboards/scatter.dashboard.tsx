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
import { ReactElement, ReactNode, useState } from 'react';

import { TRENDLINE_VALUE } from '@spectrum-charts/core-s2/constants';
import { Datum } from '@spectrum-charts/vega-spec-builder-s2';

import { Chart } from '../../../Chart.js';
import { Axis, ChartInspect, ChartPopover, Legend, ReferenceLine, Title } from '../../../components/index.js';
import useChartProps from '../../../hooks/useChartProps.js';
import { Scatter, ScatterAnnotation, ScatterPath, Trendline, TrendlineAnnotation } from '../../../pre-alpha/index.js';
import {
  AxisProps,
  ChartInspectProps,
  ChartPopoverProps,
  ChartProps,
  LegendProps,
  ReferenceLineProps,
  ScatterAnnotationProps,
  ScatterPathProps,
  ScatterProps,
  TitleProps,
  TrendlineAnnotationProps,
  TrendlineProps,
} from '../../../types/index.js';
import {
  Variation,
  VariationDashboard,
  VariationFilter,
  VariationSizePreset,
  VariationViewMode,
  useVariationAnimations,
  useVariationDataset,
  useVariationRenderer,
  useVariationSize,
  useVariationViewMode,
} from '../../VariationDashboard.js';
import { DashboardDefinition, PropCoverage, SiblingCoverage } from '../../dashboardCoverage.js';
import {
  ScatterVariationDatasetName,
  ScatterVariationDatum,
  getFirstSeries,
  getScatterSeries,
  scatterDatasetOptions,
  scatterVariationDatasets,
} from './scatterVariationData.js';

const scatterSizePresets: VariationSizePreset[] = [
  { label: 'XS', size: 160 },
  { label: 'S', size: 240 },
  { label: 'M', size: 360 },
  { label: 'L', size: 480 },
  { label: 'XL', size: 720 },
];

const scatterViewModes: VariationViewMode[] = [
  { label: 'Axes', value: 'axes' },
  { label: 'Axes and legend', value: 'axesLegend' },
  { label: 'Points only', value: 'none' },
];

const dashboardAnimationTypes: ChartProps['animationTypes'] = ['hover'];
const SCATTER_ASPECT_RATIO = 0.75;

const SCATTER_CHILDREN = new Set([
  'ScatterPath',
  'ScatterAnnotation',
  'Trendline',
  'TrendlineAnnotation',
  'ChartInspect',
  'ChartPopover',
]);
const SIBLINGS = new Set(['Axis', 'Chart', 'Legend', 'ReferenceLine', 'Title']);

const getCoverageComponent = (entry: string): string => entry.split(/[.=[]/)[0];
const coversAny =
  (components: Set<string>) =>
  ({ coverage }: Variation): boolean =>
    coverage.some((entry) => components.has(getCoverageComponent(entry)));
const coversScatterProp = ({ coverage }: Variation): boolean =>
  coverage.some((entry) => /^[a-z]/.test(getCoverageComponent(entry)));

const scatterVariationFilters: VariationFilter[] = [
  { label: 'All', value: 'all', matches: () => true },
  { label: 'Scatter props', value: 'scatter', matches: coversScatterProp },
  { label: 'Children', value: 'children', matches: coversAny(SCATTER_CHILDREN) },
  { label: 'Siblings & Chart', value: 'siblings', matches: coversAny(SIBLINGS) },
];

const {
  largeValues: largeValueData,
  outliers: outlierData,
  overlapping: overlappingData,
  single: singleData,
  trajectory: trajectoryData,
} = scatterVariationDatasets;

const formatDatum = (datum: Datum): string => `${String(datum.series)} · x ${datum.x} · ${datum.value}`;

const inspectContent = (datum: Datum): ReactNode => (
  <div>
    <div>{String(datum.series)}</div>
    <div>x: {String(datum.x)}</div>
    <div>value: {String(datum.value)}</div>
  </div>
);

const trendlineInspectContent = (datum: Datum): ReactNode => (
  <div>
    <div>{String(datum.series)} trend</div>
    <div>Trend value: {Number(datum[TRENDLINE_VALUE]).toFixed(1)}</div>
  </div>
);

const popoverContent = (datum: Datum, close: () => void): ReactNode => (
  <div>
    <div>{formatDatum(datum)}</div>
    <button type="button" onClick={close}>
      Close
    </button>
  </div>
);

type ScatterChartOverrides = Omit<Partial<ChartProps>, 'children' | 'data'>;
type DataFunction<T> = T | ((data: ScatterVariationDatum[]) => T);

const resolve = <T,>(value: DataFunction<T> | undefined, data: ScatterVariationDatum[]): T | undefined =>
  typeof value === 'function' ? (value as (data: ScatterVariationDatum[]) => T)(data) : value;

interface ScatterVariationChartProps extends Pick<ScatterProps, 'children'> {
  /** Fixed data, or a function deriving data from the active dataset. */
  data?: DataFunction<ScatterVariationDatum[]>;
  /** Scatter prop overrides; `color` defaults to `series`. */
  scatterProps?: DataFunction<Omit<ScatterProps, 'children'>>;
  /** Chart prop overrides; functions receive the active dataset. */
  chartProps?: DataFunction<ScatterChartOverrides>;
  /** Replaces the default axes in every view mode. */
  axes?: (data: ScatterVariationDatum[]) => ReactNode;
  /** Replaces the default legend in every view mode. */
  legend?: (data: ScatterVariationDatum[]) => ReactNode;
  /** Extra chart-level siblings such as Title. */
  siblings?: (data: ScatterVariationDatum[]) => ReactNode;
}

const DefaultAxes = (): ReactElement[] => [
  <Axis key="dimension" position="bottom" baseline grid ticks />,
  <Axis key="metric" position="left" grid numberFormat="shortNumber" />,
];

const ScatterVariationChart = ({
  data,
  scatterProps,
  children,
  chartProps: chartPropOverrides,
  axes,
  legend,
  siblings,
}: ScatterVariationChartProps): ReactElement => {
  const selectedDataset = useVariationDataset();
  const size = useVariationSize();
  const viewMode = useVariationViewMode();
  const animations = useVariationAnimations();
  const renderer = useVariationRenderer();
  if (!selectedDataset || !(selectedDataset in scatterVariationDatasets)) {
    throw new Error(`Unknown Scatter variation dataset: ${selectedDataset}`);
  }
  const datasetData = scatterVariationDatasets[selectedDataset as ScatterVariationDatasetName];
  const chartData = resolve(data, datasetData) ?? datasetData;
  const chartProps = useChartProps({
    data: chartData,
    width: size,
    height: Math.round(size * SCATTER_ASPECT_RATIO),
  });
  const showDefaultAxes = viewMode !== 'none';
  let legendNode: ReactNode = null;
  if (legend) {
    legendNode = legend(chartData);
  } else if (viewMode === 'axesLegend') {
    legendNode = <Legend highlight />;
  }
  return (
    <Chart
      {...chartProps}
      animations={animations}
      animationTypes={animations === undefined ? undefined : dashboardAnimationTypes}
      renderer={renderer}
      {...resolve(chartPropOverrides, chartData)}
    >
      {axes ? axes(chartData) : showDefaultAxes && DefaultAxes()}
      {siblings?.(chartData)}
      <Scatter color="series" {...resolve(scatterProps, chartData)}>
        {children}
      </Scatter>
      {legendNode}
    </Chart>
  );
};

/** Renders a variation with an `<output>` showing the most recent callback event. */
const CallbackVariation = ({ render }: { render: (log: (message: string) => void) => ReactElement }): ReactElement => {
  const [lastEvent, setLastEvent] = useState('No events yet');
  return (
    <div>
      {render(setLastEvent)}
      <output style={{ display: 'block', fontSize: 12 }}>{lastEvent}</output>
    </div>
  );
};

const customAxes =
  (dimensionAxisProps: Omit<AxisProps, 'position'>, metricAxisProps: Omit<AxisProps, 'position'> = {}) =>
  (): ReactElement[] =>
    [
      <Axis key="dimension" position="bottom" baseline grid ticks {...dimensionAxisProps} />,
      <Axis key="metric" position="left" grid numberFormat="shortNumber" {...metricAxisProps} />,
    ];

const timeAxes = customAxes({ granularity: 'week', labelFormat: 'time' });
const clippedMetricAxes = customAxes({}, { range: [0, 50] });

const baseScatterVariations: Variation[] = [
  {
    id: 'defaults',
    title: 'Defaults',
    description: 'Every Scatter default: one static color, medium points, no outline, multiply blend.',
    dataset: 'standard',
    coverage: [
      'color={value:categorical-100}',
      'colorScaleType=ordinal',
      'dimension=x',
      'dimensionScaleType=linear',
      'metric=value',
      'size={value:M}',
      'opacity={value:1}',
      'lineType={value:solid}',
      'lineWidth={value:0}',
      'blend=multiply',
      'clip=false',
      'name=scatter0',
    ],
    render: () => <ScatterVariationChart scatterProps={{ color: undefined }} />,
  },
  {
    id: 'color-series',
    title: 'Color by series',
    description: 'Each series gets a categorical color.',
    dataset: 'standard',
    coverage: ['color=series'],
    render: () => <ScatterVariationChart />,
  },
  {
    id: 'color-static',
    title: 'Static color',
    description: 'Every point uses one Spectrum color.',
    dataset: 'standard',
    coverage: ['color={value:magenta-900}'],
    render: () => <ScatterVariationChart scatterProps={{ color: { value: 'magenta-900' } }} />,
  },
  {
    id: 'color-linear',
    title: 'Linear color scale',
    description: 'Colors points by the numeric `weight` field on a sequential palette.',
    dataset: 'standard',
    coverage: ['color=weight', 'colorScaleType=linear', 'Chart.colors=sequentialViridis5'],
    render: () => (
      <ScatterVariationChart
        chartProps={{ colors: 'sequentialViridis5' }}
        scatterProps={{ color: 'weight', colorScaleType: 'linear' }}
      />
    ),
  },
  {
    id: 'custom-keys',
    title: 'Custom dimension and metric',
    description: 'Plots `satisfaction` against `adoption`.',
    dataset: 'standard',
    coverage: ['dimension=adoption', 'metric=satisfaction'],
    render: () => <ScatterVariationChart scatterProps={{ dimension: 'adoption', metric: 'satisfaction' }} />,
  },
  {
    id: 'dimension-time',
    title: 'Time dimension',
    description: 'Plots `datetime` on a time scale labeled by week.',
    dataset: 'standard',
    coverage: ['dimensionScaleType=time', 'dimension=datetime', 'Axis.labelFormat=time', 'Axis.granularity=week'],
    render: () => (
      <ScatterVariationChart axes={timeAxes} scatterProps={{ dimension: 'datetime', dimensionScaleType: 'time' }} />
    ),
  },
  {
    id: 'size-key',
    title: 'Size by field',
    description: 'Point area scales with the numeric `weight` field.',
    dataset: 'standard',
    coverage: ['size=weight'],
    render: () => <ScatterVariationChart scatterProps={{ size: 'weight' }} />,
  },
  {
    id: 'size-static',
    title: 'Large static size',
    description: 'Every point uses the XL size token.',
    dataset: 'standard',
    coverage: ['size={value:XL}'],
    render: () => <ScatterVariationChart scatterProps={{ size: { value: 'XL' } }} />,
  },
  {
    id: 'size-pixels',
    title: 'Numeric static size',
    description: 'Every point has an area of 24 square pixels.',
    dataset: 'standard',
    coverage: ['size={value:24}'],
    render: () => <ScatterVariationChart scatterProps={{ size: { value: 24 } }} />,
  },
  {
    id: 'opacity-static',
    title: 'Static opacity',
    description: 'Every point is 40% opaque.',
    dataset: 'standard',
    coverage: ['opacity={value:0.4}'],
    render: () => <ScatterVariationChart scatterProps={{ opacity: { value: 0.4 } }} />,
  },
  {
    id: 'opacity-key',
    title: 'Opacity by field',
    description: 'New and Returning points get different opacities.',
    dataset: 'standard',
    coverage: ['opacity=segment'],
    render: () => <ScatterVariationChart scatterProps={{ opacity: 'segment', size: { value: 'L' } }} />,
  },
  {
    id: 'line-width-static',
    title: 'Outlined points',
    description: 'Translucent fill with a medium outline in the series color.',
    dataset: 'standard',
    coverage: ['lineWidth={value:M}', 'opacity={value:0.3}'],
    render: () => (
      <ScatterVariationChart
        scatterProps={{ lineWidth: { value: 'M' }, opacity: { value: 0.3 }, size: { value: 'L' } }}
      />
    ),
  },
  {
    id: 'line-width-key',
    title: 'Outline width by field',
    description: 'New and Returning points get different outline widths.',
    dataset: 'standard',
    coverage: ['lineWidth=segment'],
    render: () => (
      <ScatterVariationChart scatterProps={{ lineWidth: 'segment', opacity: { value: 0.3 }, size: { value: 'L' } }} />
    ),
  },
  {
    id: 'line-type-static',
    title: 'Dotted outline',
    description: 'Large points with a dark dotted outline.',
    dataset: 'standard',
    coverage: ['lineType={value:dotted}', 'lineWidth={value:M}'],
    render: () => (
      <ScatterVariationChart
        scatterProps={{
          lineType: { value: 'dotted' },
          lineWidth: { value: 'M' },
          size: { value: 'XL' },
          stroke: { value: 'gray-800' },
        }}
      />
    ),
  },
  {
    id: 'line-type-key',
    title: 'Outline type by field',
    description: 'New points are solid and Returning points are dashed.',
    dataset: 'standard',
    coverage: ['lineType=segment', 'lineWidth={value:S}'],
    render: () => (
      <ScatterVariationChart
        scatterProps={{
          lineType: 'segment',
          lineWidth: { value: 'S' },
          opacity: { value: 0.3 },
          size: { value: 'XL' },
        }}
      />
    ),
  },
  {
    id: 'stroke-static',
    title: 'Static stroke',
    description: 'Series-colored points with a dark outline.',
    dataset: 'standard',
    coverage: ['stroke={value:gray-900}', 'lineWidth={value:S}'],
    render: () => (
      <ScatterVariationChart
        scatterProps={{ lineWidth: { value: 'S' }, size: { value: 'L' }, stroke: { value: 'gray-900' } }}
      />
    ),
  },
  {
    id: 'stroke-key',
    title: 'Stroke by field',
    description: 'Gray points outlined in a color per segment.',
    dataset: 'standard',
    coverage: ['stroke=segment', 'lineWidth={value:M}'],
    render: () => (
      <ScatterVariationChart
        scatterProps={{
          color: { value: 'gray-300' },
          lineWidth: { value: 'M' },
          size: { value: 'L' },
          stroke: 'segment',
        }}
      />
    ),
  },
  {
    id: 'blend-default',
    title: 'Default blend',
    description: 'Overlapping points multiply in light mode, so overlaps darken.',
    dataset: 'overlapping',
    usesDashboardDataset: false,
    coverage: ['blend=multiply'],
    render: () => <ScatterVariationChart data={overlappingData} scatterProps={{ size: { value: 'XL' } }} />,
  },
  {
    id: 'blend-normal',
    title: 'Normal blend',
    description: 'Disables blending, so later points fully cover earlier ones.',
    dataset: 'overlapping',
    usesDashboardDataset: false,
    coverage: ['blend=normal'],
    render: () => (
      <ScatterVariationChart data={overlappingData} scatterProps={{ blend: 'normal', size: { value: 'XL' } }} />
    ),
  },
  {
    id: 'blend-darken',
    title: 'Darken blend',
    description: 'Overlaps keep the darker of the two colors.',
    dataset: 'overlapping',
    usesDashboardDataset: false,
    coverage: ['blend=darken'],
    render: () => (
      <ScatterVariationChart data={overlappingData} scatterProps={{ blend: 'darken', size: { value: 'XL' } }} />
    ),
  },
  {
    id: 'clip-off',
    title: 'Unclipped overflow',
    description: 'The metric axis stops at 50; points above it draw outside the plot.',
    dataset: 'standard',
    coverage: ['clip=false', 'Axis.range=[0,50]'],
    render: () => <ScatterVariationChart axes={clippedMetricAxes} />,
  },
  {
    id: 'clip-on',
    title: 'Clipped overflow',
    description: 'Same axis range; points above 50 are clipped at the plot edge.',
    dataset: 'standard',
    coverage: ['clip=true', 'Axis.range=[0,50]'],
    render: () => <ScatterVariationChart axes={clippedMetricAxes} scatterProps={{ clip: true }} />,
  },
];

const interactionVariations: Variation[] = [
  {
    id: 'named-interactive',
    title: 'Named scatter with popover',
    description: 'Sets a custom mark name; hover and click must still work.',
    dataset: 'standard',
    coverage: ['name=retention', 'ChartInspect', 'ChartPopover'],
    render: () => (
      <ScatterVariationChart scatterProps={{ name: 'retention' }}>
        <ChartInspect>{inspectContent}</ChartInspect>
        <ChartPopover width="auto">{popoverContent}</ChartPopover>
      </ScatterVariationChart>
    ),
  },
  {
    id: 'inspect-default',
    title: 'ChartInspect',
    description: 'Hover near a point to show inspect content; other points fade.',
    dataset: 'standard',
    coverage: ['ChartInspect.children', 'ChartInspect.highlightBy=item'],
    render: () => (
      <ScatterVariationChart>
        <ChartInspect>{inspectContent}</ChartInspect>
      </ScatterVariationChart>
    ),
  },
  {
    id: 'inspect-highlight-series',
    title: 'Inspect highlights series',
    description: 'Hovering keeps the whole series emphasized.',
    dataset: 'standard',
    coverage: ['ChartInspect.highlightBy=series'],
    render: () => (
      <ScatterVariationChart>
        <ChartInspect highlightBy="series">{inspectContent}</ChartInspect>
      </ScatterVariationChart>
    ),
  },
  {
    id: 'inspect-highlight-dimension',
    title: 'Inspect highlights dimension',
    description: 'Hovering highlights every point that shares the hovered x value.',
    dataset: 'duplicatePoints',
    usesDashboardDataset: false,
    coverage: ['ChartInspect.highlightBy=dimension'],
    render: () => (
      <ScatterVariationChart data={scatterVariationDatasets.duplicatePoints} scatterProps={{ blend: 'normal' }}>
        <ChartInspect highlightBy="dimension">{inspectContent}</ChartInspect>
      </ScatterVariationChart>
    ),
  },
  {
    id: 'inspect-highlight-keys',
    title: 'Inspect highlights by keys',
    description: 'Highlights every point sharing the hovered `segment` value.',
    dataset: 'standard',
    coverage: ['ChartInspect.highlightBy=[segment]'],
    render: () => (
      <ScatterVariationChart>
        <ChartInspect highlightBy={['segment']}>{inspectContent}</ChartInspect>
      </ScatterVariationChart>
    ),
  },
  {
    id: 'inspect-exclude-keys',
    title: 'Inspect with excluded data',
    description: 'The first series has `excludeFromInspect`, so hovering it shows no inspect.',
    dataset: 'standard',
    coverage: ['ChartInspect.excludeDataKeys=[excludeFromInspect]'],
    render: () => (
      <ScatterVariationChart>
        <ChartInspect excludeDataKeys={['excludeFromInspect']}>{inspectContent}</ChartInspect>
      </ScatterVariationChart>
    ),
  },
  {
    id: 'popover-default',
    title: 'ChartPopover',
    description: 'Click a point to open a popover and ring the selected point.',
    dataset: 'standard',
    coverage: ['ChartPopover.children', 'ChartPopover.width=auto'],
    render: () => (
      <ScatterVariationChart>
        <ChartPopover width="auto">{popoverContent}</ChartPopover>
      </ScatterVariationChart>
    ),
  },
  {
    id: 'popover-size-key',
    title: 'Popover ring on sized points',
    description: 'The selection ring grows with the size-faceted point.',
    dataset: 'standard',
    coverage: ['size=weight', 'ChartPopover'],
    render: () => (
      <ScatterVariationChart scatterProps={{ size: 'weight' }}>
        <ChartPopover width="auto">{popoverContent}</ChartPopover>
      </ScatterVariationChart>
    ),
  },
  {
    id: 'popover-fixed-size',
    title: 'Fixed-size popover',
    description: 'Popover is exactly 240 × 120px.',
    dataset: 'standard',
    coverage: ['ChartPopover.width=240', 'ChartPopover.height=120'],
    render: () => (
      <ScatterVariationChart>
        <ChartPopover height={120} width={240}>
          {popoverContent}
        </ChartPopover>
      </ScatterVariationChart>
    ),
  },
  {
    id: 'popover-bounds',
    title: 'Bounded popover',
    description: 'Auto-sized popover constrained by min/max sizes with custom padding and margin.',
    dataset: 'standard',
    coverage: [
      'ChartPopover.minWidth',
      'ChartPopover.maxWidth',
      'ChartPopover.minHeight',
      'ChartPopover.maxHeight',
      'ChartPopover.containerPadding',
      'ChartPopover.contentMargin',
    ],
    render: () => (
      <ScatterVariationChart>
        <ChartPopover
          containerPadding={24}
          contentMargin={16}
          height="auto"
          maxHeight={160}
          maxWidth={220}
          minHeight={100}
          minWidth={180}
          width="auto"
        >
          {popoverContent}
        </ChartPopover>
      </ScatterVariationChart>
    ),
  },
  {
    id: 'popover-right-click',
    title: 'Right-click popover',
    description: 'Opens the popover on right click instead of left click.',
    dataset: 'standard',
    coverage: ['ChartPopover.rightClick=true'],
    render: () => (
      <ScatterVariationChart>
        <ChartPopover rightClick>{popoverContent}</ChartPopover>
      </ScatterVariationChart>
    ),
  },
  {
    id: 'popover-open-change',
    title: 'Popover onOpenChange',
    description: 'Open and close the popover; the latest open state is shown below the chart.',
    dataset: 'standard',
    coverage: ['ChartPopover.onOpenChange'],
    render: () => (
      <CallbackVariation
        render={(log) => (
          <ScatterVariationChart>
            <ChartPopover onOpenChange={(isOpen) => log(`Popover open: ${isOpen}`)}>{popoverContent}</ChartPopover>
          </ScatterVariationChart>
        )}
      />
    ),
  },
];

const pathVariations: Variation[] = [
  {
    id: 'path-default',
    title: 'ScatterPath',
    description: 'Gray translucent trails connect each series in data order.',
    dataset: 'trajectory',
    usesDashboardDataset: false,
    coverage: [
      'ScatterPath.groupBy=[series]',
      'ScatterPath.color=gray-500',
      'ScatterPath.opacity=0.5',
      'ScatterPath.pathWidth={value:M}',
    ],
    render: () => (
      <ScatterVariationChart data={trajectoryData}>
        <ScatterPath />
      </ScatterVariationChart>
    ),
  },
  {
    id: 'path-group-by',
    title: 'Path grouped by segment',
    description: 'One series colored by segment; New and Returning points form two paths.',
    dataset: 'standard',
    coverage: ['ScatterPath.groupBy=[segment]'],
    render: () => (
      <ScatterVariationChart data={getFirstSeries} scatterProps={{ color: 'segment' }}>
        <ScatterPath groupBy={['segment']} />
      </ScatterVariationChart>
    ),
  },
  {
    id: 'path-color-opacity',
    title: 'Colored path',
    description: 'A blue, mostly opaque path.',
    dataset: 'trajectory',
    usesDashboardDataset: false,
    coverage: ['ScatterPath.color=blue-500', 'ScatterPath.opacity=0.8'],
    render: () => (
      <ScatterVariationChart data={trajectoryData}>
        <ScatterPath color="blue-500" groupBy={['series']} opacity={0.8} />
      </ScatterVariationChart>
    ),
  },
  {
    id: 'path-width-key',
    title: 'Path width by field',
    description: 'Trail width varies point to point with `weight`.',
    dataset: 'trajectory',
    usesDashboardDataset: false,
    coverage: ['ScatterPath.pathWidth=weight'],
    render: () => (
      <ScatterVariationChart data={trajectoryData}>
        <ScatterPath groupBy={['series']} pathWidth="weight" />
      </ScatterVariationChart>
    ),
  },
  {
    id: 'path-width-static',
    title: 'Wide static path',
    description: 'Every trail uses the XL path width.',
    dataset: 'trajectory',
    usesDashboardDataset: false,
    coverage: ['ScatterPath.pathWidth={value:XL}'],
    render: () => (
      <ScatterVariationChart data={trajectoryData}>
        <ScatterPath groupBy={['series']} pathWidth={{ value: 'XL' }} />
      </ScatterVariationChart>
    ),
  },
  {
    id: 'path-popover',
    title: 'Path with popover',
    description: 'Clicking a point fades the paths while the popover is open.',
    dataset: 'trajectory',
    usesDashboardDataset: false,
    coverage: ['ScatterPath', 'ChartPopover'],
    render: () => (
      <ScatterVariationChart data={trajectoryData}>
        <ScatterPath groupBy={['series']} />
        <ChartPopover width="auto">{popoverContent}</ChartPopover>
      </ScatterVariationChart>
    ),
  },
];

const annotationVariations: Variation[] = [
  {
    id: 'annotation-default',
    title: 'ScatterAnnotation',
    description: 'Labels each point with its metric value where it fits.',
    dataset: 'standard',
    coverage: ['ScatterAnnotation.textKey=value', 'ScatterAnnotation.anchor=[right,top,bottom,left]'],
    render: () => (
      <ScatterVariationChart>
        <ScatterAnnotation />
      </ScatterVariationChart>
    ),
  },
  {
    id: 'annotation-text-key',
    title: 'Annotation text key',
    description: 'Labels points with the short `label` field.',
    dataset: 'standard',
    coverage: ['ScatterAnnotation.textKey=label'],
    render: () => (
      <ScatterVariationChart>
        <ScatterAnnotation textKey="label" />
      </ScatterVariationChart>
    ),
  },
  {
    id: 'annotation-anchor-single',
    title: 'Single annotation anchor',
    description: 'Only places labels above points; labels that collide are dropped.',
    dataset: 'standard',
    coverage: ['ScatterAnnotation.anchor=top'],
    render: () => (
      <ScatterVariationChart>
        <ScatterAnnotation anchor="top" textKey="label" />
      </ScatterVariationChart>
    ),
  },
  {
    id: 'annotation-anchor-list',
    title: 'Annotation anchor list',
    description: 'Tries left, then bottom.',
    dataset: 'standard',
    coverage: ['ScatterAnnotation.anchor=[left,bottom]'],
    render: () => (
      <ScatterVariationChart>
        <ScatterAnnotation anchor={['left', 'bottom']} textKey="label" />
      </ScatterVariationChart>
    ),
  },
  {
    id: 'annotation-inspect',
    title: 'Annotations with inspect',
    description: 'Hovering a point fades the other points and their labels.',
    dataset: 'standard',
    coverage: ['ScatterAnnotation', 'ChartInspect'],
    render: () => (
      <ScatterVariationChart>
        <ScatterAnnotation textKey="label" />
        <ChartInspect>{inspectContent}</ChartInspect>
      </ScatterVariationChart>
    ),
  },
];

const trendlineMethodVariation = (method: NonNullable<TrendlineProps['method']>, description: string): Variation => ({
  id: `trendline-${method}`,
  title: `${method.charAt(0).toUpperCase()}${method.slice(1)} trendline`,
  description,
  dataset: 'standard',
  coverage: [`Trendline.method=${method}`],
  render: () => (
    <ScatterVariationChart>
      <Trendline method={method} />
    </ScatterVariationChart>
  ),
});

const trendlineVariations: Variation[] = [
  {
    id: 'trendline-default',
    title: 'Trendline',
    description: 'A dashed linear regression per series in the series color.',
    dataset: 'standard',
    coverage: [
      'Trendline.method=linear',
      'Trendline.lineType=dashed',
      'Trendline.lineWidth=M',
      'Trendline.opacity=1',
      'Trendline.orientation=horizontal',
      'Trendline.dimensionRange=[null,null]',
    ],
    render: () => (
      <ScatterVariationChart>
        <Trendline />
      </ScatterVariationChart>
    ),
  },
  trendlineMethodVariation('average', 'A flat line at each series mean.'),
  trendlineMethodVariation('median', 'A flat line at each series median.'),
  trendlineMethodVariation('quadratic', 'A second-order polynomial fit per series.'),
  trendlineMethodVariation('polynomial-3', 'A third-order polynomial fit per series.'),
  trendlineMethodVariation('exponential', 'An exponential fit per series.'),
  trendlineMethodVariation('logarithmic', 'A logarithmic fit per series.'),
  trendlineMethodVariation('power', 'A power-law fit per series.'),
  {
    id: 'trendline-moving-average',
    title: 'Moving average',
    description: 'A 4-point moving average of each series.',
    dataset: 'standard',
    coverage: ['Trendline.method=movingAverage-4', 'Trendline.hidePartialWindows=false'],
    render: () => (
      <ScatterVariationChart>
        <Trendline method="movingAverage-4" />
      </ScatterVariationChart>
    ),
  },
  {
    id: 'trendline-hide-partial-windows',
    title: 'Moving average without partial windows',
    description: 'The first three points per series are not averaged, so the line starts later.',
    dataset: 'standard',
    coverage: ['Trendline.method=movingAverage-4', 'Trendline.hidePartialWindows=true'],
    render: () => (
      <ScatterVariationChart>
        <Trendline hidePartialWindows method="movingAverage-4" />
      </ScatterVariationChart>
    ),
  },
  {
    id: 'trendline-style',
    title: 'Trendline style',
    description: 'A thin, solid, half-opaque gray trendline.',
    dataset: 'standard',
    coverage: [
      'Trendline.color=gray-800',
      'Trendline.lineType=solid',
      'Trendline.lineWidth=XS',
      'Trendline.opacity=0.5',
    ],
    render: () => (
      <ScatterVariationChart>
        <Trendline color="gray-800" lineType="solid" lineWidth="XS" opacity={0.5} />
      </ScatterVariationChart>
    ),
  },
  {
    id: 'trendline-thick-dotted',
    title: 'Thick dotted trendline',
    description: 'A large dotted trendline in the series color.',
    dataset: 'standard',
    coverage: ['Trendline.lineType=dotted', 'Trendline.lineWidth=L'],
    render: () => (
      <ScatterVariationChart>
        <Trendline lineType="dotted" lineWidth="L" />
      </ScatterVariationChart>
    ),
  },
  {
    id: 'trendline-extent-domain',
    title: 'Trendline extended to the domain',
    description: 'Extrapolates each regression to both edges of the x domain.',
    dataset: 'standard',
    coverage: ['Trendline.dimensionExtent=[domain,domain]'],
    render: () => (
      <ScatterVariationChart>
        <Trendline dimensionExtent={['domain', 'domain']} />
      </ScatterVariationChart>
    ),
  },
  {
    id: 'trendline-extent-fixed',
    title: 'Fixed trendline extent',
    description: 'Draws each regression from x = 0 to x = 14.',
    dataset: 'standard',
    coverage: ['Trendline.dimensionExtent=[0,14]'],
    render: () => (
      <ScatterVariationChart>
        <Trendline dimensionExtent={[0, 14]} />
      </ScatterVariationChart>
    ),
  },
  {
    id: 'trendline-range',
    title: 'Trendline calculation range',
    description: 'Fits only points with 4 ≤ x ≤ 8 and draws over that range.',
    dataset: 'standard',
    coverage: ['Trendline.dimensionRange=[4,8]'],
    render: () => (
      <ScatterVariationChart>
        <Trendline dimensionRange={[4, 8]} />
      </ScatterVariationChart>
    ),
  },
  {
    id: 'trendline-range-extent',
    title: 'Partial range, full extent',
    description: 'Fits points with 4 ≤ x ≤ 8 but draws across the whole domain.',
    dataset: 'standard',
    coverage: ['Trendline.dimensionRange=[4,8]', 'Trendline.dimensionExtent=[domain,domain]'],
    render: () => (
      <ScatterVariationChart>
        <Trendline dimensionExtent={['domain', 'domain']} dimensionRange={[4, 8]} />
      </ScatterVariationChart>
    ),
  },
  {
    id: 'trendline-exclude-keys',
    title: 'Trendline excludes outliers',
    description: 'The trailing outlier in each series is left out of the fit.',
    dataset: 'outliers',
    usesDashboardDataset: false,
    coverage: ['Trendline.excludeDataKeys=[excludeFromTrendline]'],
    render: () => (
      <ScatterVariationChart data={outlierData}>
        <Trendline excludeDataKeys={['excludeFromTrendline']} />
      </ScatterVariationChart>
    ),
  },
  {
    id: 'trendline-outliers',
    title: 'Trendline with outliers',
    description: 'The same data without exclusions; outliers skew the fit.',
    dataset: 'outliers',
    usesDashboardDataset: false,
    coverage: ['Trendline.method=linear'],
    render: () => (
      <ScatterVariationChart data={outlierData}>
        <Trendline />
      </ScatterVariationChart>
    ),
  },
  {
    id: 'trendline-vertical',
    title: 'Vertical trendline',
    description: 'Regresses x on y, so the median is a vertical line per series.',
    dataset: 'standard',
    coverage: ['Trendline.orientation=vertical', 'Trendline.method=median'],
    render: () => (
      <ScatterVariationChart>
        <Trendline method="median" orientation="vertical" />
      </ScatterVariationChart>
    ),
  },
  {
    id: 'trendline-time',
    title: 'Trendline on a time dimension',
    description: 'A linear regression over normalized datetimes.',
    dataset: 'standard',
    coverage: ['Trendline.method=linear', 'dimensionScaleType=time'],
    render: () => (
      <ScatterVariationChart axes={timeAxes} scatterProps={{ dimension: 'datetime', dimensionScaleType: 'time' }}>
        <Trendline />
      </ScatterVariationChart>
    ),
  },
  {
    id: 'trendline-display-on-hover',
    title: 'Trendline on hover',
    description: 'The hovered series trendline appears only while hovering a point.',
    dataset: 'standard',
    coverage: ['Trendline.displayOnHover=true', 'ChartInspect'],
    render: () => (
      <ScatterVariationChart>
        <Trendline displayOnHover />
        <ChartInspect>{inspectContent}</ChartInspect>
      </ScatterVariationChart>
    ),
  },
  {
    id: 'trendline-inspect',
    title: 'Trendline inspect',
    description: 'Hover a trendline to see its value.',
    dataset: 'standard',
    coverage: ['Trendline.children', 'Trendline.highlightRawPoint=false', 'ChartInspect'],
    render: () => (
      <ScatterVariationChart>
        <Trendline>
          <ChartInspect>{trendlineInspectContent}</ChartInspect>
        </Trendline>
      </ScatterVariationChart>
    ),
  },
  {
    id: 'trendline-highlight-raw-point',
    title: 'Trendline highlights raw point',
    description: 'Hovering the trendline also highlights the matching scatter point.',
    dataset: 'standard',
    coverage: ['Trendline.highlightRawPoint=true', 'ChartInspect'],
    render: () => (
      <ScatterVariationChart>
        <Trendline highlightRawPoint>
          <ChartInspect>{trendlineInspectContent}</ChartInspect>
        </Trendline>
      </ScatterVariationChart>
    ),
  },
  {
    id: 'trendline-annotation-default',
    title: 'TrendlineAnnotation',
    description: 'Labels each average trendline at its end. Annotations only position on aggregate methods.',
    dataset: 'standard',
    coverage: [
      'TrendlineAnnotation.dimensionValue=end',
      'TrendlineAnnotation.badge=false',
      'TrendlineAnnotation.prefix=',
      'TrendlineAnnotation.numberFormat=',
    ],
    render: () => (
      <ScatterVariationChart>
        <Trendline method="average">
          <TrendlineAnnotation />
        </Trendline>
      </ScatterVariationChart>
    ),
  },
  {
    id: 'trendline-annotation-badge',
    title: 'Badged trendline annotation',
    description: 'Adds a badge, a prefix, and a one-decimal format.',
    dataset: 'standard',
    coverage: ['TrendlineAnnotation.badge=true', 'TrendlineAnnotation.prefix', 'TrendlineAnnotation.numberFormat=.1f'],
    render: () => (
      <ScatterVariationChart>
        <Trendline method="average">
          <TrendlineAnnotation badge numberFormat=".1f" prefix="Trend:" />
        </Trendline>
      </ScatterVariationChart>
    ),
  },
  {
    id: 'trendline-annotation-start',
    title: 'Trendline annotation at start',
    description: 'Labels the value at the first x of each trendline.',
    dataset: 'standard',
    coverage: ['TrendlineAnnotation.dimensionValue=start'],
    render: () => (
      <ScatterVariationChart>
        <Trendline method="average">
          <TrendlineAnnotation dimensionValue="start" numberFormat=".0f" />
        </Trendline>
      </ScatterVariationChart>
    ),
  },
  {
    id: 'trendline-annotation-value',
    title: 'Trendline annotation at x = 6',
    description: 'Labels the value at a fixed dimension value.',
    dataset: 'standard',
    coverage: ['TrendlineAnnotation.dimensionValue=6'],
    render: () => (
      <ScatterVariationChart>
        <Trendline method="average">
          <TrendlineAnnotation badge dimensionValue={6} numberFormat=".0f" />
        </Trendline>
      </ScatterVariationChart>
    ),
  },
  {
    id: 'trendline-annotation-median',
    title: 'Median annotation across the domain',
    description: 'A badged median label on a trendline extended to the domain.',
    dataset: 'standard',
    coverage: ['Trendline.method=median', 'Trendline.dimensionExtent=[domain,domain]', 'TrendlineAnnotation'],
    render: () => (
      <ScatterVariationChart>
        <Trendline dimensionExtent={['domain', 'domain']} method="median">
          <TrendlineAnnotation badge numberFormat=".0f" prefix="Median:" />
        </Trendline>
      </ScatterVariationChart>
    ),
  },
  {
    id: 'trendline-annotation-display-on-hover',
    title: 'Hover-only trendline annotation',
    description: 'The trendline and its label appear only while hovering a point.',
    dataset: 'standard',
    coverage: ['Trendline.displayOnHover=true', 'TrendlineAnnotation'],
    render: () => (
      <ScatterVariationChart>
        <Trendline displayOnHover method="average">
          <TrendlineAnnotation badge numberFormat=".0f" />
        </Trendline>
        <ChartInspect>{inspectContent}</ChartInspect>
      </ScatterVariationChart>
    ),
  },
  {
    id: 'all-children',
    title: 'Every child together',
    description: 'Path, annotation, trendline with annotation, inspect and popover in one chart.',
    dataset: 'trajectory',
    usesDashboardDataset: false,
    coverage: ['ScatterPath', 'ScatterAnnotation', 'Trendline', 'TrendlineAnnotation', 'ChartInspect', 'ChartPopover'],
    render: () => (
      <ScatterVariationChart data={trajectoryData}>
        <ScatterPath groupBy={['series']} />
        <ScatterAnnotation textKey="label" />
        <Trendline method="average">
          <TrendlineAnnotation badge numberFormat=".0f" />
        </Trendline>
        <ChartInspect>{inspectContent}</ChartInspect>
        <ChartPopover width="auto">{popoverContent}</ChartPopover>
      </ScatterVariationChart>
    ),
  },
];

const axisVariations: Variation[] = [
  {
    id: 'axis-titles-format',
    title: 'Axis titles and number format',
    description: 'Titled axes with compact millions on x and billions on y.',
    dataset: 'largeValues',
    usesDashboardDataset: false,
    coverage: ['Axis.title', 'Axis.numberFormat=shortNumber', 'Axis.grid', 'Axis.baseline', 'Axis.ticks'],
    render: () => (
      <ScatterVariationChart
        axes={customAxes({ numberFormat: 'shortNumber', title: 'Sessions' }, { title: 'Revenue' })}
        data={largeValueData}
      />
    ),
  },
  {
    id: 'axis-currency',
    title: 'Currency metric axis',
    description: 'Formats the metric axis as compact currency.',
    dataset: 'largeValues',
    usesDashboardDataset: false,
    coverage: ['Axis.numberFormat=shortCurrency', 'Axis.currencyCode=EUR'],
    render: () => (
      <ScatterVariationChart
        axes={customAxes({ numberFormat: 'shortNumber' }, { currencyCode: 'EUR', numberFormat: 'shortCurrency' })}
        data={largeValueData}
      />
    ),
  },
  {
    id: 'axis-range',
    title: 'Fixed axis ranges',
    description: 'Pins x to 0–15 and y to 0–100.',
    dataset: 'standard',
    coverage: ['Axis.range=[0,15]', 'Axis.range=[0,100]'],
    render: () => <ScatterVariationChart axes={customAxes({ range: [0, 15] }, { range: [0, 100] })} />,
  },
  {
    id: 'axis-tick-count-limit',
    title: 'Tick count limit',
    description: 'At most three ticks on each axis.',
    dataset: 'standard',
    coverage: ['Axis.tickCountLimit=3'],
    render: () => <ScatterVariationChart axes={customAxes({ tickCountLimit: 3 }, { tickCountLimit: 3 })} />,
  },
  {
    id: 'axis-opposite-positions',
    title: 'Top and right axes',
    description: 'Moves both axes to the opposite sides.',
    dataset: 'standard',
    coverage: ['Axis.position=top', 'Axis.position=right'],
    render: () => (
      <ScatterVariationChart
        axes={() => [
          <Axis key="top" position="top" baseline grid ticks />,
          <Axis key="right" position="right" grid numberFormat="shortNumber" />,
        ]}
      />
    ),
  },
  {
    id: 'axis-reference-lines',
    title: 'Reference lines',
    description: 'A labeled target on each axis.',
    dataset: 'standard',
    coverage: ['Axis.children', 'ReferenceLine.value', 'ReferenceLine.label'],
    render: () => (
      <ScatterVariationChart
        axes={() => [
          <Axis key="bottom" position="bottom" baseline grid ticks>
            <ReferenceLine label="Launch" value={6} />
          </Axis>,
          <Axis key="left" position="left" grid numberFormat="shortNumber">
            <ReferenceLine label="Goal" value={50} />
          </Axis>,
        ]}
      />
    ),
  },
  {
    id: 'reference-line-styles',
    title: 'Reference line styles',
    description: 'A large primary line and a secondary extra-small line.',
    dataset: 'standard',
    coverage: ['ReferenceLine.size=L', 'ReferenceLine.secondary=true'],
    render: () => (
      <ScatterVariationChart
        axes={() => [
          <Axis key="bottom" position="bottom" baseline grid ticks>
            <ReferenceLine label="Secondary" secondary size="XS" value={3} />
          </Axis>,
          <Axis key="left" position="left" grid numberFormat="shortNumber">
            <ReferenceLine label="Primary" size="L" value={40} />
          </Axis>,
        ]}
      />
    ),
  },
];

const legendVariations: Variation[] = [
  {
    id: 'legend-default',
    title: 'Legend',
    description: 'Default bottom legend; hover an entry to highlight its series.',
    dataset: 'standard',
    coverage: ['Legend.position=bottom', 'Legend.highlight'],
    render: () => <ScatterVariationChart legend={() => <Legend highlight />} />,
  },
  {
    id: 'legend-highlight-children',
    title: 'Legend highlight with children',
    description: 'Hovering a legend entry also fades other trendlines and paths.',
    dataset: 'trajectory',
    usesDashboardDataset: false,
    coverage: ['Legend.highlight', 'ScatterPath', 'Trendline'],
    render: () => (
      <ScatterVariationChart data={trajectoryData} legend={() => <Legend highlight />}>
        <ScatterPath groupBy={['series']} />
        <Trendline method="average" />
      </ScatterVariationChart>
    ),
  },
  {
    id: 'legend-right-title',
    title: 'Right legend with title',
    description: 'Moves the legend to the right and adds a title.',
    dataset: 'standard',
    coverage: ['Legend.position=right', 'Legend.title'],
    render: () => <ScatterVariationChart legend={() => <Legend position="right" title="Platform" />} />,
  },
  {
    id: 'legend-opacity',
    title: 'Legend opacity facet',
    description: 'One shared color; legend symbols match the per-segment opacities.',
    dataset: 'standard',
    coverage: ['Legend.opacity=segment', 'opacity=segment'],
    render: () => (
      <ScatterVariationChart
        legend={() => <Legend opacity="segment" />}
        scatterProps={{ color: { value: 'categorical-100' }, opacity: 'segment', size: { value: 'L' } }}
      />
    ),
  },
  {
    id: 'legend-toggleable',
    title: 'Toggleable legend',
    description: 'Click entries to hide series; the first series starts hidden.',
    dataset: 'standard',
    coverage: ['Legend.isToggleable', 'Legend.defaultHiddenSeries=[first]'],
    render: () => (
      <ScatterVariationChart
        legend={(data) => <Legend defaultHiddenSeries={getScatterSeries(data).slice(0, 1)} isToggleable />}
      >
        <Trendline />
      </ScatterVariationChart>
    ),
  },
  {
    id: 'legend-hidden-entries',
    title: 'Hidden legend entry',
    description: 'Omits the last series from the legend while its points still render.',
    dataset: 'standard',
    coverage: ['Legend.hiddenEntries=[last]'],
    render: () => (
      <ScatterVariationChart legend={(data) => <Legend hiddenEntries={getScatterSeries(data).slice(-1)} />} />
    ),
  },
  {
    id: 'legend-labels',
    title: 'Custom legend labels',
    description: 'Replaces series names with longer labels truncated at 80px.',
    dataset: 'standard',
    coverage: ['Legend.legendLabels', 'Legend.labelLimit=80'],
    render: () => (
      <ScatterVariationChart
        legend={(data) => (
          <Legend
            labelLimit={80}
            legendLabels={getScatterSeries(data).map((series) => ({ seriesName: series, label: `${series} users` }))}
          />
        )}
      />
    ),
  },
  {
    id: 'legend-descriptions',
    title: 'Legend descriptions',
    description: 'Hover a legend entry to see its description tooltip.',
    dataset: 'standard',
    coverage: ['Legend.descriptions'],
    render: () => (
      <ScatterVariationChart
        legend={(data) => (
          <Legend
            descriptions={getScatterSeries(data).map((series) => ({
              seriesName: series,
              description: `Retention for ${series} users`,
            }))}
          />
        )}
      />
    ),
  },
];

const chartVariations: Variation[] = [
  {
    id: 'chart-title',
    title: 'Chart title',
    description: 'Adds a Title sibling above the chart.',
    dataset: 'standard',
    coverage: ['Title.text'],
    render: () => <ScatterVariationChart siblings={() => <Title text="Retention by sessions" />} />,
  },
  {
    id: 'controlled-hidden-series',
    title: 'Controlled hidden series',
    description: 'Hides the first series through the Chart hiddenSeries prop.',
    dataset: 'standard',
    coverage: ['Chart.hiddenSeries=[first]'],
    render: () => (
      <ScatterVariationChart
        chartProps={(data) => ({ hiddenSeries: getScatterSeries(data).slice(0, 1) })}
        legend={() => <Legend />}
      >
        <Trendline />
      </ScatterVariationChart>
    ),
  },
  {
    id: 'controlled-highlighted-series',
    title: 'Controlled highlighted series',
    description: 'Highlights the first series through the Chart highlightedSeries prop.',
    dataset: 'standard',
    coverage: ['Chart.highlightedSeries=first'],
    render: () => (
      <ScatterVariationChart chartProps={(data) => ({ highlightedSeries: getScatterSeries(data)[0] })}>
        <Trendline />
      </ScatterVariationChart>
    ),
  },
  {
    id: 'controlled-highlighted-item',
    title: 'Controlled highlighted item',
    description: 'Highlights the first point by id using idKey="id" and highlightedItem.',
    dataset: 'standard',
    coverage: ['Chart.idKey=id', 'Chart.highlightedItem=first'],
    render: () => (
      <ScatterVariationChart
        chartProps={(data) => ({ idKey: 'id', highlightedItem: data[0]?.id })}
        scatterProps={{ size: { value: 'L' } }}
      />
    ),
  },
  {
    id: 'chart-colors',
    title: 'Custom colors',
    description: 'Overrides the categorical palette.',
    dataset: 'standard',
    coverage: ['Chart.colors=[...]'],
    render: () => <ScatterVariationChart chartProps={{ colors: ['indigo-900', 'magenta-600', 'seafoam-600'] }} />,
  },
  {
    id: 'chart-opacities',
    title: 'Chart opacities',
    description: 'Custom opacities for the opacity facet.',
    dataset: 'standard',
    coverage: ['Chart.opacities', 'opacity=segment'],
    render: () => (
      <ScatterVariationChart
        chartProps={{ opacities: [1, 0.25] }}
        scatterProps={{ opacity: 'segment', size: { value: 'L' } }}
      />
    ),
  },
  {
    id: 'chart-line-types',
    title: 'Chart line types',
    description: 'Custom dash patterns for the outline lineType facet.',
    dataset: 'standard',
    coverage: ['Chart.lineTypes', 'lineType=segment'],
    render: () => (
      <ScatterVariationChart
        chartProps={{ lineTypes: ['dotted', [6, 2]] }}
        scatterProps={{
          lineType: 'segment',
          lineWidth: { value: 'S' },
          opacity: { value: 0.3 },
          size: { value: 'XL' },
        }}
      />
    ),
  },
  {
    id: 'chart-line-widths',
    title: 'Chart line widths',
    description: 'Custom outline widths for the lineWidth facet.',
    dataset: 'standard',
    coverage: ['Chart.lineWidths', 'lineWidth=segment'],
    render: () => (
      <ScatterVariationChart
        chartProps={{ lineWidths: [1, 4] }}
        scatterProps={{ lineWidth: 'segment', opacity: { value: 0.3 }, size: { value: 'L' } }}
      />
    ),
  },
  {
    id: 'chart-symbol-sizes',
    title: 'Chart symbol sizes',
    description: 'Maps the size facet to a wider XS–XL range.',
    dataset: 'standard',
    coverage: ['Chart.symbolSizes=[XS,XL]', 'size=weight'],
    render: () => (
      <ScatterVariationChart chartProps={{ symbolSizes: ['XS', 'XL'] }} scatterProps={{ size: 'weight' }} />
    ),
  },
  {
    id: 'dark-background',
    title: 'Dark color scheme',
    description: 'Points screen-blend on a dark background with a trendline and annotations.',
    dataset: 'standard',
    coverage: ['Chart.colorScheme=dark', 'Chart.backgroundColor=gray-25', 'blend=screen'],
    render: () => (
      <ScatterVariationChart chartProps={{ backgroundColor: 'gray-25', colorScheme: 'dark' }}>
        <ScatterAnnotation textKey="label" />
        <Trendline method="average">
          <TrendlineAnnotation badge numberFormat=".0f" />
        </Trendline>
      </ScatterVariationChart>
    ),
  },
  {
    id: 'dark-path',
    title: 'Dark color scheme path',
    description: 'Paths keep contrast on a dark background.',
    dataset: 'trajectory',
    usesDashboardDataset: false,
    coverage: ['Chart.colorScheme=dark', 'ScatterPath'],
    render: () => (
      <ScatterVariationChart chartProps={{ backgroundColor: 'gray-25', colorScheme: 'dark' }} data={trajectoryData}>
        <ScatterPath groupBy={['series']} />
      </ScatterVariationChart>
    ),
  },
  {
    id: 'locale',
    title: 'German locale',
    description: 'Formats axis numbers and trendline annotations with de-DE separators.',
    dataset: 'single',
    usesDashboardDataset: false,
    coverage: ['Chart.locale=de-DE', 'TrendlineAnnotation.numberFormat=,.2f'],
    render: () => (
      <ScatterVariationChart
        axes={customAxes({ numberFormat: ',.1f' }, { numberFormat: ',.1f' })}
        chartProps={{ locale: 'de-DE' }}
        data={singleData}
      >
        <Trendline method="average">
          <TrendlineAnnotation badge numberFormat=",.2f" />
        </Trendline>
      </ScatterVariationChart>
    ),
  },
  {
    id: 'tooltip-anchor-mark',
    title: 'Inspect anchored to mark',
    description: 'Inspect content is placed above the hovered point instead of following the cursor.',
    dataset: 'standard',
    coverage: ['Chart.tooltipAnchor=mark', 'Chart.tooltipPlacement=top'],
    render: () => (
      <ScatterVariationChart chartProps={{ tooltipAnchor: 'mark', tooltipPlacement: 'top' }}>
        <ChartInspect>{inspectContent}</ChartInspect>
      </ScatterVariationChart>
    ),
  },
  {
    id: 'empty-state',
    title: 'Empty data',
    description: 'Shows the empty state text when data is an empty array.',
    dataset: 'empty',
    usesDashboardDataset: false,
    coverage: ['Chart.emptyStateText', 'data=[]'],
    render: () => <ScatterVariationChart chartProps={{ emptyStateText: 'No retention data' }} data={[]} />,
  },
  {
    id: 'loading',
    title: 'Loading',
    description: 'Shows the loading spinner in place of the chart.',
    dataset: 'standard',
    coverage: ['Chart.loading=true'],
    render: () => <ScatterVariationChart chartProps={{ loading: true }} />,
  },
];

export const scatterVariations: Variation[] = [
  ...baseScatterVariations,
  ...interactionVariations,
  ...pathVariations,
  ...annotationVariations,
  ...trendlineVariations,
  ...axisVariations,
  ...legendVariations,
  ...chartVariations,
];

export const ScatterDashboard = (): ReactElement => (
  <VariationDashboard
    variations={scatterVariations}
    coverage={dashboard.coverage}
    chartType="Scatter"
    datasets={scatterDatasetOptions}
    filters={scatterVariationFilters}
    getSizeDescription={(size) => `Chart: ${size} × ${Math.round(size * SCATTER_ASPECT_RATIO)}px`}
    initialSize={360}
    initialDataset="standard"
    initialFilter="all"
    initialViewMode="axes"
    sizePresets={scatterSizePresets}
    showAnimationControls
    viewModes={scatterViewModes}
  />
);

const scatterCoverage: PropCoverage<ScatterProps> = {
  blend: ['blend-default', 'blend-normal', 'blend-darken', 'dark-background'],
  children: ['path-default', 'annotation-default', 'trendline-default', 'inspect-default', 'popover-default'],
  clip: ['clip-off', 'clip-on'],
  color: ['defaults', 'color-series', 'color-static', 'color-linear'],
  colorScaleType: ['defaults', 'color-linear'],
  dimension: ['defaults', 'custom-keys', 'dimension-time'],
  dimensionScaleType: ['defaults', 'dimension-time', 'trendline-time'],
  lineType: ['defaults', 'line-type-static', 'line-type-key', 'chart-line-types'],
  lineWidth: ['defaults', 'line-width-static', 'line-width-key', 'chart-line-widths'],
  metric: ['defaults', 'custom-keys'],
  name: ['defaults', 'named-interactive'],
  opacity: ['defaults', 'opacity-static', 'opacity-key', 'chart-opacities'],
  size: ['defaults', 'size-key', 'size-static', 'size-pixels', 'chart-symbol-sizes'],
  stroke: ['stroke-static', 'stroke-key'],
};

const scatterPathCoverage: PropCoverage<ScatterPathProps> = {
  color: ['path-default', 'path-color-opacity'],
  groupBy: ['path-default', 'path-group-by'],
  opacity: ['path-default', 'path-color-opacity'],
  pathWidth: ['path-default', 'path-width-key', 'path-width-static'],
};

const scatterAnnotationCoverage: PropCoverage<ScatterAnnotationProps> = {
  anchor: ['annotation-default', 'annotation-anchor-single', 'annotation-anchor-list'],
  textKey: ['annotation-default', 'annotation-text-key'],
};

const trendlineCoverage: PropCoverage<TrendlineProps> = {
  children: ['trendline-inspect', 'trendline-annotation-default'],
  color: ['trendline-default', 'trendline-style'],
  dimensionExtent: ['trendline-default', 'trendline-extent-domain', 'trendline-extent-fixed', 'trendline-range-extent'],
  dimensionRange: ['trendline-default', 'trendline-range', 'trendline-range-extent'],
  displayOnHover: ['trendline-display-on-hover', 'trendline-annotation-display-on-hover'],
  excludeDataKeys: ['trendline-exclude-keys'],
  hidePartialWindows: ['trendline-moving-average', 'trendline-hide-partial-windows'],
  highlightRawPoint: ['trendline-inspect', 'trendline-highlight-raw-point'],
  lineType: ['trendline-default', 'trendline-style', 'trendline-thick-dotted'],
  lineWidth: ['trendline-default', 'trendline-style', 'trendline-thick-dotted'],
  method: [
    'trendline-default',
    'trendline-average',
    'trendline-median',
    'trendline-quadratic',
    'trendline-polynomial-3',
    'trendline-exponential',
    'trendline-logarithmic',
    'trendline-power',
    'trendline-moving-average',
  ],
  opacity: ['trendline-default', 'trendline-style'],
  orientation: ['trendline-default', 'trendline-vertical'],
};

const trendlineAnnotationCoverage: PropCoverage<TrendlineAnnotationProps> = {
  badge: ['trendline-annotation-default', 'trendline-annotation-badge'],
  dimensionValue: ['trendline-annotation-default', 'trendline-annotation-start', 'trendline-annotation-value'],
  numberFormat: ['trendline-annotation-default', 'trendline-annotation-badge', 'locale'],
  prefix: ['trendline-annotation-default', 'trendline-annotation-badge'],
};

const chartInspectCoverage: PropCoverage<ChartInspectProps> = {
  children: ['inspect-default', 'trendline-inspect'],
  excludeDataKeys: ['inspect-exclude-keys'],
  highlightBy: ['inspect-default', 'inspect-highlight-series', 'inspect-highlight-dimension', 'inspect-highlight-keys'],
  targets: { skip: 'Scatter has no dimension hover area; only the default item target applies' },
};

const chartPopoverCoverage: PropCoverage<ChartPopoverProps> = {
  children: ['popover-default'],
  containerPadding: ['popover-bounds'],
  contentMargin: ['popover-bounds'],
  height: ['popover-fixed-size', 'popover-bounds'],
  maxHeight: ['popover-bounds'],
  maxWidth: ['popover-bounds'],
  minHeight: ['popover-bounds'],
  minWidth: ['popover-bounds'],
  onOpenChange: ['popover-open-change'],
  rightClick: ['popover-right-click'],
  UNSAFE_highlightBy: { skip: 'Not read by the Scatter spec builder; only the clicked point is ringed' },
  width: ['popover-default', 'popover-fixed-size'],
};

const axisCoverage: SiblingCoverage<AxisProps> = {
  baseline: ['axis-titles-format'],
  children: ['axis-reference-lines'],
  currencyCode: ['axis-currency'],
  granularity: ['dimension-time'],
  grid: ['axis-titles-format'],
  labelFormat: ['dimension-time'],
  numberFormat: ['axis-titles-format', 'axis-currency', 'locale'],
  position: ['axis-opposite-positions'],
  range: ['axis-range', 'clip-on'],
  tickCountLimit: ['axis-tick-count-limit'],
  ticks: ['axis-titles-format'],
  title: ['axis-titles-format'],
};

const referenceLineCoverage: SiblingCoverage<ReferenceLineProps> = {
  label: ['axis-reference-lines'],
  secondary: ['reference-line-styles'],
  size: ['reference-line-styles'],
  value: ['axis-reference-lines'],
};

const legendCoverage: SiblingCoverage<LegendProps> = {
  defaultHiddenSeries: ['legend-toggleable'],
  descriptions: ['legend-descriptions'],
  hiddenEntries: ['legend-hidden-entries'],
  highlight: ['legend-default', 'legend-highlight-children'],
  isToggleable: ['legend-toggleable'],
  labelLimit: ['legend-labels'],
  legendLabels: ['legend-labels'],
  opacity: ['legend-opacity'],
  position: ['legend-default', 'legend-right-title'],
  title: ['legend-right-title'],
};

const titleCoverage: SiblingCoverage<TitleProps> = {
  text: ['chart-title'],
};

const chartCoverage: SiblingCoverage<ChartProps> = {
  animations: { skip: 'Covered by the dashboard Animations switch' },
  animationTypes: { skip: 'Covered by the dashboard Animations switch' },
  backgroundColor: ['dark-background', 'dark-path'],
  colors: ['chart-colors', 'color-linear'],
  colorScheme: ['dark-background', 'dark-path'],
  emptyStateText: ['empty-state'],
  hiddenSeries: ['controlled-hidden-series'],
  highlightedItem: ['controlled-highlighted-item'],
  highlightedSeries: ['controlled-highlighted-series'],
  idKey: ['controlled-highlighted-item'],
  lineTypes: ['chart-line-types'],
  lineWidths: ['chart-line-widths'],
  loading: ['loading'],
  locale: ['locale'],
  opacities: ['chart-opacities'],
  renderer: { skip: 'Covered by the dashboard Renderer control' },
  symbolSizes: ['chart-symbol-sizes'],
  tooltipAnchor: ['tooltip-anchor-mark'],
  tooltipPlacement: ['tooltip-anchor-mark'],
};

export const dashboard: DashboardDefinition = {
  chartType: 'Scatter',
  variations: scatterVariations,
  coverage: {
    Scatter: scatterCoverage,
    ScatterPath: scatterPathCoverage,
    ScatterAnnotation: scatterAnnotationCoverage,
    Trendline: trendlineCoverage,
    TrendlineAnnotation: trendlineAnnotationCoverage,
    ChartInspect: chartInspectCoverage,
    ChartPopover: chartPopoverCoverage,
    Axis: axisCoverage,
    ReferenceLine: referenceLineCoverage,
    Legend: legendCoverage,
    Title: titleCoverage,
    Chart: chartCoverage,
  },
};
