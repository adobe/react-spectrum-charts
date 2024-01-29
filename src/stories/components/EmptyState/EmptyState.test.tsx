import { render } from '@testing-library/react';

import { Basic } from './EmptyState.story';

describe('EmptyState', () => {
	test('Empty state renders text', () => {
		const { getByText } = render(<Basic {...Basic.args} />);
		expect(getByText('No data found')).toBeInTheDocument();
	});
});
