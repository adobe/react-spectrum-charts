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
import { hasPopover, hasTooltip } from '@specBuilder/marks/markUtils';
import {
	addHighlightedItemSignalEvents,
	getGenericSignal,
	getSeriesHoveredSignal,
} from '@specBuilder/signal/signalSpecBuilder';
import { Signal } from 'vega';

import { TrendlineParentProps, getTrendlines } from './trendlineUtils';

export const setTrendlineSignals = (signals: Signal[], markProps: TrendlineParentProps): void => {
	const { name: markName } = markProps;
	const trendlines = getTrendlines(markProps);

	if (trendlines.some((trendline) => hasTooltip(trendline.children))) {
		addHighlightedItemSignalEvents(signals, `${markName}Trendline_voronoi`, 2);
		signals.push(getSeriesHoveredSignal(`${markName}Trendline`, true, `${markName}Trendline_voronoi`));
	}

	if (trendlines.some((trendline) => trendline.displayOnHover)) {
		signals.push(getSeriesHoveredSignal(markName, true, `${markName}_voronoi`));
		signals.push(getGenericSignal(`${markName}_selectedSeries`));
	}

	if (trendlines.some((trendline) => hasPopover(trendline.children))) {
		signals.push(getGenericSignal(`${markName}Trendline_selectedId`));
		signals.push(getGenericSignal(`${markName}Trendline_selectedSeries`));
	}
};
