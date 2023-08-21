// import TsconfigPathsPlugin from 'tsconfig-paths-webpack-plugin';
import { updateStorybookConfig } from '@exc/spa-pipeline-tools/lib/storybook';
import type { StorybookConfig } from '@storybook/core-common';
import TsconfigPathsPlugin from 'tsconfig-paths-webpack-plugin';
import merge from 'webpack-merge';

const config: StorybookConfig = {
	stories: ['../src/**/*.story.mdx', '../src/**/*.story.@(js|jsx|ts|tsx)'],
	addons: [
		'@storybook/addon-links',
		'@storybook/addon-essentials',
		'@storybook/addon-interactions',
		'@storybook/addon-a11y',
		'storybook-addon-react-docgen',
		'storybook-dark-mode',
	],
	framework: '@storybook/react',
	webpackFinal(config) {
		if (config?.resolve?.plugins) {
			config.resolve = {
				...config.resolve,
				plugins: [new TsconfigPathsPlugin()],
			};
		}
		return merge(config, {});
	},
};

module.exports = updateStorybookConfig(config);
