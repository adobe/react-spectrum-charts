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
import { DEFAULT_COLOR, DEFAULT_COLOR_SCHEME, DEFAULT_METRIC, TABLE } from '@constants';
import { getTooltipProps, hasInteractiveChildren } from '@specBuilder/marks/markUtils';
import { addFieldToFacetScaleDomain } from '@specBuilder/scale/scaleSpecBuilder';
import { addHighlightedItemSignalEvents } from '@specBuilder/signal/signalSpecBuilder';
import { sanitizeMarkChildren, toCamelCase } from '@utils';
import { produce } from 'immer';
import { Data, Mark, PartitionTransform, Scale, Signal, Spec, StratifyTransform } from 'vega';

import { ColorScheme, HighlightedItem, SunburstProps, SunburstSpecProps } from '../../types';
import { getArcMark } from './sunburstMarkUtils';

export const addSunburst = produce<
	Spec,
	[SunburstProps & { colorScheme?: ColorScheme; highlightedItem?: HighlightedItem; index?: number; idKey: string }]
>(
	(
		spec,
		{
			children,
			color = DEFAULT_COLOR,
			colorScheme = DEFAULT_COLOR_SCHEME,
			index = 0,
			metric = DEFAULT_METRIC,
			name,
			id = 'id',
			parentId = 'parent',
			segmentKey = 'segment',
			...props
		}
	) => {
		// put props back together now that all defaults are set
		const sunburstProps: SunburstSpecProps = {
			children: sanitizeMarkChildren(children),
			color,
			colorScheme,
			index,
			markType: 'sunburst',
			metric,
			id,
			parentId,
			segmentKey,
			name: toCamelCase(name ?? `sunburst${index}`),
			...props,
		};

		spec.data = addData(spec.data ?? [], sunburstProps);
		spec.scales = addScales(spec.scales ?? [], sunburstProps);
		spec.marks = addMarks(spec.marks ?? [], sunburstProps);
		spec.signals = addSignals(spec.signals ?? [], sunburstProps);
	}
);

export const addData = produce<Data[], [SunburstSpecProps]>((data, props) => {
	const tableIndex = data.findIndex((d) => d.name === TABLE);

	//set up transforms
	data[tableIndex].transform = data[tableIndex].transform ?? [];
	data[tableIndex].transform?.push(...getSunburstDataTransforms(props));
});

const getSunburstDataTransforms = ({
	id,
	parentId,
	metric,
}: SunburstSpecProps): (StratifyTransform | PartitionTransform)[] => [
	{
		type: 'stratify',
		key: id,
		parentKey: parentId,
	},
	{
		type: 'partition',
		field: metric,
		sort: { field: metric },
		size: [{ signal: '2 * PI' }, { signal: 'width / 2' }],
		as: ['a0', 'r0', 'a1', 'r1', 'depth', 'children'],
	},
];

export const addScales = produce<Scale[], [SunburstSpecProps]>((scales, props) => {
	const { segmentKey } = props;
	addFieldToFacetScaleDomain(scales, 'opacity', 'depth');
	addFieldToFacetScaleDomain(scales, 'color', segmentKey);
});

export const addMarks = produce<Mark[], [SunburstSpecProps]>((marks, props) => {
	marks.push(getArcMark(props));
});

export const addSignals = produce<Signal[], [SunburstSpecProps]>((signals, props) => {
	const { children, idKey, name } = props;
	if (!hasInteractiveChildren(children)) return;
	addHighlightedItemSignalEvents(signals, name, idKey, 1, getTooltipProps(children)?.excludeDataKeys);
});
