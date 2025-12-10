Write comprehensive tests for this component including:

## Unit Tests
- Test all props and their variations
- Test all component states
- Test computed values and derived state
- Test conditional rendering logic

## User Interaction Tests
- Test all click handlers
- Test form submissions
- Test keyboard interactions (Tab, Enter, Space, Escape)
- Test focus management

## Accessibility Tests
- Verify ARIA labels and roles
- Test keyboard navigation flow
- Check focus indicators
- Verify screen reader announcements

## Edge Cases
- Test with missing/invalid props
- Test error states
- Test loading states
- Test empty states

## Integration
- Test with parent component interactions
- Test with context providers
- Test with API mocking (if applicable)

Use Vitest and React Testing Library following our project standards.

**Example test structure:**
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('renders with required props', () => {
    render(<MyComponent title="Test" />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('handles click events', async () => {
    const handleClick = vi.fn();
    render(<MyComponent onClick={handleClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it('is keyboard accessible', () => {
    render(<MyComponent />);
    const button = screen.getByRole('button');
    button.focus();
    expect(button).toHaveFocus();
  });
});
```

