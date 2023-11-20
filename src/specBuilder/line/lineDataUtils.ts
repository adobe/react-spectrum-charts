import { MARK_ID } from '@constants';
import { SourceData } from 'vega';

/**
 * gets the data used for highlighting hovered data points
 * @param name
 * @param source
 * @returns
 */
export const getLineHighlightedData = (name: string, source: string, hasPopover: boolean): SourceData => {
	const selectSignal = `${name}_selectedId`;
	const hoverSignal = `${name}_hoveredId`;
	const expr = hasPopover
		? `${selectSignal} && ${selectSignal} === datum.${MARK_ID} || !${selectSignal} && ${hoverSignal} && ${hoverSignal} === datum.${MARK_ID}`
		: `${hoverSignal} && ${hoverSignal} === datum.${MARK_ID}`;
	return {
		name: `${name}_highlightedData`,
		source,
		transform: [
			{
				type: 'filter',
				expr,
			},
		],
	};
};

/**
 * gets the data used for displaying points
 * @param name
 * @param source
 * @returns
 */
export const getLineStaticPointData = (name: string, staticPoint: string, source: string): SourceData => {
	return {
		name: `${name}_staticPointData`,
		source,
		transform: [
			{
				type: 'filter',
				expr: `datum.${staticPoint} === true`,
			},
		],
	};
};
