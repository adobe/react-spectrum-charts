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
import { ChartEngineContext } from '../packages/react-spectrum-charts-s2/src/context/ChartEngineContext.ts';

const LINE_TITLE_PREFIX = 'React Spectrum Charts 2/Line/';

/** Renders Line stories with the engine picked in the toolbar; charts with an explicit `engine` prop keep it. */
const engineDecorator: Decorator = (Story, context) => {
  if (!context.title.startsWith(LINE_TITLE_PREFIX)) {
    return <Story />;
  }
  return (
    <ChartEngineContext.Provider value={context.globals.engine === 'd3' ? 'd3' : 'vega'}>
      <Story />
    </ChartEngineContext.Provider>
  );
};

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

type RegressionParameter = { description: string; pr?: number };

const regressionDecorator: Decorator = (Story, context) => {
  const regression = context.parameters.regression as RegressionParameter | undefined;
  if (!regression) {
    return <Story />;
  }

  return (
    <div>
      <div
        data-testid="regression-note"
        style={{ fontFamily: 'adobe-clean, sans-serif', fontSize: 14, marginBottom: 16, maxWidth: 760 }}
      >
        <strong>Regression:</strong> {regression.description}{' '}
        {regression.pr !== undefined && (
          <a
            href={`https://github.com/adobe/react-spectrum-charts/pull/${regression.pr}`}
            target="_blank"
            rel="noreferrer"
          >
            Fixed in #{regression.pr}
          </a>
        )}
      </div>
      <Story />
    </div>
  );
};

const preview: Preview = {
  ...basePreview,
  decorators: [...(basePreview.decorators ?? []), accessibleNavigationDecorator, regressionDecorator, engineDecorator],
  globalTypes: {
    ...(basePreview.globalTypes ?? {}),
    engine: {
      description: 'Rendering engine for Line stories.',
      defaultValue: 'vega',
      toolbar: {
        title: 'Engine',
        icon: 'transfer',
        items: [
          { value: 'vega', title: 'Vega' },
          { value: 'd3', title: 'D3' },
        ],
        dynamicTitle: true,
      },
    },
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
