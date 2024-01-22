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

/* eslint-disable @typescript-eslint/no-unused-vars */
import { DEFAULT_COLOR, DEFAULT_LINEAR_DIMENSION, DEFAULT_METRIC, DEFAULT_SYMBOL_SIZE } from '@constants';

import { ScatterProps } from '../../types';

// destructure props here and set defaults so that storybook can pick them up
export function Scatter({
	color = DEFAULT_COLOR,
	colorScaleType,
	dimension = DEFAULT_LINEAR_DIMENSION,
	children,
	metric = DEFAULT_METRIC,
	name,
	opacity = 0.8,
	size = { value: DEFAULT_SYMBOL_SIZE },
}: ScatterProps) {
	return null;
}
