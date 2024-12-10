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
		name: 'Browsers',
	},
	{
		id: 2,
		name: 'Chrome',
		parent: 1,
		segment: 'chrome',
	},
	{
		id: 3,
		name: 'V 130',
		parent: 2,
		value: 200,
		segment: 'chrome',
	},
	{
		id: 4,
		parent: 2,
		name: 'V 131',
		value: 100,
		segment: 'chrome',
	},
	{
		id: 5,
		parent: 2,
		name: 'V 132',
		value: 500,
		segment: 'chrome',
	},
	{
		id: 6,
		parent: 1,
		name: 'Firefox',
		segment: 'firefox',
	},
	{
		id: 7,
		parent: 6,
		name: 'Alpha',
		value: 100,
		segment: 'firefox',
	},
	{
		id: 8,
		parent: 6,
		name: 'Beta',
		value: 200,
		segment: 'firefox',
	},
	{
		id: 9,
		parent: 6,
		name: 'Prod',
		value: 300,
		segment: 'firefox',
	},
	{
		id: 10,
		parent: 1,
		name: 'Safari',
		segment: 'safari',
	},
	{
		id: 11,
		parent: 10,
		name: '12.4.64',
		value: 50,
		segment: 'safari',
	},
	{
		id: 12,
		parent: 10,
		name: '12.4.65',
		value: 50,
		segment: 'safari',
	},
	{
		id: 13,
		parent: 10,
		name: '12.5.0',
		value: 50,
		segment: 'safari',
	},
	{
		id: 14,
		parent: 1,
		name: 'Edge',
		segment: 'edge',
	},
	{
		id: 15,
		parent: 14,
		name: '1',
		value: 200,
		segment: 'edge',
	},
	{
		id: 16,
		parent: 14,
		name: '2',
		value: 200,
		segment: 'edge',
	},
	{
		id: 17,
		parent: 14,
		name: '3',
		value: 200,
		segment: 'edge',
	},
	{
		id: 18,
		parent: 14,
		name: '4',
		value: 200,
		segment: 'edge',
	},
	{
		id: 19,
		parent: 18,
		name: '4.1',
		value: 85,
		segment: 'edge',
	},
	{
		id: 20,
		parent: 19,
		name: '4.1.1',
		value: 40,
		segment: 'edge',
	},
	{
		id: 21,
		parent: 19,
		name: '4.1.2',
		value: 45,
		segment: 'edge',
	},
	{
		id: 22,
		parent: 3,
		name: 'V 130.1',
		value: 100,
		segment: 'chrome',
	},
	{
		id: 23,
		parent: 3,
		name: 'V 130.2',
		value: 100,
		segment: 'chrome',
	},
	{
		id: 24,
		parent: 7,
		name: 'Alpha 1',
		value: 50,
		segment: 'firefox',
	},
	{
		id: 25,
		parent: 7,
		name: 'Alpha 2',
		value: 50,
		segment: 'firefox',
	},
	{
		id: 26,
		parent: 8,
		name: 'Beta 1',
		value: 100,
		segment: 'firefox',
	},
	{
		id: 27,
		parent: 8,
		name: 'Beta 2',
		value: 100,
		segment: 'firefox',
	},
	{
		id: 28,
		parent: 9,
		name: 'Prod 1',
		value: 150,
		segment: 'firefox',
	},
	{
		id: 29,
		parent: 9,
		name: 'Prod 2',
		value: 150,
		segment: 'firefox',
	},
];
