import type { Meta, StoryObj } from '@storybook/react-vite';
import { Spinner, Skeleton } from '@/components/ui/Spinner';

const meta: Meta<typeof Spinner> = {
  title: 'UI/Spinner',
  component: Spinner,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Spinner>;

export const Default: Story = {};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
      <Spinner size="sm" />
      <Spinner size="md" />
      <Spinner size="lg" />
    </div>
  ),
};

export const SkeletonText: Story = {
  render: () => <Skeleton variant="text" lines={3} width="100%" />,
};

export const SkeletonCircular: Story = {
  render: () => <Skeleton variant="circular" width={48} height={48} />,
};

export const SkeletonRectangular: Story = {
  render: () => <Skeleton variant="rectangular" width={200} height={120} />,
};
