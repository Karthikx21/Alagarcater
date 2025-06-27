import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Navigation from '../client/src/components/navigation';

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = createTestQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Navigation Component', () => {
  it('renders navigation links', () => {
    render(
      <TestWrapper>
        <Navigation />
      </TestWrapper>
    );

    expect(screen.getByText('Menu')).toBeInTheDocument();
  });

  it('shows company name', () => {
    render(
      <TestWrapper>
        <Navigation />
      </TestWrapper>
    );

    expect(screen.getByText(/Alagar/)).toBeInTheDocument();
  });
});
