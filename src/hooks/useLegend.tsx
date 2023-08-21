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

import { useMemo } from 'react';
import { ChartChildElement, LegendDescription, LegendElement, PrismElement } from 'types';

import { Legend } from '../components/Legend';
import { getElement } from '../utils';

export default function useLegend(children: ChartChildElement[]): [LegendDescription[] | undefined] {
	const legend = useMemo(() => {
		return getElement({ type: { name: 'Prism' }, props: { children } } as PrismElement, Legend);
	}, [children]) as LegendElement;
	if (!legend) return [undefined];
	return [legend.props.descriptions];
}
