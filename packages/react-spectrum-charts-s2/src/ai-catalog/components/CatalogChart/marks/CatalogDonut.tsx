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
import { ReactElement } from 'react';

import { DonutDecorationInput, DonutInput } from '@spectrum-charts/schemas';

import { ChartInspect, Donut, DonutSummary, SegmentLabel } from '../../../../components/index.js';

function renderDonutDecoration(decoration: DonutDecorationInput, key: number): ReactElement {
  switch (decoration.component) {
    case 'DonutSummary': {
      const { component: _component, ...props } = decoration;
      return <DonutSummary key={key} {...props} />;
    }
    case 'SegmentLabel': {
      const { component: _component, ...props } = decoration;
      return <SegmentLabel key={key} {...props} />;
    }
    case 'ChartInspect': {
      const { component: _component, ...props } = decoration;
      return <ChartInspect key={key} {...props} />;
    }
  }
}

export function renderCatalogDonut(mark: DonutInput, key: number): ReactElement {
  const { component: _component, decorations, ...props } = mark;
  return <Donut key={key} {...props}>{decorations?.map(renderDonutDecoration)}</Donut>;
}
