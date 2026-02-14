/*
 * Copyright 2026 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

declare module 'vega-format' {
	import { NumberLocale, TimeLocale } from 'vega';

	export interface NumberFormatLocale {
		format(specifier: string): (n: number) => string;
	}

	export interface TimeFormatLocale {
		format(specifier: string): (d: Date | number) => string;
		parse(specifier: string): (str: string) => Date | null;
		utcFormat(specifier: string): (d: Date | number) => string;
		utcParse(specifier: string): (str: string) => Date | null;
	}

	export function numberFormatLocale(locale: NumberLocale): NumberFormatLocale;
	export function timeFormatLocale(locale: TimeLocale): TimeFormatLocale;
}

