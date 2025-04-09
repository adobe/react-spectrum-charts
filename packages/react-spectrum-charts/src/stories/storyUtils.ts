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
/**
 * converts a timestamp to a MMM D format
 * @param timestamp
 * @returns
 */
export const formatTimestamp = (timestamp: number): string => {
	// Create a Date object from the timestamp (assuming the timestamp is in milliseconds)
	const date = new Date(timestamp);

	// Define an array of month abbreviations
	const monthAbbreviations = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

	// Get the month and day from the Date object
	const month = monthAbbreviations[date.getMonth()];
	const day = date.getDate();

	// Format the date in 'MMM D' format
	return `${month} ${day}`;
};
