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
	addHighlightedSeriesSignalEvents,
	getRSCAnimationSignals,
	getRSCTrendlineColorAnimationDirection,
	hasSignalByName
} from '@specBuilder/signal/signalSpecBuilder';
import { Signal } from 'vega';

import { TrendlineParentProps, getTrendlines } from './trendlineUtils';
import { TrendlineSpecProps } from '@rsc';
import { RSC_ANIMATION } from '@constants';

export const setTrendlineSignals = (signals: Signal[], markProps: TrendlineParentProps): void => {
	const { name: markName, animations } = markProps;
	const trendlines = getTrendlines(markProps);

	//TODO: Add comments/documentation/tests
	if (animations !== false) {
		checkRSCTrendlineAnimationSignals(markName, signals, trendlines);
	}
	if (trendlines.some((trendline) => hasTooltip(trendline.children))) {
		addHighlightedItemSignalEvents({ signals, markName: `${markName}Trendline_voronoi`, datumOrder: 2 });
		addHighlightedSeriesSignalEvents(signals, `${markName}Trendline_voronoi`, 2);
	}

	if (trendlines.some((trendline) => trendline.displayOnHover)) {
		addHighlightedSeriesSignalEvents(signals, `${markName}_voronoi`, 2);
	}
};
//TODO: Add comments/documentation/tests
const checkRSCTrendlineAnimationSignals = (name: string, signals: Signal[], trendlines: TrendlineSpecProps[] ) => {
	if (!hasSignalByName(signals, RSC_ANIMATION) && (trendlines.some((trendline) => hasTooltip(trendline.children) || hasPopover(trendline.children)))) {
		signals.push(...getRSCAnimationSignals(`${name}Trendline`, true));
		signals.find((sig) => sig.name == 'rscColorAnimationDirection')?.on?.push(...getRSCTrendlineColorAnimationDirection(`${name}Trendline`))
	}
}
