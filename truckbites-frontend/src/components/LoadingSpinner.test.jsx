import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import LoadingSpinner from './LoadingSpinner';

describe('LoadingSpinner', () => {
  it('renders without crashing', () => {
    render(<LoadingSpinner />);
    expect(document.querySelector('.animate-spin')).toBeTruthy();
  });

  it('renders the provided text', () => {
    render(<LoadingSpinner text="Loading orders..." />);
    expect(screen.getByText('Loading orders...')).toBeTruthy();
  });

  it('supports different sizes', () => {
    render(<LoadingSpinner size="lg" />);
    expect(document.querySelector('.h-16')).toBeTruthy();
  });
});
