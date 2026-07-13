import type { NodeType } from '@/types';

export interface NodeLibraryItemConfig {
  type: NodeType;
  name: string;
  description: string;
  icon: string;
  color: string;
  group: string;
}

export interface NodeLibraryGroupConfig {
  name: string;
  items: NodeLibraryItemConfig[];
}

export const nodeLibraryGroups: NodeLibraryGroupConfig[] = [
  {
    name: '基础节点',
    items: [
      {
        type: 'start',
        name: '开始',
        description: '工作流的起点',
        icon: 'Play',
        color: 'var(--accent-success)',
        group: 'basic',
      },
      {
        type: 'end',
        name: '结束',
        description: '定义最终输出',
        icon: 'Square',
        color: 'var(--accent-danger)',
        group: 'basic',
      },
    ],
  },
  {
    name: 'AI 能力节点',
    items: [
      {
        type: 'agent',
        name: 'Agent',
        description: '调用 AI Agent',
        icon: 'Bot',
        color: 'var(--accent-primary)',
        group: 'ai',
      },
      {
        type: 'knowledgeRetrieval',
        name: '知识检索',
        description: '检索知识库内容',
        icon: 'BookOpen',
        color: 'var(--accent-primary)',
        group: 'ai',
      },
      {
        type: 'questionClassifier',
        name: '问题分类',
        description: 'LLM 智能分类',
        icon: 'GitBranch',
        color: 'var(--accent-primary)',
        group: 'ai',
      },
      {
        type: 'parameterExtractor',
        name: '参数提取',
        description: '提取结构化参数',
        icon: 'FormInput',
        color: 'var(--accent-primary)',
        group: 'ai',
      },
    ],
  },
  {
    name: '逻辑控制节点',
    items: [
      {
        type: 'condition',
        name: '条件分支',
        description: 'If-Else 条件判断',
        icon: 'GitBranch',
        color: 'var(--accent-warning)',
        group: 'logic',
      },
      {
        type: 'parallel',
        name: '并行执行',
        description: '多分支并行处理',
        icon: 'Columns',
        color: 'var(--accent-warning)',
        group: 'logic',
      },
      {
        type: 'loop',
        name: '循环/迭代',
        description: '遍历数组执行',
        icon: 'Repeat',
        color: 'var(--accent-warning)',
        group: 'logic',
      },
    ],
  },
  {
    name: '交互控制节点',
    items: [
      {
        type: 'review',
        name: '审核',
        description: '人工审核节点',
        icon: 'UserCheck',
        color: 'var(--accent-warning)',
        group: 'interaction',
      },
      {
        type: 'test',
        name: '测试',
        description: '断言测试节点',
        icon: 'TestTubes',
        color: 'var(--accent-warning)',
        group: 'interaction',
      },
      {
        type: 'delay',
        name: '延时等待',
        description: '暂停指定时间',
        icon: 'Clock',
        color: 'var(--accent-warning)',
        group: 'interaction',
      },
    ],
  },
  {
    name: '数据处理节点',
    items: [
      {
        type: 'code',
        name: '代码执行',
        description: '执行 Python/JS',
        icon: 'Code',
        color: 'var(--accent-primary)',
        group: 'data',
      },
      {
        type: 'template',
        name: '模板转换',
        description: 'Jinja2 模板渲染',
        icon: 'FileCode',
        color: 'var(--accent-primary)',
        group: 'data',
      },
      {
        type: 'variableAggregator',
        name: '变量聚合',
        description: '合并多个变量',
        icon: 'Combine',
        color: 'var(--accent-primary)',
        group: 'data',
      },
    ],
  },
  {
    name: '外部集成节点',
    items: [
      {
        type: 'httpRequest',
        name: 'HTTP 请求',
        description: '调用 REST API',
        icon: 'Globe',
        color: 'var(--accent-warning)',
        group: 'external',
      },
    ],
  },
];

export function findNodeLibraryItem(type: NodeType): NodeLibraryItemConfig | undefined {
  for (const group of nodeLibraryGroups) {
    const item = group.items.find((i) => i.type === type);
    if (item) return item;
  }
  return undefined;
}
