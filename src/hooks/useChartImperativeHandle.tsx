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
import { MutableRefObject, Ref, useImperativeHandle } from 'react';

import { ChartHandle } from 'types';
import { View } from 'vega';

export default function useChartImperativeHandle(
	forwardedRef: Ref<ChartHandle>,
	{ chartView, title }: { chartView: MutableRefObject<View | undefined>; title?: string }
) {
	return useImperativeHandle(forwardedRef, () => ({
		copy() {
			return new Promise<string>((resolve, reject) => {
				if (chartView.current) {
					chartView.current.toImageURL('png').then(
						async (url) => {
							try {
								const response = await fetch(url);
								const blob = await response.blob();
								navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]).then(
									() => resolve('Chart copied to clipboard'),
									() => reject('Error occurred while writing to clipboard, copy to clipboard failed')
								);
							} catch (error) {
								reject('Error occurred while fetching image, copy to clipboard failed');
							}
						},
						() => reject('Error occurred while converting image to URL, copy to clipboard failed')
					);
				} else {
					reject("There isn't a chart to copy, copy to clipboard failed");
				}
			});
		},
		download(customFileName?: string) {
			return new Promise<string>((resolve, reject) => {
				if (chartView.current) {
					const filename = `${customFileName || title || 'chart_export'}.png`;
					chartView.current.toImageURL('png').then(
						(url) => {
							const link = document.createElement('a');
							link.setAttribute('href', url);
							link.setAttribute('target', '_blank');
							link.setAttribute('download', filename);
							link.dispatchEvent(new MouseEvent('click'));
							resolve(`Chart downloaded as ${filename}`);
						},
						() => reject('Error occurred while converting image to URL, download failed')
					);
				} else {
					reject("There isn't a chart to download, download failed");
				}
			});
		},
	}));
}
