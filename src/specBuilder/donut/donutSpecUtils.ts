import { NumericValueRef, ProductionRule } from 'vega';

export const getFontSize = (
	radius: string,
	holeRatio: number,
	isPrimaryText: boolean
): ProductionRule<NumericValueRef> => {
	return [
		{ test: `${radius} * ${holeRatio} > 72`, value: isPrimaryText ? 72 : 24 },
		{ test: `${radius} * ${holeRatio} > 60`, value: isPrimaryText ? 60 : 18 },
		{ test: `${radius} * ${holeRatio} > 48`, value: isPrimaryText ? 48 : 12 },
		{ test: `${radius} * ${holeRatio} > 36`, value: isPrimaryText ? 36 : 0 },
		{ value: 0 },
	];
};
