import { ChartTooltip } from '@components/ChartTooltip';
import {
	DEFAULT_OPACITY_RULE,
	FILTERED_TABLE,
	HIGHLIGHTED_GROUP,
	HIGHLIGHTED_ITEM,
	HIGHLIGHT_CONTRAST_RATIO,
	MARK_ID,
	SERIES_ID,
} from '@constants';
import { getFilteredTableData } from '@specBuilder/data/dataUtils';
import {
	AreaSpecProps,
	BarSpecProps,
	ChartTooltipElement,
	ChartTooltipProps,
	ChartTooltipSpecProps,
	DonutSpecProps,
	LineSpecProps,
	ScatterSpecProps,
} from 'types';
import { Data, FormulaTransform, NumericValueRef, Signal, SourceData } from 'vega';

type TooltipParentProps = AreaSpecProps | BarSpecProps | DonutSpecProps | LineSpecProps | ScatterSpecProps;

/**
 * gets all the tooltips
 * @param markProps
 * @returns
 */
export const getTooltips = (markProps: TooltipParentProps): ChartTooltipSpecProps[] => {
	const chartTooltipElements = markProps.children.filter(
		(child) => child.type === ChartTooltip
	) as ChartTooltipElement[];
	return chartTooltipElements.map((chartTooltip) => applyTooltipPropDefaults(chartTooltip.props, markProps.name));
};

/**
 * Applies all defaults to ChartTooltipProps
 * @param chartTooltipProps
 * @returns ChartTooltipSpecProps
 */
export const applyTooltipPropDefaults = (
	{ highlightBy = 'item', ...props }: ChartTooltipProps,
	markName: string
): ChartTooltipSpecProps => {
	return {
		highlightBy,
		markName,
		...props,
	};
};

/**
 * Sets all the data needed for tooltips
 *
 * NOTE: this function mutates the data object so it should only be called from a produce function
 * @param data
 * @param chartTooltipProps
 */
export const addTooltipData = (data: Data[], markProps: TooltipParentProps, addHighlightedData = true) => {
	const tooltips = getTooltips(markProps);
	for (const { highlightBy, markName } of tooltips) {
		if (highlightBy === 'item') return;
		const filteredTable = getFilteredTableData(data);
		if (!filteredTable.transform) {
			filteredTable.transform = [];
		}
		if (highlightBy === 'dimension' && markProps.markType !== 'donut') {
			filteredTable.transform.push(getGroupIdTransform([markProps.dimension], markName));
		} else if (highlightBy === 'series') {
			filteredTable.transform.push(getGroupIdTransform([SERIES_ID], markName));
		} else if (Array.isArray(highlightBy)) {
			filteredTable.transform.push(getGroupIdTransform(highlightBy, markName));
		}

		if (addHighlightedData) {
			data.push(getMarkHighlightedData(markName));
		}
	}
};

/**
 * Gets the group id transform
 * @param highlightBy
 * @param markName
 * @returns FormulaTransform
 */
export const getGroupIdTransform = (highlightBy: string[], markName: string): FormulaTransform => {
	return {
		type: 'formula',
		as: `${markName}_groupId`,
		expr: highlightBy.map((facet) => `datum.${facet}`).join(' + " | " + '),
	};
};

/**
 * Gets the highlighted data for a mark
 * @param markName
 * @returns
 */
const getMarkHighlightedData = (markName: string): SourceData => ({
	name: `${markName}_highlightedData`,
	source: FILTERED_TABLE,
	transform: [
		{
			type: 'filter',
			expr: `${HIGHLIGHTED_GROUP} === datum.${markName}_groupId`,
		},
	],
});

export const isHighlightedByGroup = (markProps: TooltipParentProps) => {
	const tooltips = getTooltips(markProps);
	return tooltips.some(({ highlightBy }) => highlightBy && highlightBy !== 'item');
};

/**
 * Tooltip highlights by item or dimension
 * @param markProps
 * @returns
 */
export const isHighlightedByDimension = (markProps: TooltipParentProps) => {
	const tooltips = getTooltips(markProps);
	return tooltips.some(
		({ highlightBy }) => typeof highlightBy === 'string' && ['dimension', 'item'].includes(highlightBy)
	);
};

/**
 * adds the appropriate signals for tooltips
 *
 * NOTE: this function mutates the signals array so it should only be called from a produce function
 * @param signals
 * @param markProps
 */
export const addTooltipSignals = (signals: Signal[], markProps: TooltipParentProps) => {
	if (isHighlightedByGroup(markProps)) {
		const highlightedGroupSignal = signals.find((signal) => signal.name === HIGHLIGHTED_GROUP) as Signal;
		if (highlightedGroupSignal.on === undefined) {
			highlightedGroupSignal.on = [];
		}

		let markName = markProps.name;
		let update = `datum.${markName}_groupId`;
		if (['scatter', 'line'].includes(markProps.markType)) {
			update = `datum.${update}`;
			markName += '_voronoi';
		}
		highlightedGroupSignal.on.push(
			...[
				{
					events: `@${markName}:mouseover`,
					update,
				},
				{ events: `@${markName}:mouseout`, update: 'null' },
			]
		);
	}
};

/**
 * adds the appropriate opacity rules to the beginning of the opacityRules array
 *
 * NOTE: this function mutates the opacityRules array so it should only be called from a produce function
 * @param opacityRules
 * @param markProps
 */
export const addTooltipMarkOpacityRules = (
	opacityRules: ({ test?: string } & NumericValueRef)[],
	markProps: TooltipParentProps
) => {
	opacityRules.unshift({
		test: `${HIGHLIGHTED_ITEM} && ${HIGHLIGHTED_ITEM} !== datum.${MARK_ID}`,
		value: 1 / HIGHLIGHT_CONTRAST_RATIO,
	});
	if (isHighlightedByGroup(markProps)) {
		const { name: markName } = markProps;
		opacityRules.unshift({
			test: `${HIGHLIGHTED_GROUP} === datum.${markName}_groupId`,
			...DEFAULT_OPACITY_RULE,
		});
	}
};
