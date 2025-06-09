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
import { CSSProperties, useMemo } from 'react';

import { Padding } from 'vega';

import { useChartContext } from '../context/RscChartContext';

export default function usePopoverAnchorStyle(padding: Padding): CSSProperties {
  const { chartView, selectedDataBounds, isPopoverOpen } = useChartContext();

  const bounds = selectedDataBounds.current;
  const view = chartView.current;

  return useMemo((): CSSProperties => {
    if (isPopoverOpen && bounds && view) {
      const { x1, x2, y1, y2 } = bounds;
      const leftPadding = (typeof padding === 'number' ? padding : padding.left) ?? 0;
      const topPadding = (typeof padding === 'number' ? padding : padding.top) ?? 0;
      return {
        position: 'absolute',
        width: x2 - x1,
        height: y2 - y1,
        left: x1 + leftPadding + view.origin()[0],
        top: y1 + topPadding + view.origin()[1],
      };
    }
    return { display: 'none' };
  }, [isPopoverOpen, view, bounds, padding]);
}
