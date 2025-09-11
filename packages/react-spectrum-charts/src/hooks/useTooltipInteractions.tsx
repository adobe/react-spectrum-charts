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
import { FC } from 'react';

import { renderToStaticMarkup } from 'react-dom/server';
import { Position, Options as TooltipOptions } from 'vega-tooltip';

import { COMPONENT_NAME, FILTERED_TABLE, GROUP_DATA, GROUP_ID } from '@spectrum-charts/constants';
import { ColorScheme, LegendDescription, TooltipAnchor, TooltipPlacement } from '@spectrum-charts/vega-spec-builder';

import { useChartContext } from '../context/RscChartContext';
import { ChartChildElement, RscChartProps } from '../types';
import { debugLog } from '../utils';
import useLegend from './useLegend';
import useTooltips from './useTooltips';

interface LegendTooltipProps {
  value: { index: number };
  descriptions: LegendDescription[];
  domain: string[];
}

const useTooltipsInteractions = (props: RscChartProps, sanitizedChildren: ChartChildElement[]) => {
  const { chartView, controlledHoveredIdSignal, controlledHoveredGroupSignal } = useChartContext();
  const { debug, colorScheme, idKey, tooltipAnchor, tooltipPlacement } = props;
  const tooltips = useTooltips(sanitizedChildren);
  const { descriptions: legendDescriptions } = useLegend(sanitizedChildren);

  const tooltipOptions = getTooltipOptions(colorScheme, tooltipAnchor, tooltipPlacement);

  if (tooltips.length || legendDescriptions) {
    tooltipOptions.formatTooltip = (value) => {
      debugLog(debug, { title: 'Tooltip datum', contents: value });
      if (value[COMPONENT_NAME]?.startsWith('legend') && legendDescriptions && 'index' in value) {
        debugLog(debug, {
          title: 'Legend descriptions',
          contents: legendDescriptions,
        });
        return renderToStaticMarkup(
          <LegendTooltip
            value={value}
            descriptions={legendDescriptions}
            domain={chartView.current?.scale('legend0Entries').domain()}
          />
        );
      }
      // get the correct tooltip to render based on the hovered item
      const tooltip = tooltips.find((t) => t.name === value[COMPONENT_NAME]);
      if (tooltip?.callback && !('index' in value)) {
        if (controlledHoveredIdSignal.current) {
          chartView.current?.signal(controlledHoveredIdSignal.current.name, value?.[idKey] ?? null);
        }
        if (controlledHoveredGroupSignal.current) {
          const key = Object.keys(value).find((k) => k.endsWith(GROUP_ID));
          if (key) {
            chartView.current?.signal(controlledHoveredGroupSignal.current.name, value[key]);
          }
        }
        if (tooltip.highlightBy && tooltip.highlightBy !== 'item') {
          const tableData = chartView.current?.data(FILTERED_TABLE);
          const groupId = `${tooltip.name}_${GROUP_ID}`;
          value[GROUP_DATA] = tableData?.filter((d) => d[groupId] === value[groupId]);
        }
        return renderToStaticMarkup(
          <div className="rsc-tooltip" data-testid="rsc-tooltip">
            {tooltip.callback(value)}
          </div>
        );
      }
      return '';
    };
  }

  return { tooltipOptions };
};

export default useTooltipsInteractions;

const getTooltipOptions = (
  colorScheme: ColorScheme,
  tooltipAnchor: TooltipAnchor,
  tooltipPlacement: TooltipPlacement
): TooltipOptions => {
  const position: Record<'top' | 'bottom' | 'right' | 'left', Position[]> = {
    top: ['top', 'bottom', 'right', 'left', 'top-right', 'top-left', 'bottom-right', 'bottom-left'],
    bottom: ['bottom', 'top', 'right', 'left', 'bottom-right', 'bottom-left', 'top-right', 'top-left'],
    right: ['right', 'left', 'top', 'bottom', 'top-right', 'bottom-right', 'top-left', 'bottom-left'],
    left: ['left', 'right', 'top', 'bottom', 'top-left', 'bottom-left', 'top-right', 'bottom-right'],
  };

  const offset = tooltipAnchor === 'cursor' ? 10 : 6;

  return {
    theme: colorScheme,
    anchor: tooltipAnchor,
    position: tooltipAnchor === 'mark' ? position[tooltipPlacement] : undefined,
    offsetX: offset,
    offsetY: offset,
  };
};

const LegendTooltip: FC<LegendTooltipProps> = ({ value, descriptions, domain }) => {
  const series = domain[value.index];
  const description = descriptions.find((d) => d.seriesName === series);
  if (!description) {
    return <></>;
  }
  return (
    <div className="rsc-tooltip legend-tooltip" data-testid="rsc-tooltip">
      <div className="series">{description.title ?? series}</div>
      <p className="series-description">{description.description}</p>
    </div>
  );
};
