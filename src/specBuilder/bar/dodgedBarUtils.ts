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
import { BACKGROUND_COLOR } from '@constants';
import { getInteractive } from '@specBuilder/marks/markUtils';
import { getColorValue } from '@specBuilder/specUtils';
import { GroupMark, RectMark } from 'vega';

import { BarSpecProps } from '../../types';
import { getAnnotationMarks } from './barAnnotationUtils';
import {
	getBarEnterEncodings,
	getBarUpdateEncodings,
	getBaseBarEnterEncodings,
	getDodgedDimensionEncodings,
	getDodgedGroupMark,
} from './barUtils';

export const getDodgedMark = (props: BarSpecProps): [GroupMark, RectMark] => {
	const { children, colorScheme, name, dimension } = props;

	return [
		{
			...getDodgedGroupMark(props),
			marks: [
				// background bars
				{
					name: `${name}_background`,
					from: { data: `${name}_facet` },
					type: 'rect',
					interactive: false,
					encode: {
						enter: {
							...getBaseBarEnterEncodings(props),
							fill: { signal: BACKGROUND_COLOR },
						},
						update: {
							...getDodgedDimensionEncodings(props),
						},
					},
				},
				// bars
				{
					name,
					from: { data: `${name}_facet` },
					type: 'rect',
					interactive: getInteractive(children, props),
					encode: {
						enter: {
							...getBaseBarEnterEncodings(props),
							...getBarEnterEncodings(props),
						},
						update: {
							...getDodgedDimensionEncodings(props),
							...getBarUpdateEncodings(props),
						},
					},
				},
				getBarFocusRing(props),
				...getAnnotationMarks(props, `${name}_facet`, `${name}_position`, `${name}_dodgeGroup`),
			],
		},
		{
			name: `${name}_group_focusRing`,
			type: 'rect',
			from: { data: `${name}_group` },
			interactive: false,
			encode: {
				enter: {
					strokeWidth: { value: 2 },
					fill: { value: 'transparent' },
					stroke: { value: getColorValue('static-blue', colorScheme) },
					cornerRadius: { value: 4 },
				},
				update: {
					x: { signal: 'datum.bounds.x1 - 2' },
					x2: { signal: 'datum.bounds.x2 + 2' },
					y: { signal: 'datum.bounds.y1 - 2' },
					y2: { signal: 'datum.bounds.y2 + 2' },
					opacity: [{ test: `focussedDimension === datum.datum.${dimension}`, value: 1 }, { value: 0 }],
				},
			},
		},
	];
};

export const getBarFocusRing = (props: BarSpecProps): RectMark => {
	const { colorScheme, idKey, name } = props;
	return {
		name: `${name}_focusRing`,
		type: 'rect',
		from: { data: name },
		interactive: false,
		encode: {
			enter: {
				strokeWidth: { value: 2 },
				fill: { value: 'transparent' },
				stroke: { value: getColorValue('static-blue', colorScheme) },
				cornerRadius: { value: 4 },
			},
			update: {
				x: { signal: 'datum.bounds.x1 - 2' },
				x2: { signal: 'datum.bounds.x2 + 2' },
				y: { signal: 'datum.bounds.y1 - 2' },
				y2: { signal: 'datum.bounds.y2 + 2' },
				opacity: [{ test: `focussedItem === datum.datum.${idKey}`, value: 1 }, { value: 0 }],
			},
		},
	};
};
