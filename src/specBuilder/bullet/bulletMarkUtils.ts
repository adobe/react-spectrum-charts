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
import { produce } from 'immer';
import { Axis, Data, GroupMark, Mark, Scale, Signal } from 'vega';

import { BulletSpecProps } from '../../types';
import { getColorValue } from '../specUtils';
import { getBulletTableData, getBulletTransforms } from './bulletDataUtils';

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

		if (props.axis && !props.showTargetValue) {
			signals.push({
				name: 'bulletChartHeight',
				update: "length(data('table')) * bulletGroupHeight + (length(data('table')) - 1) * gap + 10",
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

export const addData = produce<Data[], [BulletSpecProps]>((data, props) => {
	const tableData = getBulletTableData(data);
	tableData.values = props.children?.length ? props.children : [];
	tableData.transform = getBulletTransforms(props);
});

export const addMarks = produce<Mark[], [BulletSpecProps]>((marks, props) => {
	const markGroupEncodeUpdateDirection = props.direction === 'column' ? 'y' : 'x';
	const bulletGroupWidth = props.direction === 'column' ? 'width' : 'bulletGroupWidth';

	const bulletMark: GroupMark = {
		name: 'bulletGroup',
		type: 'group',
		from: {
			facet: { data: 'table', name: 'bulletGroups', groupby: `${props.dimension}` },
		},
		encode: {
			update: {
				[markGroupEncodeUpdateDirection]: { scale: 'groupScale', field: `${props.dimension}` },
				height: { signal: 'bulletGroupHeight' },
				width: { signal: bulletGroupWidth },
			},
		},
		marks: [],
	};

	const thresholds = props.thresholds;

	if (Array.isArray(thresholds) && thresholds.length > 0) {
		bulletMark.data = [
			{
				name: 'thresholds',
				values: thresholds,
				transform: [{ type: 'identifier', as: 'id' }],
			},
		];
		bulletMark.marks?.push(getBulletMarkThreshold(props));
	} else if (props.track) {
		bulletMark.marks?.push(getBulletTrack(props));
	}

	bulletMark.marks?.push(getBulletMarkRect(props));
	if (props.target && props.showTarget !== false) {
		bulletMark.marks?.push(getBulletMarkTarget(props));
		if (props.showTargetValue) {
			bulletMark.marks?.push(getBulletMarkTargetValueLabel(props));
		}
	}

	if (props.labelPosition === 'top' || props.direction === 'row') {
		bulletMark.marks?.push(getBulletMarkLabel(props));
		bulletMark.marks?.push(getBulletMarkValueLabel(props));
	}

	marks.push(bulletMark);
});

export function getBulletMarkRect(props: BulletSpecProps): Mark {
	//The vertical positioning is calculated starting at the bulletgroupheight
	//and then subtracting two times the bullet height to center the bullet bar
	//in the middle of the threshold. The 3 is subtracted because the bulletgroup height
	//starts the bullet below the threshold area.
	//Additionally, the value of the targetValueLabelHeight is subtracted if the target value label is shown
	//to make sure that the bullet bar is not drawn over the target value label.
	const bulletMarkRectEncodeUpdateYSignal =
		props.showTarget && props.showTargetValue
			? 'bulletGroupHeight - targetValueLabelHeight - 3 - 2 * bulletHeight'
			: 'bulletGroupHeight - 3 - 2 * bulletHeight';

	const bulletMarkRect: Mark = {
		name: `${props.name}Rect`,
		description: `${props.name}Rect`,
		type: 'rect',
		from: { data: 'bulletGroups' },
		encode: {
			enter: {
				cornerRadiusTopLeft: [{ test: `datum.${props.metric} < 0`, value: 3 }],
				cornerRadiusBottomLeft: [{ test: `datum.${props.metric} < 0`, value: 3 }],
				cornerRadiusTopRight: [{ test: `datum.${props.metric} > 0`, value: 3 }],
				cornerRadiusBottomRight: [{ test: `datum.${props.metric} > 0`, value: 3 }],
				fill: [{ value: `${props.color}` }],
			},
			update: {
				x: { scale: 'xscale', value: 0 },
				x2: { scale: 'xscale', field: `${props.metric}` },
				height: { signal: 'bulletHeight' },
				y: { signal: bulletMarkRectEncodeUpdateYSignal },
			},
		},
	};

	return bulletMarkRect;
}

export function getBulletMarkTarget(props: BulletSpecProps): Mark {
	const solidColor = getColorValue('gray-900', props.colorScheme);

	//When the target value label is shown, we must subtract the height of the target value label
	//to make sure that the target line is not drawn over the target value label
	const bulletMarkTargetEncodeUpdateY =
		props.showTarget && props.showTargetValue
			? 'bulletGroupHeight - targetValueLabelHeight - targetHeight'
			: 'bulletGroupHeight - targetHeight';
	const bulletMarkTargetEncodeUpdateY2 =
		props.showTarget && props.showTargetValue ? 'bulletGroupHeight - targetValueLabelHeight' : 'bulletGroupHeight';

	const bulletMarkTarget: Mark = {
		name: `${props.name}Target`,
		description: `${props.name}Target`,
		type: 'rule',
		from: { data: 'bulletGroups' },
		encode: {
			enter: {
				stroke: { value: `${solidColor}` },
				strokeWidth: { value: 2 },
			},
			update: {
				x: { scale: 'xscale', field: `${props.target}` },
				y: { signal: bulletMarkTargetEncodeUpdateY },
				y2: { signal: bulletMarkTargetEncodeUpdateY2 },
			},
		},
	};

	return bulletMarkTarget;
}

export function getBulletMarkLabel(props: BulletSpecProps): Mark {
	const barLabelColor = getColorValue('gray-600', props.colorScheme);

	const bulletMarkLabel: Mark = {
		name: `${props.name}Label`,
		description: `${props.name}Label`,
		type: 'text',
		from: { data: 'bulletGroups' },
		encode: {
			enter: {
				text: { signal: `datum.${props.dimension}` },
				align: { value: 'left' },
				baseline: { value: 'top' },
				fill: { value: `${barLabelColor}` },
			},
			update: { x: { value: 0 }, y: { value: 0 } },
		},
	};

	return bulletMarkLabel;
}

export function getBulletMarkValueLabel(props: BulletSpecProps): Mark {
	const solidColor = getColorValue('gray-900', props.colorScheme);
	const encodeUpdateSignalWidth = props.direction === 'column' ? 'width' : 'bulletGroupWidth';

	const bulletMarkValueLabel: Mark = {
		name: `${props.name}ValueLabel`,
		description: `${props.name}ValueLabel`,
		type: 'text',
		from: { data: 'bulletGroups' },
		encode: {
			enter: {
				text: {
					signal: `datum.${props.metric} != null ? format(datum.${props.metric}, '${
						props.numberFormat || ''
					}') : ''`,
				},
				align: { value: 'right' },
				baseline: { value: 'top' },
				fill: { value: `${solidColor}` },
			},
			update: { x: { signal: encodeUpdateSignalWidth }, y: { value: 0 } },
		},
	};

	return bulletMarkValueLabel;
}

export function getBulletMarkTargetValueLabel(props: BulletSpecProps): Mark {
	const solidColor = getColorValue('gray-900', props.colorScheme);

	const bulletMarkTargetValueLabel: Mark = {
		name: `${props.name}TargetValueLabel`,
		description: `${props.name}TargetValueLabel`,
		type: 'text',
		from: { data: 'bulletGroups' },
		encode: {
			enter: {
				text: {
					signal: `datum.${props.target} != null ? 'Target: ' + format(datum.${props.target}, '$,.2f') : 'No Target'`,
				},
				align: { value: 'center' },
				baseline: { value: 'top' },
				fill: { value: `${solidColor}` },
			},
			update: {
				x: { scale: 'xscale', field: `${props.target}` },
				y: { signal: 'bulletGroupHeight - targetValueLabelHeight + 6' },
			},
		},
	};

	return bulletMarkTargetValueLabel;
}

export function getBulletMarkThreshold(props: BulletSpecProps): Mark {
	// Vertically center the threshold bar by offsetting from bulletGroupHeight.
	// Subtract 3 for alignment and targetValueLabelHeight if the label is shown.
	const baseHeightSignal = 'bulletGroupHeight - 3 - bulletThresholdHeight';
	const encodeUpdateYSignal =
		props.showTarget && props.showTargetValue ? `${baseHeightSignal} - targetValueLabelHeight` : baseHeightSignal;

	const bulletMarkThreshold: Mark = {
		name: `${props.name}Threshold`,
		description: `${props.name}Threshold`,
		type: 'rect',
		from: { data: 'thresholds' },
		clip: true,
		encode: {
			enter: {
				cornerRadiusTopLeft: [
					{ test: `!isDefined(datum.thresholdMin) && domain('xscale')[0] !== 0`, value: 3 },
				],
				cornerRadiusBottomLeft: [
					{ test: `!isDefined(datum.thresholdMin) && domain('xscale')[0] !== 0`, value: 3 },
				],
				cornerRadiusTopRight: [
					{ test: `!isDefined(datum.thresholdMax) && domain('xscale')[1] !== 0`, value: 3 },
				],
				cornerRadiusBottomRight: [
					{ test: `!isDefined(datum.thresholdMax) && domain('xscale')[1] !== 0`, value: 3 },
				],
				fill: { field: 'fill' },
				fillOpacity: { value: 0.2 },
			},
			update: {
				x: {
					signal: "isDefined(datum.thresholdMin) ? scale('xscale', datum.thresholdMin) : 0",
				},
				x2: {
					signal: "isDefined(datum.thresholdMax) ? scale('xscale', datum.thresholdMax) : width",
				},
				height: { signal: 'bulletThresholdHeight' },
				y: { signal: encodeUpdateYSignal },
			},
		},
	};
	return bulletMarkThreshold;
}

export function getBulletTrack(props: BulletSpecProps): Mark {
	const trackColor = getColorValue('gray-200', props.colorScheme);
	const trackWidth = props.direction === 'column' ? 'width' : 'bulletGroupWidth';
	// Subtracting 20 accounts for the space used by the target value label
	const trackY = props.showTarget && props.showTargetValue ? 'bulletGroupHeight - 3 - 2 * bulletHeight - 20' : 'bulletGroupHeight - 3 - 2 * bulletHeight';

	const bulletTrack: Mark = {
		name: `${props.name}Track`,
		description: `${props.name}Track`,
		type: 'rect',
		from: { data: 'bulletGroups' },
		encode: {
			enter: {
				fill: { value: trackColor },
				cornerRadiusTopRight: [{ test: "domain('xscale')[1] !== 0", value: 3 }],
				cornerRadiusBottomRight: [{ test: "domain('xscale')[1] !== 0", value: 3 }],
				cornerRadiusTopLeft: [{ test: "domain('xscale')[0] !== 0", value: 3 }],
				cornerRadiusBottomLeft: [{ test: "domain('xscale')[0] !== 0", value: 3 }],
			},
			update: {
				x: { value: 0 },
				width: { signal: trackWidth },
				height: { signal: 'bulletHeight' },
				y: { signal: trackY },
			},
		},
	};

	return bulletTrack;
}

export function getBulletLabelAxes(props: BulletSpecProps): Axis[] {
	const labelOffset = props.showTargetValue && props.showTarget ? -8 : 2;

	return [{
		scale: 'groupScale',
		orient: 'left',
		tickSize: 0,
		labelOffset: labelOffset,
		labelPadding: 10,
		labelColor: '#797979',
		domain: false,
	},{
		scale: 'groupScale',
		orient: 'right',
		tickSize: 0,
		labelOffset: labelOffset,
		labelPadding: 10,
		domain: false,
		encode: {
			labels: {
				update: {
					text: {
						signal: `info(data('table')[datum.index * (length(data('table')) - 1)].${
							props.metric
						}) != null ? format(info(data('table')[datum.index * (length(data('table')) - 1)].${
							props.metric
						}), '${props.numberFormat || ''}') : ''`,
					},
				},
			},
		},
	}];
}

export function getBulletScaleAxes(props: BulletSpecProps): Axis {

	return {
		labelOffset: 2,
		scale: 'xscale',
		orient: 'bottom',
		ticks: false,
		labelColor: 'gray',
		domain: false,
		tickCount: 5,
		offset: props.showTargetValue ? 10 : 0,
	};
}

export function getBulletAxes(props: BulletSpecProps): Axis[] {
	let BulletAxes: Axis[] = [];

	if (props.axis && props.direction === 'column' && !props.showTargetValue) {
		BulletAxes.push(getBulletScaleAxes(props));
	}

	if (props.labelPosition === 'side' && props.direction === 'column') {
		BulletAxes = BulletAxes.concat(getBulletLabelAxes(props));
	}

	return BulletAxes;
}
