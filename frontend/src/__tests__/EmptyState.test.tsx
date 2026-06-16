import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { EmptyState } from '../../components/EmptyState';

describe('EmptyState Component', () => {
  it('renders the title and description correctly', () => {
    render(
      <MemoryRouter>
        <EmptyState
          icon="🌱"
          title="No Data Found"
          description="Please complete an assessment to see data here."
        />
      </MemoryRouter>
    );

    expect(screen.getByText('No Data Found')).toBeInTheDocument();
    expect(screen.getByText('Please complete an assessment to see data here.')).toBeInTheDocument();
  });

  it('renders a link when actionTo is provided', () => {
    render(
      <MemoryRouter>
        <EmptyState
          icon="🌱"
          title="Empty"
          description="Nothing here"
          actionLabel="Go to Calculator"
          actionTo="/calculator"
        />
      </MemoryRouter>
    );

    const link = screen.getByText('Go to Calculator');
    expect(link).toBeInTheDocument();
    expect(link.closest('a')).toHaveAttribute('href', '/calculator');
  });

  it('renders a button and fires the click handler when actionClick is provided', () => {
    const mockFn = jest.fn();
    render(
      <MemoryRouter>
        <EmptyState
          icon="💡"
          title="Empty State"
          description="Click the action button"
          actionLabel="Retry"
          actionClick={mockFn}
        />
      </MemoryRouter>
    );

    const btn = screen.getByText('Retry');
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn);
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('renders icon with aria-hidden to avoid screen reader noise', () => {
    render(
      <MemoryRouter>
        <EmptyState
          icon="🎯"
          title="Icon Test"
          description="Checking icon accessibility"
        />
      </MemoryRouter>
    );

    const icon = screen.getByText('🎯');
    expect(icon).toHaveAttribute('aria-hidden', 'true');
  });
});
