import type { StorybookConfig } from '@storybook/react-webpack5';

const config: StorybookConfig = {
  stories: [
    '../packages/react-spectrum-charts-s2/src/**/*.story.mdx',
    '../packages/react-spectrum-charts-s2/src/**/*.story.@(js|jsx|ts|tsx)',
  ],

  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
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
    // Webpack's persistent filesystem cache defaults to treating everything under node_modules as
    // immutable (snapshot.managedPaths), keyed off package version. The @spectrum-charts/* workspace
    // packages are symlinked into node_modules, so `yarn build:s2` rewrites their dist without bumping
    // the version — webpack then serves a stale cached module across restarts. Drop managedPaths so
    // the workspace dist is content-hashed and rebuilds are always picked up.
    config.snapshot = { ...config.snapshot, managedPaths: [] };
    return config;
  },

  docs: {},

  typescript: {
    reactDocgen: 'react-docgen-typescript',
  },
};

module.exports = config;

