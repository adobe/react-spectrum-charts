import { useEffect, useRef } from 'react';
import { ChartData } from '@rsc';

export default function usePreviousChartData(data: ChartData[]): ChartData[] | undefined {
	const ref = useRef<ChartData[]>();
	useEffect(() => {
		ref.current = data;
	}, [data]);

	return ref.current;
}