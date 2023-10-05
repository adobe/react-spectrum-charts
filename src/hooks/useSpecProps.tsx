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

import { useMemo } from 'react';
import { Spec } from 'vega';

export default function useSpecProps(spec: Spec) {
	return useMemo(() => {
		const selectedIdSignalName = spec.signals?.find((signal) => signal.name.includes('selectedId'))?.name ?? null;
		const selectedSeriesSignalName =
			spec.signals?.find((signal) => signal.name.includes('selectedSeries'))?.name ?? null;
		const controlledHoverSignal = spec.signals?.find((signal) => signal.name.includes('controlledHoveredId'));
		return { selectedIdSignalName, selectedSeriesSignalName, controlledHoverSignal };
	}, [spec]);
}
