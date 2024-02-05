/*
 * Copyright 2024 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import { useLayoutEffect, useRef } from 'react';

export const useResizeObserver = <T extends HTMLElement>(callback: (target: T, entry: ResizeObserverEntry) => void) => {
	const ref = useRef<T>(null);

	useLayoutEffect(() => {
		const element = ref?.current;

		if (!element) {
			return;
		}

		// ResizeObserver is not supported in jest
		if (typeof ResizeObserver === 'undefined') {
			console.warn('ResizeObserver is not supported. Defaulting to 500px.');
			callback(element, { contentRect: { width: 500 } } as ResizeObserverEntry);
			return;
		}

		const observer = new ResizeObserver((entries) => {
			callback(element, entries[0]);
		});

		observer.observe(element);

		return () => {
			observer.disconnect();
		};
	}, [callback, ref]);

	return ref;
};
