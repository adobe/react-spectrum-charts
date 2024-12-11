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
import { OrdinalScale, StratifyTransform } from 'vega';
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
			layout = 'binary',
			...props
		}
	) => {
		// put props back together now that all defaults are set
		const treemapProps: TreemapSpecProps = {
			children: sanitizeMarkChildren(children),
			color,
			colorScheme,
			index,
			metric,
			name: toCamelCase(name ?? `treemap${index}`),
			layout,
			...props,
		};

		// need to add the treemap to the spec
		spec.data = addData(spec.data ?? [], treemapProps);
		console.log('spec data', spec.data);
		spec.scales = addScales(spec.scales ?? [], treemapProps);
		console.log('spec scales', spec.scales);
		spec.marks = addMarks(spec.marks ?? [], treemapProps);
		console.log('spec marks', spec.marks);

		// console.log('I made it', treemapProps, JSON.stringify(spec));
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
	size,
	metric,
}: TreemapSpecProps): (StratifyTransform | TreemapTransform)[] => [
	{
		type: 'stratify',
		key: idKey, // might be undefined, hardcodeing for now
		parentKey: 'parent',
	},
	{
		type: 'treemap',
		field: 'size',
		sort: { field: 'value' },
		paddingInner: 1,
		// paddingOuter: 5,
		round: true,
		method: 'squarify', // hard coded
		// ratio: 1,
		size: [{ signal: 'width' }, { signal: 'height' }],
	},
];

export const addScales = produce<Scale[], [TreemapSpecProps]>((scales, props) => {
	const { color } = props;
	// addFieldToFacetScaleDomain(scales, COLOR_SCALE, color);
	scales.push({
		name: 'color',
		type: 'ordinal',
		domain: { data: 'nodes', field: 'name' },
		range: [
			'#3182bd',
			'#6baed6',
			'#9ecae1',
			'#c6dbef',
			'#e6550d',
			'#fd8d3c',
			'#fdae6b',
			'#fdd0a2',
			'#31a354',
			'#74c476',
			'#a1d99b',
			'#c7e9c0',
			'#756bb1',
			'#9e9ac8',
			'#bcbddc',
			'#dadaeb',
			'#636363',
			'#969696',
			'#bdbdbd',
			'#d9d9d9',
		],
	});
	scales.push(getTreemapOrdinalScales(props)); // do we need these 2?
	scales.push(getTreemapOpacityScales(props));
});

export const getTreemapOrdinalScales = ({ colorScheme }: TreemapSpecProps): OrdinalScale => ({
	name: 'color2',
	type: 'ordinal',
	domain: [0, 1, 2, 3],
	range: [256, 28, 20, 14],
});

export const getTreemapOpacityScales = ({ colorScheme }: TreemapSpecProps): OrdinalScale => ({
	name: 'opacity',
	type: 'ordinal',
	domain: [0, 1, 2, 3],
	range: [0.15, 0.5, 0.8, 1.0],
});

export const addMarks = produce<Mark[], [TreemapSpecProps]>((marks, props) => {
	marks.push(getNodeMarks(props));
	marks.push(getLeavesMarks(props));
	marks.push(getRootText(props));
	marks.push(getNodesText(props));
	marks.push(getLeavesText(props));
});
