import { DEFAULT_COLOR_SCHEME } from '@constants';
import { Bar, Line } from '@rsc';
import { addBar } from '@specBuilder/bar/barSpecBuilder';
import { addLine } from '@specBuilder/line/lineSpecBuilder';
import { sanitizeRscChartChildren, toCamelCase } from '@utils';
import { produce } from 'immer';
import { Spec } from 'vega';

import { BarElement, ColorScheme, ComboChildElement, ComboProps, LineElement } from '../../types';

export const addCombo = produce<Spec, [ComboProps & { colorScheme?: ColorScheme; index?: number }]>(
	(spec, { children = [], colorScheme = DEFAULT_COLOR_SCHEME, index = 0, name }) => {
		const buildOrder = new Map();
		buildOrder.set(Bar, 0);
		buildOrder.set(Line, 0);

		let { barCount, lineCount } = initializeComponentCounts();
		const sanitizedChildren = sanitizeRscChartChildren(children);
		const comboName = toCamelCase(name || `combo${index}`);

		spec = [...sanitizedChildren]
			.sort((a, b) => buildOrder.get(a.type) - buildOrder.get(b.type))
			.reduce((acc: Spec, cur) => {
				if (!('displayName' in cur.type)) {
					console.error('Invalid component type. Component is missing display name.');
					return acc;
				}

				/**
				 * type.displayName is used because it doesn't get minified, unlike type.name
				 * If we simply compare cur.type to the component,
				 * that uses referential equality which fails in production when the component is imported from a different module like ./alpha
				 */
				const displayName = cur.type.displayName;
				switch (displayName) {
					case Bar.displayName:
						barCount++;
						const barElement = cur as BarElement;
						return addBar(acc, {
							...barElement.props,
							colorScheme,
							index: barCount,
							name: getComboChildName(barElement, comboName, barCount),
						});
					case Line.displayName:
						lineCount++;
						const lineElement = cur as LineElement;
						return addLine(acc, {
							...lineElement.props,
							colorScheme,
							index: lineCount,
							name: getComboChildName(lineElement, comboName, lineCount),
						});
					default:
						console.error(`Invalid component type: ${displayName} is not a supported <Combo> child`);
						return acc;
				}
			}, spec);

		return spec;
	}
);

const initializeComponentCounts = () => {
	return { barCount: -1, lineCount: -1 };
};

export const getComboChildName = (cur: ComboChildElement, comboName: string, index: number) => {
	if (cur.props.name) {
		return cur.props.name;
	}
	const displayName = (cur.type as React.ComponentType).displayName;
	return toCamelCase(`${comboName}_${displayName}${index}`);
};
