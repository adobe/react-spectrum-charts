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
import { ReactElement, ReactNode, createContext, useContext, useMemo } from 'react';

import { VariationDashboardHeader } from './VariationDashboardHeader.js';
import type { DashboardDefinition } from './dashboardCoverage.js';
import { usePersistedState } from './usePersistedState.js';

const DEFAULT_SIZE = 280;
const VariationDatasetContext = createContext<string | undefined>(undefined);
const VariationSizeContext = createContext(DEFAULT_SIZE);
export type VariationRenderer = 'svg' | 'canvas';

const VariationDisplayContext = createContext<{
  viewMode?: string;
  animations?: boolean;
  renderer?: VariationRenderer;
}>({});

export interface VariationDataset {
  description?: string;
  label: string;
  value: string;
}

export interface VariationSizePreset {
  label: string;
  size: number;
}

export interface VariationViewMode {
  label: string;
  value: string;
}

export interface VariationFilter {
  label: string;
  value: string;
  matches: (variation: Variation) => boolean;
}

export interface Variation {
  /** Stable identifier used as the React key and future visual-regression identifier. */
  id: string;
  /** Short label shown above the visualization. */
  title: string;
  /** Explains the expected visual or interactive behavior. */
  description: string;
  /** Identifies the data fixture so the same prop matrix can later run against stress datasets. */
  dataset: string;
  /** Uses the dashboard dataset selection instead of the fixed dataset label. */
  usesDashboardDataset?: boolean;
  /** Public props or child configurations exercised by this variation. */
  coverage: string[];
  /** Renders the isolated chart variation. */
  render: () => ReactNode;
}

interface VariationDashboardProps {
  chartType: string;
  variations: Variation[];
  /** Prop coverage map; populates the prop filter menu. */
  coverage?: DashboardDefinition['coverage'];
  datasets?: VariationDataset[];
  filters?: VariationFilter[];
  getSizeDescription?: (size: number, viewMode?: string) => string;
  initialDataset?: string;
  initialAnimations?: boolean;
  initialFilter?: string;
  initialSize?: number;
  initialViewMode?: string;
  resolvePresetSize?: (size: number, viewMode?: string) => number;
  sizePresets?: VariationSizePreset[];
  showAnimationControls?: boolean;
  viewModes?: VariationViewMode[];
}

const defaultSizePresets: VariationSizePreset[] = [
  { label: 'S', size: 160 },
  { label: 'M', size: 240 },
  { label: 'L', size: 320 },
  { label: 'XL', size: 400 },
];

const badgeStyle = {
  background: 'var(--spectrum-gray-100, #f8f8f8)',
  border: '1px solid var(--spectrum-gray-300, #d5d5d5)',
  borderRadius: 4,
  fontFamily: 'monospace',
  fontSize: 11,
  padding: '2px 5px',
} as const;

/**
 * Returns the variation ids covering any selected prop, or undefined when no props are selected.
 * @param coverage
 * @param selectedProps
 * @returns Set<string> | undefined
 */
const getPropVariationIds = (
  coverage: DashboardDefinition['coverage'] | undefined,
  selectedProps: Set<string>
): Set<string> | undefined => {
  if (!coverage || selectedProps.size === 0) return undefined;
  const ids = [...selectedProps].flatMap((key) => {
    const [component, prop] = key.split('.');
    const entry = coverage[component]?.[prop];
    return entry && !('skip' in entry) ? entry : [];
  });
  return new Set(ids);
};

export const useVariationSize = (): number => useContext(VariationSizeContext);
export const useVariationDataset = (): string | undefined => useContext(VariationDatasetContext);
export const useVariationViewMode = (): string | undefined => useContext(VariationDisplayContext).viewMode;
export const useVariationAnimations = (): boolean | undefined => useContext(VariationDisplayContext).animations;
export const useVariationRenderer = (): VariationRenderer | undefined => useContext(VariationDisplayContext).renderer;

export const VariationDashboard = ({
  chartType,
  variations,
  coverage,
  datasets = [],
  filters = [],
  getSizeDescription,
  initialAnimations = true,
  initialDataset,
  initialFilter,
  initialSize = DEFAULT_SIZE,
  initialViewMode,
  resolvePresetSize = (size) => size,
  sizePresets = defaultSizePresets,
  showAnimationControls = false,
  viewModes = [],
}: VariationDashboardProps): ReactElement => {
  const storageKey = `rsc-s2-variation-dashboard:${chartType}`;
  const isOneOf =
    (values: string[]) =>
    (value: unknown): boolean =>
      typeof value === 'string' && values.includes(value);
  const [dataset, setDataset] = usePersistedState(
    `${storageKey}:dataset`,
    initialDataset ?? datasets[0]?.value,
    isOneOf(datasets.map(({ value }) => value))
  );
  const [animations, setAnimations] = usePersistedState(`${storageKey}:animations`, initialAnimations);
  const [renderer, setRenderer] = usePersistedState<VariationRenderer>(
    `${storageKey}:renderer`,
    'svg',
    isOneOf(['svg', 'canvas'])
  );
  const [filter, setFilter] = usePersistedState(
    `${storageKey}:filter`,
    initialFilter ?? filters[0]?.value,
    isOneOf(filters.map(({ value }) => value))
  );
  const [size, setSize] = usePersistedState(`${storageKey}:size`, initialSize);
  const [viewMode, setViewMode] = usePersistedState(
    `${storageKey}:viewMode`,
    initialViewMode ?? viewModes[0]?.value,
    isOneOf(viewModes.map(({ value }) => value))
  );
  const displayContextValue = useMemo(
    () => ({ viewMode, animations: showAnimationControls ? animations : undefined, renderer }),
    [viewMode, animations, showAnimationControls, renderer]
  );
  const coveredPropKeys = Object.entries(coverage ?? {}).flatMap(([component, props]) =>
    Object.keys(props).map((prop) => `${component}.${prop}`)
  );
  const [selectedPropList, setSelectedPropList] = usePersistedState<string[]>(
    `${storageKey}:selectedProps`,
    [],
    (value) => Array.isArray(value) && value.every(isOneOf(coveredPropKeys))
  );
  const selectedProps = useMemo(() => new Set(selectedPropList), [selectedPropList]);
  const presetSizes = sizePresets.map((preset) => resolvePresetSize(preset.size, viewMode));
  const minSize = Math.min(...presetSizes, initialSize);
  const maxSize = Math.max(...presetSizes, initialSize);
  const selectedPreset = sizePresets.find((preset) => resolvePresetSize(preset.size, viewMode) === size);
  const minimumCardWidth = Math.max(320, size + 16);
  const activeFilter = filters.find((option) => option.value === filter);
  const propVariationIds = getPropVariationIds(coverage, selectedProps);
  const visibleVariations = variations.filter(
    (variation) =>
      (!activeFilter || activeFilter.matches(variation)) && (!propVariationIds || propVariationIds.has(variation.id))
  );

  const updateViewMode = (nextViewMode: string): void => {
    setViewMode(nextViewMode);
    if (selectedPreset) {
      setSize(resolvePresetSize(selectedPreset.size, nextViewMode));
    }
  };

  return (
    <VariationSizeContext.Provider value={size}>
      <main style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <VariationDashboardHeader
          chartType={chartType}
          visibleCount={visibleVariations.length}
          totalCount={variations.length}
          size={size}
          minSize={minSize}
          maxSize={maxSize}
          onSizeChange={setSize}
          sizeDescription={getSizeDescription?.(size, viewMode)}
          sizePresets={sizePresets}
          selectedPreset={selectedPreset?.label}
          getPresetSize={(preset) => resolvePresetSize(preset.size, viewMode)}
          datasets={datasets}
          dataset={dataset}
          onDatasetChange={setDataset}
          viewModes={viewModes}
          viewMode={viewMode}
          onViewModeChange={updateViewMode}
          filters={filters}
          filter={filter}
          onFilterChange={setFilter}
          coverage={coverage}
          selectedProps={selectedProps}
          onSelectedPropsChange={(props) => setSelectedPropList([...props])}
          animations={showAnimationControls ? animations : undefined}
          onAnimationsChange={setAnimations}
          renderer={renderer}
          onRendererChange={setRenderer}
        />
        <VariationDatasetContext.Provider value={dataset}>
          <VariationDisplayContext.Provider value={displayContextValue}>
            <div
              style={{
                alignItems: 'start',
                display: 'grid',
                gap: 16,
                gridTemplateColumns: `repeat(auto-fill, minmax(min(100%, ${minimumCardWidth}px), 1fr))`,
              }}
            >
              {visibleVariations.map(
                ({ id, title, description, dataset: caseDataset, usesDashboardDataset = true, coverage, render }) => (
                  <section
                    key={id}
                    data-variation-id={id}
                    style={{
                      border: '1px solid var(--spectrum-gray-300, #d5d5d5)',
                      borderRadius: 8,
                      minWidth: 0,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        alignItems: 'center',
                        display: 'flex',
                        justifyContent: 'center',
                        minHeight: size + 16,
                        overflow: 'auto',
                        padding: 8,
                      }}
                    >
                      {render()}
                    </div>
                    <div
                      style={{
                        borderTop: '1px solid var(--spectrum-gray-300, #d5d5d5)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                        padding: 12,
                      }}
                    >
                      <div>
                        <h2 style={{ fontSize: 16, margin: '0 0 4px' }}>{title}</h2>
                        <p style={{ fontSize: 13, margin: 0 }}>{description}</p>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        <span style={badgeStyle}>data: {usesDashboardDataset ? dataset : caseDataset}</span>
                        {coverage.map((item) => (
                          <span key={item} style={badgeStyle}>
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  </section>
                )
              )}
            </div>
          </VariationDisplayContext.Provider>
        </VariationDatasetContext.Provider>
      </main>
    </VariationSizeContext.Provider>
  );
};
