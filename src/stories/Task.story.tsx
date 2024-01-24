import React from 'react';

type TaskType = {
	id: string;
	title: string;
	state: 'TASK_INBOX' | 'TASK_PINNED' | 'TASK_ARCHIVED';
};

interface TaskProps {
	task: TaskType;
	onArchiveTask: (id: string) => void;
	onPinTask: (id: string) => void;
}

const Task: React.FC<TaskProps> = ({ task, onArchiveTask, onPinTask }) => {
	return (
		<div className={`list-item ${task.state}`}>
			<h1>en-US locale</h1>
			<h2>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(12345.67)}</h2>
			<h2>{new Intl.NumberFormat('en-US', { style: 'percent' }).format(0.123)}</h2>
			<h2>{new Intl.NumberFormat('en-US', { style: 'decimal', notation: 'compact' }).format(123456)}</h2>
			<h2>{new Intl.NumberFormat('en-US', { style: 'decimal', useGrouping: true }).format(123456789)}</h2>
			<hr />

			<h1>de-DE locale</h1>
			<h2>{new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(12345.67)}</h2>
			<h2>{new Intl.NumberFormat('de-DE', { style: 'percent' }).format(0.123)}</h2>
			<h2>{new Intl.NumberFormat('de-DE', { style: 'decimal', notation: 'compact' }).format(123456)}</h2>
			<h2>{new Intl.NumberFormat('de-DE', { style: 'decimal', useGrouping: true }).format(123456789)}</h2>
			<hr />

			<h1>zh-CN locale</h1>
			<h2>{new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY' }).format(12345.67)}</h2>
			<h2>{new Intl.NumberFormat('zh-CN', { style: 'percent' }).format(0.123)}</h2>
			<h2>{new Intl.NumberFormat('zh-CN', { style: 'decimal', notation: 'compact' }).format(123456)}</h2>
			<h2>{new Intl.NumberFormat('zh-CN', { style: 'decimal', useGrouping: true }).format(123456789)}</h2>
			<hr />

			<label htmlFor="checked" aria-label={`archiveTask-${task.id}`} className="checkbox">
				<input
					type="checkbox"
					disabled={true}
					name="checked"
					id={`archiveTask-${task.id}`}
					checked={task.state === 'TASK_ARCHIVED'}
				/>
				<span className="checkbox-custom" onClick={() => onArchiveTask(task.id)} />
			</label>

			<label htmlFor="title" aria-label={task.title} className="title">
				<input type="text" value={task.title} readOnly={true} name="title" placeholder="Input title" />
			</label>

			{task.state !== 'TASK_ARCHIVED' && (
				<button
					className="pin-button"
					onClick={() => onPinTask(task.id)}
					id={`pinTask-${task.id}`}
					aria-label={`pinTask-${task.id}`}
					key={`pinTask-${task.id}`}
				>
					<span className={`icon-star`} />
				</button>
			)}
		</div>
	);
};

export default {
	component: Task,
	title: 'Task',
	tags: ['autodocs'],
};

export const Default = {
	args: {
		task: {
			id: '1',
			title: 'Test Task',
			state: 'TASK_INBOX',
		},
	},
};

export const Pinned = {
	args: {
		task: {
			...Default.args.task,
			state: 'TASK_PINNED',
		},
	},
};

export const Archived = {
	args: {
		task: {
			...Default.args.task,
			state: 'TASK_ARCHIVED',
		},
	},
};
