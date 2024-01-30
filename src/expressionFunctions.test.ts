import { expressionFunctions } from './expressionFunctions';

describe('truncateText()', () => {
	const longText =
		'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec a diam lectus. Sed sit amet ipsum mauris. Maecenas congue ligula ac quam viverra nec consectetur ante hendrerit.';
	const shortText = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.';
	test('should truncate text that is too long', () => {
		expect(expressionFunctions.truncateText(longText, 24)).toBe('Lorem ipsum dolor s…');
		expect(expressionFunctions.truncateText(longText, 100)).toBe(
			'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec a diam lectus. Sed sit amet ipsu…'
		);
	});
	test('should not truncate text that is shorter than maxLength', () => {
		expect(expressionFunctions.truncateText(shortText, 100)).toBe(shortText);
	});
});
