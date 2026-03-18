import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConversationInput } from '@/components/home/ConversationInput';

describe('ConversationInput', () => {
  it('renders input with placeholder', () => {
    render(<ConversationInput onSubmit={vi.fn()} />);
    expect(screen.getByPlaceholderText('Talk to Neptune...')).toBeDefined();
  });

  it('calls onSubmit with trimmed message on form submit', () => {
    const onSubmit = vi.fn();
    render(<ConversationInput onSubmit={onSubmit} />);
    const input = screen.getByPlaceholderText('Talk to Neptune...');
    fireEvent.change(input, { target: { value: '  hello world  ' } });
    fireEvent.submit(input.closest('form')!);
    expect(onSubmit).toHaveBeenCalledWith('hello world');
  });

  it('does not submit empty messages', () => {
    const onSubmit = vi.fn();
    render(<ConversationInput onSubmit={onSubmit} />);
    const input = screen.getByPlaceholderText('Talk to Neptune...');
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.submit(input.closest('form')!);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('clears input after submit', () => {
    render(<ConversationInput onSubmit={vi.fn()} />);
    const input = screen.getByPlaceholderText('Talk to Neptune...') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'test message' } });
    fireEvent.submit(input.closest('form')!);
    expect(input.value).toBe('');
  });

  it('disables input when loading', () => {
    render(<ConversationInput onSubmit={vi.fn()} isLoading />);
    const input = screen.getByPlaceholderText('Talk to Neptune...') as HTMLInputElement;
    expect(input.disabled).toBe(true);
  });

  it('renders ambient pulse', () => {
    const { container } = render(<ConversationInput onSubmit={vi.fn()} />);
    expect(container.querySelector('[data-ambient-pulse]')).toBeDefined();
  });
});
