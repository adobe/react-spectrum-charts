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
import { COLOR_SCALE, DEFAULT_COLOR, DEFAULT_COLOR_SCHEME, DEFAULT_METRIC, TABLE } from '@constants';
import { addFieldToFacetScaleDomain } from '@specBuilder/scale/scaleSpecBuilder';
import { sanitizeMarkChildren, toCamelCase } from '@utils';
import { produce } from 'immer';
import { LinearScale, StratifyTransform } from 'vega';
import { Data, Mark, Scale, Spec, TreemapTransform } from 'vega';

import { ColorScheme, HighlightedItem, TreemapProps, TreemapSpecProps } from '../../types';
import { getLeavesMarks, getLeavesText, getNodeMarks, getNodesText, getRootText } from './treemapUtils';

export const addTreemap = produce<
	Spec,
	[TreemapProps & { colorScheme?: ColorScheme; highlightedItem?: HighlightedItem; index?: number; idKey: string }]
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
			segmentKey = 'segment',
			layout = 'binary',
			...props
		}
	) => {
		const treemapProps: TreemapSpecProps = {
			children: sanitizeMarkChildren(children),
			color,
			colorScheme,
			index,
			metric,
			segmentKey,
			name: toCamelCase(name ?? `treemap${index}`),
			layout,
			...props,
		};

		// need to add the treemap to the spec
		spec.data = addData(spec.data ?? [], treemapProps);
		spec.scales = addScales(spec.scales ?? [], treemapProps);
		spec.marks = addMarks(spec.marks ?? [], treemapProps);
	}
);

export const addData = produce<Data[], [TreemapSpecProps]>((data, props) => {
	// const { children, idKey, metric } = props;
	// console.log('props', { props, data, TABLE });
	const tableIndex = data.findIndex((d) => d.name === TABLE);

	// setup transform
	data[tableIndex].transform = data[tableIndex].transform ?? [];
	data[tableIndex].transform?.push(...getTreemapTransforms(props));
	data.push({
		name: 'nodes',
		source: TABLE,
		transform: [{ type: 'filter', expr: 'datum.children' }],
	});
	data.push({
		name: 'leaves',
		source: TABLE,
		transform: [{ type: 'filter', expr: '!datum.children' }],
	});
	data.push({
		name: 'trunk',
		source: TABLE,
		transform: [{ type: 'filter', expr: '!datum.parent' }],
	});
});

export const getTreemapTransforms = ({
	idKey,
	parent,
	paddingInner,
	paddingOuter,
	aspectRatio,
	layout,
}: TreemapSpecProps): (StratifyTransform | TreemapTransform)[] => [
	{
		type: 'stratify',
		key: idKey,
		parentKey: parent ?? 'parent',
	},
	{
		type: 'treemap',
		field: 'size',
		sort: { field: 'value' },
		paddingInner: paddingInner ?? 1,
		paddingOuter: paddingOuter ?? 1,
		round: true,
		method: layout ?? 'squarify',
		ratio: aspectRatio ?? 1,
		size: [{ signal: 'width' }, { signal: 'height' }],
	},
];

export const addScales = produce<Scale[], [TreemapSpecProps]>((scales, props) => {
	const { segmentKey } = props;
	addFieldToFacetScaleDomain(scales, COLOR_SCALE, segmentKey);
	scales.push(getTreemapOpacityScales(props));
});

export const getTreemapOpacityScales = ({}: TreemapSpecProps): LinearScale => ({
	name: 'opacityScale',
	type: 'linear',
	domain: [2, 3, 4, 5, 6, 7],
	range: [0.75, 1, 0.75, 1, 0.75, 1],
});

export const addMarks = produce<Mark[], [TreemapSpecProps]>((marks, props) => {
	marks.push(getNodeMarks(props));
	marks.push(getLeavesMarks(props));
	marks.push(getRootText(props));
	marks.push(getNodesText(props));
	marks.push(getLeavesText(props));
});
