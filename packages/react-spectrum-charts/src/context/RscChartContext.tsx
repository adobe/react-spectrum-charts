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
import { MutableRefObject, ReactNode, createContext, useContext, useMemo, useRef, useState } from 'react';

import { Signal, View } from 'vega';

import { Datum, MarkBounds } from '@spectrum-charts/vega-spec-builder';

interface ChartContextValue {
	// Chart view state
	chartView: MutableRefObject<View | undefined>;
	chartId: string;

	// Selection state
	selectedData: MutableRefObject<Datum | null>;
	selectedDataName: MutableRefObject<string>;
	selectedDataBounds: MutableRefObject<MarkBounds>;

	// Popover state
	isPopoverOpen: boolean;
	setIsPopoverOpen: (isOpen: boolean) => void;
	popoverAnchorRef: MutableRefObject<HTMLDivElement | null>;

	// Legend state
	legendHiddenSeries: string[];
	setLegendHiddenSeries: (series: string[]) => void;
	// legendIsToggleable: boolean;

	// Interaction handlers
	onLegendClick?: (seriesName: string) => void;
	onLegendMouseOver?: (seriesName: string) => void;
	onLegendMouseOut?: (seriesName: string) => void;

	// Spec state
	controlledHoveredIdSignal: MutableRefObject<Signal | undefined>;
	controlledHoveredGroupSignal: MutableRefObject<Signal | undefined>;
}

const ChartContext = createContext<ChartContextValue | null>(null);

interface ChartProviderProps {
	children: ReactNode;
	chartId: string;
	chartView: MutableRefObject<View | undefined>;
}

export const ChartProvider = ({ children, chartId, chartView }: ChartProviderProps) => {
	const controlledHoveredIdSignal = useRef<Signal | undefined>();
	const controlledHoveredGroupSignal = useRef<Signal | undefined>();
	const popoverAnchorRef = useRef<HTMLDivElement | null>(null);
	const selectedData = useRef<Datum | null>(null);
	const selectedDataName = useRef<string>('');
	const selectedDataBounds = useRef<MarkBounds>({ x1: 0, x2: 0, y1: 0, y2: 0 });

	const [isPopoverOpen, setIsPopoverOpen] = useState(false);
	const [legendHiddenSeries, setLegendHiddenSeries] = useState<string[]>([]);

	const value: ChartContextValue = useMemo(
		() => ({
			chartView,
			chartId,
			selectedData,
			selectedDataName,
			selectedDataBounds,
			controlledHoveredIdSignal,
			controlledHoveredGroupSignal,
			isPopoverOpen,
			setIsPopoverOpen,
			popoverAnchorRef,
			legendHiddenSeries,
			setLegendHiddenSeries,
		}),
		[chartId, chartView, isPopoverOpen, legendHiddenSeries]
	);

	return <ChartContext.Provider value={value}>{children}</ChartContext.Provider>;
};

export const useChartContext = () => {
	const context = useContext(ChartContext);
	if (!context) {
		throw new Error('useChartContext must be used within a ChartProvider');
	}
	return context;
};
