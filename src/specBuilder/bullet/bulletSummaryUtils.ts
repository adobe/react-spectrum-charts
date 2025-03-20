import { TABLE } from '@constants';
import { getTableData } from '@specBuilder/data/dataUtils';
import { Data, ValuesData } from 'vega';

export const getBulletTableData = (data: Data[]): ValuesData => {
	let tableData = getTableData(data);

	if (!tableData) {
		tableData = {
			name: TABLE,
			values: [],
			transform: [],
		};
		data.push(tableData);
	}
	return tableData;
};
