import React from 'react';
import { render } from '@testing-library/react-native';

import { ProgressBar } from '@/components/common/ProgressBar';
import { ThemeProvider } from '@/context/ThemeContext';

const wrap = (ui: React.ReactElement) =>
  render(<ThemeProvider>{ui}</ThemeProvider>);

describe('<ProgressBar />', () => {
  it('renders without crashing', () => {
    const { toJSON } = wrap(<ProgressBar progress={50} />);
    expect(toJSON()).toBeTruthy();
  });

  it('shows the rounded percent label when showLabel is true', () => {
    const { getByText } = wrap(<ProgressBar progress={42.7} showLabel />);
    expect(getByText('43%')).toBeTruthy();
  });

  it('clamps progress between 0 and 100', () => {
    const { getByText, rerender } = wrap(<ProgressBar progress={-50} showLabel />);
    expect(getByText('0%')).toBeTruthy();

    rerender(
      <ThemeProvider>
        <ProgressBar progress={150} showLabel />
      </ThemeProvider>,
    );
    expect(getByText('100%')).toBeTruthy();
  });
});
