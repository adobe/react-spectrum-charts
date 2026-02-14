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
import {
  AxisOptions,
  AxisThumbnailOptions,
  BarAnnotationOptions,
  ChartPopoverOptions,
  ChartTooltipOptions,
  DonutSummaryOptions,
  LegendOptions,
  LineOptions,
  MarkOptions,
  ReferenceLineOptions,
  SegmentLabelOptions,
  TitleOptions,
} from '@spectrum-charts/vega-spec-builder-s2';

import { Axis } from '../components/Axis';
import { AxisThumbnail } from '../components/AxisThumbnail';
import { Bar } from '../components/Bar';
import { ChartPopover } from '../components/ChartPopover';
import { ChartTooltip } from '../components/ChartTooltip';
import { Legend } from '../components/Legend';
import { Line } from '../components/Line';
import { ReferenceLine } from '../components/ReferenceLine';
import { Title } from '../components/Title';
import { Donut, DonutSummary, SegmentLabel } from '../rc';
import {
  AxisProps,
  AxisThumbnailProps,
  BarProps,
  ChartPopoverProps,
  ChartTooltipProps,
  DonutProps,
  DonutSummaryProps,
  LegendProps,
  LineProps,
  ReferenceLineProps,
  SegmentLabelProps,
  TitleProps,
} from '../types';
import { sanitizeChildren } from '../utils';
import { getAxisOptions } from './axisAdapter';
import { getBarOptions } from './barAdapter';
import { getChartPopoverOptions } from './chartPopoverAdapter';
import { getChartTooltipOptions } from './chartTooltipAdapter';
import { getDonutOptions } from './donutAdapter';
import { getLegendOptions } from './legendAdapter';
import { getLineOptions } from './lineAdapter';

export const childrenToOptions = (
  children: React.ReactNode
): {
  axes: AxisOptions[];
  axisThumbnails: AxisThumbnailOptions[];
  barAnnotations: BarAnnotationOptions[];
  chartTooltips: ChartTooltipOptions[];
  chartPopovers: ChartPopoverOptions[];
  donutSummaries: DonutSummaryOptions[];
  legends: LegendOptions[];
  lines: LineOptions[];
  marks: MarkOptions[];
  referenceLines: ReferenceLineOptions[];
  segmentLabels: SegmentLabelOptions[];
  titles: TitleOptions[];
} => {
  const axes: AxisOptions[] = [];
  const axisThumbnails: AxisThumbnailOptions[] = [];
  const barAnnotations: BarAnnotationOptions[] = [];
  const chartPopovers: ChartPopoverOptions[] = [];
  const chartTooltips: ChartTooltipOptions[] = [];
  const donutSummaries: DonutSummaryOptions[] = [];
  const legends: LegendOptions[] = [];
  const lines: LineOptions[] = [];
  const marks: MarkOptions[] = [];
  const referenceLines: ReferenceLineOptions[] = [];
  const segmentLabels: SegmentLabelOptions[] = [];
  const titles: TitleOptions[] = [];

  for (const child of sanitizeChildren(children)) {
    if (!('displayName' in child.type)) {
      console.error('Invalid component type. Component is missing display name.');
      continue;
    }
    switch (child.type.displayName) {
      case Axis.displayName:
        axes.push(getAxisOptions(child.props as AxisProps));
        break;

      case AxisThumbnail.displayName:
        axisThumbnails.push(child.props as AxisThumbnailProps);
        break;

      case Bar.displayName:
        marks.push(getBarOptions(child.props as BarProps));
        break;

      case ChartPopover.displayName:
        chartPopovers.push(getChartPopoverOptions(child.props as ChartPopoverProps));
        break;

      case ChartTooltip.displayName:
        chartTooltips.push(getChartTooltipOptions(child.props as ChartTooltipProps));
        break;

      case Donut.displayName:
        marks.push(getDonutOptions(child.props as DonutProps));
        break;

      case DonutSummary.displayName:
        donutSummaries.push(child.props as DonutSummaryProps);
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

      case SegmentLabel.displayName:
        segmentLabels.push(child.props as SegmentLabelProps);
        break;

      case Title.displayName:
        titles.push(child.props as TitleProps);
        break;

      default:
        console.error('Invalid component type: ', child.type.displayName);
    }
  }

  return {
    axes,
    axisThumbnails,
    barAnnotations,
    chartTooltips,
    chartPopovers,
    donutSummaries,
    legends,
    lines,
    marks,
    referenceLines,
    segmentLabels,
    titles,
  };
};
