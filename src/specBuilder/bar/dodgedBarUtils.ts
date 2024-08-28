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
import { GroupMark } from 'vega';

import { BarSpecProps } from '../../types';
import { getAnnotationMarks } from './barAnnotationUtils';
import {
	getBarEnterEncodings,
	getBarUpdateEncodings,
	getBaseBarEnterEncodings,
	getDodgedDimensionEncodings,
	getDodgedGroupMark,
} from './barUtils';

export const getDodgedMark = (props: BarSpecProps): GroupMark => {
	const { children, name } = props;

	return {
		...getDodgedGroupMark(props),
		marks: [
			// background bars
			{
				name: `${name}_background`,
				from: { data: `${name}_facet` },
				type: 'rect',
				interactive: getInteractive(props.children, props),
				encode: {
					enter: {
						...getBaseBarEnterEncodings(props),
						fill: { signal: BACKGROUND_COLOR },
						cursor: {value: 'pointer'},
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
