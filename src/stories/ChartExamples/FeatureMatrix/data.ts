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

export const timeCompareFeatureMatrixData = [
	{
		event: 'Open-editor',
		segment: 'Day  1 Exporter',
		dauPercent: 0.1834,
		countAvg: 1.62,
		period: 'past',
		trailSize: 0,
	},
	{
		event: 'View-express-home',
		segment: 'Day  1 Exporter',
		dauPercent: 0.2327,
		countAvg: 2.66,
		period: 'past',
		trailSize: 0,
	},
	{
		event: 'View-quickaction-editor',
		segment: 'Day  1 Exporter',
		dauPercent: 0.0083,
		countAvg: 2.95,
		period: 'past',
		trailSize: 0,
	},
	{
		event: 'Generate-image',
		segment: 'Day  1 Exporter',
		dauPercent: 0.0015,
		countAvg: 2.84,
		period: 'past',
		trailSize: 0,
	},
	{
		event: 'Generate-text-effects',
		segment: 'Day  1 Exporter',
		dauPercent: 0.1277,
		countAvg: 2.25,
		period: 'past',
		trailSize: 0,
	},
	{
		event: 'Search-inspire',
		segment: 'Day  1 Exporter',
		dauPercent: 0.0563,
		countAvg: 5.28,
		period: 'past',
		trailSize: 0,
	},
	{
		event: 'Open-editor',
		segment: 'Non Day  1 Exporter',
		dauPercent: 0.1144,
		countAvg: 3.75,
		period: 'past',
		trailSize: 0,
	},
	{
		event: 'View-express-home',
		segment: 'Non Day  1 Exporter',
		dauPercent: 0.1236,
		countAvg: 0.84,
		period: 'past',
		trailSize: 0,
	},
	{
		event: 'View-quickaction-editor',
		segment: 'Non Day  1 Exporter',
		dauPercent: 0.1167,
		countAvg: 2.27,
		period: 'past',
		trailSize: 0,
	},
	{
		event: 'Generate-image',
		segment: 'Non Day  1 Exporter',
		dauPercent: 0.0658,
		countAvg: 2.4,
		period: 'past',
		trailSize: 0,
	},
	{
		event: 'Generate-text-effects',
		segment: 'Non Day  1 Exporter',
		dauPercent: 0.0172,
		countAvg: 2.21,
		period: 'past',
		trailSize: 0,
	},
	{
		event: 'Search-inspire',
		segment: 'Non Day  1 Exporter',
		dauPercent: 0.1049,
		countAvg: 5.6,
		period: 'past',
		trailSize: 0,
	},
	{
		event: 'Open-editor',
		segment: 'Day 7 Exporter',
		dauPercent: 0.1565,
		countAvg: 6.68,
		period: 'past',
		trailSize: 0,
	},
	{
		event: 'View-express-home',
		segment: 'Day 7 Exporter',
		dauPercent: 0.0964,
		countAvg: 4.22,
		period: 'past',
		trailSize: 0,
	},
	{
		event: 'View-quickaction-editor',
		segment: 'Day 7 Exporter',
		dauPercent: 0.0715,
		countAvg: 1.59,
		period: 'past',
		trailSize: 0,
	},
	{
		event: 'Generate-image',
		segment: 'Day 7 Exporter',
		dauPercent: 0.0678,
		countAvg: 2.5,
		period: 'past',
		trailSize: 0,
	},
	{
		event: 'Generate-text-effects',
		segment: 'Day 7 Exporter',
		dauPercent: 0.0583,
		countAvg: 0.75,
		period: 'past',
		trailSize: 0,
	},
	{
		event: 'Search-inspire',
		segment: 'Day 7 Exporter',
		dauPercent: 0.1098,
		countAvg: 3.98,
		period: 'past',
		trailSize: 0,
	},
	...multipleSegmentFeatureMatrixData.map((d) => ({ ...d, period: 'present', trailSize: 1 })),
]
	.sort((a, b) => {
		if (a.event > b.event) return 1;
		if (a.event < b.event) return -1;
		return 0;
	})
	.sort((a, b) => {
		if (a.segment > b.segment) return 1;
		if (a.segment < b.segment) return -1;
		return 0;
	});
