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
  Variation,
  VariationDashboard,
  VariationDataset,
  VariationSizePreset,
  VariationViewMode,
  useVariationDataset,
  useVariationSize,
  useVariationViewMode,
} from './VariationDashboard';

const sizePresets: VariationSizePreset[] = [{ label: 'L', size: 200 }];
const viewModes: VariationViewMode[] = [
  { label: 'No labels', value: 'none' },
  { label: 'Direct labels', value: 'direct' },
];
const datasets: VariationDataset[] = [
  { label: 'Standard', value: 'standard', description: 'Standard dataset' },
  { label: 'Dense', value: 'dense', description: 'Dense dataset' },
];
const resolvePresetSize = (size: number, viewMode?: string): number => (viewMode === 'direct' ? size + 164 : size + 4);

const ContextProbe = (): ReactElement => {
  const size = useVariationSize();
  const dataset = useVariationDataset();
  const viewMode = useVariationViewMode();
  return <div>{`${dataset}:${viewMode}:${size}`}</div>;
};

const variations: Variation[] = [
  {
    id: 'probe',
    title: 'Probe',
    description: 'Displays the active dashboard context.',
    dataset: 'test',
    coverage: ['view mode', 'size'],
    render: () => <ContextProbe />,
  },
];

describe('VariationDashboard', () => {
  test('preserves the selected effective size tier when the view mode changes', () => {
    render(
      <VariationDashboard
        variations={variations}
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

  test('provides the selected dataset to every variation', () => {
    render(
      <VariationDashboard
        variations={variations}
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
    expect(screen.getByText('Dense dataset')).not.toBeNull();
  });

  test('updates the container from size presets and the range control', () => {
    render(
      <VariationDashboard
        variations={variations}
        chartType="Test"
        datasets={datasets}
        getSizeDescription={(size, viewMode) => `${viewMode} view uses a ${size}px container`}
        initialDataset="standard"
        initialViewMode="none"
        resolvePresetSize={resolvePresetSize}
        sizePresets={sizePresets}
        viewModes={viewModes}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'L (204px container)' }));

    expect(screen.getByText('standard:none:204')).not.toBeNull();
    expect(screen.getByText('none view uses a 204px container')).not.toBeNull();

    fireEvent.change(screen.getByRole('slider', { name: 'Test chart size' }), { target: { value: '250' } });

    expect(screen.getByText('standard:none:250')).not.toBeNull();
    expect(screen.getByText('none view uses a 250px container')).not.toBeNull();
  });

  test('uses a fixed dataset badge without optional dashboard controls', () => {
    const fixedVariations: Variation[] = [
      {
        ...variations[0],
        dataset: 'fixed',
        usesDashboardDataset: false,
      },
    ];

    render(<VariationDashboard variations={fixedVariations} chartType="Test" />);

    expect(screen.queryByRole('combobox')).toBeNull();
    expect(screen.queryByText('View:')).toBeNull();
    expect(screen.getByText('data: fixed')).not.toBeNull();
  });
});
