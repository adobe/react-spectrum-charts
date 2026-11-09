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
import type { CSSProperties } from 'react';

type BadgeVariant = 'neutral' | 'informative' | 'positive';

// Story tags that mark a component's stage. Mirrored in packages/docs-s2/src/stages.json; keep them in sync.
// Variants follow React Spectrum's VersionBadge; stable has no badge. Colors are the S2 Badge bold fill,
// for manager UI that can't render S2.
type BadgeStage = { label: string; variant: BadgeVariant; light: string; dark: string };
export const STAGES: Record<string, BadgeStage | { label: string; variant: null }> = {
  lab: { label: 'Lab', variant: 'neutral', light: 'rgb(80, 80, 80)', dark: 'rgb(109, 109, 109)' },
  alpha: { label: 'Alpha', variant: 'informative', light: 'rgb(59, 99, 251)', dark: 'rgb(64, 105, 253)' },
  beta: { label: 'Beta', variant: 'informative', light: 'rgb(59, 99, 251)', dark: 'rgb(64, 105, 253)' },
  rc: { label: 'RC', variant: 'positive', light: 'rgb(5, 131, 78)', dark: 'rgb(6, 136, 80)' },
  stable: { label: 'Stable', variant: null },
};

const isBadgeStage = (stage: string | undefined): stage is string => Boolean(stage && STAGES[stage]?.variant);

/**
 * Gets the badge-bearing stage from a story's tags.
 * @param tags
 * @returns stage key, or undefined if the tags have no badged stage
 */
export const getStageFromTags = (tags: string[] | undefined): string | undefined => tags?.find(isBadgeStage);

/**
 * Gets inline styles that match an S2 size S bold Badge, or a smaller version for the sidebar.
 * @param stage
 * @param isDark
 * @param compact
 * @returns style object
 */
export const getStageBadgeStyle = (stage: string, isDark: boolean, compact = false): CSSProperties => {
  const { light, dark } = STAGES[stage] as BadgeStage;
  return {
    display: 'inline-flex',
    alignItems: 'center',
    height: compact ? 16 : 24,
    padding: compact ? '0 6px' : '0 9px',
    borderRadius: compact ? 5 : 7,
    background: isDark ? dark : light,
    color: '#fff',
    fontSize: compact ? 10 : 12,
    lineHeight: compact ? '12px' : '16px',
    whiteSpace: 'nowrap',
  };
};
