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
import { isInteractive } from '@specBuilder/marks/markUtils';
import { GroupMark } from 'vega';

import { BarSpecOptions } from '../../types';
import { getAnnotationMarks } from './barAnnotationUtils';
import {
	getBarEnterEncodings,
	getBarUpdateEncodings,
	getBaseBarEnterEncodings,
	getDodgedDimensionEncodings,
	getDodgedGroupMark,
} from './barUtils';

export const getDodgedMark = (options: BarSpecOptions): GroupMark => {
	const { name } = options;

	return {
		...getDodgedGroupMark(options),
		marks: [
			// background bars
			{
				name: `${name}_background`,
				from: { data: `${name}_facet` },
				type: 'rect',
				interactive: false,
				encode: {
					enter: {
						...getBaseBarEnterEncodings(options),
						fill: { signal: BACKGROUND_COLOR },
					},
					update: {
						...getDodgedDimensionEncodings(options),
					},
				},
			},
			// bars
			{
				name,
				from: { data: `${name}_facet` },
				type: 'rect',
				interactive: isInteractive(options),
				encode: {
					enter: {
						...getBaseBarEnterEncodings(options),
						...getBarEnterEncodings(options),
					},
					update: {
						...getDodgedDimensionEncodings(options),
						...getBarUpdateEncodings(options),
					},
				},
			},
			...getAnnotationMarks(options, `${name}_facet`, `${name}_position`, `${name}_dodgeGroup`),
		],
	};
};
