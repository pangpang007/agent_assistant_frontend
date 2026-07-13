import type { Meta, StoryObj } from '@storybook/react-vite';
import { Tag, Badge } from '@/components/ui/Tag';

const meta: Meta<typeof Tag> = {
  title: 'UI/Tag',
  component: Tag,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Tag>;

export const Default: Story = {
  args: { children: '默认' },
};

export const Primary: Story = {
  args: { color: 'primary', children: '进行中' },
};

export const Success: Story = {
  args: { color: 'success', children: '成功' },
};

export const Warning: Story = {
  args: { color: 'warning', children: '警告' },
};

export const Danger: Story = {
  args: { color: 'danger', children: '失败' },
};

export const Closable: Story = {
  args: { color: 'primary', closable: true, children: '可关闭' },
};

export const BadgeExample: Story = {
  render: () => (
    <Badge count={5}>
      <button type="button">消息</button>
    </Badge>
  ),
};

export const BadgeDot: Story = {
  render: () => (
    <Badge dot>
      <button type="button">通知</button>
    </Badge>
  ),
};
