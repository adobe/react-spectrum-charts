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
import { FC, useMemo, type ReactElement } from 'react';

import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import { Position, Options as VegaTooltipOptions } from 'vega-tooltip';

function renderToHtml(element: ReactElement): string {
  const container = document.createElement('div');
  const root = createRoot(container);
  flushSync(() => {
    root.render(element);
  });
  const html = container.innerHTML;
  root.unmount();
  return html;
}

import { COMPONENT_NAME, DIMENSION_HOVER_AREA, FILTERED_TABLE, GROUP_DATA, GROUP_ID } from '@spectrum-charts/constants';
import { ColorScheme, Datum, LegendDescription, TooltipAnchor, TooltipPlacement } from '@spectrum-charts/vega-spec-builder-s2';

import { useChartContext } from '../context/RscChartContext';
import { ChartChildElement, RscChartProps } from '../types';
import { debugLog } from '../utils';
import useLegend from './useLegend';
import useChartInspects, { type InspectDetail } from './useChartInspects';

interface LegendInspectProps {
  value: { index: number };
  descriptions: LegendDescription[];
  domain: string[];
}

const getLegendInspectMarkup = (
  value: Datum,
  legendDescriptions: LegendDescription[] | undefined,
  chartView: { current?: { scale: (name: string) => { domain: () => string[] } } } | null,
  debug: boolean | undefined
): string | undefined => {
  const componentName = value[COMPONENT_NAME];
  const index = (value as { index?: number }).index;
  if (typeof componentName === 'string' && componentName.startsWith('legend') && legendDescriptions && typeof index === 'number') {
    debugLog(debug, {
      title: 'Legend descriptions',
      contents: legendDescriptions,
    });
    return renderToHtml(
      <LegendInspect
        value={{ index }}
        descriptions={legendDescriptions}
        domain={chartView?.current?.scale('legend0Entries').domain() ?? []}
      />
    );
  }
};

const getDimensionAreaInspectMarkup = (
  value: Datum,
  inspects: InspectDetail[],
  chartView: { current?: { data: (name: string) => Datum[] } } | null
): string | undefined => {
  const componentName = value[COMPONENT_NAME];
  if (typeof componentName !== 'string' || !componentName.endsWith(DIMENSION_HOVER_AREA)) {
    return;
  }

  const inspectName = componentName.replace(`_${DIMENSION_HOVER_AREA}`, '');
  const inspect = inspects.find((t) => t.name === inspectName && t.targets?.includes('dimensionArea'));
  if (!inspect) return '';

  const dimension = value.dimension;

  const tableData = chartView?.current?.data(FILTERED_TABLE);
  value[GROUP_DATA] = tableData?.filter((d) => d[dimension] === value[dimension]);

  return renderToHtml(
    <div className="rsc-tooltip" data-testid="rsc-tooltip">
      {inspect.callback(value)}
    </div>
  );
};

const useChartInspectInteractions = (props: RscChartProps, sanitizedChildren: ChartChildElement[]) => {
  const { chartView, controlledHoveredIdSignal, controlledHoveredGroupSignal } = useChartContext();
  const { debug, colorScheme, idKey, tooltipAnchor, tooltipPlacement } = props;
  const inspects = useChartInspects(sanitizedChildren);
  const { descriptions: legendDescriptions } = useLegend(sanitizedChildren);

  const inspectOptions = useMemo(() => {
    const options = getInspectOptions(colorScheme, tooltipAnchor, tooltipPlacement);

    if (inspects.length || legendDescriptions) {
      options.formatTooltip = (value) => {
        debugLog(debug, { title: 'Inspect datum', contents: value });

        const legendInspect = getLegendInspectMarkup(value, legendDescriptions, chartView, debug);
        if (legendInspect) return legendInspect;

        const dimensionAreaInspect = getDimensionAreaInspectMarkup(value, inspects, chartView);
        if (dimensionAreaInspect !== undefined) return dimensionAreaInspect;

        // get the correct inspect to render based on the hovered item
        const inspect = inspects.find((t) => t.name === value[COMPONENT_NAME]);
        if (inspect?.callback && !('index' in value)) {
          if (controlledHoveredIdSignal.current) {
            chartView.current?.signal(controlledHoveredIdSignal.current.name, value?.[idKey] ?? null);
          }
          if (controlledHoveredGroupSignal.current) {
            const key = Object.keys(value).find((k) => k.endsWith(GROUP_ID));
            if (key) {
              chartView.current?.signal(controlledHoveredGroupSignal.current.name, value[key]);
            }
          }
          if (inspect.highlightBy && inspect.highlightBy !== 'item') {
            const tableData = chartView.current?.data(FILTERED_TABLE);
            const groupId = `${inspect.name}_${GROUP_ID}`;
            value[GROUP_DATA] = tableData?.filter((d) => d[groupId] === value[groupId]);
          }
          return renderToHtml(
            <div className="rsc-tooltip" data-testid="rsc-tooltip">
              {inspect.callback(value)}
            </div>
          );
        }
        return '';
      };
    }

    return options;
  }, [colorScheme, tooltipAnchor, tooltipPlacement, inspects, legendDescriptions, debug, idKey, chartView, controlledHoveredIdSignal, controlledHoveredGroupSignal]);

  return { inspectOptions };
};

export default useChartInspectInteractions;

const getInspectOptions = (
  colorScheme: ColorScheme,
  tooltipAnchor: TooltipAnchor,
  tooltipPlacement: TooltipPlacement
): VegaTooltipOptions => {
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

const LegendInspect: FC<LegendInspectProps> = ({ value, descriptions, domain }) => {
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
