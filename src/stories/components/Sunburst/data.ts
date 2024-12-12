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

export const basicSunburstData = [
	{
		id: 1,
		name: 'All browsers',
		value: 2235,
	},
	{
		id: 2,
		name: 'Chrome',
		parent: 1,
		value: 800,
		segment: 'Chrome',
	},
	{
		id: 3,
		name: 'V 130',
		parent: 2,
		value: 200,
		segment: 'Chrome',
	},
	{
		id: 4,
		parent: 3,
		name: 'V 130.1',
		value: 30,
		segment: 'Chrome',
	},
	{
		id: 5,
		parent: 3,
		name: 'V 130.2',
		value: 100,
		segment: 'Chrome',
	},
	{
		id: 6,
		parent: 2,
		name: 'V 131',
		value: 100,
		segment: 'Chrome',
	},
	{
		id: 7,
		parent: 2,
		name: 'V 132',
		value: 500,
		segment: 'Chrome',
	},
	{
		id: 8,
		parent: 1,
		name: 'Firefox',
		value: 600,
		segment: 'Firefox',
	},
	{
		id: 9,
		parent: 8,
		name: 'Alpha',
		value: 100,
		segment: 'Firefox',
	},
	{
		id: 10,
		parent: 9,
		name: 'Alpha 1',
		value: 50,
		segment: 'Firefox',
	},
	{
		id: 11,
		parent: 9,
		name: 'Alpha 2',
		value: 50,
		segment: 'Firefox',
	},
	{
		id: 12,
		parent: 8,
		name: 'Beta',
		value: 200,
		segment: 'Firefox',
	},
	{
		id: 13,
		parent: 12,
		name: 'Beta 1',
		value: 40,
		segment: 'Firefox',
	},
	{
		id: 14,
		parent: 12,
		name: 'Beta 2',
		value: 100,
		segment: 'Firefox',
	},
	{
		id: 15,
		parent: 8,
		name: 'Prod',
		value: 300,
		segment: 'Firefox',
	},
	{
		id: 16,
		parent: 15,
		name: 'Prod 1',
		value: 100,
		segment: 'Firefox',
	},
	{
		id: 17,
		parent: 15,
		name: 'Prod 2',
		value: 150,
		segment: 'Firefox',
	},
	{
		id: 18,
		parent: 1,
		name: 'Safari',
		value: 150,
		segment: 'Safari',
	},
	{
		id: 19,
		parent: 18,
		name: '12.4.64',
		value: 20,
		segment: 'Safari',
	},
	{
		id: 20,
		parent: 18,
		name: '12.4.65',
		value: 50,
		segment: 'Safari',
	},
	{
		id: 21,
		parent: 18,
		name: '12.5.0',
		value: 60,
		segment: 'Safari',
	},
	{
		id: 22,
		parent: 1,
		name: 'Edge',
		value: 685,
		segment: 'Edge',
	},
	{
		id: 23,
		parent: 22,
		name: '1',
		value: 200,
		segment: 'Edge',
	},
	{
		id: 24,
		parent: 22,
		name: '2',
		value: 200,
		segment: 'Edge',
	},
	{
		id: 25,
		parent: 22,
		name: '3',
		value: 200,
		segment: 'Edge',
	},
	{
		id: 26,
		parent: 22,
		name: '4',
		value: 85,
		segment: 'Edge',
	},
	{
		id: 27,
		parent: 26,
		name: '4.1',
		value: 85,
		segment: 'Edge',
	},
	{
		id: 28,
		parent: 27,
		name: '4.1.1',
		value: 30,
		segment: 'Edge',
	},
	{
		id: 29,
		parent: 27,
		name: '4.1.2',
		value: 30,
		segment: 'Edge',
	},
	{
		id: 30,
		parent: 25,
		name: '3.0.1',
		value: 30,
		segment: 'Edge',
	},
];

export const simpleSunburstData = [
	{
		id: 1,
		value: 100,
		name: 'root',
	},
	{
		id: 2,
		parent: 1,
		value: 40,
		name: 'A',
		segment: 'A',
	},
	{
		id: 3,
		parent: 1,
		value: 60,
		name: 'B',
		segment: 'B',
	},
	{
		id: 4,
		parent: 2,
		value: 30,
		name: 'A 1',
		segment: 'A',
	},
	{
		id: 5,
		parent: 3,
		value: 10,
		name: 'B 1',
		segment: 'B',
	},
	{
		id: 6,
		parent: 3,
		value: 20,
		name: 'B 2',
		segment: 'B',
	},
	{
		id: 7,
		parent: 5,
		value: 10,
		name: 'B 1 ^',
		segment: 'B',
	},
];
