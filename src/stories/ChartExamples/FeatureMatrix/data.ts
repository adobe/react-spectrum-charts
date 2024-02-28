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

export const basicFeatureMatrixData = [
	{
		event: 'Open-editor',
		segment: 'Day  1 Exporter',
		dauPercent: 0.1534,
		countAvg: 1.92,
	},
	{
		event: 'View-express-home',
		segment: 'Day  1 Exporter',
		dauPercent: 0.1327,
		countAvg: 1.66,
	},
	{
		event: 'View-quickaction-editor',
		segment: 'Day  1 Exporter',
		dauPercent: 0.0183,
		countAvg: 3.95,
	},
	{
		event: 'Generate-image',
		segment: 'Day  1 Exporter',
		dauPercent: 0.0915,
		countAvg: 1.84,
	},
	{
		event: 'Generate-text-effects',
		segment: 'Day  1 Exporter',
		dauPercent: 0.0277,
		countAvg: 4.25,
	},
	{
		event: 'Search-inspire',
		segment: 'Day  1 Exporter',
		dauPercent: 0.0763,
		countAvg: 6.28,
	},
];

export const multipleSegmentFeatureMatrixData = [
	...basicFeatureMatrixData,
	{
		event: 'Open-editor',
		segment: 'Non Day  1 Exporter',
		dauPercent: 0.1344,
		countAvg: 3.75,
	},
	{
		event: 'View-express-home',
		segment: 'Non Day  1 Exporter',
		dauPercent: 0.1336,
		countAvg: 0.84,
	},
	{
		event: 'View-quickaction-editor',
		segment: 'Non Day  1 Exporter',
		dauPercent: 0.0967,
		countAvg: 1.27,
	},
	{
		event: 'Generate-image',
		segment: 'Non Day  1 Exporter',
		dauPercent: 0.0658,
		countAvg: 2.36,
	},
	{
		event: 'Generate-text-effects',
		segment: 'Non Day  1 Exporter',
		dauPercent: 0.0272,
		countAvg: 2.71,
	},
	{
		event: 'Search-inspire',
		segment: 'Non Day  1 Exporter',
		dauPercent: 0.1149,
		countAvg: 5.8,
	},
	{
		event: 'Open-editor',
		segment: 'Day 7 Exporter',
		dauPercent: 0.1365,
		countAvg: 4.68,
	},
	{
		event: 'View-express-home',
		segment: 'Day 7 Exporter',
		dauPercent: 0.1064,
		countAvg: 5.22,
	},
	{
		event: 'View-quickaction-editor',
		segment: 'Day 7 Exporter',
		dauPercent: 0.0795,
		countAvg: 1.51,
	},
	{
		event: 'Generate-image',
		segment: 'Day 7 Exporter',
		dauPercent: 0.0578,
		countAvg: 2.2,
	},
	{
		event: 'Generate-text-effects',
		segment: 'Day 7 Exporter',
		dauPercent: 0.0183,
		countAvg: 1.75,
	},
	{
		event: 'Search-inspire',
		segment: 'Day 7 Exporter',
		dauPercent: 0.0998,
		countAvg: 2.98,
	},
];
