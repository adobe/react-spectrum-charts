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
import { DEFAULT_COLOR, DEFAULT_COLOR_SCHEME, DEFAULT_METRIC, DEFAULT_TIME_DIMENSION, MARK_ID } from '@constants';

import { LineMarkProps } from './lineUtils';

export const defaultLineMarkProps: LineMarkProps = {
	children: [],
	color: DEFAULT_COLOR,
	colorScheme: DEFAULT_COLOR_SCHEME,
	dimension: DEFAULT_TIME_DIMENSION,
	idField: MARK_ID,
	lineType: { value: 'solid' },
	lineWidth: { value: 1 },
	name: 'line0',
	opacity: { value: 1 },
	metric: DEFAULT_METRIC,
	scaleType: 'time',
};
