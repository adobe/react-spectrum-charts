/*
 * Copyright 2025 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import {
  AxisAnnotationOptions,
  AxisOptions,
  AxisThumbnailOptions,
  BarAnnotationOptions,
  BulletOptions,
  ChartPopoverOptions,
  ChartTooltipOptions,
  DonutSummaryOptions,
  GaugeOptions,
  LegendOptions,
  LineOptions,
  MarkOptions,
  MetricRangeOptions,
  ReferenceLineOptions,
  ScatterPathOptions,
  SegmentLabelOptions,
  TitleOptions,
  TrendlineAnnotationOptions,
  TrendlineOptions,
} from '@spectrum-charts/vega-spec-builder';

import { Bullet, Combo, Gauge, Venn } from '../alpha';
import { Annotation } from '../components/Annotation';
import { Area } from '../components/Area';
import { Axis } from '../components/Axis';
import { AxisAnnotation } from '../components/AxisAnnotation';
import { AxisThumbnail } from '../components/AxisThumbnail';
import { Bar } from '../components/Bar';
import { ChartPopover } from '../components/ChartPopover';
import { ChartTooltip } from '../components/ChartTooltip';
import { Legend } from '../components/Legend';
import { Line } from '../components/Line';
import { MetricRange } from '../components/MetricRange';
import { ReferenceLine } from '../components/ReferenceLine';
import { Scatter } from '../components/Scatter';
import { ScatterPath } from '../components/ScatterPath';
import { Title } from '../components/Title';
import { Trendline } from '../components/Trendline';
import { TrendlineAnnotation } from '../components/TrendlineAnnotation';
import { Donut, DonutSummary, SegmentLabel } from '../rc';
import {
  AreaProps,
  AxisAnnotationProps,
  AxisProps,
  AxisThumbnailProps,
  BarProps,
  ChartPopoverProps,
  ChartTooltipProps,
  ComboProps,
  DonutProps,
  DonutSummaryProps,
  LegendProps,
  LineProps,
  ReferenceLineProps,
  ScatterPathProps,
  ScatterProps,
  SegmentLabelProps,
  TitleProps,
  TrendlineAnnotationProps,
  TrendlineProps,
  VennProps,
} from '../types';
import { sanitizeChildren } from '../utils';
import { getAreaOptions } from './areaAdapter';
import { getAxisAnnotationOptions, getAxisOptions } from './axisAdapter';
import { getBarOptions } from './barAdapter';
import { getChartPopoverOptions } from './chartPopoverAdapter';
import { getChartTooltipOptions } from './chartTooltipAdapter';
import { getComboOptions } from './comboAdapter';
import { getDonutOptions } from './donutAdapter';
import { getLegendOptions } from './legendAdapter';
import { getLineOptions } from './lineAdapter';
import { getScatterOptions } from './scatterAdapter';
import { getTrendlineOptions } from './trendlineAdapter';
import { getVennOptions } from './vennAdapter';

export const childrenToOptions = (
  children: React.ReactNode
): {
  axes: AxisOptions[];
  axisAnnotations: AxisAnnotationOptions[];
  axisThumbnails: AxisThumbnailOptions[];
  barAnnotations: BarAnnotationOptions[];
  chartTooltips: ChartTooltipOptions[];
  chartPopovers: ChartPopoverOptions[];
  donutSummaries: DonutSummaryOptions[];
  legends: LegendOptions[];
  lines: LineOptions[];
  marks: MarkOptions[];
  metricRanges: MetricRangeOptions[];
  referenceLines: ReferenceLineOptions[];
  scatterPaths: ScatterPathOptions[];
  segmentLabels: SegmentLabelOptions[];
  titles: TitleOptions[];
  trendlines: TrendlineOptions[];
  trendlineAnnotations: TrendlineAnnotationOptions[];
} => {
  const axes: AxisOptions[] = [];
  const axisAnnotations: AxisAnnotationOptions[] = [];
  const axisThumbnails: AxisThumbnailOptions[] = [];
  const barAnnotations: BarAnnotationOptions[] = [];
  const chartPopovers: ChartPopoverOptions[] = [];
  const chartTooltips: ChartTooltipOptions[] = [];
  const donutSummaries: DonutSummaryOptions[] = [];
  const legends: LegendOptions[] = [];
  const lines: LineOptions[] = [];
  const marks: MarkOptions[] = [];
  const metricRanges: MetricRangeOptions[] = [];
  const referenceLines: ReferenceLineOptions[] = [];
  const segmentLabels: SegmentLabelOptions[] = [];
  const scatterPaths: ScatterPathOptions[] = [];
  const titles: TitleOptions[] = [];
  const trendlineAnnotations: TrendlineAnnotationOptions[] = [];
  const trendlines: TrendlineOptions[] = [];

  sanitizeChildren(children).forEach((child) => {
    if (!('displayName' in child.type)) {
      console.error('Invalid component type. Component is missing display name.');
      return;
    }
    switch (child.type.displayName) {
      case Area.displayName:
        marks.push(getAreaOptions(child.props as AreaProps));
        break;

      case Annotation.displayName:
        barAnnotations.push(child.props as BarAnnotationOptions);
        break;

      case Axis.displayName:
        axes.push(getAxisOptions(child.props as AxisProps));
        break;

      case AxisAnnotation.displayName:
        axisAnnotations.push(getAxisAnnotationOptions(child.props as AxisAnnotationProps));
        break;

      case AxisThumbnail.displayName:
        axisThumbnails.push(child.props as AxisThumbnailProps);
        break;

      case Bar.displayName:
        marks.push(getBarOptions(child.props as BarProps));
        break;

      case Bullet.displayName:
        marks.push({ ...child.props, markType: 'bullet' } as BulletOptions);
        break;

      case Gauge.displayName:
        marks.push({ ...child.props, markType: 'gauge' } as GaugeOptions);
        break;

      case ChartPopover.displayName:
        chartPopovers.push(getChartPopoverOptions(child.props as ChartPopoverProps));
        break;

      case ChartTooltip.displayName:
        chartTooltips.push(getChartTooltipOptions(child.props as ChartTooltipProps));
        break;

      case Combo.displayName:
        marks.push(getComboOptions(child.props as ComboProps));
        break;

      case Donut.displayName:
        marks.push(getDonutOptions(child.props as DonutProps));
        break;

      case DonutSummary.displayName:
        donutSummaries.push(child.props as DonutSummaryProps);
        break;

      case MetricRange.displayName:
        metricRanges.push(child.props as MetricRangeOptions);
        break;

      case Legend.displayName:
        legends.push(getLegendOptions(child.props as LegendProps));
        break;

      case Line.displayName:
        marks.push(getLineOptions(child.props as LineProps));
        lines.push(getLineOptions(child.props as LineProps));
        break;

      case ReferenceLine.displayName:
        referenceLines.push(child.props as ReferenceLineProps);
        break;

      case Scatter.displayName:
        marks.push(getScatterOptions(child.props as ScatterProps));
        break;

      case ScatterPath.displayName:
        scatterPaths.push(child.props as ScatterPathProps);
        break;

      case SegmentLabel.displayName:
        segmentLabels.push(child.props as SegmentLabelProps);
        break;

      case Title.displayName:
        titles.push(child.props as TitleProps);
        break;

      case Trendline.displayName:
        trendlines.push(getTrendlineOptions(child.props as TrendlineProps));
        break;

      case TrendlineAnnotation.displayName:
        trendlineAnnotations.push(child.props as TrendlineAnnotationProps);
        break;

      case Venn.displayName:
        marks.push(getVennOptions(child.props as VennProps));
        break;

      default:
        console.error('Invalid component type: ', child.type.displayName);
    }
  });

  return {
    axes,
    axisAnnotations,
    axisThumbnails,
    barAnnotations,
    chartTooltips,
    chartPopovers,
    donutSummaries,
    legends,
    lines,
    marks,
    metricRanges,
    referenceLines,
    scatterPaths,
    segmentLabels,
    titles,
    trendlines,
    trendlineAnnotations,
  };
};
