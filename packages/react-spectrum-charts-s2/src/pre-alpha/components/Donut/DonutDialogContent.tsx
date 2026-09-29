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
import { FC } from 'react';

import { View } from 'vega';

import { COLOR_SCALE, DEFAULT_COLOR, DEFAULT_METRIC, DONUT_BOOLEAN_SECONDARY_COLOR } from '@spectrum-charts/constants';
import { getS2ColorValue } from '@spectrum-charts/themes';
import { ColorScheme, Datum, formatPercentWithValue } from '@spectrum-charts/vega-spec-builder-s2';

import { ChartProps, DonutProps } from '../../../types';

interface DonutDialogContentOptions {
  colorKey: string;
  metricKey: string;
  /** Field holding the segment's percent of the visible total (0-1) */
  percentKey: string;
}

type DefaultDonutContent = DonutDialogContentOptions & {
  /** Data source holding a boolean donut's primary segment; only set for boolean donuts */
  booleanDataName?: string;
};

interface DonutDialogContentProps extends DonutDialogContentOptions {
  color?: string;
  datum: Datum;
  locale: ChartProps['locale'];
}

/**
 * Gets the swatch color for a donut segment, matching the gray fill of a boolean donut's secondary segment.
 * @param view
 * @param content
 * @param datum
 * @param idKey
 * @param colorScheme
 * @returns color string
 */
const getDonutSwatchColor = (
  view: View | undefined,
  { booleanDataName, colorKey }: DefaultDonutContent,
  datum: Datum,
  idKey: string,
  colorScheme: ColorScheme
): string | undefined => {
  if (!view) return undefined;
  if (booleanDataName && datum[idKey] !== view.data(booleanDataName)[0]?.[idKey]) {
    return getS2ColorValue(DONUT_BOOLEAN_SECONDARY_COLOR, colorScheme);
  }
  return view.scale(COLOR_SCALE)(datum[colorKey]) as string | undefined;
};

/**
 * Gets the default dialog content options for a donut.
 * @param name
 * @param donutProps
 * @returns DefaultDonutContent
 */
const getDefaultDonutContent = (name: string, { color, isBoolean, metric }: DonutProps): DefaultDonutContent => ({
  booleanDataName: isBoolean ? `${name}_booleanData` : undefined,
  colorKey: color ?? DEFAULT_COLOR,
  metricKey: metric ?? DEFAULT_METRIC,
  percentKey: `${name}_arcPercent`,
});

const DonutDialogContent: FC<DonutDialogContentProps> = ({ color, colorKey, datum, locale, metricKey, percentKey }) => {
  const series = datum[colorKey];
  const percent = datum[percentKey];
  const value = datum[metricKey];
  const percentWithValue =
    typeof percent === 'number' && typeof value === 'number' ? formatPercentWithValue(locale)(percent, value) : '';
  return (
    <div className="rsc-donut-dialog-content">
      <span
        aria-hidden="true"
        className="rsc-donut-dialog-swatch"
        data-testid="donut-dialog-swatch"
        style={{ backgroundColor: color }}
      />
      <span className="rsc-donut-dialog-series">{String(series ?? '')}</span>
      <span className="rsc-donut-dialog-percent-value">{percentWithValue}</span>
    </div>
  );
};

export { DonutDialogContent, getDefaultDonutContent, getDonutSwatchColor };
export type { DefaultDonutContent };
