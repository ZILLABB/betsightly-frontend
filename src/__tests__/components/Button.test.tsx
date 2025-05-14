// React is automatically imported with the JSX transform
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../../components/common/Button';

describe('Button Component', () => {
  it('renders correctly with default props', () => {
    render(<Button>Click me</Button>);
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('bg-primary');
  });

  it('renders with different variants', () => {
    const { rerender } = render(<Button variant="outline">Outline Button</Button>);
    let button = screen.getByRole('button', { name: /outline button/i });
    expect(button).toHaveClass('border');

    rerender(<Button variant="ghost">Ghost Button</Button>);
    button = screen.getByRole('button', { name: /ghost button/i });
    expect(button).toHaveClass('hover:bg-accent');

    rerender(<Button variant="link">Link Button</Button>);
    button = screen.getByRole('button', { name: /link button/i });
    expect(button).toHaveClass('underline-offset-4');
  });

  it('renders with different sizes', () => {
    const { rerender } = render(<Button size="sm">Small Button</Button>);
    let button = screen.getByRole('button', { name: /small button/i });
    expect(button).toHaveClass('h-9');

    rerender(<Button size="lg">Large Button</Button>);
    button = screen.getByRole('button', { name: /large button/i });
    expect(button).toHaveClass('h-11');
  });

  it('handles click events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    const button = screen.getByRole('button', { name: /click me/i });

    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('can be disabled', () => {
    const handleClick = jest.fn();
    render(<Button disabled onClick={handleClick}>Disabled Button</Button>);
    const button = screen.getByRole('button', { name: /disabled button/i });

    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('renders with custom className', () => {
    render(<Button className="custom-class">Custom Button</Button>);
    const button = screen.getByRole('button', { name: /custom button/i });
    expect(button).toHaveClass('custom-class');
  });

  it('renders with an icon', () => {
    const TestIcon = () => <svg data-testid="test-icon" />;
    render(
      <Button>
        <TestIcon />
        Button with Icon
      </Button>
    );

    const button = screen.getByRole('button', { name: /button with icon/i });
    const icon = screen.getByTestId('test-icon');

    expect(button).toContainElement(icon);
  });
});
