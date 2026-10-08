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
import { CSSProperties, ReactElement, ReactNode, useState } from 'react';

import {
  ActionButton,
  Header,
  Heading,
  Menu,
  MenuItem,
  MenuSection,
  MenuTrigger,
  Picker,
  PickerItem,
  Provider,
  SegmentedControl,
  SegmentedControlItem,
  Slider,
  Switch,
  Tag,
  TagGroup,
  Text,
  ToggleButton,
  ToggleButtonGroup,
} from '@react-spectrum/s2';
import ChevronDown from '@react-spectrum/s2/icons/ChevronDown';
import ChevronUp from '@react-spectrum/s2/icons/ChevronUp';
import FilterIcon from '@react-spectrum/s2/icons/Filter';

import type { DashboardDefinition } from './dashboardCoverage.js';
import type { VariationDataset, VariationFilter, VariationSizePreset, VariationViewMode } from './VariationDashboard.js';

export interface VariationDashboardHeaderProps {
  chartType: string;
  visibleCount: number;
  totalCount: number;
  size: number;
  minSize: number;
  maxSize: number;
  onSizeChange: (size: number) => void;
  sizeDescription?: string;
  sizePresets: VariationSizePreset[];
  selectedPreset?: string;
  getPresetSize: (preset: VariationSizePreset) => number;
  datasets: VariationDataset[];
  dataset?: string;
  onDatasetChange: (dataset: string) => void;
  viewModes: VariationViewMode[];
  viewMode?: string;
  onViewModeChange: (viewMode: string) => void;
  filters: VariationFilter[];
  filter?: string;
  onFilterChange: (filter: string) => void;
  coverage?: DashboardDefinition['coverage'];
  selectedProps: Set<string>;
  onSelectedPropsChange: (selectedProps: Set<string>) => void;
  /** Animation toggle state; the toggle is hidden when undefined. */
  animations?: boolean;
  onAnimationsChange: (animations: boolean) => void;
}

const groupStyle: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 };
const groupTitleStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: 0.5,
  margin: 0,
  textTransform: 'uppercase',
};

const ControlGroup = ({ title, children }: { title: string; children: ReactNode }): ReactElement => (
  <section aria-label={title} style={groupStyle}>
    <h2 style={groupTitleStyle}>{title}</h2>
    {children}
  </section>
);

/**
 * Sticky, collapsible dashboard controls; the size slider stays visible when collapsed.
 * @param props
 * @returns ReactElement
 */
export const VariationDashboardHeader = ({
  chartType,
  visibleCount,
  totalCount,
  size,
  minSize,
  maxSize,
  onSizeChange,
  sizeDescription,
  sizePresets,
  selectedPreset,
  getPresetSize,
  datasets,
  dataset,
  onDatasetChange,
  viewModes,
  viewMode,
  onViewModeChange,
  filters,
  filter,
  onFilterChange,
  coverage = {},
  selectedProps,
  onSelectedPropsChange,
  animations,
  onAnimationsChange,
}: VariationDashboardHeaderProps): ReactElement => {
  const [isExpanded, setIsExpanded] = useState(true);
  const coverageSections = Object.entries(coverage).map(([component, componentCoverage]) => ({
    component,
    entries: Object.entries(componentCoverage).flatMap(([prop, entry]) => (entry ? [{ prop, entry }] : [])),
  }));
  const skippedProps = coverageSections.flatMap(({ component, entries }) =>
    entries.filter(({ entry }) => 'skip' in entry).map(({ prop }) => `${component}.${prop}`)
  );
  const datasetDescription = datasets.find((option) => option.value === dataset)?.description;

  const removeProps = (keys: Set<string | number>): void => {
    onSelectedPropsChange(new Set([...selectedProps].filter((key) => !keys.has(key))));
  };

  return (
    <Provider
      background="base"
      UNSAFE_style={{
        borderBottom: '1px solid var(--spectrum-gray-300, #d5d5d5)',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        paddingBlock: 12,
        position: 'sticky',
        top: 0,
        zIndex: 1,
      }}
    >
      <header style={{ alignItems: 'end', display: 'flex', flexWrap: 'wrap', gap: 24 }}>
        <div style={{ minWidth: 200 }}>
          <h1 style={{ fontSize: 20, margin: '0 0 4px' }}>{chartType} variations</h1>
          <span style={{ fontSize: 13 }}>
            Showing {visibleCount} of {totalCount}
          </span>
        </div>
        <div style={{ display: 'flex', flex: 1, flexDirection: 'column', gap: 4, minWidth: 240 }}>
          <Slider
            label="Container size (px)"
            maxValue={maxSize}
            minValue={minSize}
            onChange={onSizeChange}
            value={size}
          />
          {sizeDescription && <span style={{ fontSize: 13 }}>{sizeDescription}</span>}
        </div>
        <ActionButton
          aria-expanded={isExpanded}
          aria-label={isExpanded ? 'Hide controls' : 'Show controls'}
          isQuiet
          onPress={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? <ChevronUp /> : <ChevronDown />}
        </ActionButton>
      </header>
      {isExpanded && (
        <div style={{ display: 'grid', gap: 24, gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
          <ControlGroup title="Data">
            {datasets.length > 0 && (
              <Picker
                label="Dataset"
                onSelectionChange={(key) => onDatasetChange(String(key))}
                selectedKey={dataset}
              >
                {datasets.map((option) => (
                  <PickerItem key={option.value} id={option.value}>
                    {option.label}
                  </PickerItem>
                ))}
              </Picker>
            )}
            {datasetDescription && <span style={{ fontSize: 13, minHeight: 36 }}>{datasetDescription}</span>}
          </ControlGroup>
          <ControlGroup title="Display">
            {viewModes.length > 0 && (
              <SegmentedControl
                aria-label="View mode"
                onSelectionChange={(key) => onViewModeChange(String(key))}
                selectedKey={viewMode}
              >
                {viewModes.map((mode) => (
                  <SegmentedControlItem key={mode.value} id={mode.value}>
                    {mode.label}
                  </SegmentedControlItem>
                ))}
              </SegmentedControl>
            )}
            <ToggleButtonGroup
              aria-label="Size presets"
              onSelectionChange={(keys) => {
                const preset = sizePresets.find(({ label }) => keys.has(label));
                if (preset) onSizeChange(getPresetSize(preset));
              }}
              selectedKeys={selectedPreset ? [selectedPreset] : []}
              selectionMode="single"
              size="S"
            >
              {sizePresets.map((preset) => (
                <ToggleButton
                  key={preset.label}
                  aria-label={`${preset.label} (${Math.round(getPresetSize(preset))}px container)`}
                  id={preset.label}
                >
                  {preset.label}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
            {animations !== undefined && (
              <Switch aria-label={`${chartType} animations`} isSelected={animations} onChange={onAnimationsChange}>
                Animations (hover and draw-in)
              </Switch>
            )}
          </ControlGroup>
          <ControlGroup title="Filter">
            {filters.length > 0 && (
              <SegmentedControl
                aria-label="Variant"
                onSelectionChange={(key) => onFilterChange(String(key))}
                selectedKey={filter}
              >
                {filters.map((option) => (
                  <SegmentedControlItem key={option.value} id={option.value}>
                    {option.label}
                  </SegmentedControlItem>
                ))}
              </SegmentedControl>
            )}
            {coverageSections.length > 0 && (
              <MenuTrigger>
                <ActionButton>
                  <FilterIcon />
                  <Text>Props{selectedProps.size > 0 ? ` (${selectedProps.size})` : ''}</Text>
                </ActionButton>
                <Menu
                  aria-label="Filter by prop"
                  disabledKeys={skippedProps}
                  onSelectionChange={(keys) => onSelectedPropsChange(new Set([...keys].map(String)))}
                  selectedKeys={selectedProps}
                  selectionMode="multiple"
                >
                  {coverageSections.map(({ component, entries }) => (
                    <MenuSection key={component}>
                      <Header>
                        <Heading>{component}</Heading>
                      </Header>
                      {entries.map(({ prop, entry }) => (
                        <MenuItem key={prop} id={`${component}.${prop}`} textValue={prop}>
                          <Text slot="label">{prop}</Text>
                          {'skip' in entry && <Text slot="description">{entry.skip}</Text>}
                        </MenuItem>
                      ))}
                    </MenuSection>
                  ))}
                </Menu>
              </MenuTrigger>
            )}
            {selectedProps.size > 0 && (
              <TagGroup aria-label="Active prop filters" onRemove={removeProps}>
                {[...selectedProps].map((key) => (
                  <Tag key={key} id={key}>
                    {key}
                  </Tag>
                ))}
              </TagGroup>
            )}
          </ControlGroup>
        </div>
      )}
    </Provider>
  );
};
