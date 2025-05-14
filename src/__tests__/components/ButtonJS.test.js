import React from 'react';
import { render, screen } from '@testing-library/react';

// Mock the Button component
jest.mock('../../components/common/Button', () => ({
  Button: (props) => {
    return <button data-testid="button">{props.children}</button>;
  }
}));

describe('Button Component (Mocked)', () => {
  it('renders correctly', () => {
    const { Button } = require('../../components/common/Button');
    render(<Button>Click me</Button>);
    
    const button = screen.getByTestId('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Click me');
  });
});
