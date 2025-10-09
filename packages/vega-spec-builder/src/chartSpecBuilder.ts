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
import { produce } from 'immer';
import { Data, LinearScale, OrdinalScale, PointScale, Scale, Signal } from 'vega';

import {
  BACKGROUND_COLOR,
  DEFAULT_BACKGROUND_COLOR,
  DEFAULT_COLOR_SCHEME,
  DEFAULT_LINE_TYPES,
  FILTERED_TABLE,
  HIGHLIGHTED_GROUP,
  HIGHLIGHTED_ITEM,
  HIGHLIGHTED_SERIES,
  LINEAR_COLOR_SCALE,
  LINE_TYPE_SCALE,
  LINE_WIDTH_SCALE,
  MARK_ID,
  OPACITY_SCALE,
  SELECTED_GROUP,
  SELECTED_ITEM,
  SELECTED_SERIES,
  SERIES_ID,
  SYMBOL_PATH_WIDTH_SCALE,
  SYMBOL_SHAPE_SCALE,
  SYMBOL_SIZE_SCALE,
  TABLE,
} from '@spectrum-charts/constants';
import { colorSchemes, getColorValue } from '@spectrum-charts/themes';

import { addArea } from './area/areaSpecBuilder';
import { addAxis } from './axis/axisSpecBuilder';
import { addBar } from './bar/barSpecBuilder';
import { addBullet } from './bullet/bulletSpecBuilder';
import { addGauge } from './gauge/gaugeSpecBuilder';
import { addCombo } from './combo/comboSpecBuilder';
import { getSeriesIdTransform } from './data/dataUtils';
import { addDonut } from './donut/donutSpecBuilder';
import { setHoverOpacityForMarks } from './legend/legendHighlightUtils';
import { addLegend } from './legend/legendSpecBuilder';
import { addLine } from './line/lineSpecBuilder';
import { getOrdinalScale } from './scale/scaleSpecBuilder';
import { addScatter } from './scatter/scatterSpecBuilder';
import { getGenericValueSignal } from './signal/signalSpecBuilder';
import {
  getFacetsFromScales,
  getLineWidthPixelsFromLineWidth,
  getPathFromSymbolShape,
  getStrokeDashFromLineType,
  getSymbolWidthFromRscSymbolSize,
  getVegaSymbolSizeFromRscSymbolSize,
  initializeSpec,
} from './specUtils';
import { addTitle } from './title/titleSpecBuilder';
import {
  ChartColors,
  ChartOptions,
  ChartSpecOptions,
  ChartSymbolShape,
  ColorScale,
  ColorScheme,
  Colors,
  LineType,
  LineTypes,
  LineWidth,
  Opacities,
  ScSpec,
  SymbolShapes,
  SymbolSize,
} from './types';
import { addVenn } from './venn/vennSpecBuilder';

export function buildSpec({
  axes = [],
  backgroundColor = DEFAULT_BACKGROUND_COLOR,
  chartHeight,
  chartWidth,
  colors = 'categorical12',
  colorScheme = DEFAULT_COLOR_SCHEME,
  data,
  description,
  hiddenSeries = [],
  highlightedItem,
  highlightedSeries,
  idKey = MARK_ID,
  legends = [],
  lineTypes = DEFAULT_LINE_TYPES as LineType[],
  lineWidths = ['M'],
  marks = [],
  opacities,
  symbolShapes = ['rounded-square'],
  symbolSizes = ['XS', 'XL'],
  title,
  titles = [],
}: ChartOptions) {
  const options: ChartSpecOptions = {
    axes,
    backgroundColor,
    chartHeight,
    chartWidth,
    colors,
    colorScheme,
    data,
    description,
    hiddenSeries,
    highlightedItem,
    highlightedSeries,
    idKey,
    legends,
    lineTypes,
    lineWidths,
    marks,
    opacities,
    symbolShapes,
    symbolSizes,
    title,
    titles,
  };
  let spec = initializeSpec(null, { backgroundColor, colorScheme, description, title });
  spec.signals = getDefaultSignals(options);
  spec.scales = getDefaultScales(colors, colorScheme, lineTypes, lineWidths, opacities, symbolShapes, symbolSizes);

  // added gaugeCount below
  let { areaCount, barCount, bulletCount, comboCount, donutCount, gaugeCount, lineCount, scatterCount, vennCount } =
    initializeComponentCounts();
  const specOptions = { colorScheme, idKey, highlightedItem };
  spec = [...marks].reduce((acc: ScSpec, mark) => {
    switch (mark.markType) {
      case 'area':
        areaCount++;
        return addArea(acc, { ...mark, ...specOptions, index: areaCount });
      case 'bar':
        barCount++;
        return addBar(acc, { ...mark, ...specOptions, index: barCount });
      case 'bullet':
        bulletCount++;
        return addBullet(acc, { ...mark, ...specOptions, index: bulletCount });
      case 'combo':
        comboCount++;
        return addCombo(acc, { ...mark, ...specOptions, index: comboCount });
      case 'donut':
        donutCount++;
        return addDonut(acc, { ...mark, ...specOptions, index: donutCount });
      case 'gauge':
        gaugeCount++;
        return addGauge(acc, { ...mark, ...specOptions, index: gaugeCount });
      case 'line':
        lineCount++;
        return addLine(acc, { ...mark, ...specOptions, index: lineCount });
      case 'scatter':
        scatterCount++;
        return addScatter(acc, { ...mark, ...specOptions, index: scatterCount });
      case 'venn':
        vennCount++;
        return addVenn(acc, { ...mark, ...specOptions, index: vennCount, data, chartWidth, chartHeight });

      case 'bigNumber':
        // Do nothing and do not throw an error
        return acc;
      default:
        console.error(`Invalid component type: ${mark} is not a supported chart mark option child`);
        return acc;
    }
  }, spec);

  spec = [...legends].reduce((acc: ScSpec, legend, index) => {
    return addLegend(acc, {
      ...legend,
      ...specOptions,
      index,
      hiddenSeries,
      highlightedSeries,
    });
  }, spec);

  spec = [...axes].reduce((acc: ScSpec, axis, index) => {
    return addAxis(acc, {
      ...axis,
      ...specOptions,
      index,
    });
  }, spec);

  if (titles.length) {
    spec = addTitle(spec, titles[0]);
  }

  // copy the spec so we don't mutate the original
  spec = JSON.parse(JSON.stringify(spec));
  spec.data = addData(spec.data ?? [], { facets: getFacetsFromScales(spec.scales) });

  // add signals and update marks for controlled highlighting if there isn't a legend with highlight enabled
  if (highlightedSeries) {
    setHoverOpacityForMarks(spec.marks ?? []);
  }

  // clear out all scales that don't have any fields on the domain
  spec = removeUnusedScales(spec);

  return safeClone(spec);
}

export const removeUnusedScales = produce<ScSpec>((spec) => {
  spec.scales = spec.scales?.filter((scale) => {
    return !('domain' in scale && scale.domain && 'fields' in scale.domain && scale.domain.fields.length === 0);
  });
});

const initializeComponentCounts = () => {
  return {
    areaCount: -1,
    barCount: -1,
    comboCount: -1,
    donutCount: -1,
    bulletCount: -1,
    gaugeCount: -1,
    lineCount: -1,
    scatterCount: -1,
    vennCount: -1,
  };
};

export const getDefaultSignals = ({
  backgroundColor,
  colors,
  colorScheme,
  lineTypes,
  opacities,
  hiddenSeries,
  highlightedItem,
  highlightedSeries,
}: ChartSpecOptions): Signal[] => {
  // if the background color is transparent, then we want to set the signal background color to gray-50
  // if the signal background color were transparent then backgroundMarks and annotation fill would also be transparent
  const signalBackgroundColor = backgroundColor === 'transparent' ? 'gray-50' : backgroundColor;
  // highlightedItem should be undefined or an array
  const formattedHighlightedItem = highlightedItem === undefined || Array.isArray(highlightedItem) ? highlightedItem : [highlightedItem];
  return [
    getGenericValueSignal(BACKGROUND_COLOR, getColorValue(signalBackgroundColor, colorScheme)),
    getGenericValueSignal('colors', getTwoDimensionalColorScheme(colors, colorScheme)),
    getGenericValueSignal('lineTypes', getTwoDimensionalLineTypes(lineTypes)),
    getGenericValueSignal('opacities', getTwoDimensionalOpacities(opacities)),
    getGenericValueSignal('hiddenSeries', hiddenSeries ?? []),
    getGenericValueSignal(HIGHLIGHTED_ITEM, formattedHighlightedItem),
    getGenericValueSignal(HIGHLIGHTED_GROUP),
    getGenericValueSignal(HIGHLIGHTED_SERIES, highlightedSeries),
    getGenericValueSignal(SELECTED_ITEM),
    getGenericValueSignal(SELECTED_SERIES),
    getGenericValueSignal(SELECTED_GROUP),
  ];
};

export const getTwoDimensionalColorScheme = (colors: ChartColors, colorScheme: ColorScheme): string[][] => {
  if (isColors(colors)) {
    return getColors(colors, colorScheme).map((color) => [color]);
  }
  return colors.map((color) => getColors(color, colorScheme));
};

export const getTwoDimensionalLineTypes = (lineTypes: LineTypes): number[][][] => {
  // 1D array of line types
  if (isLineTypeArray(lineTypes)) {
    return getStrokeDashesFromLineTypes(lineTypes).map((strokeDash) => [strokeDash]);
  }
  // 2D array of line types
  return lineTypes.map((lineTypeArray) => getStrokeDashesFromLineTypes(lineTypeArray));
};

export const getTwoDimensionalOpacities = (opacities: Opacities | undefined): number[][] => {
  if (!opacities) return [[1]];
  // 1D array of line types
  if (isNumberArray(opacities)) {
    return opacities.map((opacity) => [opacity]);
  }
  // 2D array of line types
  return opacities;
};

const getDefaultScales = (
  colors: ChartColors,
  colorScheme: ColorScheme,
  lineTypes: LineTypes,
  lineWidths: LineWidth[],
  opacities: Opacities | undefined,
  symbolShapes: SymbolShapes,
  symbolSizes: [SymbolSize, SymbolSize]
): Scale[] => [
  getColorScale(colors, colorScheme),
  getLinearColorScale(colors, colorScheme),
  getLineTypeScale(lineTypes),
  getLineWidthScale(lineWidths),
  getOpacityScale(opacities),
  getSymbolShapeScale(symbolShapes),
  getSymbolSizeScale(symbolSizes),
  getSymbolPathWidthScale(symbolSizes),
];

export const getColorScale = (colors: ChartColors, colorScheme: ColorScheme): OrdinalScale => {
  // if a two dimensional scale was provided, then just grab the first color in each scale and set that as the scale range
  const range = isColors(colors) ? getColors(colors, colorScheme) : colors.map((c) => getColors(c, colorScheme)[0]);
  return getOrdinalScale('color', range);
};

export const getLinearColorScale = (colors: ChartColors, colorScheme: ColorScheme): LinearScale => {
  // if a two dimensional scale was provided, then just grab the first color in each scale and set that as the scale range
  const range = isColors(colors) ? getColors(colors, colorScheme) : colors.map((c) => getColors(c, colorScheme)[0]);
  return {
    name: LINEAR_COLOR_SCALE,
    type: 'linear',
    range,
    domain: { data: TABLE, fields: [] },
  };
};

export const getLineTypeScale = (lineTypes: LineTypes): OrdinalScale => {
  // if a two dimensional scale was provided, then just grab the first color in each scale and set that as the scale range
  const range = isLineTypeArray(lineTypes)
    ? getStrokeDashesFromLineTypes(lineTypes)
    : lineTypes.map((lineTypesArray) => getStrokeDashFromLineType(lineTypesArray[0]));
  return getOrdinalScale(LINE_TYPE_SCALE, range);
};

export const getSymbolShapeScale = (symbolShapes: SymbolShapes): OrdinalScale => {
  // if a two dimensional scale was provided, then just grab the first color in each scale and set that as the scale range
  const range = isSymbolShapeArray(symbolShapes)
    ? getPathsFromSymbolShapes(symbolShapes)
    : symbolShapes.map((symbolShape) => getPathFromSymbolShape(symbolShape[0]));
  return getOrdinalScale(SYMBOL_SHAPE_SCALE, range);
};

/**
 * returns the symbol size scale
 * @param symbolSizes
 * @returns LinearScale
 */
export const getSymbolSizeScale = (symbolSizes: [SymbolSize, SymbolSize]): LinearScale => ({
  name: SYMBOL_SIZE_SCALE,
  type: 'linear',
  zero: false,
  range: symbolSizes.map((symbolSize) => getVegaSymbolSizeFromRscSymbolSize(symbolSize)),
  domain: { data: TABLE, fields: [] },
});

/**
 * returns the path width scale
 * @param symbolSizes
 * @returns LinearScale
 */
export const getSymbolPathWidthScale = (symbolSizes: [SymbolSize, SymbolSize]): LinearScale => ({
  name: SYMBOL_PATH_WIDTH_SCALE,
  type: 'linear',
  zero: false,
  range: symbolSizes.map((symbolSize) => getSymbolWidthFromRscSymbolSize(symbolSize)),
  domain: { data: TABLE, fields: [] },
});

export const getLineWidthScale = (lineWidths: LineWidth[]): OrdinalScale => {
  const range = lineWidths.map((lineWidth) => getLineWidthPixelsFromLineWidth(lineWidth));
  return getOrdinalScale(LINE_WIDTH_SCALE, range);
};

export const getOpacityScale = (opacities?: Opacities): OrdinalScale | PointScale => {
  if (opacities?.length) {
    const range = isNumberArray(opacities) ? opacities : opacities.map((opacityArray) => opacityArray[0]);
    return getOrdinalScale(OPACITY_SCALE, range);
  }
  return {
    name: OPACITY_SCALE,
    type: 'point',
    range: [1, 0],
    padding: 1,
    align: 1,
    domain: { data: TABLE, fields: [] },
  };
};

function getColors(colors: Colors, colorScheme: ColorScheme): string[] {
  if (Array.isArray(colors)) {
    return colors.map((color: string) => getColorValue(color, colorScheme));
  }
  return colorSchemes[colors];
}

function getStrokeDashesFromLineTypes(lineTypes: LineType[]): number[][] {
  return lineTypes.map((lineType) => getStrokeDashFromLineType(lineType));
}

function getPathsFromSymbolShapes(symbolShapes: ChartSymbolShape[]) {
  return symbolShapes.map((symbolShape) => getPathFromSymbolShape(symbolShape));
}

/**
 * Adds a formula transform to the TABLE data that combines all the facets into a single key
 */
export const addData = produce<Data[], [{ facets: string[] }]>((data, { facets }) => {
  if (facets.length === 0) return;
  data[0]?.transform?.push(...getSeriesIdTransform(facets));

  // add a filter transform to the TABLE data that filters out any hidden series
  const index = data.findIndex((datum) => datum.name === FILTERED_TABLE);
  if (index !== -1) {
    data[index].transform = [
      { type: 'filter', expr: `indexof(hiddenSeries, datum.${SERIES_ID}) === -1` },
      ...(data[index].transform ?? []),
    ];
  }
});

export const isColorScale = (colors: ChartColors): colors is ColorScale => {
  return Boolean(!Array.isArray(colors) && colors in colorSchemes);
};

export const isColors = (colors: ChartColors): colors is Colors => {
  return isColorScale(colors) || colors.some((color) => !isColorScale(color) && typeof color === 'string');
};

export const isLineTypeArray = (lineTypes: LineTypes): lineTypes is LineType[] => {
  return lineTypes.some((lineType) => typeof lineType === 'string' || isStrokeDashArray(lineType));
};

export const isStrokeDashArray = (lineType: LineType | LineType[]): lineType is number[] => {
  return Array.isArray(lineType) && !lineType.some((value) => typeof value !== 'number');
};

export const isNumberArray = (opacities: Opacities): opacities is number[] => {
  return !opacities.some((opacity) => Array.isArray(opacity));
};

export const isSymbolShapeArray = (symbolShapes: SymbolShapes): symbolShapes is ChartSymbolShape[] => {
  return !symbolShapes.some((symbolShape) => Array.isArray(symbolShape));
};

const safeClone = <T>(obj: T): T => {
  if (typeof structuredClone === 'function') {
    return structuredClone(obj);
  }
  return JSON.parse(JSON.stringify(obj));
};
