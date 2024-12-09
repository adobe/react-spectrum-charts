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
		name: 'Root',
	},
	{
		id: 2,
		name: 'Chrome',
		parent: 1,
	},
	{
		id: 3,
		name: 'V 130',
		parent: 2,
		value: 200,
	},
	{
		id: 4,
		parent: 2,
		name: 'V 131',
		value: 100,
	},
	{
		id: 5,
		parent: 2,
		name: 'V 132',
		value: 500,
	},
	{
		id: 6,
		parent: 1,
		name: 'Firefox',
	},
	{
		id: 7,
		parent: 6,
		name: 'Alpha',
		value: 100,
	},
	{
		id: 8,
		parent: 6,
		name: 'Beta',
		value: 200,
	},
	{
		id: 9,
		parent: 6,
		name: 'Prod',
		value: 300,
	},
	{
		id: 10,
		parent: 1,
		name: 'Safari',
	},
	{
		id: 11,
		parent: 10,
		name: '12.4.64',
		value: 50,
	},
	{
		id: 12,
		parent: 10,
		name: '12.4.65',
		value: 50,
	},
	{
		id: 13,
		parent: 10,
		name: '12.5.0',
		value: 50,
	},
	{
		id: 14,
		parent: 1,
		name: 'Edge',
	},
	{
		id: 15,
		parent: 14,
		name: '1',
		value: 300,
	},
	{
		id: 16,
		parent: 14,
		name: '2',
		value: 300,
	},
	{
		id: 17,
		parent: 14,
		name: '3',
		value: 300,
	},
	{
		id: 18,
		parent: 14,
		name: '4',
		value: 300,
	},
];
