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
import { DEFAULT_COLOR, DEFAULT_COLOR_SCHEME, DEFAULT_METRIC, FILTERED_TABLE } from '@constants';
import { sanitizeMarkChildren, toCamelCase } from '@utils';
import { produce } from 'immer';
import { Data, Mark, PartitionTransform, Spec, StratifyTransform } from 'vega';

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
			name: toCamelCase(name ?? `sunburst${index}`),
			...props,
		};

		spec.data = addData(spec.data ?? [], sunburstProps);
		spec.marks = addMarks(spec.marks ?? [], sunburstProps);

		console.log('spec is', JSON.stringify(spec, null, 2));
	}
);

export const addData = produce<Data[], [SunburstSpecProps]>((data, props) => {
	const filteredTableIndex = data.findIndex((d) => d.name === FILTERED_TABLE);

	//set up transforms
	data[filteredTableIndex].transform = data[filteredTableIndex].transform ?? [];
	data[filteredTableIndex].transform?.push(...getSunburstDataTransforms(props));
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

export const addMarks = produce<Mark[], [SunburstSpecProps]>((marks, props) => {
	marks.push(getArcMark(props));
});
