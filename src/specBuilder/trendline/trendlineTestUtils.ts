/*
 * Copyright 2024 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import { Trendline } from '@components/Trendline';
import { DEFAULT_COLOR, DEFAULT_COLOR_SCHEME, DEFAULT_METRIC, DEFAULT_TIME_DIMENSION } from '@constants';
import { createElement } from 'react';
import { LineSpecProps, TrendlineSpecProps } from 'types';

export const defaultLineProps: LineSpecProps = {
	children: [createElement(Trendline, { method: 'average' })],
	color: DEFAULT_COLOR,
	colorScheme: DEFAULT_COLOR_SCHEME,
	dimension: DEFAULT_TIME_DIMENSION,
	index: 0,
	lineType: { value: 'solid' },
	metric: DEFAULT_METRIC,
	name: 'line0',
	opacity: { value: 1 },
	scaleType: 'time',
	interactiveMarkName: undefined,
	popoverMarkName: undefined,
};

export const defaultTrendlineProps: TrendlineSpecProps = {
	children: [],
	dimensionExtent: [null, null],
	dimensionRange: [null, null],
	dimensionScaleType: 'time',
	displayOnHover: false,
	highlightRawPoint: false,
	isDimensionNormalized: false,
	lineType: 'dashed',
	lineWidth: 'M',
	method: 'average',
	metric: DEFAULT_METRIC,
	name: 'line0Trendline0',
	opacity: 1,
	orientation: 'horizontal',
	trendlineDimension: DEFAULT_TIME_DIMENSION,
	trendlineMetric: DEFAULT_METRIC,
};
