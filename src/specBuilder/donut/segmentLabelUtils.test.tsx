import { SegmentLabel } from '@rsc/alpha';

import { DonutSpecProps, SegmentLabelSpecProps } from '../../types';
import { defaultDonutProps } from './donutTestUtils';
import {
	getSegmentLabelMarks,
	getSegmentLabelTextMark,
	getSegmentLabelValueText,
	getSegmentLabelValueTextMark,
} from './segmentLabelUtils';

const defaultDonutPropsWithSegmentLabel: DonutSpecProps = {
	...defaultDonutProps,
	children: [<SegmentLabel key={0} />],
};

const defaultSegmentLabelProps: SegmentLabelSpecProps = {
	donutProps: defaultDonutPropsWithSegmentLabel,
	percent: false,
	value: false,
	valueFormat: 'standardNumber',
};

describe('getSegmentLabelMarks()', () => {
	test('should return empty array if isBoolean', () => {
		const marks = getSegmentLabelMarks({
			...defaultDonutPropsWithSegmentLabel,
			isBoolean: true,
		});
		expect(marks).toEqual([]);
	});
	test('should return emptry array if there is not SegmentLabel on the Donut', () => {
		const marks = getSegmentLabelMarks({
			...defaultDonutProps,
		});
		expect(marks).toEqual([]);
	});
	test('should return segment label marks', () => {
		const marks = getSegmentLabelMarks({
			...defaultDonutPropsWithSegmentLabel,
		});
		expect(marks).toHaveLength(1);
		expect(marks[0].type).toEqual('group');
		expect(marks[0].marks).toHaveLength(1);
		expect(marks[0].marks?.[0].type).toEqual('text');
	});
});

describe('getSegmentLabelValueTextMark()', () => {
	test('should return empty array if value and percent are false', () => {
		expect(getSegmentLabelValueTextMark(defaultSegmentLabelProps)).toEqual([]);
	});
	test('should return a text mark if value is true', () => {
		const marks = getSegmentLabelValueTextMark({ ...defaultSegmentLabelProps, value: true });
		expect(marks).toHaveLength(1);
		expect(marks[0].type).toEqual('text');
	});
	test('should return a text mark if percent is true', () => {
		const marks = getSegmentLabelValueTextMark({ ...defaultSegmentLabelProps, percent: true });
		expect(marks).toHaveLength(1);
		expect(marks[0].type).toEqual('text');
	});
	test('should return two text marks if value and percent are true', () => {
		const marks = getSegmentLabelValueTextMark({ ...defaultSegmentLabelProps, value: true, percent: true });
		expect(marks).toHaveLength(1);
		expect(marks[0].type).toEqual('text');
	});
});

describe('getSegmentLabelValueText()', () => {
	test('should return undefined if value and percent are false', () => {
		expect(getSegmentLabelValueText(defaultSegmentLabelProps)).toBeUndefined();
	});
	test('should return a simple percentSignal if percent is true and value is false', () => {
		expect(getSegmentLabelValueText({ ...defaultSegmentLabelProps, percent: true })).toHaveProperty(
			'signal',
			`format(datum['testName_arcPercent'], '.0%')`
		);
	});
	test('should return an array of rules if value is true', () => {
		const rules = getSegmentLabelValueText({ ...defaultSegmentLabelProps, value: true });
		expect(rules).toHaveLength(1);
		expect(rules?.[0]).toHaveProperty('signal', "format(datum['testMetric'], ',')");
	});
	test('should have percentSignal combined with value signal if value and percent are true', () => {
		const rules = getSegmentLabelValueText({ ...defaultSegmentLabelProps, value: true, percent: true });
		expect(rules).toHaveLength(1);
		expect(rules?.[0].signal).toContain('_arcPercent');
		expect(rules?.[0].signal).toContain('testMetric');
	});
});

describe('getSegmentLabelTextMark()', () => {
	test('should define dy if value or percent are true', () => {
		const mark = getSegmentLabelTextMark({ ...defaultSegmentLabelProps, value: true });
		expect(mark.encode?.enter).toHaveProperty('dy');
	});
	test('should not define dy if value and percent are false', () => {
		const mark = getSegmentLabelTextMark(defaultSegmentLabelProps);
		expect(mark.encode?.enter?.dy).toBeUndefined();
	});
});
