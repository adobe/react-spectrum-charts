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

import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {
  Variation,
  VariationDashboard,
  VariationDataset,
  VariationFilter,
  VariationSizePreset,
  VariationViewMode,
  useVariationAnimations,
  useVariationDataset,
  useVariationRenderer,
  useVariationSize,
  useVariationViewMode,
} from './VariationDashboard.js';
import { DashboardDefinition } from './dashboardCoverage.js';
import { stubS2BrowserApis } from './dashboardTestUtils.js';

const sizePresets: VariationSizePreset[] = [{ label: 'L', size: 200 }];
const viewModes: VariationViewMode[] = [
  { label: 'No labels', value: 'none' },
  { label: 'Direct labels', value: 'direct' },
];
const datasets: VariationDataset[] = [
  { label: 'Standard', value: 'standard', description: 'Standard dataset' },
  { label: 'Dense', value: 'dense', description: 'Dense dataset' },
];
const filters: VariationFilter[] = [
  { label: 'All', value: 'all', matches: () => true },
  { label: 'Probe', value: 'probe', matches: (variation) => variation.id === 'probe' },
  { label: 'Other', value: 'other', matches: (variation) => variation.id === 'other' },
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
  {
    id: 'other',
    title: 'Other',
    description: 'Displays another variation.',
    dataset: 'test',
    coverage: ['other'],
    render: () => <div>Other variation</div>,
  },
];

beforeAll(stubS2BrowserApis);
beforeEach(() => localStorage.clear());

describe('VariationDashboard', () => {
  test('toggles animations for every variation and preserves the setting across datasets', async () => {
    const AnimationProbe = (): ReactElement => {
      const animations = useVariationAnimations();
      return <output aria-label="Animation state">{String(animations)}</output>;
    };
    render(
      <VariationDashboard
        variations={variations.map((variation) => ({ ...variation, render: () => <AnimationProbe /> }))}
        chartType="Test"
        datasets={datasets}
        showAnimationControls
      />
    );

    const toggle = screen.getByRole('switch', { name: 'Test animations' });
    expect(toggle).toHaveProperty('checked', true);
    screen.getAllByLabelText('Animation state').forEach((output) => expect(output.textContent).toBe('true'));

    await userEvent.click(toggle);
    expect(toggle).toHaveProperty('checked', false);
    screen.getAllByLabelText('Animation state').forEach((output) => expect(output.textContent).toBe('false'));

    await userEvent.click(screen.getByRole('button', { name: /Dataset/ }));
    await userEvent.click(screen.getByRole('option', { name: 'Dense' }));
    expect(toggle).toHaveProperty('checked', false);
    screen.getAllByLabelText('Animation state').forEach((output) => expect(output.textContent).toBe('false'));

    await userEvent.click(toggle);
    screen.getAllByLabelText('Animation state').forEach((output) => expect(output.textContent).toBe('true'));
  });

  test('can initialize animations as disabled', () => {
    render(
      <VariationDashboard variations={variations} chartType="Test" initialAnimations={false} showAnimationControls />
    );
    expect(screen.getByRole('switch', { name: 'Test animations' })).toHaveProperty('checked', false);
  });

  test('preserves the selected effective size tier when the view mode changes', async () => {
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

    await userEvent.click(screen.getByRole('radio', { name: 'Direct labels' }));

    expect(screen.getByText('standard:direct:364')).not.toBeNull();
  });

  test('provides the selected dataset to every variation', async () => {
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

    await userEvent.click(screen.getByRole('button', { name: /Dataset/ }));
    await userEvent.click(screen.getByRole('option', { name: 'Dense' }));

    expect(screen.getByText('dense:none:280')).not.toBeNull();
    expect(screen.getByText('Dense dataset')).not.toBeNull();
  });

  test('updates the container from size presets and the range control', async () => {
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

    await userEvent.click(screen.getByRole('radio', { name: 'L (204px container)' }));

    expect(screen.getByText('standard:none:204')).not.toBeNull();
    expect(screen.getByText('none view uses a 204px container')).not.toBeNull();

    fireEvent.change(screen.getByRole('slider', { name: 'Container size (px)' }), { target: { value: '250' } });

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

    expect(screen.queryByRole('button', { name: /Dataset/ })).toBeNull();
    expect(screen.queryByRole('radiogroup', { name: 'View mode' })).toBeNull();
    expect(screen.queryByRole('switch')).toBeNull();
    expect(screen.getByText('data: fixed')).not.toBeNull();
  });

  test('filters the visible variations', async () => {
    render(
      <VariationDashboard
        variations={variations}
        chartType="Test"
        filters={filters}
        initialFilter="all"
        sizePresets={sizePresets}
      />
    );

    expect(screen.getByRole('heading', { name: 'Probe' })).not.toBeNull();
    expect(screen.getByRole('heading', { name: 'Other' })).not.toBeNull();

    await userEvent.click(
      within(screen.getByRole('radiogroup', { name: 'Variant' })).getByRole('radio', { name: 'Probe' })
    );

    expect(screen.getByRole('heading', { name: 'Probe' })).not.toBeNull();
    expect(screen.queryByRole('heading', { name: 'Other' })).toBeNull();
  });

  test('keeps the size control visible when the controls are collapsed', async () => {
    render(<VariationDashboard variations={variations} chartType="Test" datasets={datasets} />);

    await userEvent.click(screen.getByRole('button', { name: 'Hide controls' }));

    expect(screen.queryByRole('button', { name: /Dataset/ })).toBeNull();
    expect(screen.getByRole('slider', { name: 'Container size (px)' })).not.toBeNull();
    expect(screen.getByRole('button', { name: 'Show controls' })).not.toBeNull();
  });

  test('filters the visible variations by covered prop', async () => {
    const coverage: DashboardDefinition['coverage'] = {
      Test: {
        size: ['probe'],
        other: ['other'],
        skipped: { skip: 'Not yet covered' },
      },
    };
    render(<VariationDashboard variations={variations} chartType="Test" coverage={coverage} />);

    await userEvent.click(screen.getByRole('button', { name: /Props/ }));
    await userEvent.click(screen.getByRole('menuitemcheckbox', { name: /size/ }));
    await userEvent.keyboard('{Escape}');

    expect(screen.getByText('Showing 1 of 2')).not.toBeNull();
    expect(screen.queryByRole('heading', { name: 'Other' })).toBeNull();

    await userEvent.click(within(screen.getByRole('grid', { name: 'Active prop filters' })).getByRole('button'));

    expect(screen.getByText('Showing 2 of 2')).not.toBeNull();
  });

  test('selects every covered prop and clears them', async () => {
    const coverage: DashboardDefinition['coverage'] = {
      Test: { size: ['probe'], skipped: { skip: 'Not yet covered' } },
    };
    render(<VariationDashboard variations={variations} chartType="Test" coverage={coverage} />);
    const clear = screen.getByRole('button', { name: 'Clear' });
    expect(clear).toHaveProperty('disabled', true);

    await userEvent.click(screen.getByRole('button', { name: 'Select all' }));

    expect(screen.getByText('Showing 1 of 2')).not.toBeNull();
    expect(within(screen.getByRole('grid', { name: 'Active prop filters' })).getAllByRole('row')).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Select all' })).toHaveProperty('disabled', true);

    await userEvent.click(clear);

    expect(screen.getByText('Showing 2 of 2')).not.toBeNull();
    expect(screen.queryByRole('grid', { name: 'Active prop filters' })).toBeNull();
  });

  test('restores dashboard settings after a remount and ignores stale stored values', async () => {
    localStorage.setItem('rsc-s2-variation-dashboard:Test:dataset', JSON.stringify('removed-dataset'));
    const { unmount } = render(<VariationDashboard variations={variations} chartType="Test" datasets={datasets} />);
    expect(screen.getByRole('button', { name: /Dataset/ }).textContent).toContain('Standard');

    await userEvent.click(screen.getByRole('radio', { name: 'Canvas' }));
    await userEvent.click(screen.getByRole('button', { name: 'Hide controls' }));
    unmount();
    render(<VariationDashboard variations={variations} chartType="Test" datasets={datasets} />);

    expect(screen.getByRole('button', { name: 'Show controls' })).not.toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Show controls' }));
    expect(screen.getByRole('radio', { name: 'Canvas' }).getAttribute('aria-checked')).toBe('true');
  });

  test('switches every variation between svg and canvas renderers', async () => {
    const RendererProbe = (): ReactElement => (
      <output aria-label="Renderer state">{String(useVariationRenderer())}</output>
    );
    render(
      <VariationDashboard
        variations={variations.map((variation) => ({ ...variation, render: () => <RendererProbe /> }))}
        chartType="Test"
      />
    );
    screen.getAllByLabelText('Renderer state').forEach((output) => expect(output.textContent).toBe('svg'));

    await userEvent.click(screen.getByRole('radio', { name: 'Canvas' }));

    screen.getAllByLabelText('Renderer state').forEach((output) => expect(output.textContent).toBe('canvas'));
  });
});
