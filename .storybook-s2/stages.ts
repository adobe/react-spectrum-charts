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

// Story tags that mark a component's stage, mapped to the badge label.
export const STAGE_LABELS: Record<string, string> = {
  lab: 'Lab',
  alpha: 'Alpha',
  beta: 'Beta',
  rc: 'RC',
};

export const STAGE_BADGE_STYLE: CSSProperties = {
  display: 'inline-block',
  padding: '0 5px',
  border: '1px solid currentColor',
  borderRadius: 8,
  fontSize: 10,
  fontWeight: 700,
  lineHeight: '14px',
  opacity: 0.7,
  textTransform: 'uppercase',
  whiteSpace: 'nowrap',
};

/**
 * Gets the stage label from a story's tags.
 * @param tags
 * @returns stage label, or undefined if the tags have no stage
 */
export const getStageLabel = (tags: string[] | undefined): string | undefined => {
  const stage = Object.keys(STAGE_LABELS).find((tag) => tags?.includes(tag));
  return stage ? STAGE_LABELS[stage] : undefined;
};
