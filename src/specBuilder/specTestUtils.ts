import { HIGHLIGHTED_ITEM } from '@constants';
import { Signal } from 'vega';

import { getGenericSignal } from './signal/signalSpecBuilder';

export const defaultHighlightedItemSignal = getGenericSignal(HIGHLIGHTED_ITEM);

export const defaultSignals: Signal[] = [defaultHighlightedItemSignal];
