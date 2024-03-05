import { HIGHLIGHTED_ITEM, HIGHLIGHTED_SERIES } from '@constants';
import { Signal } from 'vega';
import { getGenericSignal } from './signal/signalSpecBuilder';

export const defaultHighlightedItemSignal = getGenericSignal(HIGHLIGHTED_ITEM);
export const defaultHighlightedSeriesSignal = getGenericSignal(HIGHLIGHTED_SERIES);

export const defaultSignals: Signal[] = [defaultHighlightedItemSignal, defaultHighlightedSeriesSignal];
