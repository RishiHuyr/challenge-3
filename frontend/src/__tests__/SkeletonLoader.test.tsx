import React from 'react';
import { render, screen } from '@testing-library/react';
import { SkeletonLoader } from '../../components/SkeletonLoader';

describe('SkeletonLoader Component', () => {
  it('renders a single card skeleton by default', () => {
    render(<SkeletonLoader />);
    const wrapper = screen.getByTestId('skeleton-loader');
    expect(wrapper).toBeInTheDocument();
  });

  it('renders multiple skeletons when count is provided', () => {
    render(<SkeletonLoader count={3} type="list" />);
    // Should render 3 skeleton-list elements
    const wrapper = screen.getByTestId('skeleton-loader');
    const listElements = wrapper.querySelectorAll('.skeleton-list');
    expect(listElements.length).toBe(3);
  });

  it('renders chart skeleton variant correctly', () => {
    render(<SkeletonLoader type="chart" />);
    const wrapper = screen.getByTestId('skeleton-loader');
    const chartEl = wrapper.querySelector('.skeleton-chart');
    expect(chartEl).toBeInTheDocument();
  });

  it('renders text skeleton variant correctly', () => {
    render(<SkeletonLoader type="text" />);
    const wrapper = screen.getByTestId('skeleton-loader');
    const textEl = wrapper.querySelector('.skeleton-text');
    expect(textEl).toBeInTheDocument();
  });

  it('has aria-hidden on inner skeleton visual elements for screen reader compatibility', () => {
    render(<SkeletonLoader type="card" />);
    const wrapper = screen.getByTestId('skeleton-loader');
    // All inner skeleton divs should have aria-hidden
    const ariaHiddenEls = wrapper.querySelectorAll('[aria-hidden="true"]');
    expect(ariaHiddenEls.length).toBeGreaterThan(0);
  });
});
