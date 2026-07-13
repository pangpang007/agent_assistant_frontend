import type { NodeType, OutputVariable } from '@/types';

export function getNodeDefaultName(type: NodeType): string {
  const names: Record<NodeType, string> = {
    start: '开始',
    end: '结束',
    agent: 'Agent',
    knowledgeRetrieval: '知识检索',
    questionClassifier: '问题分类',
    parameterExtractor: '参数提取',
    condition: '条件分支',
    parallel: '并行执行',
    loop: '循环',
    review: '审核',
    test: '测试',
    delay: '延时',
    code: '代码执行',
    template: '模板转换',
    variableAggregator: '变量聚合',
    httpRequest: 'HTTP 请求',
  };
  return names[type] ?? type;
}

export function getNodeDefaultConfig(type: NodeType): Record<string, unknown> {
  const defaults: Record<NodeType, Record<string, unknown>> = {
    start: { inputVariables: [] as { name: string; type: string; required?: boolean }[] },
    end: { outputMappings: [] as { source: string; target: string }[] },
    agent: {
      agentId: null,
      inputMappings: [],
      outputVariables: [{ name: 'result', type: 'string' }],
    },
    knowledgeRetrieval: {
      knowledgeBaseId: null,
      queryVariable: '',
      topK: 3,
      minScore: 0.5,
    },
    questionClassifier: { modelId: null, inputVariable: '', categories: [] as string[] },
    parameterExtractor: { modelId: null, inputVariable: '', parameters: [] },
    condition: {
      branches: [
        { name: '条件 1', conditions: [] },
        { name: '默认', isDefault: true },
      ],
    },
    parallel: { branches: [{ name: '分支 1' }, { name: '分支 2' }] },
    loop: { arrayVariable: '', itemName: 'item', indexName: 'index' },
    review: {
      description: '',
      reviewer: '',
      timeoutDuration: 30,
      timeoutUnit: 'minutes',
      timeoutAction: 'terminate',
    },
    test: { assertions: [], failureAction: 'terminate' },
    delay: { duration: 10, unit: 'seconds' },
    code: {
      language: 'python',
      code: '',
      inputVariables: [],
      outputVariables: [{ name: 'result', type: 'string' }],
    },
    template: { template: '', outputVariable: 'output' },
    variableAggregator: { variables: [], outputVariable: 'aggregated', mode: 'array' },
    httpRequest: { method: 'GET', url: '', headers: [], authType: 'none', body: '' },
  };
  return defaults[type] ?? {};
}

export function getNodeDefaultOutputs(type: NodeType): OutputVariable[] {
  const defaults: Record<NodeType, OutputVariable[]> = {
    start: [],
    end: [],
    agent: [{ name: 'result', type: 'string', description: 'Agent 输出' }],
    knowledgeRetrieval: [{ name: 'results', type: 'array', description: '检索结果列表' }],
    questionClassifier: [{ name: 'category', type: 'string', description: '分类结果' }],
    parameterExtractor: [],
    condition: [],
    parallel: [],
    loop: [{ name: 'results', type: 'array', description: '循环结果汇总' }],
    review: [],
    test: [],
    delay: [],
    code: [],
    template: [{ name: 'output', type: 'string', description: '渲染结果' }],
    variableAggregator: [{ name: 'aggregated', type: 'array', description: '聚合结果' }],
    httpRequest: [
      { name: 'status_code', type: 'number', description: 'HTTP 状态码' },
      { name: 'body', type: 'any', description: '响应体' },
      { name: 'headers', type: 'object', description: '响应头' },
    ],
  };
  return defaults[type] ?? [];
}

export function createWorkflowNode(
  type: NodeType,
  position: { x: number; y: number },
  id?: string,
): import('@/types').WorkflowNode {
  return {
    id: id ?? `${type}_${Date.now()}`,
    type,
    position,
    data: {
      label: getNodeDefaultName(type),
      nodeType: type,
      config: getNodeDefaultConfig(type),
      outputs: getNodeDefaultOutputs(type),
    },
  };
}

export function getNodeGroupColor(nodeType: NodeType): string {
  const aiTypes: NodeType[] = [
    'agent',
    'knowledgeRetrieval',
    'questionClassifier',
    'parameterExtractor',
  ];
  const logicTypes: NodeType[] = ['condition', 'parallel', 'loop', 'review', 'test', 'delay'];
  const dataTypes: NodeType[] = ['code', 'template', 'variableAggregator'];

  if (nodeType === 'start') return 'var(--accent-success)';
  if (nodeType === 'end') return 'var(--accent-danger)';
  if (aiTypes.includes(nodeType)) return 'var(--accent-primary)';
  if (logicTypes.includes(nodeType)) return 'var(--accent-warning)';
  if (dataTypes.includes(nodeType)) return 'var(--accent-primary)';
  if (nodeType === 'httpRequest') return 'var(--accent-warning)';
  return 'var(--text-secondary)';
}
