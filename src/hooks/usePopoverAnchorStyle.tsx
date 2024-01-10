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
import { CSSProperties, useMemo } from 'react';

import { MarkBounds } from 'types';
import { Padding, View } from 'vega';

export default function usePopoverAnchorStyle(
	popoverIsOpen: boolean,
	view: View | undefined,
	bounds: MarkBounds | undefined,
	padding: Padding
): CSSProperties {
	return useMemo((): CSSProperties => {
		if (popoverIsOpen && bounds && view) {
			const { x1, x2, y1, y2 } = bounds;
			const leftPadding = (typeof padding === 'number' ? padding : padding.left) ?? 0;
			const topPadding = (typeof padding === 'number' ? padding : padding.top) ?? 0;
			return {
				position: 'absolute',
				width: x2 - x1,
				height: y2 - y1,
				left: x1 + leftPadding + view.origin()[0],
				top: y1 + topPadding + view.origin()[1],
			};
		}
		return { display: 'none' };
	}, [popoverIsOpen, view, bounds, padding]);
}
