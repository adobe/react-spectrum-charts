/*
 * Copyright 2025 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import { combineNames, toCamelCase } from './utils';

describe('combineElementNames()', () => {
	test('should return child name if parent name is null', () => {
		expect(combineNames(null, 'bar0')).toBe('bar0');
	});
	test('should return parent name if child name is null', () => {
		expect(combineNames('combo0', null)).toBe('combo0');
	});
	test('should return combined name if both parent and child names are provided', () => {
		expect(combineNames('combo0', 'bar0')).toBe('combo0Bar0');
	});
});

describe('toCamelCase()', () => {
	test('camelCase should convert to camelCase', () => {
		expect(toCamelCase('camelTest')).toStrictEqual('camelTest');
	});
	test('kebab-case should convert to camelCase', () => {
		expect(toCamelCase('kebab-test')).toStrictEqual('kebabTest');
	});
	test('PascalCase should convert to camelCase', () => {
		expect(toCamelCase('PascalTest')).toStrictEqual('pascalTest');
	});
	test('snake_case should convert to camelCase', () => {
		expect(toCamelCase('snake_test')).toStrictEqual('snakeTest');
	});
	test('sentence should convert to camelCase', () => {
		expect(toCamelCase('This is a test')).toStrictEqual('thisIsATest');
	});
	test('wild string should convert to camelCase', () => {
		expect(toCamelCase('The quickFox_jumped-over 2 DOGS!')).toStrictEqual('theQuickFoxJumpedOver2Dogs');
	});
	test('no alpha numeric characters should return original string', () => {
		expect(toCamelCase('&()*')).toStrictEqual('&()*');
	});
});
