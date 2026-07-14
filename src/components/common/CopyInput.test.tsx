import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CopyInput } from './CopyInput';

vi.mock('@/components/ui/Toast', () => ({
  useToast: () => ({ success: vi.fn() }),
}));

describe('CopyInput', () => {
  it('copies value to clipboard', async () => {
    const user = userEvent.setup();
    const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);

    render(<CopyInput value="sk-test-key" />);
    await user.click(screen.getByRole('button', { name: '复制' }));
    expect(writeText).toHaveBeenCalledWith('sk-test-key');

    writeText.mockRestore();
  });
});
