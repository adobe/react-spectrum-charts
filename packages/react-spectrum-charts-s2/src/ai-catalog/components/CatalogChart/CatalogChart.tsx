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
'use client';
import { FC, ReactElement } from 'react';

import { AxisInput, MarkInput, parseChartRequest } from '@spectrum-charts/schemas';

import { Chart } from '../../../Chart';
import { Axis } from '../../../components';
import { renderCatalogBar, renderCatalogLine } from './marks';

export interface CatalogChartProps {
  /** Raw agent-supplied payload, validated against @spectrum-charts/schemas' ChartSchema. */
  request: unknown;
}

function renderAxis(axis: AxisInput, key: number): ReactElement {
  const { component: _component, ...axisProps } = axis;
  return <Axis key={key} {...axisProps} />;
}

function renderMark(mark: MarkInput, key: number): ReactElement {
  switch (mark.component) {
    case 'Bar':
      return renderCatalogBar(mark, key);
    case 'Line':
      return renderCatalogLine(mark, key);
  }
}

const CatalogChart: FC<CatalogChartProps> = ({ request }) => {
  const parsed = parseChartRequest(request);
  return (
    <Chart data={parsed.data.values} colorScheme={parsed.colorScheme} backgroundColor={parsed.backgroundColor}>
      {parsed.axes?.map(renderAxis)}
      {parsed.children.map(renderMark)}
    </Chart>
  );
};

CatalogChart.displayName = 'CatalogChart';

export { CatalogChart };
