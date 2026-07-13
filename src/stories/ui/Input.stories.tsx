import type { Meta, StoryObj } from '@storybook/react-vite';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/Input';

const meta: Meta<typeof Input> = {
  title: 'UI/Input',
  component: Input,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {
  args: { placeholder: '请输入内容', label: '名称' },
};

export const WithIcon: Story = {
  args: {
    placeholder: '搜索...',
    leftIcon: <Search size={16} strokeWidth={1.5} />,
  },
};

export const WithError: Story = {
  args: {
    label: '邮箱',
    value: 'invalid',
    error: '请输入有效的邮箱地址',
  },
};

export const WithPrefixSuffix: Story = {
  args: {
    prefix: 'https://',
    suffix: '.com',
    placeholder: 'example',
  },
};

export const Disabled: Story = {
  args: { placeholder: '不可编辑', disabled: true },
};
