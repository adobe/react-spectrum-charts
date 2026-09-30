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
import { Data, ValuesData } from 'vega';

import { TABLE } from '@spectrum-charts/constants';

import { getTableData } from '../data/dataUtils';

/**
 * Retrieves the gauge table data from the provided data array.
 * If it doesn't exist, creates and pushes a new one.
 * @param data The data array.
 * @returns The gauge table data.
 */
export const getGaugeTableData = (data: Data[]): ValuesData => {
  let tableData = getTableData(data);
  if (!tableData) {
    tableData = {
      name: TABLE,
      values: [],
    };
    data.push(tableData);
  }
  return tableData;
};

/**
 * Generates the necessary formula transforms for the gauge chart.
 * It calculates the xPaddingForTarget and, if in flexible scale mode, adds the flexibleScaleValue.
 * It also generates a color expression for the threshold bars if applicable.
 * @param gaugeOptions The gauge spec properties.
 * @returns An array of formula transforms.
 */

/**
 * Generates a Vega expression for the color of the gauge chart based on the provided thresholds.
 * The expression checks the value of the metric field against the thresholds and assigns the appropriate color.
 * @param defaultColor The default color to use if no thresholds are met.
 * @returns A string representing the Vega expression for the color.
 */

