import type { Meta, StoryObj } from '@storybook/react-vite';
import { Settings, User } from 'lucide-react';
import { Dropdown } from '@/components/ui/Dropdown';
import { Button } from '@/components/ui/Button';

const meta: Meta<typeof Dropdown> = {
  title: 'UI/Dropdown',
  component: Dropdown,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Dropdown>;

export const Default: Story = {
  render: () => (
    <Dropdown
      trigger={<Button variant="secondary">菜单</Button>}
      items={[
        { key: 'profile', label: '个人设置', icon: <User size={16} /> },
        { key: 'settings', label: '系统设置', icon: <Settings size={16} /> },
        { key: 'logout', label: '退出登录', danger: true, divider: true },
      ]}
      onSelect={(key) => alert(key)}
    />
  ),
};
