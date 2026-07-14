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
import { Config, Locale, NumberLocale, Padding, Renderers, TimeLocale } from 'vega';

import { DEFAULT_COLOR_SCHEME } from '@spectrum-charts/constants';
import { LocaleCode, NumberLocaleCode, TimeLocaleCode, getLocale } from '@spectrum-charts/locales';

import { getExpressionFunctions } from './expressionFunctions';
import { getChartConfig } from './specUtils';

/**
 * WARNING: This is a last-resort escape hatch for working around gaps in Vega's functionality.
 * It must NOT be used as a general config customization pattern. Each patch is deep-merged into
 * the embed config before Vega sees it, bypassing Vega's own mergeConfig (which has known bugs
 * with nested objects like legend.layout.*). Patches introduce unstructured state that is hard
 * to trace and reason about — if Vega supports the use case directly, use that instead.
 */
export const applyUserMetaConfigPatches = (patches: Partial<Config>[] | undefined, config: Config): Config => {
  if (!patches?.length) return config;
  return patches.reduce(
    (acc, patch) => deepMerge(acc as Record<string, unknown>, patch as Record<string, unknown>) as Config,
    config
  );
};

const deepMerge = (base: Record<string, unknown>, patch: Record<string, unknown>): Record<string, unknown> => {
  const result = { ...base };
  for (const [key, patchVal] of Object.entries(patch)) {
    const baseVal = base[key];
    const patchIsPlainObject =
      patchVal !== null && typeof patchVal === 'object' && !Array.isArray(patchVal) && !('signal' in patchVal);
    const baseIsPlainObject =
      baseVal !== null && typeof baseVal === 'object' && !Array.isArray(baseVal) && !('signal' in baseVal);
    if (patchIsPlainObject && baseIsPlainObject) {
      result[key] = deepMerge(baseVal as Record<string, unknown>, patchVal as Record<string, unknown>);
    } else {
      result[key] = patchVal;
    }
  }
  return result;
};

export const getVegaEmbedOptions = ({
  locale = 'en-US',
  height = 400,
  width = 600,
  padding = 0,
  renderer = 'svg',
  config,
  colorScheme = DEFAULT_COLOR_SCHEME,
  s2 = false,
}: {
  locale?: Locale | LocaleCode | { number?: NumberLocaleCode | NumberLocale; time?: TimeLocaleCode | TimeLocale };
  height?: number;
  width?: number;
  padding?: Padding;
  renderer?: Renderers;
  config?: Config;
  s2?: boolean;
  colorScheme?: 'light' | 'dark';
}) => {
  const expressionFunctions = getExpressionFunctions(locale);
  const { number: numberLocale, time: timeLocale } = getLocale(locale);
  const chartConfig = config ?? getChartConfig(undefined, colorScheme, s2);

  return {
    actions: false,
    ast: true,
    expressionFunctions,
    formatLocale: numberLocale as unknown as Record<string, unknown>, // these are poorly typed by vega-embed
    height,
    width,
    padding,
    renderer,
    timeFormatLocale: timeLocale as unknown as Record<string, unknown>, // these are poorly typed by vega-embed
    config: chartConfig,
  };
};
