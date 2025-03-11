/*
 * Copyright 2023 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import React, { ReactElement } from 'react';

import { render } from '@testing-library/react';

import { Provider, defaultTheme } from '@adobe/react-spectrum';
import { ColorScheme } from '@react-types/provider';
import { DEFAULT_COLOR_SCHEME } from '@spectrum-charts/constants';

export function spectrumRender(
	element: ReactElement,
	options?: {
		colorScheme?: ColorScheme;
	}
) {
	return render(
		<Provider theme={defaultTheme} colorScheme={options?.colorScheme ?? DEFAULT_COLOR_SCHEME}>
			{element}
		</Provider>
	);
}

// re-export everything
export * from '@testing-library/react';

// override render method
export { spectrumRender as render };
