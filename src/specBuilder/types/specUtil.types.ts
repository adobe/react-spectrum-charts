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
import { GROUP_DATA, MARK_ID, SERIES_ID, TRENDLINE_VALUE } from '@constants';
import { SymbolShape } from 'vega';

import { SpectrumVizColor } from './spectrumVizColor.types';

export type PartiallyRequired<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

export interface MarkBounds {
	x1: number;
	x2: number;
	y1: number;
	y2: number;
}

const DatumPredefinedKey = {
	markId: MARK_ID,
	seriesId: SERIES_ID,
	trendlineValue: TRENDLINE_VALUE,
	groupData: GROUP_DATA,
} as const;

export type Datum = object & {
	[DatumPredefinedKey.markId]: number;
	[DatumPredefinedKey.seriesId]: string;
	[DatumPredefinedKey.trendlineValue]?: number;
	[DatumPredefinedKey.groupData]?: Datum[];
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	[key: string]: any;
};

export type NumberFormat = 'currency' | 'shortCurrency' | 'shortNumber' | 'standardNumber' | string;
export type Orientation = 'vertical' | 'horizontal';
export type Position = 'left' | 'right' | 'top' | 'bottom';
export type ScaleType = 'linear' | 'point' | 'time' | 'band';
export type ChartSymbolShape = 'rounded-square' | SymbolShape;

/**
 * Stroke dasharray for the line.
 *
 * solid: null,
 * dashed: 7 4,
 * dotted: 2 3,
 * dotDash: 2 3 7 4,
 * shortDash: 3 4,
 * longDash: 11 4,
 * twoDash: 5 2 11 2
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/stroke-dasharray
 */
export type LineType = 'solid' | 'dashed' | 'dotted' | 'dotDash' | 'shortDash' | 'longDash' | 'twoDash' | number[];

/**
 * Width of line in pixels
 *
 * XS: 1px,
 * S: 1.5px,
 * M: 2px,
 * L: 3px,
 * XL: 4px
 * */
export type LineWidth = 'XS' | 'S' | 'M' | 'L' | 'XL' | number;

/**
 * Width of the trail in pixels
 *
 * XS: 6px,
 * S: 8px,
 * M: 10px,
 * L: 12px,
 * XL: 16px
 * */
export type PathWidth = 'XS' | 'S' | 'M' | 'L' | 'XL' | number;

/**
 * Width of the symbol in pixels
 *
 * XS: 6px,
 * S: 8px,
 * M: 10px,
 * L: 12px,
 * XL: 16px
 * */
export type SymbolSize = 'XS' | 'S' | 'M' | 'L' | 'XL' | number;

export type StaticValue<T> = { value: T };
export type FacetRef<T> = string | StaticValue<T>;

export type ColorFacet = FacetRef<string | SpectrumVizColor>;
export type LineTypeFacet = FacetRef<LineType>;
export type LineWidthFacet = FacetRef<LineWidth>;
export type OpacityFacet = FacetRef<number>;
export type PathWidthFacet = FacetRef<PathWidth>;
export type SymbolSizeFacet = FacetRef<SymbolSize>;
export type SymbolShapeFacet = FacetRef<ChartSymbolShape>;

export type FacetType =
	| 'color'
	| 'linearColor'
	| 'lineType'
	| 'lineWidth'
	| 'opacity'
	| 'symbolShape'
	| 'symbolSize'
	| 'symbolPathWidth';

export type SecondaryFacetType =
	| 'secondaryColor'
	| 'secondaryLineType'
	| 'secondaryLineWidth'
	| 'secondaryOpacity'
	| 'secondarySymbolShape'
	| 'secondarySymbolSize'
	| 'secondarySymbolPathWidth';
