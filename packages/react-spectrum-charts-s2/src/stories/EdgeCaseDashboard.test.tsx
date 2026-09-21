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

import { fireEvent, render, screen } from '@testing-library/react';

import {
  EdgeCase,
  EdgeCaseDashboard,
  EdgeCaseDataset,
  EdgeCaseSizePreset,
  EdgeCaseViewMode,
  useEdgeCaseDataset,
  useEdgeCaseSize,
  useEdgeCaseViewMode,
} from './EdgeCaseDashboard';

const sizePresets: EdgeCaseSizePreset[] = [{ label: 'L', size: 200 }];
const viewModes: EdgeCaseViewMode[] = [
  { label: 'No labels', value: 'none' },
  { label: 'Direct labels', value: 'direct' },
];
const datasets: EdgeCaseDataset[] = [
  { label: 'Standard', value: 'standard' },
  { label: 'Dense', value: 'dense' },
];
const resolvePresetSize = (size: number, viewMode?: string): number => (viewMode === 'direct' ? size + 164 : size + 4);

const ContextProbe = (): ReactElement => {
  const size = useEdgeCaseSize();
  const dataset = useEdgeCaseDataset();
  const viewMode = useEdgeCaseViewMode();
  return <div>{`${dataset}:${viewMode}:${size}`}</div>;
};

const cases: EdgeCase[] = [
  {
    id: 'probe',
    title: 'Probe',
    description: 'Displays the active dashboard context.',
    dataset: 'test',
    coverage: ['view mode', 'size'],
    render: () => <ContextProbe />,
  },
];

describe('EdgeCaseDashboard', () => {
  test('preserves the selected effective size tier when the view mode changes', () => {
    render(
      <EdgeCaseDashboard
        cases={cases}
        chartType="Test"
        datasets={datasets}
        initialDataset="standard"
        initialSize={204}
        initialViewMode="none"
        resolvePresetSize={resolvePresetSize}
        sizePresets={sizePresets}
        viewModes={viewModes}
      />
    );

    expect(screen.getByText('standard:none:204')).not.toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Direct labels' }));

    expect(screen.getByText('standard:direct:364')).not.toBeNull();
    expect(screen.getByText('Container: 364px')).not.toBeNull();
  });

  test('provides the selected dataset to every case', () => {
    render(
      <EdgeCaseDashboard
        cases={cases}
        chartType="Test"
        datasets={datasets}
        initialDataset="standard"
        initialViewMode="none"
        sizePresets={sizePresets}
        viewModes={viewModes}
      />
    );

    fireEvent.change(screen.getByRole('combobox', { name: 'Test dataset' }), { target: { value: 'dense' } });

    expect(screen.getByText('dense:none:280')).not.toBeNull();
  });
});
