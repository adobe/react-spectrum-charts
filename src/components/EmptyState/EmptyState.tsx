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
import React, { FC } from 'react';

import { Flex, Text } from '@adobe/react-spectrum';
import GraphBarVertical from '@spectrum-icons/workflow/GraphBarVertical';

import './EmptyState.css';

export interface EmptyStateProps {
	height?: number;
	text?: string;
}

export const EmptyState: FC<EmptyStateProps> = ({ height, text }) => {
	return (
		<Flex direction="column" justifyContent="center" alignItems="center" height={height}>
			<GraphBarVertical size="XXL" UNSAFE_className="EmptyState-icon" />
			{Boolean(text) && <Text UNSAFE_className="EmptyState-text">{text}</Text>}
		</Flex>
	);
};