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
import { UpdateClassification } from '@spectrum-charts/vega-spec-builder-s2';

import { AREA_PROP_UPDATE_CLASSES } from './areaPropUpdateClasses.js';
import { AXIS_PROP_UPDATE_CLASSES } from './axisPropUpdateClasses.js';
import { AXIS_THUMBNAIL_PROP_UPDATE_CLASSES } from './axisThumbnailPropUpdateClasses.js';
import { BAR_DIRECT_LABEL_PROP_UPDATE_CLASSES } from './barDirectLabelPropUpdateClasses.js';
import { BAR_PROP_UPDATE_CLASSES } from './barPropUpdateClasses.js';
import { BULLET_PROP_UPDATE_CLASSES } from './bulletPropUpdateClasses.js';
import { CHART_ACTION_BAR_PROP_UPDATE_CLASSES } from './chartActionBarPropUpdateClasses.js';
import { CHART_INSPECT_PROP_UPDATE_CLASSES } from './chartInspectPropUpdateClasses.js';
import { CHART_POPOVER_PROP_UPDATE_CLASSES } from './chartPopoverPropUpdateClasses.js';
import { CHART_PROP_UPDATE_CLASSES } from './chartPropUpdateClasses.js';
import { COMBO_PROP_UPDATE_CLASSES } from './comboPropUpdateClasses.js';
import { DONUT_PROP_UPDATE_CLASSES } from './donutPropUpdateClasses.js';
import { DONUT_SUMMARY_PROP_UPDATE_CLASSES } from './donutSummaryPropUpdateClasses.js';
import { LEGEND_PROP_UPDATE_CLASSES } from './legendPropUpdateClasses.js';
import { LINE_DIRECT_LABEL_PROP_UPDATE_CLASSES } from './lineDirectLabelPropUpdateClasses.js';
import { LINE_FORECAST_PROP_UPDATE_CLASSES } from './lineForecastPropUpdateClasses.js';
import { LINE_POINT_ANNOTATION_PROP_UPDATE_CLASSES } from './linePointAnnotationPropUpdateClasses.js';
import { LINE_PROP_UPDATE_CLASSES } from './linePropUpdateClasses.js';
import { REFERENCE_LINE_PROP_UPDATE_CLASSES } from './referenceLinePropUpdateClasses.js';
import { SCATTER_ANNOTATION_PROP_UPDATE_CLASSES } from './scatterAnnotationPropUpdateClasses.js';
import { SCATTER_PATH_PROP_UPDATE_CLASSES } from './scatterPathPropUpdateClasses.js';
import { SCATTER_PROP_UPDATE_CLASSES } from './scatterPropUpdateClasses.js';
import { SEGMENT_LABEL_PROP_UPDATE_CLASSES } from './segmentLabelPropUpdateClasses.js';
import { TITLE_PROP_UPDATE_CLASSES } from './titlePropUpdateClasses.js';
import { TRENDLINE_ANNOTATION_PROP_UPDATE_CLASSES } from './trendlineAnnotationPropUpdateClasses.js';
import { TRENDLINE_PROP_UPDATE_CLASSES } from './trendlinePropUpdateClasses.js';

/** A component and the declared update class of each of its props. */
export interface UpdateClassEntry {
  component: string;
  lab?: boolean;
  table: Record<string, UpdateClassification>;
}

/** Declared update classes for every exported component, in docs order. */
export const UPDATE_CLASS_REGISTRY: UpdateClassEntry[] = [
  { component: 'Chart', table: CHART_PROP_UPDATE_CLASSES },
  { component: 'Line', table: LINE_PROP_UPDATE_CLASSES },
  { component: 'LineDirectLabel', table: LINE_DIRECT_LABEL_PROP_UPDATE_CLASSES },
  { component: 'LineForecast', table: LINE_FORECAST_PROP_UPDATE_CLASSES },
  { component: 'LinePointAnnotation', table: LINE_POINT_ANNOTATION_PROP_UPDATE_CLASSES },
  { component: 'Bar', table: BAR_PROP_UPDATE_CLASSES },
  { component: 'BarDirectLabel', table: BAR_DIRECT_LABEL_PROP_UPDATE_CLASSES },
  { component: 'Donut', table: DONUT_PROP_UPDATE_CLASSES },
  { component: 'DonutSummary', table: DONUT_SUMMARY_PROP_UPDATE_CLASSES },
  { component: 'SegmentLabel', table: SEGMENT_LABEL_PROP_UPDATE_CLASSES },
  { component: 'Axis', table: AXIS_PROP_UPDATE_CLASSES },
  { component: 'AxisThumbnail', table: AXIS_THUMBNAIL_PROP_UPDATE_CLASSES },
  { component: 'ReferenceLine', table: REFERENCE_LINE_PROP_UPDATE_CLASSES },
  { component: 'Legend', table: LEGEND_PROP_UPDATE_CLASSES },
  { component: 'Title', table: TITLE_PROP_UPDATE_CLASSES },
  { component: 'ChartInspect', table: CHART_INSPECT_PROP_UPDATE_CLASSES },
  { component: 'ChartPopover', table: CHART_POPOVER_PROP_UPDATE_CLASSES },
  { component: 'Area', lab: true, table: AREA_PROP_UPDATE_CLASSES },
  { component: 'Bullet', lab: true, table: BULLET_PROP_UPDATE_CLASSES },
  { component: 'ChartActionBar', lab: true, table: CHART_ACTION_BAR_PROP_UPDATE_CLASSES },
  { component: 'Combo', lab: true, table: COMBO_PROP_UPDATE_CLASSES },
  { component: 'Scatter', lab: true, table: SCATTER_PROP_UPDATE_CLASSES },
  { component: 'ScatterAnnotation', lab: true, table: SCATTER_ANNOTATION_PROP_UPDATE_CLASSES },
  { component: 'ScatterPath', lab: true, table: SCATTER_PATH_PROP_UPDATE_CLASSES },
  { component: 'Trendline', lab: true, table: TRENDLINE_PROP_UPDATE_CLASSES },
  { component: 'TrendlineAnnotation', lab: true, table: TRENDLINE_ANNOTATION_PROP_UPDATE_CLASSES },
];
