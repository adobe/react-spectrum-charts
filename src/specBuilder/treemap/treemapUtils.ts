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
import { RectMark, TextMark } from 'vega';

import { TreemapSpecProps } from '../../types';

export const getNodeMarks = (props: TreemapSpecProps): RectMark => {
	const { children, color, colorScheme, idKey, name } = props;

	return {
		type: 'rect',
		from: { data: 'nodes' },
		interactive: false,
		encode: {
			enter: {
				fill: { scale: 'color', field: 'name' },
			},
			update: {
				x: { field: 'x0' },
				y: { field: 'y0' },
				x2: { field: 'x1' },
				y2: { field: 'y1' },
			},
			hover: {
				fill: { value: '#fda1a2' },
			},
		},
	};
};

export const getLeavesMarks = (props: TreemapSpecProps): RectMark => {
	const { children, color, colorScheme, idKey, name } = props;

	return {
		type: 'rect',
		from: { data: 'leaves' },
		encode: {
			enter: {
				stroke: { value: '#fff' },
				strokeWidth: { value: 1 },
				tooltip: { signal: `datum.name` },
			},
			update: {
				x: { field: 'x0' },
				y: { field: 'y0' },
				x2: { field: 'x1' },
				y2: { field: 'y1' },
				fill: { value: 'transparent' },
			},
			hover: {
				fill: { value: '#fda1a2' },
			},
		},
	};
};

export const getRootText = (props: TreemapSpecProps): TextMark => {
	const { children, color, colorScheme, idKey, name } = props;

	return {
		type: 'text',
		name: 'trunkText',
		from: { data: 'trunk' },
		interactive: false,
		encode: {
			enter: {
				font: { value: 'Helvetica Neue, Arial' },
				x: { signal: '(datum.x0 + datum.x1) / 2' },
				y: { signal: '(datum.y0 + datum.y1) / 2' },
				align: { value: 'center' },
				baseline: { value: 'middle' },
				fill: { value: '#700503' },
				text: { field: 'name' },
				fontSize: { value: 72 },
				// fillOpacity: { field: 'value' },
				// fontSize: { scale: 'size', field: 'depth' },
				fillOpacity: { scale: 'opacity', field: 'depth' },
				opactiy: { value: 0.5 },
			},
			update: {
				x: { signal: 'width / 2' },
				y: { signal: 'height / 2' },
			},
		},
	};
};

export const getNodesText = (props: TreemapSpecProps): TextMark => {
	const { children, color, colorScheme, idKey, name } = props;

	return {
		type: 'text',
		name: 'nodesText',
		from: { data: 'nodes' },
		interactive: false,
		encode: {
			enter: {
				font: { value: 'Helvetica Neue, Arial' },
				x: { signal: '(datum.x0 + datum.x1) / 2' },
				y: { signal: '(datum.y0 + datum.y1) / 2' },
				align: { value: 'center' },
				baseline: { value: 'alphabetical', scale: 'color' },
				fill: { value: '#b10c0c' },
				text: { field: 'name' },
				// fontSize: { scale: 'size', field: 'depth' },
				fillOpacity: { field: 'value' },
			},
			update: {
				x: { signal: '0.5 * (datum.x0 + datum.x1)' },
				y: { signal: '0.5 * (datum.y0 + datum.y1)' },
			},
		},
		transform: [
			{
				type: 'label',
				avoidMarks: ['trunkText'],
				avoidBaseMark: false,
				anchor: ['middle'],
				// offset: [1],
				size: { signal: '[width, height]' },
			},
		],
	};
};

export const getLeavesText = (props: TreemapSpecProps): TextMark => {
	const { children, color, colorScheme, idKey, name } = props;

	return {
		type: 'text',
		name: 'leavesText',
		from: { data: 'leaves' },
		interactive: true,
		encode: {
			enter: {
				font: { value: 'Helvetica Neue, Arial' },
				x: { signal: '(datum.x0 + datum.x1) / 2' },
				y: { signal: 'datum.y0 + (datum.y1 - datum.y0) * 0.5 - 2' },
				align: { value: 'center' },
				baseline: { value: 'middle' },
				fill: { value: '#387381' },
				text: { field: 'name' },
				limit: { signal: 'datum.x1 - datum.x0 > 40 ? (datum.x1 - datum.x0) * 0.9 : datum.x1 - datum.x0 - 2' },
				width: { signal: 'datum.x1 - datum.x0' },
				fillOpacity: { scale: 'opacity', field: 'depth' },
				fontSize: {
					signal: '((datum.x1 - datum.x0 > 40) && (datum.y1 - datum.y0 > 20)) ? clamp((datum.x1 - datum.x0) * 0.1, 10, 20) : 0',
				},
				tooltip: { signal: 'datum.name' },
			},
			update: {
				x: { signal: '0.5 * (datum.x0 + datum.x1)' },
				y: { signal: '0.5 * (datum.y0 + datum.y1) - 2' }, // Adding slight padding
			},
		},
		transform: [
			{
				type: 'label',
				avoidBaseMark: false,
				avoidMarks: ['trunkText', 'nodesText'],
				anchor: ['middle'],
				size: { signal: '[width, height]' },
			},
		],
	};
};
