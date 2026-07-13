import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

const meta: Meta<typeof Modal> = {
  title: 'UI/Modal',
  component: Modal,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Modal>;

export const Default: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button variant="primary" onClick={() => setOpen(true)}>
          打开弹窗
        </Button>
        <Modal
          open={open}
          onClose={() => setOpen(false)}
          title="确认操作"
          description="此操作不可撤销，请确认"
          footer={
            <>
              <Button variant="secondary" onClick={() => setOpen(false)}>
                取消
              </Button>
              <Button variant="primary" onClick={() => setOpen(false)}>
                确认
              </Button>
            </>
          }
        >
          <p style={{ color: 'var(--text-secondary)' }}>弹窗内容区域</p>
        </Modal>
      </>
    );
  },
};

export const Sizes: Story = {
  render: () => {
    const [size, setSize] = useState<'sm' | 'md' | 'lg' | null>(null);
    return (
      <>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['sm', 'md', 'lg'] as const).map((s) => (
            <Button key={s} variant="secondary" onClick={() => setSize(s)}>
              {s}
            </Button>
          ))}
        </div>
        <Modal
          open={size !== null}
          onClose={() => setSize(null)}
          title={`${size} 尺寸`}
          size={size ?? 'md'}
        >
          内容
        </Modal>
      </>
    );
  },
};
