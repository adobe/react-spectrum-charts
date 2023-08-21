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

import { getItemBounds, toCamelCase, toSnakeCase } from '@utils';

describe('utils', () => {
	describe('toSnakeCase()', () => {
		test('camelCase should convert to snake_case', () => {
			expect(toSnakeCase('thisIsATest')).toStrictEqual('this_is_a_test');
		});
		test('kebab-case should convert to snake_case', () => {
			expect(toSnakeCase('test-utils')).toStrictEqual('test_utils');
		});
		test('PascalCase should convert to snake_case', () => {
			expect(toSnakeCase('SnakeTest')).toStrictEqual('snake_test');
		});
		test('sentence should convert to snake_case', () => {
			expect(toSnakeCase('This is a test')).toStrictEqual('this_is_a_test');
		});
		test('wild string should convert to snake_case', () => {
			expect(toSnakeCase('The guickFox_jumped-over 2 DOGS!')).toStrictEqual('the_guick_fox_jumped_over_2_dogs');
		});
		test('no alpha numeric characters should return original string', () => {
			expect(toSnakeCase('&()*')).toStrictEqual('&()*');
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

	describe('getItemBounds()', () => {
		test('should return default bounds if null or undefined', () => {
			expect(getItemBounds(null)).toStrictEqual({ x1: 0, x2: 0, y1: 0, y2: 0 });
			expect(getItemBounds(undefined)).toStrictEqual({ x1: 0, x2: 0, y1: 0, y2: 0 });
		});
	});
});
