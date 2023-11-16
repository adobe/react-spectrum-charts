import { TITLE_FONT_WEIGHT } from '@constants';
import { produce } from 'immer';
import { TitleProps } from 'types';
import { Spec } from 'vega';

export const addTitle = produce<Spec, [TitleProps]>(
	(spec, { text, fontWeight = TITLE_FONT_WEIGHT, position = 'middle', orient = 'top' }) => {
		spec.title = {
			text,
			fontWeight,
			anchor: position,
			frame: 'group',
			baseline: orient === 'top' ? 'bottom' : 'top',
			orient,
		};

		return spec;
	}
);
