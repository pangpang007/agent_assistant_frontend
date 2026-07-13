import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

const meta: Meta = {
  title: 'UI/Toast',
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

function ToastDemo() {
  const { success, error, warning, info } = useToast();
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <Button variant="primary" onClick={() => success('操作成功', '数据已保存')}>
        Success
      </Button>
      <Button variant="danger" onClick={() => error('操作失败', '请重试')}>
        Error
      </Button>
      <Button variant="secondary" onClick={() => warning('注意', '配额即将用尽')}>
        Warning
      </Button>
      <Button variant="ghost" onClick={() => info('提示', '新版本可用')}>
        Info
      </Button>
    </div>
  );
}

export const AllTypes: Story = {
  render: () => <ToastDemo />,
};
