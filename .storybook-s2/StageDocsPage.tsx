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

import { Controls, Description, Primary, Stories, Subtitle, Title, useOf } from '@storybook/addon-docs/blocks';

import { STAGE_BADGE_STYLE, getStageLabel } from './stages';

const StageBadge = () => {
  const { preparedMeta } = useOf('meta');
  const label = getStageLabel(preparedMeta.tags);
  if (!label) return null;
  return (
    <div style={{ marginBottom: 16 }}>
      <span style={{ ...STAGE_BADGE_STYLE, fontSize: 12, lineHeight: '18px', padding: '0 7px' }} title={`${label} component`}>
        {label}
      </span>
    </div>
  );
};

/**
 * Default autodocs page with the component's stage badge under the title.
 */
export const StageDocsPage = () => (
  <>
    <Title />
    <StageBadge />
    <Subtitle />
    <Description />
    <Primary />
    <Controls />
    <Stories />
  </>
);
