import type { Meta, StoryObj } from '@storybook/react-vite';
import { EmptyState } from '@/components/ui/EmptyState';

const meta: Meta<typeof EmptyState> = {
  title: 'UI/EmptyState',
  component: EmptyState,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof EmptyState>;

export const Default: Story = {
  args: {
    title: '暂无数据',
    description: '还没有任何内容，点击下方按钮创建',
    action: { label: '创建', onClick: () => {} },
  },
};

export const WithoutAction: Story = {
  args: {
    title: '空列表',
    description: '当前没有任何记录',
  },
};
