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
import { FC } from 'react';

import { DEFAULT_CATEGORICAL_DIMENSION, DEFAULT_METRIC, PADDING_RATIO, TRELLIS_PADDING } from '@constants';

import { BarProps } from '../../types';

const Bar: FC<BarProps> = ({
	dimension = DEFAULT_CATEGORICAL_DIMENSION,
	color = { value: 'categorical-100' },
	metric = DEFAULT_METRIC,
	type = 'stacked',
	opacity = { value: 1 },
	lineType = { value: 'solid' },
	orientation = 'vertical',
	trellisOrientation = 'horizontal',
	trellisPadding = TRELLIS_PADDING,
	paddingRatio = PADDING_RATIO,
	paddingOuter,
}) => {
	return null;
};

// displayName is used to validate the component type in the spec builder
Bar.displayName = 'Bar';

export { Bar };
