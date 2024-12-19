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
	const { segmentKey, borderColor, nodesBorderWidth } = props;
	return {
		type: 'rect',
		from: { data: 'nodes' },
		interactive: false,
		encode: {
			enter: {
				stroke: { value: borderColor ?? 'rgb(82, 80, 82)' },
				strokeWidth: { value: nodesBorderWidth ?? 5 },
				fill: { scale: 'color', field: segmentKey ?? 'segment' },
				tooltip: {
					signal: "'Name: ' + datum.name + ', depth: ' + datum.depth + ', value: ' + datum.size",
				},
				fillOpacity: { scale: 'opacityScale', field: 'depth' },
			},
			update: {
				x: { field: 'x0' },
				y: { field: 'y0' },
				x2: { field: 'x1' },
				y2: { field: 'y1' },
			},
			hover: {
				fill: { scale: 'color', field: segmentKey ?? 'segment' },
				fillOpacity: { value: 0.5 },
			},
		},
	};
};

export const getLeavesMarks = (props: TreemapSpecProps): RectMark => {
	const { color, segmentKey, leavesBorderWidth } = props;

	return {
		type: 'rect',
		from: { data: 'leaves' },
		encode: {
			enter: {
				stroke: { value: '#4b4848' },
				strokeWidth: { value: leavesBorderWidth ?? 1 },
				fill: { scale: color ?? 'color', field: segmentKey ?? 'segment' },
				tooltip: {
					signal: "'Name: ' + datum.name + ', depth: ' + datum.depth + ', value: ' + datum.size",
				},
				fillOpacity: { scale: 'opacityScale', field: 'depth' },
			},
			update: {
				x: { field: 'x0' },
				y: { field: 'y0' },
				x2: { field: 'x1' },
				y2: { field: 'y1' },
				fill: { value: 'transparent' },
			},
			hover: {
				fill: { scale: 'color', field: segmentKey ?? 'segment' },
				fillOpacity: { value: 1 },
			},
		},
	};
};

export const getRootText = (props: TreemapSpecProps): TextMark => {
	const { rootTextColor } = props;

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
				fill: { value: rootTextColor ?? '#2e2525' },
				text: { field: 'name' }, // not sure why using name prop doesn't apply styling
				fontSize: { value: 72 },
				fillOpacity: { value: 0.5 },
			},
			update: {
				x: { signal: 'width / 2' },
				y: { signal: 'height / 2' },
			},
		},
	};
};

export const getNodesText = (props: TreemapSpecProps): TextMark => {
	const { textColor } = props;

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
				fill: { value: textColor ?? '#f8f5f5' },
				text: { field: 'name' },
				fillOpacity: { field: 'value' },
				fontSize: {
					signal: '((datum.x1 - datum.x0 > 40) && (datum.y1 - datum.y0 > 20)) ? clamp((datum.x1 - datum.x0) * 0.2, 10, 20) : 0',
				},
				tooltip: {
					signal: "'Name: ' + datum.name + ', depth: ' + datum.depth + ', value: ' + datum.size",
				},
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
				// anchor: ['middle'],
				// padding: 5,
				// offset: [5, 5], // still have some node text overlapping, need to fix that
				size: { signal: '[width, height]' },
			},
		],
	};
};

export const getLeavesText = (props: TreemapSpecProps): TextMark => {
	const { textColor } = props;

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
				fill: { value: textColor ?? '#f3efef' },
				text: { field: 'name' },
				limit: { signal: 'datum.x1 - datum.x0 > 40 ? (datum.x1 - datum.x0) * 0.9 : datum.x1 - datum.x0 - 2' },
				width: { signal: 'datum.x1 - datum.x0' },
				fillOpacity: { scale: 'opacity', field: 'depth' },
				fontSize: {
					signal: '((datum.x1 - datum.x0 > 40) && (datum.y1 - datum.y0 > 20)) ? clamp((datum.x1 - datum.x0) * 0.1, 10, 20) : 0',
				},
				tooltip: {
					signal: "'Name: ' + datum.name + ', depth: ' + datum.depth + ', value: ' + datum.size",
				},
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
