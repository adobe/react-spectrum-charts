import type { StorybookConfig } from '@storybook/core-common';
import TsconfigPathsPlugin from 'tsconfig-paths-webpack-plugin';

const config: StorybookConfig = {
	stories: ['../src/**/*.story.mdx', '../src/**/*.story.@(js|jsx|ts|tsx)'],
	core: {
		builder: 'webpack5',
	},
	addons: [
		'@storybook/addon-actions',
		'@storybook/addon-links',
		'@storybook/addon-essentials',
		'@storybook/addon-interactions',
		'@storybook/addon-a11y',
		'storybook-addon-react-docgen',
		'storybook-dark-mode',
	],
	framework: '@storybook/react',
	webpackFinal(config) {
		if (config?.resolve?.plugins == undefined) {
			config.resolve.plugins = [new TsconfigPathsPlugin()];
		} else {
			config.resolve.plugins.push(new TsconfigPathsPlugin());
		}
		return config;
	},
	features: {
		postcss: false,
	},
};

module.exports = config;
