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
import { ReactElement, ReactNode, createContext, useContext, useState } from 'react';

const DEFAULT_SIZE = 280;
const EdgeCaseDatasetContext = createContext<string | undefined>(undefined);
const EdgeCaseSizeContext = createContext(DEFAULT_SIZE);
const EdgeCaseViewModeContext = createContext<string | undefined>(undefined);

export interface EdgeCaseDataset {
  description?: string;
  label: string;
  value: string;
}

export interface EdgeCaseSizePreset {
  label: string;
  size: number;
}

export interface EdgeCaseViewMode {
  label: string;
  value: string;
}

export interface EdgeCase {
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
  /** Public props or child configurations exercised by this case. */
  coverage: string[];
  /** Renders the isolated chart case. */
  render: () => ReactNode;
}

interface EdgeCaseDashboardProps {
  chartType: string;
  cases: EdgeCase[];
  datasets?: EdgeCaseDataset[];
  getSizeDescription?: (size: number, viewMode?: string) => string;
  initialDataset?: string;
  initialSize?: number;
  initialViewMode?: string;
  resolvePresetSize?: (size: number, viewMode?: string) => number;
  sizePresets?: EdgeCaseSizePreset[];
  viewModes?: EdgeCaseViewMode[];
}

const defaultSizePresets: EdgeCaseSizePreset[] = [
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

export const useEdgeCaseSize = (): number => useContext(EdgeCaseSizeContext);
export const useEdgeCaseDataset = (): string | undefined => useContext(EdgeCaseDatasetContext);
export const useEdgeCaseViewMode = (): string | undefined => useContext(EdgeCaseViewModeContext);

export const EdgeCaseDashboard = ({
  chartType,
  cases,
  datasets = [],
  getSizeDescription,
  initialDataset,
  initialSize = DEFAULT_SIZE,
  initialViewMode,
  resolvePresetSize = (size) => size,
  sizePresets = defaultSizePresets,
  viewModes = [],
}: EdgeCaseDashboardProps): ReactElement => {
  const [dataset, setDataset] = useState(initialDataset ?? datasets[0]?.value);
  const [size, setSize] = useState(initialSize);
  const [viewMode, setViewMode] = useState(initialViewMode ?? viewModes[0]?.value);
  const presetSizes = sizePresets.map((preset) => resolvePresetSize(preset.size, viewMode));
  const minSize = Math.min(...presetSizes, initialSize);
  const maxSize = Math.max(...presetSizes, initialSize);
  const selectedPreset = sizePresets.find((preset) => resolvePresetSize(preset.size, viewMode) === size);
  const minimumCardWidth = Math.max(320, size + 16);

  const updateViewMode = (nextViewMode: string): void => {
    setViewMode(nextViewMode);
    if (selectedPreset) {
      setSize(resolvePresetSize(selectedPreset.size, nextViewMode));
    }
  };

  return (
    <EdgeCaseSizeContext.Provider value={size}>
      <main style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <header style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 900 }}>
          <div>
            <h1 style={{ margin: '0 0 8px' }}>{chartType} edge-case dashboard</h1>
            <p style={{ margin: 0 }}>
              Each card isolates a supported prop value or child configuration. The matrix is additive rather than a
              Cartesian product so failures remain attributable; dataset stress suites can reuse these cases
              independently.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {datasets.length > 0 && (
              <label style={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                <strong>Dataset:</strong>
                <select
                  aria-label={`${chartType} dataset`}
                  onChange={(event) => setDataset(event.target.value)}
                  style={{ padding: '4px 8px' }}
                  value={dataset}
                >
                  {datasets.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {datasets.find((option) => option.value === dataset)?.description && (
                  <span style={{ fontSize: 13 }}>
                    {datasets.find((option) => option.value === dataset)?.description}
                  </span>
                )}
              </label>
            )}
            {viewModes.length > 0 && (
              <div style={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                <strong>View:</strong>
                {viewModes.map((mode) => (
                  <button
                    key={mode.value}
                    aria-pressed={viewMode === mode.value}
                    onClick={() => updateViewMode(mode.value)}
                    style={{
                      background: viewMode === mode.value ? 'var(--spectrum-blue-900, #0265dc)' : 'transparent',
                      border: '1px solid var(--spectrum-gray-500, #909090)',
                      borderRadius: 4,
                      color: viewMode === mode.value ? 'white' : 'inherit',
                      cursor: 'pointer',
                      padding: '4px 10px',
                    }}
                    type="button"
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            )}
            <div style={{ alignItems: 'center', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <strong>Chart size:</strong>
              {sizePresets.map((preset) => (
                <button
                  key={preset.label}
                  aria-pressed={selectedPreset?.label === preset.label}
                  onClick={() => setSize(resolvePresetSize(preset.size, viewMode))}
                  style={{
                    background:
                      selectedPreset?.label === preset.label ? 'var(--spectrum-blue-900, #0265dc)' : 'transparent',
                    border: '1px solid var(--spectrum-gray-500, #909090)',
                    borderRadius: 4,
                    color: selectedPreset?.label === preset.label ? 'white' : 'inherit',
                    cursor: 'pointer',
                    padding: '4px 10px',
                  }}
                  type="button"
                >
                  {preset.label} ({Math.round(resolvePresetSize(preset.size, viewMode))}px container)
                </button>
              ))}
            </div>
            <label style={{ alignItems: 'center', display: 'flex', gap: 12 }}>
              <span style={{ minWidth: 120 }}>Container: {size}px</span>
              <input
                aria-label={`${chartType} chart size`}
                max={maxSize}
                min={minSize}
                onChange={(event) => setSize(Number(event.target.value))}
                style={{ flex: 1 }}
                type="range"
                value={size}
              />
            </label>
            {getSizeDescription && <span style={{ fontSize: 13 }}>{getSizeDescription(size, viewMode)}</span>}
          </div>
        </header>
        <EdgeCaseDatasetContext.Provider value={dataset}>
          <EdgeCaseViewModeContext.Provider value={viewMode}>
            <div
              style={{
                alignItems: 'start',
                display: 'grid',
                gap: 16,
                gridTemplateColumns: `repeat(auto-fill, minmax(min(100%, ${minimumCardWidth}px), 1fr))`,
              }}
            >
              {cases.map(
                ({ id, title, description, dataset: caseDataset, usesDashboardDataset = true, coverage, render }) => (
                  <section
                    key={id}
                    data-edge-case-id={id}
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
          </EdgeCaseViewModeContext.Provider>
        </EdgeCaseDatasetContext.Provider>
      </main>
    </EdgeCaseSizeContext.Provider>
  );
};
