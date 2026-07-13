import type { Meta, StoryObj } from '@storybook/react-vite';
import { LayoutDashboard } from 'lucide-react';
import { MenuItem } from '@/components/ui/Sidebar';

const meta: Meta<typeof MenuItem> = {
  title: 'UI/Sidebar/MenuItem',
  component: MenuItem,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof MenuItem>;

export const Default: Story = {
  args: {
    icon: <LayoutDashboard size={16} strokeWidth={1.5} />,
    label: 'Dashboard',
    path: '/',
  },
};

export const Active: Story = {
  args: {
    icon: <LayoutDashboard size={16} strokeWidth={1.5} />,
    label: 'Dashboard',
    active: true,
  },
};

export const Collapsed: Story = {
  args: {
    icon: <LayoutDashboard size={16} strokeWidth={1.5} />,
    label: 'Dashboard',
    collapsed: true,
  },
};

export const WithChildren: Story = {
  args: {
    icon: <LayoutDashboard size={16} strokeWidth={1.5} />,
    label: '工作流',
    expanded: true,
    children: [
      { icon: undefined, label: '列表', path: '/workflows' },
      { icon: undefined, label: '编辑器', path: '/workflows/new', active: true },
    ],
  },
};
