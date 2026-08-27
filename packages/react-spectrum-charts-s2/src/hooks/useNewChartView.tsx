/*
 * Copyright 2026 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import { useCallback } from 'react';

import { Item, View } from 'vega';
import { Handler, Options as TooltipOptions } from 'vega-tooltip';

import { TOOLTIP_DELAY } from '@spectrum-charts/constants';

const useNewChartView = (inspectOptions: TooltipOptions) => {
  return useCallback(
    (view: View) => {
      // Add a delay before displaying legend tooltips on hover.
      let inspectTimeout: NodeJS.Timeout | undefined;
      view.tooltip((viewRef, event, item, value) => {
        const inspectHandler = new Handler(inspectOptions);
        // Cancel delayed tooltips if the mouse moves before the delay is resolved.
        if (inspectTimeout) {
          clearTimeout(inspectTimeout);
          inspectTimeout = undefined;
        }
        if (event?.type === 'pointermove' && (itemIsLegendItem(item) || itemIsAxisLabel(item)) && 'tooltip' in item) {
          inspectTimeout = setTimeout(() => {
            inspectHandler.call(viewRef, event, item, value);
            inspectTimeout = undefined;
          }, TOOLTIP_DELAY);
        } else {
          inspectHandler.call(viewRef, event, item, value);
        }
      });
    },
    [inspectOptions]
  );
};

export default useNewChartView;

const itemIsLegendItem = (item: Item<unknown>): boolean => {
  return 'name' in item.mark && typeof item.mark.name === 'string' && item.mark.name.includes('legend');
};

const itemIsAxisLabel = (item: Item<unknown>): boolean => 'role' in item.mark && item.mark.role === 'axis-label';
