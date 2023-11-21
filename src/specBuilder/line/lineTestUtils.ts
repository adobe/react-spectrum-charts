import { DEFAULT_COLOR, DEFAULT_COLOR_SCHEME, DEFAULT_CONTINUOUS_DIMENSION, DEFAULT_METRIC } from '@constants';

import { LineMarkProps } from './lineUtils';

export const defaultLineMarkProps: LineMarkProps = {
	children: [],
	color: DEFAULT_COLOR,
	colorScheme: DEFAULT_COLOR_SCHEME,
	dimension: DEFAULT_CONTINUOUS_DIMENSION,
	lineType: { value: 'solid' },
	lineWidth: { value: 1 },
	name: 'line0',
	opacity: { value: 1 },
	metric: DEFAULT_METRIC,
	scaleType: 'time',
};
