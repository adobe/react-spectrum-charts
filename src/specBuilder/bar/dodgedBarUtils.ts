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

import { getInteractive } from '@specBuilder/marks/markUtils';
import { BarSpecProps } from 'types';
import { Mark } from 'vega';

import {
	getAnnotationMarks,
	getBarEnterEncodings,
	getBarUpdateEncodings,
	getBaseBarEnterEncodings,
	getDodgedGroupMark,
	getDodgedDimensionEncodings,
} from './barUtils';

export const getDodgedMark = (props: BarSpecProps): Mark => {
	const { children, name } = props;

	return {
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
						fill: { signal: 'backgroundColor' },
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
				interactive: getInteractive(children),
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
			...getAnnotationMarks(props, `${name}_facet`, `${name}_position`, `${name}_dodgeGroup`),
		],
	};
};
