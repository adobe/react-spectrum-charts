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

import { View } from 'vega';

import { ChartHandle } from '@spectrum-charts/vega-spec-builder';

interface ChartImperativeHandleProps {
	chartView: MutableRefObject<View | undefined>;
	title?: string;
}

export default function useChartImperativeHandle(forwardedRef: Ref<ChartHandle>, props: ChartImperativeHandleProps) {
	return useImperativeHandle(forwardedRef, () => ({
		copy: () => copy(props),
		download: (customFileName?: string) => download(props, customFileName),
		getBase64Png: () => getBase64Png(props),
		getSvg: () => getSvg(props),
	}));
}

/**
 * Copies the chart to the clipboard
 * @param props
 * @returns Promise<string>
 */
const copy = ({ chartView }: ChartImperativeHandleProps) =>
	new Promise<string>((resolve, reject) => {
		if (chartView.current) {
			chartView.current.toImageURL('png').then(
				async (url) => {
					try {
						const response = await fetch(url);
						const blob = await response.blob();
						navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]).then(
							() => resolve('Chart copied to clipboard'),
							() =>
								reject(new Error('Error occurred while writing to clipboard, copy to clipboard failed'))
						);
					} catch (error) {
						reject(new Error('Error occurred while fetching image, copy to clipboard failed'));
					}
				},
				() => reject(new Error('Error occurred while converting image to URL, copy to clipboard failed'))
			);
		} else {
			reject(new Error("There isn't a chart to copy, copy to clipboard failed"));
		}
	});

/**
 * Downloads the chart as a PNG to the users computer
 * @param props
 * @param customFileName
 * @returns Promise<string>
 */
const download = ({ chartView, title }: ChartImperativeHandleProps, customFileName?: string) =>
	new Promise<string>((resolve, reject) => {
		if (chartView.current) {
			const filename = `${customFileName ?? title ?? 'chart_export'}.png`;
			chartView.current.toImageURL('png').then(
				(url) => {
					const link = document.createElement('a');
					link.setAttribute('href', url);
					link.setAttribute('target', '_blank');
					link.setAttribute('download', filename);
					link.dispatchEvent(new MouseEvent('click'));
					resolve(`Chart downloaded as ${filename}`);
				},
				() => reject(new Error('Error occurred while converting image to URL, download failed'))
			);
		} else {
			reject(new Error("There isn't a chart to download, download failed"));
		}
	});

/**
 * Gets the base64 encoded PNG string from the chart
 * @param props
 * @param customFileName
 * @returns Promise<string>
 */
const getBase64Png = ({ chartView }: ChartImperativeHandleProps) =>
	new Promise<string>((resolve, reject) => {
		if (chartView.current) {
			chartView.current.toImageURL('png').then(
				async (url) => {
					try {
						const response = await fetch(url);
						const blob = await response.blob();
						const base64Png = await blobToBase64(blob);
						if (typeof base64Png === 'string') {
							resolve(base64Png);
						} else {
							reject(new Error('Error occurred while converting image to base64, get base64 PNG failed'));
						}
					} catch (error) {
						reject(new Error('Error occurred while fetching image, get base64 PNG failed'));
					}
				},
				() => reject(new Error('Error occurred while converting image to URL, get base64 PNG failed'))
			);
		} else {
			reject(new Error("There isn't a chart to get the PNG from, get base64 PNG failed"));
		}
	});

const blobToBase64 = (blob): Promise<string | ArrayBuffer | null> => {
	return new Promise((resolve) => {
		const reader = new FileReader();
		reader.onloadend = () => resolve(reader.result);
		reader.readAsDataURL(blob);
	});
};

/**
 * Gets the SVG string from the chart
 * @param props
 * @returns Promise<string>
 */
const getSvg = ({ chartView }: ChartImperativeHandleProps) =>
	new Promise<string>((resolve, reject) => {
		if (chartView.current) {
			chartView.current.toSVG().then(
				(value) => resolve(value),
				() => reject(new Error('Error occurred while converting chart to SVG'))
			);
		} else {
			reject(new Error("There isn't a chart to get the SVG from, get SVG failed"));
		}
	});
