import type { StorybookConfig } from '@storybook/react-webpack5';
import path from 'path';
import TsconfigPathsPlugin from 'tsconfig-paths-webpack-plugin';

const config: StorybookConfig = {
	stories: [
		'../packages/react-spectrum-charts/src/**/*.story.mdx',
		'../packages/react-spectrum-charts/src/**/*.story.@(js|jsx|ts|tsx)',
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

	webpackFinal(config) {
		if (config.resolve) {
			config.resolve.alias = {
				...config.resolve.alias,
				'@constants': path.resolve(__dirname, '../packages/react-spectrum-charts/src/constants.ts'),
				'@components': path.resolve(__dirname, '../packages/react-spectrum-charts/src/components/'),
				'@hooks': path.resolve(__dirname, '../packages/react-spectrum-charts/src/hooks/'),
				'@locales': path.resolve(__dirname, '../packages/react-spectrum-charts/src/locales/'),
				'@matchMediaMock': path.resolve(
					__dirname,
					'../packages/react-spectrum-charts/src/test-utils/__mocks__/matchMedia.mock.js'
				),
				'@rsc': path.resolve(__dirname, '../packages/react-spectrum-charts/src/'),
				'@rsc/alpha': path.resolve(__dirname, '../packages/react-spectrum-charts/src/alpha/'),
				'@rsc/beta': path.resolve(__dirname, '../packages/react-spectrum-charts/src/beta/'),
				'@rsc/rc': path.resolve(__dirname, '../packages/react-spectrum-charts/src/rc/'),
				'@specBuilder': path.resolve(__dirname, '../packages/react-spectrum-charts/src/specBuilder/'),
				'@stories': path.resolve(__dirname, '../packages/react-spectrum-charts/src/stories/'),
				'@svgPaths': path.resolve(__dirname, '../packages/react-spectrum-charts/src/svgPaths.ts'),
				'@test-utils': path.resolve(__dirname, '../packages/react-spectrum-charts/src/test-utils/'),
				'@themes': path.resolve(__dirname, '../packages/react-spectrum-charts/src/themes/'),
				'@utils': path.resolve(__dirname, '../packages/react-spectrum-charts/src/utils/'),
			};
			console.log('config.resolve', config.resolve.alias);
		}
		return config;
	},

	docs: {},

	typescript: {
		reactDocgen: 'react-docgen-typescript',
	},
};

module.exports = config;
