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
		<Flex direction="column" alignItems="center" justifyContent="center" flex={1} height="100%">
			<div className="text-color">
				{ props.icon
					? 	props.icon
					: <AlertCircle size="XL"/>
				}
			</div>
			<span className="error-info text-color">{props.message}</span>
			<button className="action-button">
				<Text>{props.actionText ? props.actionText : 'Please check incoming data'}</Text>
			</button>
		</Flex>
	);
}