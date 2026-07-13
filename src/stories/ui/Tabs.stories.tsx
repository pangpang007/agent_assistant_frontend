import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Tabs } from '@/components/ui/Tabs';

const meta: Meta<typeof Tabs> = {
  title: 'UI/Tabs',
  component: Tabs,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Tabs>;

export const Default: Story = {
  render: () => {
    const [activeKey, setActiveKey] = useState('tab1');
    return (
      <Tabs
        activeKey={activeKey}
        onChange={setActiveKey}
        items={[
          { key: 'tab1', label: '概览' },
          { key: 'tab2', label: '配置', badge: 3 },
          { key: 'tab3', label: '日志', disabled: true },
        ]}
      >
        <p style={{ color: 'var(--text-secondary)' }}>当前 Tab: {activeKey}</p>
      </Tabs>
    );
  },
};
