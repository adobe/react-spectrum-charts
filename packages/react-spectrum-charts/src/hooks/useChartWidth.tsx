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

export default function useChartWidth(
	containerWidth: number,
	maxWidth: number,
	minWidth: number,
	width: number | 'auto' | (string & NonNullable<unknown>)
) {
	return useMemo(() => {
		let targetWidth = minWidth;
		if (typeof width === 'number') {
			// integers only, decimal values can cause performance issues with vega.
			return Math.round(width);
		} else if (width === 'auto') {
			targetWidth = containerWidth;
		} else if (/^\d+%$/.exec(width)) {
			targetWidth = (containerWidth * Number(width.slice(0, -1))) / 100;
		} else {
			console.error(
				`width of ${width} is not a valid width. Please provide a valid number, 'auto' or percentage ex. 75%`
			);
		}
		// integers only, decimal values can cause performance issues with vega.
		return targetWidth === 0 ? 0 : Math.round(Math.min(maxWidth, Math.max(minWidth, targetWidth)));
	}, [containerWidth, maxWidth, minWidth, width]);
}
