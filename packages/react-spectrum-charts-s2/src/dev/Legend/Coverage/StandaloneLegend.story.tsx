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
import { useState } from 'react';

import { Button } from '@react-spectrum/s2';

import { Chart } from '../../../Chart.js';
import { Donut, DonutSummary, Legend } from '../../../components/index.js';
import { bindWithProps } from '../../../test-utils/bindWithProps.js';
import { LegendItem, LegendPage, LegendProps } from '../../../types/index.js';

const items: LegendItem[] = ['Search', 'Direct', 'Email'].map((seriesName, index) => ({
  seriesName,
  label: seriesName,
  color: `categorical-${(index + 1) * 100}`,
}));

export function SharedLegendExample(props: LegendProps) {
  const [hiddenSeries, setHiddenSeries] = useState<string[]>([]);
  const entries = props.items ?? items;
  const side = props.position === 'left' || props.position === 'right';
  return (
    <div style={{ display: 'flex', flexDirection: side ? 'row' : 'column', height: 280, minWidth: 0 }}>
      <div style={{ overflow: 'auto', flexShrink: 0, width: side ? 140 : undefined, maxHeight: side ? '100%' : '35%' }}>
        <Legend
          {...props}
          items={entries}
          hiddenSeries={hiddenSeries}
          onClick={(name) => {
            setHiddenSeries((hidden) =>
              hidden.includes(name) ? hidden.filter((entry) => entry !== name) : [...hidden, name]
            );
            props.onClick?.(name);
          }}
        />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', flex: 1, minWidth: 0 }}>
        {[1, 2].map((factor) => (
          <Chart
            key={factor}
            data={entries.map((item, index) => ({ series: item.seriesName, value: (index + 1) * factor * 10 }))}
            colors={entries.map((item) => item.color)}
            hiddenSeries={hiddenSeries}
            colorScheme={props.colorScheme}
            width="auto"
            height={220}
            minWidth={0}
            animations={false}
          >
            <Donut>
              <DonutSummary />
            </Donut>
          </Chart>
        ))}
      </div>
    </div>
  );
}

export default {
  title: 'React Spectrum Charts 2/Legend/Coverage/Standalone',
  tags: ['alpha'],
  component: Legend,
  excludeStories: ['SharedLegendExample', 'PaginatedLegendExample'],
  parameters: { controls: { include: ['position', 'overflow', 'colorScheme'] } },
};

export const Shared = bindWithProps(SharedLegendExample);
Shared.args = { position: 'top', align: 'middle' };

export const Side = bindWithProps(SharedLegendExample);
Side.args = { position: 'left', align: 'middle' };

export const Page = bindWithProps(SharedLegendExample);
Page.args = { position: 'top', hiddenEntries: ['Search'], labelLimit: 100 };

export const AlignedRows = () => (
  <div style={{ width: 420 }}>
    <SharedLegendExample
      labelLimit={100}
      items={Array.from({ length: 7 }, (_, index) => ({
        seriesName: `series-${index}`,
        label: `Series ${index + 1}`,
        color: `categorical-${(index + 1) * 100}`,
      }))}
    />
  </div>
);

export function PaginatedLegendExample() {
  const [pages, setPages] = useState<readonly LegendPage[]>([]);
  const [page, setPage] = useState(0);
  const currentPage = Math.min(page, Math.max(0, pages.length - 1));
  const current = pages[currentPage];
  const entries = Array.from({ length: 25 }, (_, index) => ({
    seriesName: `series-${index}`,
    label: index === 11 ? 'International product sales from partner campaigns' : `Series ${index + 1}`,
    color: `categorical-${((index % 10) + 1) * 100}`,
  }));
  return (
    <div style={{ width: 420, maxWidth: '100%' }}>
      {pages.length > 1 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8 }}>
          <Button variant="secondary" isDisabled={currentPage === 0} onPress={() => setPage(currentPage - 1)}>
            Previous
          </Button>
          <span>
            {currentPage + 1} of {pages.length}
          </span>
          <Button
            variant="secondary"
            isDisabled={currentPage === pages.length - 1}
            onPress={() => setPage(currentPage + 1)}
          >
            Next
          </Button>
        </div>
      )}
      <SharedLegendExample
        items={entries}
        preferredColumns="auto"
        maxRows={2}
        labelWrap={3}
        onPagesChange={setPages}
        hiddenEntries={
          current
            ? entries.filter((_, index) => index < current.start || index > current.end).map((item) => item.seriesName)
            : undefined
        }
      />
    </div>
  );
}

export const Paginated = () => <PaginatedLegendExample />;

export const Scrolling = bindWithProps(SharedLegendExample);
Scrolling.args = {
  position: 'top',
  overflow: 'scroll',
  items: Array.from({ length: 12 }, (_, index) => ({
    seriesName: `series-${index}`,
    label: `Series ${index + 1}`,
    color: `categorical-${((index % 12) + 1) * 100}`,
  })),
};

export const ContextMenu = bindWithProps(SharedLegendExample);
ContextMenu.args = {
  renderContextMenu: (name, close) => <Button onPress={close}>{name}</Button>,
};
