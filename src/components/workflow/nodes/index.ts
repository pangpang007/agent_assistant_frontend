import {
  BookOpen,
  Bot,
  Clock,
  Code,
  Columns,
  Combine,
  FileCode,
  FormInput,
  GitBranch,
  Globe,
  Play,
  Repeat,
  Square,
  TestTubes,
  UserCheck,
} from 'lucide-react';
import { branchOutputs, createSimpleNode, distributeHandles } from './nodeFactory';

export const StartNode = createSimpleNode({
  type: 'start',
  icon: Play,
  inputs: [],
  outputs: [{ id: 'output' }],
  getSummary: (config) => {
    const vars = (config.inputVariables as unknown[]) ?? [];
    return vars.length > 0 ? `${vars.length} 个输入变量` : '点击配置输入变量';
  },
});

export const EndNode = createSimpleNode({
  type: 'end',
  icon: Square,
  inputs: [{ id: 'input' }],
  outputs: [],
  getSummary: (config) => {
    const mappings = (config.outputMappings as unknown[]) ?? [];
    return mappings.length > 0 ? `引用 ${mappings.length} 个输出` : '点击配置输出';
  },
});

export const AgentNode = createSimpleNode({
  type: 'agent',
  icon: Bot,
  getSummary: (config) =>
    config.agentName ? String(config.agentName) : '点击选择 Agent',
});

export const KnowledgeRetrievalNode = createSimpleNode({
  type: 'knowledgeRetrieval',
  icon: BookOpen,
  getSummary: (config) => {
    if (config.knowledgeBaseName) return String(config.knowledgeBaseName);
    return config.knowledgeBaseId ? '已配置知识库' : '点击配置知识库';
  },
});

export const QuestionClassifierNode = createSimpleNode({
  type: 'questionClassifier',
  icon: GitBranch,
  outputs: (config) => branchOutputs(config, 'categories'),
  getSummary: (config) => {
    const categories = (config.categories as string[]) ?? [];
    if (categories.length === 0) return '点击配置分类';
    const preview = categories.slice(0, 2).join(', ');
    return categories.length > 2 ? `${categories.length} 个分类: ${preview}...` : preview;
  },
});

export const ParameterExtractorNode = createSimpleNode({
  type: 'parameterExtractor',
  icon: FormInput,
  getSummary: (config) => {
    const params = (config.parameters as unknown[]) ?? [];
    return params.length > 0 ? `提取 ${params.length} 个参数` : '点击配置参数';
  },
});

export const ConditionNode = createSimpleNode({
  type: 'condition',
  icon: GitBranch,
  outputs: (config) => branchOutputs(config, 'branches'),
  getSummary: (config) => {
    const branches = (config.branches as { name: string }[]) ?? [];
    if (branches.length === 0) return '点击配置条件';
    const preview = branches
      .slice(0, 2)
      .map((b) => b.name)
      .join(', ');
    return branches.length > 2 ? `${branches.length} 个分支: ${preview}...` : preview;
  },
});

export const ParallelNode = createSimpleNode({
  type: 'parallel',
  icon: Columns,
  outputs: (config) => branchOutputs(config, 'branches'),
  getSummary: (config) => {
    const branches = (config.branches as unknown[]) ?? [];
    return branches.length > 0 ? `${branches.length} 路并行` : '点击配置分支';
  },
});

export const LoopNode = createSimpleNode({
  type: 'loop',
  icon: Repeat,
  getSummary: (config) => {
    if (config.arrayVariable) {
      return `遍历 ${String(config.arrayVariable)} → ${String(config.itemName ?? 'item')}`;
    }
    return '点击配置循环';
  },
});

export const ReviewNode = createSimpleNode({
  type: 'review',
  icon: UserCheck,
  outputs: () => {
    const positions = distributeHandles(2);
    return [
      { id: 'approved', label: '通过', top: positions[0] },
      { id: 'rejected', label: '驳回', top: positions[1] },
    ];
  },
  getSummary: (config) =>
    config.description ? String(config.description) : '点击配置审核',
});

export const TestNode = createSimpleNode({
  type: 'test',
  icon: TestTubes,
  outputs: () => {
    const positions = distributeHandles(2);
    return [
      { id: 'passed', label: '通过', top: positions[0] },
      { id: 'failed', label: '失败', top: positions[1] },
    ];
  },
  getSummary: (config) => {
    const assertions = (config.assertions as unknown[]) ?? [];
    return assertions.length > 0 ? `${assertions.length} 条断言规则` : '点击配置断言';
  },
});

export const DelayNode = createSimpleNode({
  type: 'delay',
  icon: Clock,
  getSummary: (config) => {
    if (config.duration) {
      const unit = config.unit === 'minutes' ? '分钟' : '秒';
      return `等待 ${String(config.duration)} ${unit}`;
    }
    return '点击设置延时';
  },
});

export const CodeNode = createSimpleNode({
  type: 'code',
  icon: Code,
  getSummary: (config) => {
    const lang = config.language === 'javascript' ? 'JavaScript' : 'Python';
    const code = (config.code as string) ?? '';
    const lines = code.split('\n').filter(Boolean).length;
    return code ? `${lang} · ${lines} 行代码` : '点击编写代码';
  },
});

export const TemplateNode = createSimpleNode({
  type: 'template',
  icon: FileCode,
  getSummary: (config) =>
    config.template ? '已配置模板' : '点击配置模板',
});

export const VariableAggregatorNode = createSimpleNode({
  type: 'variableAggregator',
  icon: Combine,
  inputs: [{ id: 'input-0' }],
  getSummary: (config) => {
    const vars = (config.variables as unknown[]) ?? [];
    return vars.length > 0 ? `聚合 ${vars.length} 个变量` : '点击配置变量';
  },
});

export const HttpRequestNode = createSimpleNode({
  type: 'httpRequest',
  icon: Globe,
  getSummary: (config) => {
    if (config.url) return `${String(config.method ?? 'GET')} ${String(config.url)}`;
    return '点击配置 HTTP 请求';
  },
});

export const nodeTypes = {
  start: StartNode,
  end: EndNode,
  agent: AgentNode,
  knowledgeRetrieval: KnowledgeRetrievalNode,
  questionClassifier: QuestionClassifierNode,
  parameterExtractor: ParameterExtractorNode,
  condition: ConditionNode,
  parallel: ParallelNode,
  loop: LoopNode,
  review: ReviewNode,
  test: TestNode,
  delay: DelayNode,
  code: CodeNode,
  template: TemplateNode,
  variableAggregator: VariableAggregatorNode,
  httpRequest: HttpRequestNode,
};
