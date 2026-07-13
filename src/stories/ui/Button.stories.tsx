import type { Meta, StoryObj } from '@storybook/react-vite';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: { variant: 'primary', children: '保存' },
};

export const Secondary: Story = {
  args: { variant: 'secondary', children: '取消' },
};

export const Danger: Story = {
  args: { variant: 'danger', children: '删除' },
};

export const Ghost: Story = {
  args: { variant: 'ghost', children: '更多' },
};

export const WithIcons: Story = {
  args: {
    variant: 'primary',
    leftIcon: <Plus size={16} strokeWidth={1.5} />,
    children: '创建',
  },
};

export const Loading: Story = {
  args: { variant: 'primary', loading: true, children: '提交中' },
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
    </div>
  ),
};

export const Disabled: Story = {
  args: { variant: 'primary', disabled: true, children: '禁用' },
};
