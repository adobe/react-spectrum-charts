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
import { defaultTheme } from '@adobe/react-spectrum';
import {
  DEFAULT_BACKGROUND_COLOR,
  DEFAULT_COLOR_SCHEME,
  DEFAULT_HIDDEN_SERIES,
  DEFAULT_LINE_TYPES,
  DEFAULT_LINE_WIDTHS,
  DEFAULT_LOCALE,
  MARK_ID,
} from '@spectrum-charts/constants';
import { LineType, LineWidth, PartiallyRequired } from '@spectrum-charts/vega-spec-builder';

import './Chart.css';
import { ChartProps } from './types';

type ChartPropsWithDefaults =
  | 'backgroundColor'
  | 'colors'
  | 'colorScheme'
  | 'debug'
  | 'emptyStateText'
  | 'height'
  | 'hiddenSeries'
  | 'idKey'
  | 'lineTypes'
  | 'lineWidths'
  | 'locale'
  | 'minHeight'
  | 'maxHeight'
  | 'minWidth'
  | 'maxWidth'
  | 'padding'
  | 'renderer'
  | 's2'
  | 'theme'
  | 'tooltipAnchor'
  | 'tooltipPlacement'
  | 'width';

const baseDefaults: Required<Pick<ChartProps, ChartPropsWithDefaults>> = {
  backgroundColor: DEFAULT_BACKGROUND_COLOR,
  colors: 'categorical16',
  colorScheme: DEFAULT_COLOR_SCHEME,
  debug: false,
  emptyStateText: 'No data found',
  height: 300,
  hiddenSeries: DEFAULT_HIDDEN_SERIES,
  idKey: MARK_ID,
  lineTypes: DEFAULT_LINE_TYPES as LineType[],
  lineWidths: DEFAULT_LINE_WIDTHS as LineWidth[],
  locale: DEFAULT_LOCALE,
  minHeight: 100,
  maxHeight: Infinity,
  minWidth: 100,
  maxWidth: Infinity,
  padding: 0,
  renderer: 'svg' as const,
  s2: false,
  theme: defaultTheme,
  tooltipAnchor: 'cursor' as const,
  tooltipPlacement: 'top' as const,
  width: 'auto' as const,
};

type S2PropDefaults = 'colors';

const s2ColorOverride: Required<Pick<ChartProps, S2PropDefaults>> = {
  colors: 's2Categorical20',
};

export const applyChartPropsDefaults = (props: ChartProps): PartiallyRequired<ChartProps, ChartPropsWithDefaults> => {
  return {
    ...baseDefaults,
    ...(props.s2 ? s2ColorOverride : {}),
    ...props,
  };
};
