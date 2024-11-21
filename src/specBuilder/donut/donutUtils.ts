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
import { DONUT_RADIUS, FILTERED_TABLE, SELECTED_ITEM } from '@constants';
import { getColorProductionRule, getCursor, getMarkOpacity, getTooltip } from '@specBuilder/marks/markUtils';
import { getColorValue } from '@specBuilder/specUtils';
import { ArcMark } from 'vega';

import { DonutSpecProps } from '../../types';

export const getArcMark = (props: DonutSpecProps): ArcMark => {
	const { children, color, colorScheme, holeRatio, idKey, name } = props;
	return {
		type: 'arc',
		name,
		from: { data: FILTERED_TABLE },
		encode: {
			enter: {
				fill: getColorProductionRule(color, colorScheme),
				x: { signal: 'width / 2' },
				y: { signal: 'height / 2' },
				tooltip: getTooltip(children, name),
				stroke: { value: getColorValue('static-blue', colorScheme) },
			},
			update: {
				startAngle: { field: `${name}_startAngle` },
				endAngle: { field: `${name}_endAngle` },
				padAngle: { value: 0.01 },
				innerRadius: { signal: `${holeRatio} * ${DONUT_RADIUS}` },
				outerRadius: { signal: DONUT_RADIUS },
				opacity: getMarkOpacity(props),
				cursor: getCursor(children),
				strokeWidth: [{ test: `${SELECTED_ITEM} === datum.${idKey}`, value: 2 }, { value: 0 }],
			},
		},
	};
};
