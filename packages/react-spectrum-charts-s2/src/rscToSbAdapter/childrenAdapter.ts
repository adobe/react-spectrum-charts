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
  BarDirectLabelOptions,
  ChartActionBarOptions,
  ChartInspectOptions,
  ChartPopoverOptions,
  DonutSummaryOptions,
  LegendOptions,
  LineForecastOptions,
  LineDirectLabelOptions,
  LineOptions,
  LinePointAnnotationOptions,
  MarkOptions,
  ReferenceLineOptions,
  ScatterAnnotationOptions,
  ScatterPathOptions,
  SegmentLabelOptions,
  TitleOptions,
  TrendlineAnnotationOptions,
  TrendlineOptions,
} from '@spectrum-charts/vega-spec-builder-s2';

import { Axis } from '../components/Axis/index.js';
import { AxisThumbnail } from '../components/AxisThumbnail/index.js';
import { Bar } from '../components/Bar/index.js';
import { BarDirectLabel } from '../components/BarDirectLabel/index.js';
import { ChartActionBar } from '../components/ChartActionBar/index.js';
import { ChartInspect } from '../components/ChartInspect/index.js';
import { ChartPopover } from '../components/ChartPopover/index.js';
import { Legend } from '../components/Legend/index.js';
import { Line } from '../components/Line/index.js';
import { LineDirectLabel } from '../components/LineDirectLabel/index.js';
import { LineForecast } from '../components/LineForecast/index.js';
import { LinePointAnnotation } from '../components/LinePointAnnotation/index.js';
import { ReferenceLine } from '../components/ReferenceLine/index.js';
import { Title } from '../components/Title/index.js';
import {
  Area,
  Bullet,
  Combo,
  Donut,
  DonutSummary,
  Scatter,
  ScatterAnnotation,
  ScatterPath,
  SegmentLabel,
  Trendline,
  TrendlineAnnotation,
} from '../pre-alpha/index.js';
import {
  AreaProps,
  AxisProps,
  AxisThumbnailProps,
  BarDirectLabelProps,
  BarProps,
  BulletProps,
  ChartActionBarProps,
  ChartInspectProps,
  ChartPopoverProps,
  ComboProps,
  DonutProps,
  DonutSummaryProps,
  LegendProps,
  LineForecastProps,
  LineDirectLabelProps,
  LinePointAnnotationProps,
  LineProps,
  ReferenceLineProps,
  ScatterAnnotationProps,
  ScatterPathProps,
  ScatterProps,
  SegmentLabelProps,
  TitleProps,
  TrendlineAnnotationProps,
  TrendlineProps,
} from '../types/index.js';
import { sanitizeChildren } from '../utils/index.js';
import { getAreaOptions } from './areaAdapter.js';
import { getAxisOptions } from './axisAdapter.js';
import { getBarOptions } from './barAdapter.js';
import { getBulletOptions } from './bulletAdapter.js';
import { getChartActionBarOptions } from './chartActionBarAdapter.js';
import { getChartPopoverOptions } from './chartPopoverAdapter.js';
import { getChartInspectOptions } from './chartInspectAdapter.js';
import { ChildrenToOptions } from './childOptions.types.js';
import { getComboOptions } from './comboAdapter.js';
import { getDonutOptions } from './donutAdapter.js';
import { getLegendOptions } from './legendAdapter.js';
import { getLineOptions } from './lineAdapter.js';
import { getScatterOptions } from './scatterAdapter.js';
import { getTrendlineOptions } from './trendlineAdapter.js';

export const childrenToOptions: ChildrenToOptions = (children) => {
  const axes: AxisOptions[] = [];
  const axisThumbnails: AxisThumbnailOptions[] = [];
  const barAnnotations: BarAnnotationOptions[] = [];
  const barDirectLabels: BarDirectLabelOptions[] = [];
  const chartActionBars: ChartActionBarOptions[] = [];
  const chartInspects: ChartInspectOptions[] = [];
  const chartPopovers: ChartPopoverOptions[] = [];
  let hasRightClickPopover = false;
  const donutSummaries: DonutSummaryOptions[] = [];
  const forecasts: LineForecastOptions[] = [];
  const legends: LegendOptions[] = [];
  const lineDirectLabels: LineDirectLabelOptions[] = [];
  const linePointAnnotations: LinePointAnnotationOptions[] = [];
  const lines: LineOptions[] = [];
  const marks: MarkOptions[] = [];
  const referenceLines: ReferenceLineOptions[] = [];
  const scatterAnnotations: ScatterAnnotationOptions[] = [];
  const scatterPaths: ScatterPathOptions[] = [];
  const segmentLabels: SegmentLabelOptions[] = [];
  const titles: TitleOptions[] = [];
  const trendlineAnnotations: TrendlineAnnotationOptions[] = [];
  const trendlines: TrendlineOptions[] = [];

  for (const child of sanitizeChildren(children)) {
    if (!('displayName' in child.type)) {
      console.error('Invalid component type. Component is missing display name.');
      continue;
    }
    switch (child.type.displayName) {

      case Area.displayName:
        marks.push(getAreaOptions(child.props as AreaProps, childrenToOptions));
        break;

      case Axis.displayName:
        axes.push(getAxisOptions(child.props as AxisProps, childrenToOptions));
        break;

      case AxisThumbnail.displayName:
        axisThumbnails.push(child.props as AxisThumbnailProps);
        break;

      case Bar.displayName:
        marks.push(getBarOptions(child.props as BarProps, childrenToOptions));
        break;

      case BarDirectLabel.displayName:
        barDirectLabels.push(child.props as BarDirectLabelProps);
        break;

      case Bullet.displayName:
        marks.push(getBulletOptions(child.props as BulletProps, childrenToOptions));
        break;

      case ChartActionBar.displayName:
        chartActionBars.push(getChartActionBarOptions(child.props as ChartActionBarProps));
        break;

      case ChartPopover.displayName: {
        const popoverProps = child.props as ChartPopoverProps;
        chartPopovers.push(getChartPopoverOptions(popoverProps));
        if (popoverProps.rightClick) hasRightClickPopover = true;
        break;
      }

      case ChartInspect.displayName:
        chartInspects.push(getChartInspectOptions(child.props as ChartInspectProps));
        break;

      case Combo.displayName:
        marks.push(getComboOptions(child.props as ComboProps, childrenToOptions));
        break;

      case Donut.displayName:
        marks.push(getDonutOptions(child.props as DonutProps, childrenToOptions));
        break;

      case DonutSummary.displayName:
        donutSummaries.push(child.props as DonutSummaryProps);
        break;

      case Legend.displayName:
        legends.push(getLegendOptions(child.props as LegendProps, childrenToOptions));
        break;

      case LineForecast.displayName:
        forecasts.push(child.props as LineForecastProps);
        break;

      case LineDirectLabel.displayName:
        lineDirectLabels.push(child.props as LineDirectLabelProps);
        break;

      case LinePointAnnotation.displayName:
        linePointAnnotations.push(child.props as LinePointAnnotationProps);
        break;

      case Line.displayName:
        marks.push(getLineOptions(child.props as LineProps, childrenToOptions));
        lines.push(getLineOptions(child.props as LineProps, childrenToOptions));
        break;

      case ReferenceLine.displayName:
        referenceLines.push(child.props as ReferenceLineProps);
        break;

      case Scatter.displayName:
        marks.push(getScatterOptions(child.props as ScatterProps, childrenToOptions));
        break;

      case ScatterAnnotation.displayName:
        scatterAnnotations.push(child.props as ScatterAnnotationProps);
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
        trendlines.push(getTrendlineOptions(child.props as TrendlineProps, childrenToOptions));
        break;

      case TrendlineAnnotation.displayName:
        trendlineAnnotations.push(child.props as TrendlineAnnotationProps);
        break;

      default:
        console.error('Invalid component type: ', child.type.displayName);
    }
  }

  if (chartActionBars.length > 0 && chartPopovers.length > 0 && !hasRightClickPopover) {
    console.error(
      'ChartActionBar and ChartPopover cannot both be children of the same Line unless ChartPopover uses rightClick. Only ChartActionBar will be rendered.'
    );
    chartPopovers.length = 0;
  }

  return {
    axes,
    axisThumbnails,
    barAnnotations,
    barDirectLabels,
    chartActionBars,
    chartInspects,
    chartPopovers,
    donutSummaries,
    forecasts,
    legends,
    lineDirectLabels,
    linePointAnnotations,
    lines,
    marks,
    referenceLines,
    scatterAnnotations,
    scatterPaths,
    segmentLabels,
    titles,
    trendlineAnnotations,
    trendlines,
  };
};
