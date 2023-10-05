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

import { useMemo } from 'react';
import { ChartChildElement, ChartPopoverElement, PopoverHandler, PrismElement } from 'types';

import { ChartPopover } from '../components/ChartPopover';
import { getAllElements } from '@utils';

type MappedPopover = { name: string; element: ChartPopoverElement };

export type PopoverDetail = { name: string; callback: PopoverHandler; width?: number };

export default function usePopovers(children: ChartChildElement[]): PopoverDetail[] {
	const popoverElements = useMemo(
		() =>
			getAllElements(
				{ type: { name: 'Prism' }, props: { children } } as PrismElement,
				ChartPopover,
				[],
			) as MappedPopover[],
		[children],
	);

	return useMemo(
		() =>
			popoverElements
				.filter((popover) => popover.element.props.children)
				.map((popover) => ({
					name: popover.name,
					callback: popover.element.props.children,
					width: popover.element.props.width,
				})) as PopoverDetail[],
		[popoverElements],
	);
}
