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
import {
	DEFAULT_COLOR_SCHEME,
	DEFAULT_DIMENSION_SCALE_TYPE,
	DEFAULT_LINEAR_DIMENSION,
	DEFAULT_METRIC,
} from '@constants';
import { ScatterSpecProps } from 'types';

export const defaultScatterProps: ScatterSpecProps = {
	children: [],
	color: { value: 'categorical-100' },
	colorScaleType: 'ordinal',
	colorScheme: DEFAULT_COLOR_SCHEME,
	dimension: DEFAULT_LINEAR_DIMENSION,
	dimensionScaleType: DEFAULT_DIMENSION_SCALE_TYPE,
	index: 0,
	interactiveMarkName: 'scatter0',
	lineType: { value: 'solid' },
	lineWidth: { value: 0 },
	metric: DEFAULT_METRIC,
	name: 'scatter0',
	opacity: { value: 1 },
	size: { value: 'M' },
};
