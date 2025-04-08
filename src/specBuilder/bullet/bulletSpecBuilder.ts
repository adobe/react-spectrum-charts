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
import {
	DEFAULT_BULLET_DIRECTION,
	DEFAULT_COLOR_SCHEME,
	DEFAULT_LABEL_POSITION,
	DEFAULT_SCALE_TYPE,
	DEFAULT_SCALE_VALUE,
} from '@constants';
import { spectrumColors } from '@themes';
import { toCamelCase } from '@utils';
import { produce } from 'immer';
import { Spec } from 'vega';

import { BulletProps, BulletSpecProps, ColorScheme } from '../../types';
import { sanitizeMarkChildren } from '../../utils';
import { getColorValue } from '../specUtils';
import { addAxes, addData, addMarks, addScales, addSignals } from './bulletMarkUtils';

const DEFAULT_COLOR = spectrumColors.light['static-blue'];

export const addBullet = produce<Spec, [BulletProps & { colorScheme?: ColorScheme; index?: number; idKey: string }]>(
	(
		spec,
		{
			children,
			colorScheme = DEFAULT_COLOR_SCHEME,
			index = 0,
			name,
			metric,
			dimension,
			target,
			color = DEFAULT_COLOR,
			direction = DEFAULT_BULLET_DIRECTION,
			numberFormat,
			showTarget = true,
			showTargetValue = false,
			labelPosition = DEFAULT_LABEL_POSITION,
			scaleType = DEFAULT_SCALE_TYPE,
			maxScaleValue = DEFAULT_SCALE_VALUE,
			thresholds = [],
			track = false,
			thresholdBarColor = false,
			metricAxis = false,
			...props
		}
	) => {
		const bulletProps: BulletSpecProps = {
			children: sanitizeMarkChildren(children),
			colorScheme: colorScheme,
			index,
			color: getColorValue(color, colorScheme),
			metric: metric ?? 'currentAmount',
			dimension: dimension ?? 'graphLabel',
			target: target ?? 'target',
			name: toCamelCase(name ?? `bullet${index}`),
			direction: direction,
			numberFormat: numberFormat ?? '',
			showTarget: showTarget,
			showTargetValue: showTargetValue,
			labelPosition: labelPosition,
			scaleType: scaleType,
			maxScaleValue: maxScaleValue,
			track: track,
			thresholds: thresholds,
			thresholdBarColor: thresholdBarColor,
			metricAxis: metricAxis,
			...props,
		};

		spec.data = addData(spec.data ?? [], bulletProps);
		spec.marks = addMarks(spec.marks ?? [], bulletProps);
		spec.scales = addScales(spec.scales ?? [], bulletProps);
		spec.signals = addSignals(spec.signals ?? [], bulletProps);
		spec.axes = addAxes(spec.axes ?? [], bulletProps);
	}
);
