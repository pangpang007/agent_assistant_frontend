import type { Meta, StoryObj } from '@storybook/react-vite';
import { Card } from '@/components/ui/Card';

const meta: Meta<typeof Card> = {
  title: 'UI/Card',
  component: Card,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Card>;

export const Default: Story = {
  args: {
    title: '卡片标题',
    description: '这是一段描述文字',
    children: '卡片内容区域',
  },
};

export const Hoverable: Story = {
  args: {
    title: '可悬浮卡片',
    hoverable: true,
    children: '鼠标悬停查看效果',
  },
};

export const Clickable: Story = {
  args: {
    title: '可点击卡片',
    hoverable: true,
    onClick: () => alert('clicked'),
    children: '点击查看',
  },
};
