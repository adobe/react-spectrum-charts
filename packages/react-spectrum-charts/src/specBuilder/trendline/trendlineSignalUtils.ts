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
import { hasTooltip } from '@specBuilder/marks/markUtils';
import {
	addHighlightedItemSignalEvents,
	addHighlightedSeriesSignalEvents,
} from '@specBuilder/signal/signalSpecBuilder';
import { Signal } from 'vega';

import { TrendlineParentOptions, getTrendlines } from './trendlineUtils';

export const setTrendlineSignals = (signals: Signal[], markOptions: TrendlineParentOptions): void => {
	const { idKey, name: markName } = markOptions;
	const trendlines = getTrendlines(markOptions);

	if (trendlines.some((trendline) => hasTooltip(trendline))) {
		addHighlightedItemSignalEvents(signals, `${markName}Trendline_voronoi`, idKey, 2);
		addHighlightedSeriesSignalEvents(signals, `${markName}Trendline_voronoi`, 2);
	}

	if (trendlines.some((trendline) => trendline.displayOnHover)) {
		addHighlightedSeriesSignalEvents(signals, `${markName}_voronoi`, 2);
	}
};
