import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import VirtualizedList from '../VirtualizedList';

// Mock the useBreakpoints hook
jest.mock('../../../hooks/useMediaQuery', () => ({
  useBreakpoints: () => ({
    isMobile: false,
    isTablet: false,
    isDesktop: true
  })
}));

// Mock the errorHandler
jest.mock('../../../utils/errorTracking', () => ({
  errorHandler: {
    trackError: jest.fn()
  }
}));

describe('VirtualizedList', () => {
  // Mock data
  const mockItems = Array.from({ length: 100 }, (_, i) => ({
    id: `item-${i}`,
    name: `Item ${i}`
  }));

  // Mock render item function
  const mockRenderItem = jest.fn((item, index) => (
    <div data-testid={`item-${index}`}>{item.name}</div>
  ));

  // Mock end reached callback
  const mockOnEndReached = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the list with correct height', () => {
    render(
      <VirtualizedList
        items={mockItems}
        height={500}
        itemHeight={50}
        renderItem={mockRenderItem}
      />
    );

    // Check that the container has the correct height
    const container = screen.getByClassName('virtualized-list-container');
    expect(container).toHaveStyle('height: 500px');
  });

  it('renders visible items based on viewport', () => {
    render(
      <VirtualizedList
        items={mockItems}
        height={200}
        itemHeight={50}
        renderItem={mockRenderItem}
        overscan={1}
      />
    );

    // With a height of 200px and item height of 50px, we should see 4 items
    // plus overscan of 1 on each side, so 6 items total
    expect(mockRenderItem).toHaveBeenCalledTimes(6);
  });

  it('handles scroll events', () => {
    render(
      <VirtualizedList
        items={mockItems}
        height={200}
        itemHeight={50}
        renderItem={mockRenderItem}
        overscan={1}
      />
    );

    // Get the container
    const container = screen.getByClassName('virtualized-list-container');

    // Reset mock calls before scrolling
    mockRenderItem.mockClear();

    // Simulate scroll
    fireEvent.scroll(container, { target: { scrollTop: 200 } });

    // After scrolling, we should render different items
    expect(mockRenderItem).toHaveBeenCalled();
    expect(mockRenderItem).toHaveBeenCalledWith(
      expect.objectContaining({ id: expect.stringContaining('item-') }),
      expect.any(Number)
    );
  });

  it('calls onEndReached when scrolled to threshold', () => {
    render(
      <VirtualizedList
        items={mockItems}
        height={200}
        itemHeight={50}
        renderItem={mockRenderItem}
        onEndReached={mockOnEndReached}
        endReachedThreshold={0.8}
      />
    );

    // Get the container
    const container = screen.getByClassName('virtualized-list-container');

    // Simulate scroll to near the end
    // With 100 items of height 50px, total height is 5000px
    // 80% of 5000px is 4000px
    fireEvent.scroll(container, { target: { scrollTop: 4000 } });

    // onEndReached should be called
    expect(mockOnEndReached).toHaveBeenCalled();
  });

  it('renders loading component when loading is true', () => {
    render(
      <VirtualizedList
        items={mockItems}
        height={200}
        itemHeight={50}
        renderItem={mockRenderItem}
        loading={true}
        loadingComponent={<div>Loading...</div>}
      />
    );

    // Check that loading component is rendered
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders empty state when no items are provided', () => {
    render(
      <VirtualizedList
        items={[]}
        height={200}
        itemHeight={50}
        renderItem={mockRenderItem}
      />
    );

    // Check that empty state is rendered
    expect(screen.getByText('No items to display')).toBeInTheDocument();
  });

  it('handles errors in renderItem gracefully', () => {
    const errorRenderItem = (item: any, index: number) => {
      if (index === 2) {
        throw new Error('Test error in renderItem');
      }
      return <div data-testid={`item-${index}`}>{item.name}</div>;
    };

    render(
      <VirtualizedList
        items={mockItems}
        height={200}
        itemHeight={50}
        renderItem={errorRenderItem}
        overscan={1}
      />
    );

    // The list should still render without crashing
    const container = screen.getByClassName('virtualized-list-container');
    expect(container).toBeInTheDocument();
  });

  it('restores scroll position when scrollRestoration is true', () => {
    // Mock sessionStorage
    const mockGetItem = jest.fn().mockReturnValue('100');
    const mockSetItem = jest.fn();
    const originalSessionStorage = window.sessionStorage;
    
    Object.defineProperty(window, 'sessionStorage', {
      value: {
        getItem: mockGetItem,
        setItem: mockSetItem
      }
    });

    render(
      <VirtualizedList
        items={mockItems}
        height={200}
        itemHeight={50}
        renderItem={mockRenderItem}
        scrollRestoration={true}
      />
    );

    // Check that sessionStorage was accessed
    expect(mockGetItem).toHaveBeenCalled();

    // Restore original sessionStorage
    Object.defineProperty(window, 'sessionStorage', {
      value: originalSessionStorage
    });
  });
});
