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

import { Flex, Text } from '@adobe/react-spectrum';
import GraphBarVertical from '@spectrum-icons/workflow/GraphBarVertical';
import React, { FC } from 'react';

import './EmptyState.css';

interface EmptyStateProps {
	height?: number;
}

export const EmptyState: FC<EmptyStateProps> = (props) => {
	return (
		<Flex direction="column" justifyContent="center" alignItems="center" {...props}>
			<GraphBarVertical size="XXL" UNSAFE_className="EmptyState-icon" />
			<Text UNSAFE_className="EmptyState-text">No data found</Text>
		</Flex>
	);
};
