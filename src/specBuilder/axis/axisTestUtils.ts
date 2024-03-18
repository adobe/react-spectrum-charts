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
import {
	DEFAULT_COLOR_SCHEME,
	DEFAULT_GRANULARITY,
	DEFAULT_LABEL_ALIGN,
	DEFAULT_LABEL_FONT_WEIGHT,
	DEFAULT_LABEL_ORIENTATION,
} from '@constants';
import { AxisSpecProps } from 'types';
import { Mark } from 'vega';

export const defaultXBaselineMark: Mark = {
	name: 'xBaseline',
	type: 'rule',
	interactive: false,
	encode: {
		update: {
			x: { value: 0 },
			x2: { signal: 'width' },
			y: { scale: 'yLinear', value: 0 },
		},
	},
};

export const defaultYBaselineMark: Mark = {
	name: 'yBaseline',
	type: 'rule',
	interactive: false,
	encode: {
		update: {
			y: { value: 0 },
			y2: { signal: 'height' },
			x: { scale: 'xLinear', value: 0 },
		},
	},
};

export const defaultAxisProps: AxisSpecProps = {
	name: 'axis0',
	baseline: false,
	baselineOffset: 0,
	colorScheme: DEFAULT_COLOR_SCHEME,
	granularity: DEFAULT_GRANULARITY,
	grid: false,
	hideDefaultLabels: false,
	index: 0,
	labelAlign: DEFAULT_LABEL_ALIGN,
	labelFontWeight: DEFAULT_LABEL_FONT_WEIGHT,
	labelOrientation: DEFAULT_LABEL_ORIENTATION,
	labels: [],
	numberFormat: 'shortNumber',
	position: 'bottom',
	scaleType: 'linear',
	subLabels: [],
	ticks: false,
};
