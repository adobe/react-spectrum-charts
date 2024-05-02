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
import { createElement, useMemo, useState } from 'react';

import { getElement } from '@utils';

import { Chart } from '../Chart';
import { Legend } from '../components/Legend';
import { ChartChildElement, LegendDescription, LegendElement } from '../types';

interface UseLegendProps {
	hiddenSeriesState: string[];
	setHiddenSeries: (hiddenSeries: string[]) => void;
	descriptions?: LegendDescription[];
	isToggleable?: boolean;
	onClick?: (seriesName: string) => void;
	onMouseOut?: (seriesName: string) => void;
	onMouseOver?: (seriesName: string) => void;
}

export default function useLegend(children: ChartChildElement[]): UseLegendProps {
	const legend = useMemo(() => {
		return getElement(createElement(Chart, { data: [] }, children), Legend);
	}, [children]) as LegendElement;
	const [hiddenSeriesState, setHiddenSeries] = useState<string[]>(legend?.props?.defaultHiddenSeries ?? []);
	if (!legend) return { hiddenSeriesState, setHiddenSeries };
	const { descriptions, isToggleable, onClick, onMouseOut, onMouseOver } = legend.props;
	return { hiddenSeriesState, setHiddenSeries, descriptions, isToggleable, onClick, onMouseOut, onMouseOver };
}
