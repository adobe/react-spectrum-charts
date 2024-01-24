import React, { FC, ReactElement } from 'react';
import { Flex, Text } from '@adobe/react-spectrum';
import AlertCircle from '@spectrum-icons/workflow/AlertCircle';

import './ErrorState.css';

interface ErrorStateProps {
	message: string;

	icon?: ReactElement;

	actionText?: string;

	action?: () => void;

	direction: 'column' | 'row';

	alignment: 'center' | 'start';
}

export const ErrorState: FC<ErrorStateProps> = (props) => {
	return (
		<Flex direction={props.direction} alignItems={props.alignment} justifyContent="center">
			{ props.icon
				? 	props.icon
				: <AlertCircle size="XL"/>
			}
			<span className="error-info">{props.message}</span>
			<button onClick={props.action} className="action-button">
				<Text>{props.actionText ? props.actionText : 'Reload'}</Text>
			</button>
		</Flex>
	);
}