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
import React from 'react';

import BrowserOnly from '@docusaurus/BrowserOnly';
import { useDoc } from '@docusaurus/plugin-content-docs/client';
import { useColorMode } from '@docusaurus/theme-common';
import useBaseUrl from '@docusaurus/useBaseUrl';

import { Badge, BadgeProps, Provider } from '@react-spectrum/s2';

import STAGES from '../stages.json';
import styles from './StageBadge.module.css';

// Mirrors the Storybook stage badge in .storybook-s2/stages.ts; keep them in sync.
export type Stage = keyof typeof STAGES;

/**
 * Checks whether a value is a known stage.
 * @param value
 * @returns true if the value is a stage key
 */
export const isStage = (value: unknown): value is Stage => typeof value === 'string' && value in STAGES;

/**
 * Gets the display label for a stage.
 * @param stage
 * @returns label
 */
export const getStageLabel = (stage: Stage): string => STAGES[stage].label;

/**
 * Checks whether a stage shows a badge; stable components have none, matching React Spectrum's VersionBadge.
 * @param stage
 * @returns true if the stage has a badge variant
 */
export const hasStageBadge = (stage: Stage): boolean => STAGES[stage].variant !== null;

/**
 * Color-coded S2 badge for a component stage; must be inside an S2 Provider.
 * @param stage
 * @returns Badge element, or null for stages without a badge
 */
export const StageLabelBadge = ({ stage }: { stage: Stage }) => {
  const { variant, label } = STAGES[stage];
  if (variant === null) return null;
  return (
    <Badge size="S" variant={variant as BadgeProps['variant']}>
      {label}
    </Badge>
  );
};


const ThemedBadge = ({ stage }: { stage: Stage }) => {
  const { colorMode } = useColorMode();
  return (
    <Provider colorScheme={colorMode} elementType="span" UNSAFE_className={styles.provider}>
      <StageLabelBadge stage={stage} />
    </Provider>
  );
};

/**
 * Renders the current page's stage badge from its `stage` frontmatter.
 * @returns badge linking to the stages page, or null if the page has no stage
 */
export const StageBadge = () => {
  const { frontMatter } = useDoc();
  const stagesUrl = useBaseUrl('docs/guides/stages-and-lab');
  const stage = (frontMatter as { stage?: unknown }).stage;
  if (!isStage(stage) || !hasStageBadge(stage)) return null;
  return (
    <a href={stagesUrl} aria-label={`${getStageLabel(stage)} stage`} className={styles.link}>
      <BrowserOnly fallback={<span className={styles.fallback} />}>{() => <ThemedBadge stage={stage} />}</BrowserOnly>
    </a>
  );
};
