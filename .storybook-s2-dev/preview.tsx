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
import type { Decorator, Preview } from '@storybook/react';

import basePreview from '../.storybook-s2/preview.tsx';

const accessibleNavigationDecorator: Decorator = (Story, context) => {
  if (context.globals.accessibleNavigationControls !== 'on') {
    return <Story />;
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <button type="button">Previous focus target</button>
        <button type="button">Next focus target</button>
      </div>
      <Story />
    </div>
  );
};

const preview: Preview = {
  ...basePreview,
  decorators: [...(basePreview.decorators ?? []), accessibleNavigationDecorator],
  globalTypes: {
    ...(basePreview.globalTypes ?? {}),
    accessibleNavigationControls: {
      description: 'Adds reusable before/after focus targets for accessible-navigation testing.',
      defaultValue: 'off',
      toolbar: {
        icon: 'accessibility',
        items: [
          { value: 'off', title: 'Navigation controls off' },
          { value: 'on', title: 'Navigation controls on' },
        ],
        showName: true,
      },
    },
  },
};

export default preview;
