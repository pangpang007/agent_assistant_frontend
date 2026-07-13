import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Table, type SortOrder } from '@/components/ui/Table';
import { Tag } from '@/components/ui/Tag';

interface Row extends Record<string, unknown> {
  id: string;
  name: string;
  status: string;
}

const data: Row[] = [
  { id: '1', name: '工作流 A', status: '运行中' },
  { id: '2', name: '工作流 B', status: '已完成' },
  { id: '3', name: '工作流 C', status: '失败' },
];

const meta: Meta<typeof Table> = {
  title: 'UI/Table',
  component: Table,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Table<Row>>;

export const Default: Story = {
  render: () => {
    const [sortKey, setSortKey] = useState<string | null>(null);
    const [sortOrder, setSortOrder] = useState<SortOrder>(null);
    return (
      <Table
        columns={[
          { key: 'name', title: '名称', dataIndex: 'name', sortable: true },
          {
            key: 'status',
            title: '状态',
            dataIndex: 'status',
            render: (v) => <Tag color="primary">{String(v)}</Tag>,
          },
        ]}
        data={data}
        rowKey="id"
        sortKey={sortKey}
        sortOrder={sortOrder}
        onSort={(key, order) => {
          setSortKey(order ? key : null);
          setSortOrder(order);
        }}
        pagination={{
          current: 1,
          pageSize: 10,
          total: 30,
          onChange: () => {},
        }}
      />
    );
  },
};

export const Loading: Story = {
  render: () => (
    <Table
      columns={[{ key: 'name', title: '名称', dataIndex: 'name' }]}
      data={[]}
      rowKey="id"
      loading
    />
  ),
};

export const Empty: Story = {
  render: () => (
    <Table
      columns={[{ key: 'name', title: '名称', dataIndex: 'name' }]}
      data={[]}
      rowKey="id"
      emptyText="暂无工作流"
    />
  ),
};
