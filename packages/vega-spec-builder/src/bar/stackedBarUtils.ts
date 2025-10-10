/*
 * Copyright 2023 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import { GroupMark, Mark, RectEncodeEntry, RectMark } from 'vega';

import { BACKGROUND_COLOR, DIMENSION_HOVER_AREA, FILTERED_TABLE } from '@spectrum-charts/constants';

import { getTooltip, isInteractive } from '../marks/markUtils';
import { BarSpecOptions } from '../types';
import { getAnnotationMarks } from './barAnnotationUtils';
import {
  getBarEnterEncodings,
  getBarUpdateEncodings,
  getBaseBarEnterEncodings,
  getDodgedDimensionEncodings,
  getDodgedGroupMark,
  getOrientationProperties,
  isDodgedAndStacked,
} from './barUtils';
import { getTrellisProperties, isTrellised } from './trellisedBarUtils';
import { hasTooltipWithDimensionAreaTarget } from '../chartTooltip/chartTooltipUtils';

export const getStackedBarMarks = (options: BarSpecOptions): Mark[] => {
  const marks: Mark[] = [];

  if (hasTooltipWithDimensionAreaTarget(options.chartTooltips)) {
    marks.push(getStackedBarDimensionHoverArea(options));
  }

  // add background marks
  // these marks make it so that when the opacity of a bar is lowered (like on hover), you can't see the grid lines behind the bars
  marks.push(getStackedBackgroundBar(options));

  // bar mark
  marks.push(getStackedBar(options));

  // add annotation marks
  marks.push(
    ...getAnnotationMarks(
      options,
      getBaseDataSourceName(options),
      getOrientationProperties(options.orientation).dimensionScaleKey,
      options.dimension
    )
  );

  return marks;
};

export const getDodgedAndStackedBarMark = (options: BarSpecOptions): GroupMark => {
  const marks: Mark[] = [];
  // add background marks
  marks.push(getStackedBackgroundBar(options));

  // bar mark
  marks.push(getStackedBar(options));

  // add annotation marks
  marks.push(
    ...getAnnotationMarks(options, `${options.name}_facet`, `${options.name}_position`, `${options.name}_dodgeGroup`)
  );

  return { ...getDodgedGroupMark(options), marks };
};

/**
 * Returns the mark for the dimension area position of a stacked bar
 * @param options
 * @returns
 */
export const getStackedBarDimensionHoverArea = (options: BarSpecOptions): RectMark => {
  const { name: barName } = options;

  return {
    name: `${barName}_${DIMENSION_HOVER_AREA}`,
    description: `hover area for ${barName} dimensions`,
    type: 'rect',
    from: { data: `${barName}_stacks` },
    interactive: true,
    clip: true,
    encode: {
      enter: {
        fill: { value: 'transparent' },
        tooltip: getTooltip(options.chartTooltips ?? [], `${barName}_${DIMENSION_HOVER_AREA}`, false, { dimension: options.dimension }),
      },
      update: {
        ...getStackedBarDimensionAreaPositionEncodings(options)
      },
    },
  };
};

/**
 * Returns the encodings for the dimension area position of a stacked bar
 * @param options
 * @returns
 */
export const getStackedBarDimensionAreaPositionEncodings = (options: BarSpecOptions): RectEncodeEntry => {
  const { dimension, orientation } = options;
  const { dimensionScaleKey, metricAxis, dimensionAxis, dimensionSizeSignal, metricSizeSignal } = getOrientationProperties(orientation);

  return {
    [metricAxis]: { value: 0 },
    [`${metricAxis}2`]: { signal: `${metricSizeSignal}` },
    [dimensionAxis]: {
      signal: `scale('${dimensionScaleKey}', datum.${dimension}) - bandwidth('${dimensionScaleKey}') * paddingInner / 2 / (1 - paddingInner)`,
    },
    [dimensionSizeSignal]: {
      signal: `bandwidth('${dimensionScaleKey}') * ( 1 + paddingInner / (1 - paddingInner))`,
    },
  };
};

export const getStackedBackgroundBar = (options: BarSpecOptions): RectMark => {
  const { name } = options;

  return {
    name: `${name}_background`,
    description: `${name}_background`,
    type: 'rect',
    from: { data: isDodgedAndStacked(options) ? `${name}_facet` : getBaseDataSourceName(options) },
    interactive: false,
    encode: {
      enter: {
        ...getBaseBarEnterEncodings(options),
        fill: { signal: BACKGROUND_COLOR },
      },
      update: {
        ...getStackedDimensionEncodings(options),
      },
    },
  };
};

export const getStackedBar = (options: BarSpecOptions): RectMark => {
  const { name } = options;
  return {
    name,
    description: name,
    type: 'rect',
    from: { data: isDodgedAndStacked(options) ? `${name}_facet` : getBaseDataSourceName(options) },
    interactive: isInteractive(options),
    encode: {
      enter: {
        ...getBaseBarEnterEncodings(options),
        ...getBarEnterEncodings(options),
      },
      update: {
        ...getStackedDimensionEncodings(options),
        ...getBarUpdateEncodings(options),
      },
    },
  };
};

export const getStackedDimensionEncodings = (options: BarSpecOptions): RectEncodeEntry => {
  const { dimension, orientation } = options;
  if (isDodgedAndStacked(options)) {
    return getDodgedDimensionEncodings(options);
  }

  const { dimensionAxis, dimensionSizeSignal, dimensionScaleKey } = getOrientationProperties(orientation);

  return {
    [dimensionAxis]: { scale: dimensionScaleKey, field: dimension },
    [dimensionSizeSignal]: { scale: dimensionScaleKey, band: 1 },
  };
};

const getBaseDataSourceName = (options: BarSpecOptions) => {
  if (isTrellised(options)) return getTrellisProperties(options).facetName;
  return FILTERED_TABLE;
};
