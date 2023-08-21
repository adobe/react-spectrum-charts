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

export const barData = [
	{ browser: 'Chrome', downloads: 27000, percentLabel: '53.1%' },
	{ browser: 'Firefox', downloads: 8000, percentLabel: '15.7%' },
	{ browser: 'Safari', downloads: 7750, percentLabel: '15.2%' },
	{ browser: 'Edge', downloads: 7600, percentLabel: '14.9%' },
	{ browser: 'Explorer', downloads: 500, percentLabel: '1.0%' },
];

export const barSeriesData = [
	{ browser: 'Chrome', value: 5, operatingSystem: 'Windows', order: 2, percentLabel: '50%' },
	{ browser: 'Chrome', value: 3, operatingSystem: 'Mac', order: 1, percentLabel: '30%' },
	{ browser: 'Chrome', value: 2, operatingSystem: 'Other', order: 0, percentLabel: '20%' },
	{ browser: 'Firefox', value: 3, operatingSystem: 'Windows', order: 2, percentLabel: '42.6%' },
	{ browser: 'Firefox', value: 3, operatingSystem: 'Mac', order: 1, percentLabel: '42.6%' },
	{ browser: 'Firefox', value: 1, operatingSystem: 'Other', order: 0, percentLabel: '14.3%' },
	{ browser: 'Safari', value: 3, operatingSystem: 'Windows', order: 2, percentLabel: '75%' },
	{ browser: 'Safari', value: 0, operatingSystem: 'Mac', order: 1 },
	{ browser: 'Safari', value: 1, operatingSystem: 'Other', order: 0, percentLabel: '25%' },
];

export const negativeBarSeriesData = [
	{ browser: 'Chrome', value: -5, operatingSystem: 'Windows', order: 2, percentLabel: '50%' },
	{ browser: 'Chrome', value: -3, operatingSystem: 'Mac', order: 1, percentLabel: '30%' },
	{ browser: 'Chrome', value: -2, operatingSystem: 'Other', order: 0, percentLabel: '20%' },
	{ browser: 'Firefox', value: -3, operatingSystem: 'Windows', order: 2, percentLabel: '42.6%' },
	{ browser: 'Firefox', value: -3, operatingSystem: 'Mac', order: 1, percentLabel: '42.6%' },
	{ browser: 'Firefox', value: -1, operatingSystem: 'Other', order: 0, percentLabel: '14.3%' },
	{ browser: 'Safari', value: -3, operatingSystem: 'Windows', order: 2, percentLabel: '75%' },
	{ browser: 'Safari', value: 0, operatingSystem: 'Mac', order: 1 },
	{ browser: 'Safari', value: -1, operatingSystem: 'Other', order: 0, percentLabel: '25%' },
];

export const barSubSeriesData = [
	{ browser: 'Chrome', value: 5, operatingSystem: 'Windows', version: 'Current', order: 2, percentLabel: '71.4%' },
	{ browser: 'Chrome', value: 3, operatingSystem: 'Mac', version: 'Current', order: 1, percentLabel: '42.9%' },
	{ browser: 'Chrome', value: 2, operatingSystem: 'Linux', version: 'Current', order: 0, percentLabel: '28.6%' },
	{ browser: 'Firefox', value: 3, operatingSystem: 'Windows', version: 'Current', order: 2, percentLabel: '30%' },
	{ browser: 'Firefox', value: 3, operatingSystem: 'Mac', version: 'Current', order: 1, percentLabel: '75%' },
	{ browser: 'Firefox', value: 1, operatingSystem: 'Linux', version: 'Current', order: 0, percentLabel: '25%' },
	{ browser: 'Safari', value: 3, operatingSystem: 'Windows', version: 'Current', order: 2, percentLabel: '27.3%' },
	{ browser: 'Safari', value: 1, operatingSystem: 'Mac', version: 'Current', order: 1, percentLabel: '50%' },
	{ browser: 'Safari', value: 1, operatingSystem: 'Linux', version: 'Current', order: 0, percentLabel: '25%' },
	{ browser: 'Chrome', value: 2, operatingSystem: 'Windows', version: 'Previous', order: 2, percentLabel: '28.6%' },
	{ browser: 'Chrome', value: 4, operatingSystem: 'Mac', version: 'Previous', order: 1, percentLabel: '57.1%' },
	{ browser: 'Chrome', value: 5, operatingSystem: 'Linux', version: 'Previous', order: 0, percentLabel: '71.4%' },
	{ browser: 'Firefox', value: 7, operatingSystem: 'Windows', version: 'Previous', order: 2, percentLabel: '70%' },
	{ browser: 'Firefox', value: 1, operatingSystem: 'Mac', version: 'Previous', order: 1, percentLabel: '25%' },
	{ browser: 'Firefox', value: 3, operatingSystem: 'Linux', version: 'Previous', order: 0, percentLabel: '75%' },
	{ browser: 'Safari', value: 8, operatingSystem: 'Windows', version: 'Previous', order: 2, percentLabel: '72.7%' },
	{ browser: 'Safari', value: 1, operatingSystem: 'Mac', version: 'Previous', order: 1, percentLabel: '50%' },
	{ browser: 'Safari', value: 3, operatingSystem: 'Linux', version: 'Previous', order: 0, percentLabel: '75%' },
];

export const frequencyOfUseData = [
	{ segment: 'All users', bucket: '1-5 times', event: 'A. Sign up', value: 12000, order: 0 },
	{ segment: 'Roku', bucket: '1-5 times', event: 'A. Sign up', value: 11200, order: 0 },
	{ segment: 'Chromecast', bucket: '1-5 times', event: 'A. Sign up', value: 11500, order: 0 },
	{ segment: 'Apple TV', bucket: '1-5 times', event: 'A. Sign up', value: 10930, order: 0 },
	{ segment: 'Amazon Fire', bucket: '1-5 times', event: 'A. Sign up', value: 10000, order: 0 },
	{ segment: 'All users', bucket: '6-10 times', event: 'A. Sign up', value: 3200, order: 1 },
	{ segment: 'Roku', bucket: '6-10 times', event: 'A. Sign up', value: 3000, order: 1 },
	{ segment: 'Chromecast', bucket: '6-10 times', event: 'A. Sign up', value: 3100, order: 1 },
	{ segment: 'Apple TV', bucket: '6-10 times', event: 'A. Sign up', value: 2900, order: 1 },
	{ segment: 'Amazon Fire', bucket: '6-10 times', event: 'A. Sign up', value: 2700, order: 1 },
	{ segment: 'All users', bucket: '11-15 times', event: 'A. Sign up', value: 1200, order: 2 },
	{ segment: 'Roku', bucket: '11-15 times', event: 'A. Sign up', value: 1090, order: 2 },
	{ segment: 'Chromecast', bucket: '11-15 times', event: 'A. Sign up', value: 1150, order: 2 },
	{ segment: 'Apple TV', bucket: '11-15 times', event: 'A. Sign up', value: 1000, order: 2 },
	{ segment: 'Amazon Fire', bucket: '11-15 times', event: 'A. Sign up', value: 900, order: 2 },

	{ segment: 'All users', bucket: '1-5 times', event: 'B. Watch a video', value: 7600, order: 0 },
	{ segment: 'Roku', bucket: '1-5 times', event: 'B. Watch a video', value: 7100, order: 0 },
	{ segment: 'Chromecast', bucket: '1-5 times', event: 'B. Watch a video', value: 7300, order: 0 },
	{ segment: 'Apple TV', bucket: '1-5 times', event: 'B. Watch a video', value: 6900, order: 0 },
	{ segment: 'Amazon Fire', bucket: '1-5 times', event: 'B. Watch a video', value: 6300, order: 0 },
	{ segment: 'All users', bucket: '6-10 times', event: 'B. Watch a video', value: 2100, order: 1 },
	{ segment: 'Roku', bucket: '6-10 times', event: 'B. Watch a video', value: 2000, order: 1 },
	{ segment: 'Chromecast', bucket: '6-10 times', event: 'B. Watch a video', value: 2100, order: 1 },
	{ segment: 'Apple TV', bucket: '6-10 times', event: 'B. Watch a video', value: 1900, order: 1 },
	{ segment: 'Amazon Fire', bucket: '6-10 times', event: 'B. Watch a video', value: 1700, order: 1 },
	{ segment: 'All users', bucket: '11-15 times', event: 'B. Watch a video', value: 700, order: 2 },
	{ segment: 'Roku', bucket: '11-15 times', event: 'B. Watch a video', value: 640, order: 2 },
	{ segment: 'Chromecast', bucket: '11-15 times', event: 'B. Watch a video', value: 670, order: 2 },
	{ segment: 'Apple TV', bucket: '11-15 times', event: 'B. Watch a video', value: 600, order: 2 },
	{ segment: 'Amazon Fire', bucket: '11-15 times', event: 'B. Watch a video', value: 540, order: 2 },

	{ segment: 'All users', bucket: '1-5 times', event: 'C. Add to My List', value: 4100, order: 0 },
	{ segment: 'Roku', bucket: '1-5 times', event: 'C. Add to My List', value: 3800, order: 0 },
	{ segment: 'Chromecast', bucket: '1-5 times', event: 'C. Add to My List', value: 3900, order: 0 },
	{ segment: 'Apple TV', bucket: '1-5 times', event: 'C. Add to My List', value: 3700, order: 0 },
	{ segment: 'Amazon Fire', bucket: '1-5 times', event: 'C. Add to My List', value: 3400, order: 0 },
	{ segment: 'All users', bucket: '6-10 times', event: 'C. Add to My List', value: 1100, order: 1 },
	{ segment: 'Roku', bucket: '6-10 times', event: 'C. Add to My List', value: 1000, order: 1 },
	{ segment: 'Chromecast', bucket: '6-10 times', event: 'C. Add to My List', value: 800, order: 1 },
	{ segment: 'Apple TV', bucket: '6-10 times', event: 'C. Add to My List', value: 1000, order: 1 },
	{ segment: 'Amazon Fire', bucket: '6-10 times', event: 'C. Add to My List', value: 900, order: 1 },
	{ segment: 'All users', bucket: '11-15 times', event: 'C. Add to My List', value: 400, order: 2 },
	{ segment: 'Roku', bucket: '11-15 times', event: 'C. Add to My List', value: 220, order: 2 },
	{ segment: 'Chromecast', bucket: '11-15 times', event: 'C. Add to My List', value: 300, order: 2 },
	{ segment: 'Apple TV', bucket: '11-15 times', event: 'C. Add to My List', value: 200, order: 2 },
	{ segment: 'Amazon Fire', bucket: '11-15 times', event: 'C. Add to My List', value: 100, order: 2 },
];

interface GenerateMockDataForTrellisArgs {
	property1: string[];
	property2: string[];
	property3: string[];
	propertyNames: [string, string, string];
	orderBy: string;
	maxValue?: number;
	randomizeSteps?: boolean;
}
export const generateMockDataForTrellis = ({
	property1,
	property2,
	property3,
	propertyNames,
	orderBy,
	maxValue = 10000,
	randomizeSteps = true,
}: GenerateMockDataForTrellisArgs): Record<string, string | number>[] => {
	const [property1Name, property2Name, property3Name] = propertyNames;

	const data: Record<string, string | number>[] = [];
	let order: number = -1;

	for (let p1i = 0; p1i < property1.length; p1i++) {
		const p1 = property1[p1i];

		if (orderBy === property1Name) {
			order = p1i;
		}

		for (let p2i = 0; p2i < property2.length; p2i++) {
			const p2 = property2[p2i];
			if (orderBy === property2Name) {
				order = p2i;
			}

			for (let p3i = 0; p3i < property3.length; p3i++) {
				const p3 = property3[p3i];
				if (orderBy === property3Name) {
					order = p3i;
				}

				let value: number;

				if (randomizeSteps) {
					value = Math.max(0, Math.floor(Math.random() * maxValue));
				} else {
					value = Math.max(0, maxValue - (p1i + p2i + p3i) * (maxValue / 10));
				}

				data.push({
					order,
					value,
					[property1Name]: p1,
					[property2Name]: p2,
					[property3Name]: p3,
				});
			}
		}
	}

	return data;
};
