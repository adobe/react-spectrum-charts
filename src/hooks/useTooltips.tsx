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
import { createElement, useMemo } from 'react';

import { ChartTooltip } from '@components/ChartTooltip';
import { getAllElements } from '@utils';
import { ChartChildElement, ChartTooltipElement, TooltipHandler } from 'types';

import { Chart } from '../Chart';

type MappedTooltip = { name: string; element: ChartTooltipElement };

export type TooltipDetail = { name: string; callback: TooltipHandler; width?: number };

export default function useTooltips(children: ChartChildElement[]): TooltipDetail[] {
	const tooltipElements = useMemo(
		() => getAllElements(createElement(Chart, { data: [] }, children), ChartTooltip, []) as MappedTooltip[],
		[children]
	);

	return useMemo(
		() =>
			tooltipElements
				.filter((tooltip) => tooltip.element.props.children)
				.map((tooltip) => ({
					name: tooltip.name,
					callback: tooltip.element.props.children,
				})) as TooltipDetail[],
		[tooltipElements]
	);
}
