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

import React, { FC, ReactElement } from 'react';
import { Flex, Text } from '@adobe/react-spectrum';
import AlertCircle from '@spectrum-icons/workflow/AlertCircle';

import './ErrorState.css';

interface ErrorStateProps {
	message: string;

	icon?: ReactElement;

	actionText?: string;

	action?: () => void;
}

export const ErrorState: FC<ErrorStateProps> = (props) => {
	return (
		<Flex justifyContent="center">
			<div tabIndex={0} className="focus-style">
				<div className="text-color">
					{props.icon
						? props.icon
						: <AlertCircle size="XL" />
					}
				</div>
				<span className="error-info text-color">{props.message}</span>
				<button className="action-button">
					<Text>{props.actionText ? props.actionText : 'Please check incoming data'}</Text>
				</button>
			</div>
		</Flex>
	);
};