import { fileURLToPath } from 'node:url';

import type { StorybookConfig } from '@storybook/react-webpack5';

const config: StorybookConfig = {
  stories: [
    '../packages/react-spectrum-charts-s2/src/**/*.story.@(js|jsx|ts|tsx)',
  ],

  addons: [
    '@storybook/addon-links',
    '@storybook/addon-docs',
    'storybook-dark-mode',
    '@storybook/addon-webpack5-compiler-babel',
  ],

  framework: {
    name: '@storybook/react-webpack5',
    options: {},
  },

  staticDirs: [
    { from: '../.storybook/public', to: '/' }
  ],

  webpackFinal(config) {
    config.resolve ??= {};
    config.resolve.alias = {
      ...config.resolve.alias,
      '@spectrum-charts/core-s2': fileURLToPath(new URL('../packages/core-s2/src', import.meta.url)),
    };
    return config;
  },

  docs: {},

  typescript: {
    reactDocgen: 'react-docgen-typescript',
  },
};

export default config;

