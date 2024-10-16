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
import { DEFAULT_LOCALE } from '@constants';
import { getLocale } from 'utils/locale';
import { NumberLocale } from 'vega';
import { numberFormatLocale } from 'vega-format';

import { BigNumberNumberType } from '../../types';

export const formatBigNumber = (
	value: number,
	numberType: BigNumberNumberType,
	numberFormat?: string,
	numberLocale?: NumberLocale
): string => {
	const formatter = numberLocale
		? numberFormatLocale(numberLocale)
		: numberFormatLocale(getLocale(DEFAULT_LOCALE).number);

	if (numberType === 'percentage') {
		return formatter.format('~%')(value);
	}

	if (numberFormat) {
		return formatter.format(numberFormat)(value);
	} else {
		return formatter.format('')(value);
	}
};
