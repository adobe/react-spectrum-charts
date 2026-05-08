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

/* eslint-disable @typescript-eslint/no-unused-vars */
import { FC } from 'react';

import { DEFAULT_METRIC } from '@spectrum-charts/constants';

import { GaugeProps } from '../../../types';

const DEFAULT_ARC_SIZE = 2 / 3;
const DEFAULT_HOLE_RATIO = 0.8;
const DEFAULT_MAX_SCALE_VALUE = 100;
const DEFAULT_METHOD = 'last';
const DEFAULT_MIN_SCALE_VALUE = 0;
const DEFAULT_NUMBER_FORMAT = 'shortNumber';
const DEFAULT_SIZE = 'M';

// destructure props here and set defaults so that storybook can pick them up
const Gauge: FC<GaugeProps> = ({
	arcSize = DEFAULT_ARC_SIZE,
	children,
	color = 'categorical-01',
	holeRatio = DEFAULT_HOLE_RATIO,
	label,
	maxScaleValue = DEFAULT_MAX_SCALE_VALUE,
	method = DEFAULT_METHOD,
	metric = DEFAULT_METRIC,
	minScaleValue = DEFAULT_MIN_SCALE_VALUE,
	name,
	numberFormat = DEFAULT_NUMBER_FORMAT,
	showNeedle = true,
	showRangeLabels = false,
	size = DEFAULT_SIZE,
	target,
	targetLabel,
	thresholds,
	ticks,
}) => {
	return null;
};

// displayName is used to validate the component type in the spec builder
Gauge.displayName = 'Gauge';

export { Gauge };
