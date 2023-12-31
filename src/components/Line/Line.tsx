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

/* eslint-disable @typescript-eslint/no-unused-vars */
import { DEFAULT_COLOR, DEFAULT_CONTINUOUS_DIMENSION, DEFAULT_METRIC } from '@constants';

import { LineProps } from '../../types';

export function Line({
	name = 'line0',
	dimension = DEFAULT_CONTINUOUS_DIMENSION,
	metric = DEFAULT_METRIC,
	color = { value: 'categorical-100' },
	scaleType = 'time',
	lineType = { value: 'solid' },
	padding,
}: LineProps) {
	return null;
}
