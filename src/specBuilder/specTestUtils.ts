import { HIGHLIGHTED_ITEM, HIGHLIGHTED_SERIES, SELECTED_ITEM, SELECTED_SERIES } from '@constants';
import { Signal } from 'vega';
import { getGenericSignal } from './signal/signalSpecBuilder';

export const defaultHighlightedItemSignal = getGenericSignal(HIGHLIGHTED_ITEM);
export const defaultHighlightedSeriesSignal = getGenericSignal(HIGHLIGHTED_SERIES);
export const defaultSelectedItemSignal = getGenericSignal(SELECTED_ITEM);
export const defaultSelectedSeriesSignal = getGenericSignal(SELECTED_SERIES);

export const defaultSignals: Signal[] = [
	defaultHighlightedItemSignal,
	defaultHighlightedSeriesSignal,
	defaultSelectedItemSignal,
	defaultSelectedSeriesSignal,
];
