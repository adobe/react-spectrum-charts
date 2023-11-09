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
import { RefObject, useLayoutEffect, useState } from 'react';

export default function useElementSize(ref: RefObject<HTMLElement>) {
	const [width, setWidth] = useState(0);
	const [height, setHeight] = useState(0);

	useLayoutEffect(() => {
		const handleResize = () => {
			if (!ref.current) {
				setWidth(0);
				setHeight(0);
				return;
			}
			// in jest, offsetWidth and offsetHeight are always 0
			// default to 500px for testing
			setWidth(ref.current.offsetWidth || 500);
			setHeight(ref.current.offsetHeight || 500);
		};
		handleResize();
		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, [ref]);

	return [width, height];
}
