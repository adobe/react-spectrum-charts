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

import { BigNumberNumberType } from 'types';
import { NumberLocale } from 'vega';
import { numberFormatLocale } from 'vega-format';

export const getFormattedString = (
	value: number,
	numberType: BigNumberNumberType,
	numberLocale?: NumberLocale,
	numberFormat?: string,
): string => {
	const formatter = numberFormatLocale(numberLocale);

	if (numberType === 'percentage') {
		return formatter.format('~%')(value);
	}

	if (Math.abs(value) >= 1000) {
		// Format in scientific notation with B instead of G (e.g., 1K, 20M, 1.3B)
		const formattedValue = formatter.format('.3s')(value);
		return formattedValue.replace('G', 'B').toUpperCase();
	}

	// Format with commas for thousands, etc., or use the provided numberFormat
	return numberFormat ? formatter.format(numberFormat)(value) : formatter.format(',')(value);
};
