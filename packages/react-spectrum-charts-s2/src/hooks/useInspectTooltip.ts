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
import { useCallback, useEffect, useMemo, useRef } from 'react';

import { Item, TooltipHandler } from 'vega';
import { Handler, Options as TooltipOptions } from 'vega-tooltip';

import { TOOLTIP_DELAY } from '@spectrum-charts/core-s2/constants';

import { useChartContext } from '../context/RscChartContext.js';
import { getItemBounds } from '../utils/index.js';

/**
 * Builds a stable tooltip handler to pass to embed; setting a tooltip after embed makes Vega rebuild its renderer.
 * @param inspectOptions - vega-tooltip options for the inspect panel
 * @returns TooltipHandler
 */
const useInspectTooltip = (inspectOptions: TooltipOptions): TooltipHandler => {
  const { setHoveredAxisLabel } = useChartContext();
  const inspectHandler = useMemo(() => new Handler(inspectOptions), [inspectOptions]);
  const latest = useRef({ inspectHandler, setHoveredAxisLabel });
  // delays legend tooltips on hover
  const inspectTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    latest.current = { inspectHandler, setHoveredAxisLabel };
  }, [inspectHandler, setHoveredAxisLabel]);

  useEffect(() => () => clearTimeout(inspectTimeout.current), []);

  return useCallback((view, event, item, value) => {
    const { inspectHandler, setHoveredAxisLabel } = latest.current;
    // Cancel delayed tooltips if the mouse moves before the delay is resolved.
    if (inspectTimeout.current) {
      clearTimeout(inspectTimeout.current);
      inspectTimeout.current = undefined;
    }
    // Axis labels use a real Tooltip, not vega-tooltip's popup.
    if (item && itemIsAxisLabel(item) && value !== undefined && value !== null) {
      setHoveredAxisLabel({ bounds: getItemBounds(item), content: String(value) });
      return;
    }
    setHoveredAxisLabel(null);
    if (event?.type === 'pointermove' && itemIsLegendItem(item) && 'tooltip' in item) {
      inspectTimeout.current = setTimeout(() => {
        inspectHandler.call(view, event, item, value);
        inspectTimeout.current = undefined;
      }, TOOLTIP_DELAY);
    } else {
      inspectHandler.call(view, event, item, value);
    }
  }, []);
};

export default useInspectTooltip;

const itemIsLegendItem = (item: Item<unknown>): boolean => {
  return 'name' in item.mark && typeof item.mark.name === 'string' && item.mark.name.includes('legend');
};

const itemIsAxisLabel = (item: Item<unknown>): boolean => 'role' in item.mark && item.mark.role === 'axis-label';
