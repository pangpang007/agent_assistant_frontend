import type { Meta, StoryObj } from '@storybook/react-vite';
import { Tooltip } from '@/components/ui/Tooltip';
import { Button } from '@/components/ui/Button';

const meta: Meta<typeof Tooltip> = {
  title: 'UI/Tooltip',
  component: Tooltip,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Tooltip>;

export const Default: Story = {
  render: () => (
    <Tooltip content="这是提示文字">
      <Button variant="secondary">悬停查看</Button>
    </Tooltip>
  ),
};

export const Placements: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 16, padding: 40 }}>
      {(['top', 'bottom', 'left', 'right'] as const).map((p) => (
        <Tooltip key={p} content={`${p} placement`} placement={p}>
          <Button variant="ghost">{p}</Button>
        </Tooltip>
      ))}
    </div>
  ),
};
