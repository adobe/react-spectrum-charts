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
import { Scale, Signal, Spec } from 'vega';

import { BulletProps, BulletSpecProps, ColorScheme } from '../../types';
import { sanitizeMarkChildren } from '../../utils';
import { getColorValue } from '../specUtils';
import { addData } from './bulletDataUtils';
import { addAxes, addMarks } from './bulletMarkUtils';

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

export const addScales = produce<Scale[], [BulletSpecProps]>((scales, props) => {
	const groupScaleRangeSignal = props.direction === 'column' ? 'bulletChartHeight' : 'width';
	const xRange = props.direction === 'column' ? 'width' : [0, { signal: 'bulletGroupWidth' }];
	let domainFields;

	if (props.scaleType === 'flexible' && props.maxScaleValue > 0) {
		domainFields = { data: 'table', fields: ['xPaddingForTarget', props.metric, 'flexibleScaleValue'] };
	} else if (props.scaleType === 'fixed' && props.maxScaleValue > 0) {
		domainFields = [0, `${props.maxScaleValue}`];
	} else {
		domainFields = { data: 'table', fields: ['xPaddingForTarget', props.metric] };
	}

	scales.push(
		{
			name: 'groupScale',
			type: 'band',
			domain: { data: 'table', field: props.dimension },
			range: [0, { signal: groupScaleRangeSignal }],
			paddingInner: { signal: 'paddingRatio' },
		},
		{
			name: 'xscale',
			type: 'linear',
			domain: domainFields,
			range: xRange,
			round: true,
			clamp: true,
			zero: true,
		}
	);
});

export const addSignals = produce<Signal[], [BulletSpecProps]>((signals, props) => {
	signals.push({ name: 'gap', value: 12 });
	signals.push({ name: 'bulletHeight', value: 8 });
	signals.push({ name: 'bulletThresholdHeight', update: 'bulletHeight * 3' });
	signals.push({ name: 'targetHeight', update: 'bulletThresholdHeight + 6' });

	if (props.showTargetValue && props.showTarget) {
		signals.push({ name: 'targetValueLabelHeight', update: '20' });
	}

	signals.push({
		name: 'bulletGroupHeight',
		update: getBulletGroupHeightExpression(props),
	});

	if (props.direction === 'column') {
		signals.push({ name: 'paddingRatio', update: 'gap / (gap + bulletGroupHeight)' });

		if (props.metricAxis && !props.showTargetValue) {
			signals.push({
				name: 'bulletChartHeight',
				update: "length(data('table')) * bulletGroupHeight + (length(data('table')) - 1) * gap + 10",
			});
			signals.push({
				name: 'axisOffset',
				update: 'bulletChartHeight - height - 10',
			});
		} else {
			signals.push({
				name: 'bulletChartHeight',
				update: "length(data('table')) * bulletGroupHeight + (length(data('table')) - 1) * gap",
			});
		}
	} else {
		signals.push({ name: 'bulletGroupWidth', update: "(width / length(data('table'))) - gap" });
		signals.push({ name: 'paddingRatio', update: 'gap / (gap + bulletGroupWidth)' });
		signals.push({ name: 'bulletChartHeight', update: 'bulletGroupHeight' });
	}
});

/**
 * Returns the height of the bullet group based on the props
 * @param props the bullet spec props
 * @returns the height of the bullet group
 */
function getBulletGroupHeightExpression(props: BulletSpecProps): string {
	if (props.showTargetValue && props.showTarget) {
		return props.labelPosition === 'side' && props.direction === 'column'
			? 'bulletThresholdHeight + targetValueLabelHeight + 10'
			: 'bulletThresholdHeight + targetValueLabelHeight + 24';
	} else if (props.labelPosition === 'side' && props.direction === 'column') {
		return 'bulletThresholdHeight + 10';
	}
	return 'bulletThresholdHeight + 24';
}
