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

import { COLOR_SCALE } from '@spectrum-charts/constants';
import { getS2ColorValue } from '@spectrum-charts/themes';
import { ColorScheme, Datum, formatPercentWithValue } from '@spectrum-charts/vega-spec-builder-s2';

import { ChartProps } from '../types';

interface DonutDialogContentOptions {
  /** Data source holding a boolean donut's primary segment; only set for boolean donuts */
  booleanDataName?: string;
  colorKey: string;
  metricKey: string;
  /** Field holding the segment's percent of the visible total (0-1) */
  percentKey: string;
}

interface DonutDialogContentProps extends DonutDialogContentOptions {
  datum: Datum;
  getColor: (datum: Datum) => string | undefined;
  locale?: ChartProps['locale'];
}

/**
 * Gets the swatch color for a donut segment, matching the gray fill of a boolean donut's secondary segment.
 * @param view
 * @param options
 * @param datum
 * @param idKey
 * @param colorScheme
 * @returns color string
 */
const getDonutSwatchColor = (
  view: View | undefined,
  { booleanDataName, colorKey }: DonutDialogContentOptions,
  datum: Datum,
  idKey: string,
  colorScheme: ColorScheme
): string | undefined => {
  if (!view) return undefined;
  if (booleanDataName && datum[idKey] !== view.data(booleanDataName)[0]?.[idKey]) {
    return getS2ColorValue('gray-400', colorScheme);
  }
  return view.scale(COLOR_SCALE)(datum[colorKey]) as string | undefined;
};

const DonutDialogContent: FC<DonutDialogContentProps> = ({
  colorKey,
  datum,
  getColor,
  locale,
  metricKey,
  percentKey,
}) => {
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
        style={{ backgroundColor: getColor(datum) }}
      />
      <span className="rsc-donut-dialog-series">{String(series ?? '')}</span>
      <span className="rsc-donut-dialog-percent-value">{percentWithValue}</span>
    </div>
  );
};

export { DonutDialogContent, getDonutSwatchColor };
export type { DonutDialogContentOptions, DonutDialogContentProps };
