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
import { BACKGROUND_COLOR, CHART_SIZE_FONT_SIZE, DIRECT_LABEL_BACKGROUND_STROKE_WIDTH, DIRECT_LABEL_FONT_WEIGHT, LINE_POINT_ANNOTATION_OFFSET } from '@spectrum-charts/constants';
import { getS2ColorValue } from '@spectrum-charts/themes';

import { defaultLineOptions } from '../lineTestUtils';
import {
	getLinePointAnnotationMarks,
	getLinePointAnnotationSpecOptions,
} from './linePointAnnotationUtils';

const lineOptionsWithAnnotations = {
	...defaultLineOptions,
	linePointAnnotations: [{}],
	staticPoint: 'staticPoint',
};

describe('getLinePointAnnotationSpecOptions', () => {
	test('applies default anchor when not provided', () => {
		const result = getLinePointAnnotationSpecOptions({}, 0, defaultLineOptions);
		expect(result.anchor).toEqual(['right', 'top', 'bottom', 'left']);
	});

	test('preserves provided anchor string', () => {
		const result = getLinePointAnnotationSpecOptions({ anchor: 'left' }, 0, defaultLineOptions);
		expect(result.anchor).toBe('left');
	});

	test('preserves provided anchor array', () => {
		const result = getLinePointAnnotationSpecOptions({ anchor: ['top', 'bottom'] }, 0, defaultLineOptions);
		expect(result.anchor).toEqual(['top', 'bottom']);
	});

	test('defaults matchLineColor to false', () => {
		const result = getLinePointAnnotationSpecOptions({}, 0, defaultLineOptions);
		expect(result.matchLineColor).toBe(false);
	});

	test('preserves matchLineColor=true', () => {
		const result = getLinePointAnnotationSpecOptions({ matchLineColor: true }, 0, defaultLineOptions);
		expect(result.matchLineColor).toBe(true);
	});

	test('falls back to lineOptions.metric when textKey not provided', () => {
		const result = getLinePointAnnotationSpecOptions({}, 0, defaultLineOptions);
		expect(result.textKey).toBe(defaultLineOptions.metric);
	});

	test('uses provided textKey over lineOptions.metric', () => {
		const result = getLinePointAnnotationSpecOptions({ textKey: 'label' }, 0, defaultLineOptions);
		expect(result.textKey).toBe('label');
	});

	test('sets name from lineName and index', () => {
		const result = getLinePointAnnotationSpecOptions({}, 2, defaultLineOptions);
		expect(result.name).toBe('line0Annotation2');
	});

	test('sets correct index', () => {
		const result = getLinePointAnnotationSpecOptions({}, 3, defaultLineOptions);
		expect(result.index).toBe(3);
	});

	test('attaches lineOptions reference', () => {
		const result = getLinePointAnnotationSpecOptions({}, 0, defaultLineOptions);
		expect(result.lineOptions).toBe(defaultLineOptions);
	});
});

describe('getLinePointAnnotationMarks', () => {
	test('returns empty array when linePointAnnotations is empty', () => {
		const marks = getLinePointAnnotationMarks(defaultLineOptions);
		expect(marks).toHaveLength(0);
	});

	test('returns two marks per annotation (background halo + foreground text)', () => {
		const marks = getLinePointAnnotationMarks(lineOptionsWithAnnotations);
		expect(marks).toHaveLength(2);
	});

	test('returns four marks for two annotations', () => {
		const marks = getLinePointAnnotationMarks({
			...defaultLineOptions,
			linePointAnnotations: [{}, {}],
		});
		expect(marks).toHaveLength(4);
	});

	describe('background mark', () => {
		const getBackgroundMark = () => getLinePointAnnotationMarks(lineOptionsWithAnnotations)[0];

		test('has correct name with _bg suffix', () => {
			expect(getBackgroundMark().name).toBe('line0Annotation0_bg');
		});

		test('is a text mark', () => {
			expect(getBackgroundMark().type).toBe('text');
		});

		test('is non-interactive', () => {
			expect(getBackgroundMark().interactive).toBe(false);
		});

		test('reads from static points mark', () => {
			expect(getBackgroundMark().from).toEqual({ data: 'line0_staticPoints' });
		});

		test('encodes text from datum.datum.textKey', () => {
			const marks = getLinePointAnnotationMarks({ ...lineOptionsWithAnnotations, linePointAnnotations: [{ textKey: 'label' }] });
			expect(marks[0].encode?.enter).toHaveProperty('text', { signal: 'datum.datum.label' });
		});

		test('falls back to metric as textKey', () => {
			expect(getBackgroundMark().encode?.enter).toHaveProperty('text', { signal: `datum.datum.${defaultLineOptions.metric}` });
		});

		test('has transparent fill for halo-only rendering', () => {
			expect(getBackgroundMark().encode?.enter).toHaveProperty('fill', { value: 'transparent' });
		});

		test('uses background color signal for stroke', () => {
			expect(getBackgroundMark().encode?.enter).toHaveProperty('stroke', { signal: BACKGROUND_COLOR });
		});

		test('uses correct halo stroke width', () => {
			expect(getBackgroundMark().encode?.enter).toHaveProperty('strokeWidth', { value: DIRECT_LABEL_BACKGROUND_STROKE_WIDTH });
		});

		test('applies font weight in update encoding', () => {
			expect(getBackgroundMark().encode?.update).toHaveProperty('fontWeight', { value: DIRECT_LABEL_FONT_WEIGHT });
		});

		test('uses chart size font size signal', () => {
			expect(getBackgroundMark().encode?.enter).toHaveProperty('fontSize', { signal: CHART_SIZE_FONT_SIZE });
		});

		test('has label transform', () => {
			const transform = getBackgroundMark().transform;
			expect(transform).toHaveLength(1);
			expect(transform?.[0]).toHaveProperty('type', 'label');
		});

		test('label transform uses chart size signal', () => {
			const transform = getBackgroundMark().transform?.[0] as { size: unknown };
			expect(transform.size).toEqual({ signal: '[width, height]' });
		});

		test('label transform wraps single anchor string in array', () => {
			const marks = getLinePointAnnotationMarks({ ...lineOptionsWithAnnotations, linePointAnnotations: [{ anchor: 'left' }] });
			const transform = marks[0].transform?.[0] as { anchor: unknown };
			expect(transform.anchor).toEqual(['left']);
		});

		test('label transform passes anchor array through unchanged', () => {
			const marks = getLinePointAnnotationMarks({ ...lineOptionsWithAnnotations, linePointAnnotations: [{ anchor: ['top', 'right'] }] });
			const transform = marks[0].transform?.[0] as { anchor: unknown };
			expect(transform.anchor).toEqual(['top', 'right']);
		});

		test('label transform uses default anchor when none provided', () => {
			const transform = getBackgroundMark().transform?.[0] as { anchor: unknown };
			expect(transform.anchor).toEqual(['right', 'top', 'bottom', 'left']);
		});

		test('label transform uses LINE_POINT_ANNOTATION_OFFSET to prevent background halo touching point fill', () => {
			const transform = getBackgroundMark().transform?.[0] as { offset: unknown };
			expect(transform.offset).toEqual([LINE_POINT_ANNOTATION_OFFSET]);
		});
	});

	describe('foreground mark', () => {
		const getForegroundMark = () => getLinePointAnnotationMarks(lineOptionsWithAnnotations)[1];

		test('has correct name without suffix', () => {
			expect(getForegroundMark().name).toBe('line0Annotation0');
		});

		test('is a text mark', () => {
			expect(getForegroundMark().type).toBe('text');
		});

		test('is non-interactive', () => {
			expect(getForegroundMark().interactive).toBe(false);
		});

		test('reads from background mark to inherit label transform positions', () => {
			expect(getForegroundMark().from).toEqual({ data: 'line0Annotation0_bg' });
		});

		test('fill defaults to black (gray-900) when matchLineColor is false', () => {
			expect(getForegroundMark().encode?.enter).toHaveProperty('fill', {
				value: getS2ColorValue('gray-900', defaultLineOptions.colorScheme),
			});
		});

		test('fill uses series color from static point fill when matchLineColor is true', () => {
			const marks = getLinePointAnnotationMarks({
				...lineOptionsWithAnnotations,
				linePointAnnotations: [{ matchLineColor: true }],
			});
			expect(marks[1].encode?.enter).toHaveProperty('fill', { field: 'datum.fill' });
		});

		test('has no label transform', () => {
			expect(getForegroundMark().transform).toBeUndefined();
		});

		test('update encodes text from background mark datum', () => {
			expect(getForegroundMark().encode?.update).toHaveProperty('text', { field: 'text' });
		});

		test('update encodes x position from label transform output', () => {
			expect(getForegroundMark().encode?.update).toHaveProperty('x', { field: 'x' });
		});

		test('update encodes y position from label transform output', () => {
			expect(getForegroundMark().encode?.update).toHaveProperty('y', { field: 'y' });
		});

		test('update encodes align from label transform output', () => {
			expect(getForegroundMark().encode?.update).toHaveProperty('align', { field: 'align' });
		});

		test('update encodes baseline from label transform output', () => {
			expect(getForegroundMark().encode?.update).toHaveProperty('baseline', { field: 'baseline' });
		});

		test('update encodes opacity from label transform output (0 when label cannot be placed)', () => {
			expect(getForegroundMark().encode?.update).toHaveProperty('opacity', { field: 'opacity' });
		});

		test('applies font weight in update encoding', () => {
			expect(getForegroundMark().encode?.update).toHaveProperty('fontWeight', { value: DIRECT_LABEL_FONT_WEIGHT });
		});

		test('uses chart size font size signal', () => {
			expect(getForegroundMark().encode?.enter).toHaveProperty('fontSize', { signal: CHART_SIZE_FONT_SIZE });
		});
	});

	describe('background and foreground alignment', () => {
		// The foreground mark renders the visible text; the background mark renders the halo and
		// runs the label transform that positions both. If their fontSize or fontWeight ever drift
		// apart, the halo stops matching the glyph size and visibly misaligns from the text.
		test('background and foreground share the same fontSize', () => {
			const [backgroundMark, foregroundMark] = getLinePointAnnotationMarks(lineOptionsWithAnnotations);
			expect(backgroundMark.encode?.enter?.fontSize).toEqual(foregroundMark.encode?.enter?.fontSize);
		});

		test('background and foreground share the same fontWeight', () => {
			const [backgroundMark, foregroundMark] = getLinePointAnnotationMarks(lineOptionsWithAnnotations);
			expect(backgroundMark.encode?.update?.fontWeight).toEqual(foregroundMark.encode?.update?.fontWeight);
		});
	});

	describe('multiple annotations', () => {
		test('second annotation background reads from the same static points mark', () => {
			const marks = getLinePointAnnotationMarks({
				...defaultLineOptions,
				linePointAnnotations: [{}, {}],
			});
			expect(marks[2].from).toEqual({ data: 'line0_staticPoints' });
		});

		test('second annotation foreground reads from its own background mark', () => {
			const marks = getLinePointAnnotationMarks({
				...defaultLineOptions,
				linePointAnnotations: [{}, {}],
			});
			expect(marks[3].from).toEqual({ data: 'line0Annotation1_bg' });
		});

		test('each annotation has unique names via index', () => {
			const marks = getLinePointAnnotationMarks({
				...defaultLineOptions,
				linePointAnnotations: [{}, {}],
			});
			expect(marks[0].name).toBe('line0Annotation0_bg');
			expect(marks[1].name).toBe('line0Annotation0');
			expect(marks[2].name).toBe('line0Annotation1_bg');
			expect(marks[3].name).toBe('line0Annotation1');
		});
	});
});
