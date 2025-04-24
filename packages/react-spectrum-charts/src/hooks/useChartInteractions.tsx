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
import { useMemo } from 'react';

import { SELECTED_ITEM, SELECTED_SERIES, SERIES_ID } from '@spectrum-charts/constants';
import { getColorValue } from '@spectrum-charts/themes';

import { useChartContext } from '../context/RscChartContext';
import { ChartChildElement, RscChartProps } from '../types';
import useLegend from './useLegend';
import useNewChartView from './useNewChartView';
import usePopoverAnchorStyle from './usePopoverAnchorStyle';
import useTooltipInteractions from './useTooltipInteractions';

export const useChartInteractions = (props: RscChartProps, sanitizedChildren: ChartChildElement[]) => {
	const { selectedData } = useChartContext();
	const { tooltipOptions } = useTooltipInteractions(props, sanitizedChildren);
	const { legendHiddenSeries, isToggleable: legendIsToggleable } = useLegend(sanitizedChildren);
	const targetStyle = usePopoverAnchorStyle(props.padding);

	const signals = useMemo(() => {
		const signals: Record<string, unknown> = {
			backgroundColor: getColorValue('gray-50', props.colorScheme),
		};
		if (legendIsToggleable) {
			signals.hiddenSeries = legendHiddenSeries;
		}
		signals[SELECTED_ITEM] = selectedData?.[props.idKey] ?? null;
		signals[SELECTED_SERIES] = selectedData?.[SERIES_ID] ?? null;

		return signals;
	}, [legendHiddenSeries, legendIsToggleable, props.colorScheme, props.idKey, selectedData]);

	const onNewView = useNewChartView(props, sanitizedChildren, tooltipOptions);

	return { signals, targetStyle, tooltipOptions, onNewView };
};
