/*
 * Copyright 2024 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */
import { Icon } from '@adobe/react-spectrum';

import { Chart } from '../../../Chart';
import { Line } from '../../../components';
import { BigNumber } from '../../../rc';
import { getBigNumberChartDimensions, getBigNumberSize, getFontSize } from '../../../rc/components/BigNumber/BigNumber';
import { simpleSparklineData as data } from '../../../stories/data/data';
import { findAllMarksByGroupName, findChart, render, screen } from '../../../test-utils';
import {
  BasicHorizontal,
  BasicVertical,
  CompactFormat,
  CurrencyFormat,
  IconHorizontal,
  IconVertical,
  PercentageFormat,
  SparklineAndIconHorizontal,
  SparklineAndIconVertical,
  SparklineHorizontal,
  SparklineMethodLast,
  SparklineVertical,
  UndefinedData,
} from './BigNumber.story';

describe('BigNumber', () => {
  describe('BigNumber basic component', () => {
    test('BasicHorizontal renders', async () => {
      render(<BasicHorizontal {...BasicHorizontal.args} />);
      const value = await screen.findByText('20');
      expect(value).toBeInTheDocument();
      const label = await screen.findByText(BasicHorizontal.args.label);
      expect(label).toBeInTheDocument();
      expect(label.style.textAlign).toEqual('start');
    });

    test('BasicVertical renders', async () => {
      render(<BasicVertical {...BasicVertical.args} />);
      const value = await screen.findByText(data[data.length - 1][BasicVertical.args.dataKey]);
      expect(value).toBeInTheDocument();
      const label = await screen.findByText(BasicVertical.args.label);
      expect(label).toBeInTheDocument();
      expect(label.style.textAlign).toEqual('center');
    });
  });
  describe('BigNumber with icon prop passed in', () => {
    test('IconVertical renders with correct icon present', async () => {
      render(<IconVertical {...IconVertical.args} />);
      const icon = await screen.findByTestId('icon-user');
      expect(icon).toBeInTheDocument();
      const value = await screen.findByText(data[data.length - 1][IconVertical.args.dataKey]);
      expect(value).toBeInTheDocument();
      const label = await screen.findByText(IconVertical.args.label);
      expect(label).toBeInTheDocument();
      expect(label.style.textAlign).toEqual('center');
    });

    test('IconHorizontal renders with correct icon present', async () => {
      render(<IconHorizontal {...IconHorizontal.args} />);
      const icon = await screen.findByTestId('icon-user');
      expect(icon).toBeInTheDocument();
      const value = await screen.findByText('20');
      expect(value).toBeInTheDocument();
      const label = await screen.findByText(IconHorizontal.args.label);
      expect(label).toBeInTheDocument();
      expect(label.style.textAlign).toEqual('start');
    });
  });
  describe('BigNumber error states', () => {
    test('UndefinedData renders appropriate warning icon and text', async () => {
      render(<UndefinedData {...UndefinedData.args} />);
      const errorDescription = await screen.findByText('No data found');
      expect(errorDescription).toBeInTheDocument();
    });
  });
  describe('BigNumber using numberFormat', () => {
    test('CurrencyFormat renders with formatted value', async () => {
      render(<CurrencyFormat {...CurrencyFormat.args} />);
      const formattedValue = await screen.findByText('255,56 €');
      expect(formattedValue).toBeInTheDocument();
    });

    test('PercentageFormat renders with formatted value', async () => {
      render(<PercentageFormat {...PercentageFormat.args} />);
      const formattedValue = await screen.findByText('25%');
      expect(formattedValue).toBeInTheDocument();
    });

    test('CompactFormat renders with formatted value', async () => {
      render(<CompactFormat {...CompactFormat.args} />);
      const formattedValue = await screen.findByText('12.3M');
      expect(formattedValue).toBeInTheDocument();
    });
  });

	describe('Chart with BigNumber children', () => {
		test('Chart with BigNumber and Line as children should only display BigNumber', async () => {
			render(
				<Chart data={data}>
					<BigNumber
						dataKey="y"
						orientation="horizontal"
						label="Empty"
						icon={
							<Icon data-testid="icon">
								<svg></svg>
							</Icon>
						}
					/>
					<Line />
				</Chart>
			);

      const bigNumber = screen.queryByTestId('icon');
      expect(bigNumber).toBeInTheDocument();
      const charts = await screen.queryAllByRole('graphics-document');
      expect(charts.length).toEqual(0);
    });

    test('Chart with multiple BigNumbers only displays first', async () => {
      render(
        <Chart data={data}>
          <BigNumber
            dataKey="y"
            orientation="horizontal"
            label="test"
            icon={
              <Icon data-testid="first-icon">
                <svg></svg>
              </Icon>
            }
          />
          <BigNumber
            dataKey="y"
            orientation="horizontal"
            label="test"
            icon={
              <Icon data-testid="second-icon">
                <svg></svg>
              </Icon>
            }
          />
          <BigNumber
            dataKey="y"
            orientation="horizontal"
            label="test"
            icon={
              <Icon data-testid="third-icon">
                <svg></svg>
              </Icon>
            }
          />
        </Chart>
      );
      const bigNumber = screen.queryByTestId('first-icon');
      expect(bigNumber).toBeInTheDocument();

      const secondBigNumber = screen.queryByTestId('second-icon');
      const thirdBigNumber = screen.queryByTestId('third-icon');

      expect(secondBigNumber).toBe(null);
      expect(thirdBigNumber).toBe(null);
    });
  });

  describe('Sparkline with orientation', () => {
    test('Vertical orientation sparkline', async () => {
      render(<SparklineVertical {...SparklineVertical.args} />);
      const value = await screen.findByText('20');
      expect(value).toBeInTheDocument();

      const label = await screen.findByText('Visitors');
      expect(label).toBeInTheDocument();
      expect(label.style.textAlign).toEqual('center');

      const chart = await findChart();
      expect(chart).toBeInTheDocument();

      const lines = await findAllMarksByGroupName(chart, 'line0');
      expect(lines.length).toEqual(1);
    });
    test('Horizontal orientation sparkline', async () => {
      render(<SparklineHorizontal {...SparklineHorizontal.args} />);
      const value = await screen.findByText('20');
      expect(value).toBeInTheDocument();

      const label = await screen.findByText('Visitors');
      expect(label).toBeInTheDocument();
      expect(label.style.textAlign).toEqual('start');

      const chart = await findChart();
      expect(chart).toBeInTheDocument();

      const lines = await findAllMarksByGroupName(chart, 'line0');
      expect(lines.length).toEqual(1);
    });
  });

  describe('Sparkline with orientation and icon', () => {
    test('Vertical orientation sparkline with icon', async () => {
      render(<SparklineAndIconVertical {...SparklineAndIconVertical.args} />);
      const icon = await screen.findByTestId('icon-user');
      expect(icon).toBeInTheDocument();

      const value = await screen.findByText('20');
      expect(value).toBeInTheDocument();

      const label = await screen.findByText('Visitors');
      expect(label).toBeInTheDocument();
      expect(label.style.textAlign).toEqual('center');

      const chart = await findChart();
      expect(chart).toBeInTheDocument();

      const lines = await findAllMarksByGroupName(chart, 'line0');
      expect(lines.length).toEqual(1);
    });
    test('Horizontal orientation sparkline with icon', async () => {
      render(<SparklineAndIconHorizontal {...SparklineAndIconHorizontal.args} />);
      const icon = await screen.findByTestId('icon-user');
      expect(icon).toBeInTheDocument();

      const value = await screen.findByText('20');
      expect(value).toBeInTheDocument();

      const label = await screen.findByText('Visitors');
      expect(label).toBeInTheDocument();
      expect(label.style.textAlign).toEqual('start');

      const chart = await findChart();
      expect(chart).toBeInTheDocument();

      const lines = await findAllMarksByGroupName(chart, 'line0');
      expect(lines.length).toEqual(1);
    });
  });

  describe('Sparkline with different display methods', () => {
    test('Sparkline with  no method specified (default to last)', async () => {
      render(<SparklineMethodLast {...SparklineMethodLast.args} />);
      const val = await screen.findByText(data[data.length - 1][SparklineMethodLast.args.dataKey]);
      expect(val).toBeInTheDocument();
    });

    test('Sparkline with sum method specified', async () => {
      render(<SparklineMethodLast {...SparklineMethodLast.args} method="sum" />);
      const val = await screen.findByText('1050');
      expect(val).toBeInTheDocument();
    });

    test('Sparkline with avg method specified', async () => {
      render(<SparklineMethodLast {...SparklineMethodLast.args} method="avg" />);
      const val = await screen.findByText('50');
      expect(val).toBeInTheDocument();
    });
  });

  describe('Sizing', () => {
    describe('getBigNumberSize', () => {
      // chart width
      test('Returns small if chart width is 100', () => {
        expect(getBigNumberSize(100, 1000)).toBe('small');
      });
      test('Returns small if chart width is less than 100', () => {
        expect(getBigNumberSize(99, 1000)).toBe('small');
      });
      test('Returns medium if chart width is 266', () => {
        expect(getBigNumberSize(266, 1000)).toBe('medium');
      });
      test('Returns medium if chart width is less than 266 and greater than 100', () => {
        expect(getBigNumberSize(101, 1000)).toBe('medium');
      });
      test('Returns large if chart width is 466', () => {
        expect(getBigNumberSize(466, 1000)).toBe('large');
      });
      test('Returns large if chart width is less than 466 and greater than 266', () => {
        expect(getBigNumberSize(267, 1000)).toBe('large');
      });
      test('Returns x-large if chart width is greater than 466', () => {
        expect(getBigNumberSize(467, 1000)).toBe('x-large');
      });

      // chart height
      test('Returns small if chart height is 100', () => {
        expect(getBigNumberSize(1000, 100)).toBe('small');
      });
      test('Returns small if chart height is less than 100', () => {
        expect(getBigNumberSize(1000, 99)).toBe('small');
      });
      test('Returns medium if chart height is 200', () => {
        expect(getBigNumberSize(1000, 200)).toBe('medium');
      });
      test('Returns medium if chart height is less than 200 and greather than 100', () => {
        expect(getBigNumberSize(1000, 101)).toBe('medium');
      });
      test('Returns large if chart height is 300', () => {
        expect(getBigNumberSize(1000, 300)).toBe('large');
      });
      test('Returns large if chart height is less than 300 and greather than 200', () => {
        expect(getBigNumberSize(1000, 201)).toBe('large');
      });
      test('Returns x-large if chart height is greather than 300', () => {
        expect(getBigNumberSize(1000, 301)).toBe('x-large');
      });
    });

    describe('getBigNumberChartDimensions', () => {
      test('small', () => {
        expect(getBigNumberChartDimensions('small')).toEqual({ cWidth: 75, cHeight: 35 });
      });
      test('medium', () => {
        expect(getBigNumberChartDimensions('medium')).toEqual({ cWidth: 100, cHeight: 50 });
      });
      test('large', () => {
        expect(getBigNumberChartDimensions('large')).toEqual({ cWidth: 150, cHeight: 75 });
      });
      test('x-large', () => {
        expect(getBigNumberChartDimensions('x-large')).toEqual({ cWidth: 200, cHeight: 100 });
      });
    });

    describe('getFontSize', () => {
      test('small', () => {
        expect(getFontSize('small')).toEqual({ labelSize: 'medium', valueSize: 'large' });
      });
      test('medium', () => {
        expect(getFontSize('medium')).toEqual({ labelSize: 'large', valueSize: 'x-large' });
      });
      test('large', () => {
        expect(getFontSize('large')).toEqual({ labelSize: 'x-large', valueSize: 'xx-large' });
      });
      test('x-large', () => {
        expect(getFontSize('x-large')).toEqual({ labelSize: 'xx-large', valueSize: 'xxx-large' });
      });
    });
  });
});
