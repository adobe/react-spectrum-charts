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
import { TABLE } from '@constants';
import { getMarkOpacity, getTooltip } from '@specBuilder/marks/markUtils';
import { ArcMark, TextMark } from 'vega';

import { SunburstSpecProps } from '../../types';

export const getArcMark = (props: SunburstSpecProps): ArcMark => {
	const { name, children, segmentKey, muteElementsOnHover } = props;
	return {
		type: 'arc',
		name,
		from: { data: TABLE },
		encode: {
			enter: {
				x: { signal: 'width / 2' },
				y: { signal: 'height / 2' },
				fill: {
					scale: 'color',
					field: segmentKey,
				},
				fillOpacity: { scale: 'opacity', field: 'depth' },
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
				opacity: muteElementsOnHover ? getMarkOpacity(props) : undefined,
			},
		},
	};
};

export const getTextMark = (props: SunburstSpecProps): TextMark => {
	const { metric, children, name, muteElementsOnHover } = props;
	return {
		type: 'text',
		name: `${name}_text`,
		from: { data: TABLE },
		encode: {
			enter: {
				text: { field: metric },
				fontSize: { value: 9 },
				baseline: { value: 'middle' },
				align: { value: 'center' },
				tooltip: getTooltip(children, name),
			},
			update: {
				x: { signal: 'width / 2' },
				y: { signal: 'height / 2' },
				radius: { signal: "(datum['r0'] == 0 ? 0 : datum['r0'] + datum['r1']) / 2" },
				theta: { signal: "(datum['a0'] + datum['a1']) / 2" },
				angle: {
					signal: "datum['r0'] == 0 ? 0 : ((datum['a0'] + datum['a1']) / 2) * 180 / PI + (inrange(((datum['a0'] + datum['a1']) / 2) % (2 * PI), [0, PI]) ? 270 : 90)",
				},
				opacity: muteElementsOnHover ? getMarkOpacity(props) : undefined,
			},
		},
	};
};
