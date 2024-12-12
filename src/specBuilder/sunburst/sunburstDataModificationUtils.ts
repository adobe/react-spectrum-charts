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
import { Datum } from 'vega';

export const createLeafValues = (data: Datum[], id: string, parentId: string, metric: string) => {
	data.forEach((element) => {
		element[`${metric}_childSum`] = data
			.filter((e) => e[parentId] === element[id])
			.reduce((acc, e) => acc + e[metric], 0);
	});
	data.forEach((element) => {
		element[`${metric}_leafValue`] = element[metric] - element[`${metric}_childSum`];
		if (element[`${metric}_leafValue`] < 0) {
			element[`${metric}_leafValue`] = 0;
		}
	});
};
