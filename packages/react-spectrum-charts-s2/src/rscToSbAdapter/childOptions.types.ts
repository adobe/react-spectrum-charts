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
import { ReactNode } from 'react';

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
  LineDirectLabelOptions,
  LineForecastOptions,
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

/** Child component options grouped by kind. */
export type ChildOptions = {
  axes: AxisOptions[];
  axisThumbnails: AxisThumbnailOptions[];
  barAnnotations: BarAnnotationOptions[];
  barDirectLabels: BarDirectLabelOptions[];
  chartActionBars: ChartActionBarOptions[];
  chartInspects: ChartInspectOptions[];
  chartPopovers: ChartPopoverOptions[];
  donutSummaries: DonutSummaryOptions[];
  forecasts: LineForecastOptions[];
  legends: LegendOptions[];
  lineDirectLabels: LineDirectLabelOptions[];
  linePointAnnotations: LinePointAnnotationOptions[];
  lines: LineOptions[];
  marks: MarkOptions[];
  referenceLines: ReferenceLineOptions[];
  scatterAnnotations: ScatterAnnotationOptions[];
  scatterPaths: ScatterPathOptions[];
  segmentLabels: SegmentLabelOptions[];
  titles: TitleOptions[];
  trendlineAnnotations: TrendlineAnnotationOptions[];
  trendlines: TrendlineOptions[];
};

/** Converts React children into grouped child options. */
export type ChildrenToOptions = (children: ReactNode) => ChildOptions;
