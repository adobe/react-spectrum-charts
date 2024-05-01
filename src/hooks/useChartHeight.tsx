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
import { useMemo } from 'react';

import { Height } from '../types';

export default function useChartHeight(containerHeight: number, maxHeight: number, minHeight: number, height: Height) {
	return useMemo(() => {
		let targetHeight = minHeight;
		if (typeof height === 'number') {
			targetHeight = height;
		} else if (/^\d+%$/.exec(height)) {
			targetHeight = (containerHeight * Number(height.slice(0, -1))) / 100;
		} else {
			console.error(
				`height of ${height} is not a valid height. Please provide a valid number or percentage ex. 75%`
			);
		}
		return targetHeight === 0 ? 0 : Math.min(maxHeight, Math.max(minHeight, targetHeight));
	}, [containerHeight, maxHeight, minHeight, height]);
}
