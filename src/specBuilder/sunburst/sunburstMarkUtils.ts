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
import { FILTERED_TABLE } from '@constants';
import { getTooltip } from '@specBuilder/marks/markUtils';
import { ArcMark } from 'vega';

import { SunburstSpecProps } from '../../types';

export const getArcMark = (props: SunburstSpecProps): ArcMark => {
	const { children, name } = props;
	return {
		type: 'arc',
		name,
		from: { data: FILTERED_TABLE },
		encode: {
			enter: {
				x: { signal: 'width / 2' },
				y: { signal: 'height / 2' },
				fill: { scale: 'color', field: 'depth' },
				tooltip: getTooltip(children, name),
			},
			update: {
				startAngle: { field: 'a0' },
				endAngle: { field: 'a1' },
				innerRadius: { field: 'r0' },
				outerRadius: { field: 'r1' },
				stroke: { value: 'white' },
				strokeWidth: { value: 0.5 },
				zindex: { value: 0 },
			},
			hover: {
				stroke: { value: 'red' },
				strokeWidth: { value: 2 },
				zindex: { value: 1 },
			},
		},
	};
};
