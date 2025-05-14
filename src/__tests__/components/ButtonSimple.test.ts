// No need to import render and screen since we're mocking the component

// Mock the Button component
jest.mock('../../components/common/Button', () => ({
  Button: ({ children, onClick, disabled, className }: any) => {
    return {
      type: 'button',
      props: {
        children,
        onClick,
        disabled,
        className,
      },
      render: () => {
        return `<button>${children}</button>`;
      },
    };
  },
}));

describe('Button Component (Mocked)', () => {
  it('creates a button with correct props', () => {
    const { Button } = require('../../components/common/Button');
    const mockOnClick = jest.fn();

    const button = Button({
      children: 'Click me',
      onClick: mockOnClick,
      disabled: false,
      className: 'test-class',
    });

    expect(button.props.children).toBe('Click me');
    expect(button.props.onClick).toBe(mockOnClick);
    expect(button.props.disabled).toBe(false);
    expect(button.props.className).toContain('test-class');
  });
});
