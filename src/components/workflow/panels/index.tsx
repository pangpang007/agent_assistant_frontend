import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { FormSelect } from '@/components/shared/FormSelect';
import { VariableInput, VariableSelector } from '@/components/workflow/VariableSelector';
import { agentService } from '@/services/agentService';
import { knowledgeService } from '@/services/knowledgeService';
import { useWorkflowEditorStore } from '@/stores/workflowEditorStore';
import type { NodeType, WorkflowNode } from '@/types';
import { findNodeLibraryItem } from '../nodeLibraryConfig';
import { NodeLibraryIcon } from '../WorkflowIcons';

export interface NodePanelProps {
  node: WorkflowNode;
}

function PanelField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="panel-field">
      <label className="panel-field__label">{label}</label>
      {children}
    </div>
  );
}

function useNodeConfig(node: WorkflowNode) {
  const updateNodeConfig = useWorkflowEditorStore((s) => s.updateNodeConfig);
  const updateNodeData = useWorkflowEditorStore((s) => s.updateNodeData);
  const config = node.data.config;

  const setConfig = useCallback(
    (patch: Record<string, unknown>) => {
      updateNodeConfig(node.id, patch);
    },
    [node.id, updateNodeConfig],
  );

  const setLabel = useCallback(
    (label: string) => updateNodeData(node.id, { label }),
    [node.id, updateNodeData],
  );

  return { config, setConfig, setLabel };
}

function CommonHeader({ node }: { node: WorkflowNode }) {
  const { setLabel } = useNodeConfig(node);
  const item = findNodeLibraryItem(node.type as NodeType);

  return (
    <div className="properties-panel__node-header">
      {item ? (
        <NodeLibraryIcon name={item.icon} color={item.color} size={20} />
      ) : null}
      <Input
        key={node.id + node.data.label}
        size="sm"
        defaultValue={node.data.label}
        onBlur={(e) => setLabel(e.target.value)}
      />
    </div>
  );
}

export function StartPanel({ node }: NodePanelProps) {
  const { config, setConfig } = useNodeConfig(node);
  const inputVariables =
    (config.inputVariables as { name: string; type: string; required?: boolean }[]) ?? [];

  const addVariable = () => {
    setConfig({
      inputVariables: [...inputVariables, { name: `input_${inputVariables.length + 1}`, type: 'string', required: true }],
    });
  };

  const updateVariable = (index: number, patch: Partial<(typeof inputVariables)[0]>) => {
    const next = inputVariables.map((v, i) => (i === index ? { ...v, ...patch } : v));
    setConfig({ inputVariables: next });
  };

  const removeVariable = (index: number) => {
    setConfig({ inputVariables: inputVariables.filter((_, i) => i !== index) });
  };

  return (
    <>
      <PanelField label="输入变量">
        {inputVariables.map((v, index) => (
          <div key={index} className="panel-field__row">
            <Input
              size="sm"
              value={v.name}
              onChange={(e) => updateVariable(index, { name: e.target.value })}
              placeholder="变量名"
            />
            <FormSelect
              size="sm"
              value={v.type}
              options={[
                { value: 'string', label: '字符串' },
                { value: 'number', label: '数字' },
                { value: 'boolean', label: '布尔' },
                { value: 'object', label: '对象' },
                { value: 'array', label: '数组' },
              ]}
              onChange={(type) => updateVariable(index, { type })}
            />
            <Button variant="ghost" size="sm" onClick={() => removeVariable(index)}>
              删除
            </Button>
          </div>
        ))}
        <Button variant="secondary" size="sm" onClick={addVariable}>
          添加变量
        </Button>
      </PanelField>
    </>
  );
}

export function EndPanel({ node }: NodePanelProps) {
  const { config, setConfig } = useNodeConfig(node);
  const mappings = (config.outputMappings as { source: string; target: string }[]) ?? [];

  const addMapping = () => {
    setConfig({ outputMappings: [...mappings, { source: '', target: '' }] });
  };

  const updateMapping = (index: number, patch: Partial<(typeof mappings)[0]>) => {
    setConfig({
      outputMappings: mappings.map((m, i) => (i === index ? { ...m, ...patch } : m)),
    });
  };

  return (
    <PanelField label="输出映射">
      {mappings.map((m, index) => (
        <div key={index} className="panel-field__row">
          <VariableSelector
            nodeId={node.id}
            value={m.source}
            onChange={(source) => updateMapping(index, { source })}
            label=""
            placeholder="来源变量"
          />
          <Input
            size="sm"
            value={m.target}
            onChange={(e) => updateMapping(index, { target: e.target.value })}
            placeholder="输出名"
          />
        </div>
      ))}
      <Button variant="secondary" size="sm" onClick={addMapping}>
        添加映射
      </Button>
    </PanelField>
  );
}

export function AgentPanel({ node }: NodePanelProps) {
  const { config, setConfig } = useNodeConfig(node);
  const [agents, setAgents] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    agentService
      .getList()
      .then((res) =>
        setAgents(
          (res.agents ?? []).map((a) => ({ value: a.id, label: a.name })),
        ),
      )
      .catch(() => setAgents([]));
  }, []);

  return (
    <>
      <PanelField label="Agent">
        <FormSelect
          value={(config.agentId as string) ?? ''}
          options={agents}
          onChange={(agentId) => {
            const agent = agents.find((a) => a.value === agentId);
            setConfig({ agentId, agentName: agent?.label ?? '' });
          }}
          placeholder="选择 Agent"
        />
      </PanelField>
      <VariableInput
        nodeId={node.id}
        label="用户输入"
        value={(config.userInput as string) ?? ''}
        onChange={(userInput) => setConfig({ userInput })}
        placeholder="输入或引用变量"
        multiline
      />
    </>
  );
}

export function KnowledgeRetrievalPanel({ node }: NodePanelProps) {
  const { config, setConfig } = useNodeConfig(node);
  const [kbs, setKbs] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    knowledgeService
      .getList()
      .then((res) =>
        setKbs(
          (res.knowledge_bases ?? []).map((kb) => ({
            value: kb.id,
            label: kb.name,
          })),
        ),
      )
      .catch(() => setKbs([]));
  }, []);

  return (
    <>
      <PanelField label="知识库">
        <FormSelect
          value={(config.knowledgeBaseId as string) ?? ''}
          options={kbs}
          onChange={(knowledgeBaseId) => {
            const kb = kbs.find((k) => k.value === knowledgeBaseId);
            setConfig({ knowledgeBaseId, knowledgeBaseName: kb?.label ?? '' });
          }}
          placeholder="选择知识库"
        />
      </PanelField>
      <VariableSelector
        nodeId={node.id}
        label="查询变量"
        value={(config.queryVariable as string) ?? ''}
        onChange={(queryVariable) => setConfig({ queryVariable })}
      />
      <PanelField label="Top K">
        <Input
          size="sm"
          type="number"
          value={String(config.topK ?? 3)}
          onChange={(e) => setConfig({ topK: Number(e.target.value) })}
        />
      </PanelField>
    </>
  );
}

export function QuestionClassifierPanel({ node }: NodePanelProps) {
  const { config, setConfig } = useNodeConfig(node);
  const categories = (config.categories as string[]) ?? [];
  const [text, setText] = useState(categories.join('\n'));

  return (
    <>
      <VariableSelector
        nodeId={node.id}
        label="输入变量"
        value={(config.inputVariable as string) ?? ''}
        onChange={(inputVariable) => setConfig({ inputVariable })}
      />
      <PanelField label="分类（每行一个）">
        <textarea
          className="panel-field__textarea"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={() =>
            setConfig({
              categories: text
                .split('\n')
                .map((s) => s.trim())
                .filter(Boolean),
            })
          }
          rows={5}
        />
      </PanelField>
    </>
  );
}

export function ParameterExtractorPanel({ node }: NodePanelProps) {
  const { config, setConfig } = useNodeConfig(node);
  const parameters = (config.parameters as { name: string; type: string }[]) ?? [];

  return (
    <>
      <VariableSelector
        nodeId={node.id}
        label="输入变量"
        value={(config.inputVariable as string) ?? ''}
        onChange={(inputVariable) => setConfig({ inputVariable })}
      />
      <PanelField label="提取参数">
        {parameters.map((p, index) => (
          <div key={index} className="panel-field__row">
            <Input
              size="sm"
              value={p.name}
              onChange={(e) => {
                const next = parameters.map((item, i) =>
                  i === index ? { ...item, name: e.target.value } : item,
                );
                setConfig({ parameters: next });
              }}
            />
            <FormSelect
              size="sm"
              value={p.type}
              options={[
                { value: 'string', label: '字符串' },
                { value: 'number', label: '数字' },
                { value: 'boolean', label: '布尔' },
              ]}
              onChange={(type) => {
                const next = parameters.map((item, i) =>
                  i === index ? { ...item, type } : item,
                );
                setConfig({ parameters: next });
              }}
            />
          </div>
        ))}
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setConfig({ parameters: [...parameters, { name: '', type: 'string' }] })}
        >
          添加参数
        </Button>
      </PanelField>
    </>
  );
}

export function ConditionPanel({ node }: NodePanelProps) {
  const { config, setConfig } = useNodeConfig(node);
  const branches = (config.branches as { name: string; isDefault?: boolean }[]) ?? [];

  return (
    <PanelField label="分支">
      {branches.map((branch, index) => (
        <div key={index} className="panel-field__row">
          <Input
            size="sm"
            value={branch.name}
            disabled={branch.isDefault}
            onChange={(e) => {
              const next = branches.map((b, i) =>
                i === index ? { ...b, name: e.target.value } : b,
              );
              setConfig({ branches: next });
            }}
          />
        </div>
      ))}
      <Button
        variant="secondary"
        size="sm"
        onClick={() =>
          setConfig({
            branches: [...branches, { name: `条件 ${branches.length}`, conditions: [] }],
          })
        }
      >
        添加分支
      </Button>
    </PanelField>
  );
}

export function ParallelPanel({ node }: NodePanelProps) {
  const { config, setConfig } = useNodeConfig(node);
  const branches = (config.branches as { name: string }[]) ?? [];

  return (
    <PanelField label="并行分支">
      {branches.map((branch, index) => (
        <Input
          key={index}
          size="sm"
          value={branch.name}
          onChange={(e) => {
            const next = branches.map((b, i) =>
              i === index ? { ...b, name: e.target.value } : b,
            );
            setConfig({ branches: next });
          }}
        />
      ))}
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setConfig({ branches: [...branches, { name: `分支 ${branches.length + 1}` }] })}
      >
        添加分支
      </Button>
    </PanelField>
  );
}

export function LoopPanel({ node }: NodePanelProps) {
  const { config, setConfig } = useNodeConfig(node);
  return (
    <>
      <VariableSelector
        nodeId={node.id}
        label="数组变量"
        value={(config.arrayVariable as string) ?? ''}
        onChange={(arrayVariable) => setConfig({ arrayVariable })}
      />
      <PanelField label="当前项变量名">
        <Input
          size="sm"
          value={(config.itemName as string) ?? 'item'}
          onChange={(e) => setConfig({ itemName: e.target.value })}
        />
      </PanelField>
    </>
  );
}

export function ReviewPanel({ node }: NodePanelProps) {
  const { config, setConfig } = useNodeConfig(node);
  return (
    <>
      <PanelField label="审核说明">
        <textarea
          className="panel-field__textarea"
          value={(config.description as string) ?? ''}
          onChange={(e) => setConfig({ description: e.target.value })}
          rows={3}
        />
      </PanelField>
      <PanelField label="超时（分钟）">
        <Input
          size="sm"
          type="number"
          value={String(config.timeoutDuration ?? 30)}
          onChange={(e) => setConfig({ timeoutDuration: Number(e.target.value) })}
        />
      </PanelField>
    </>
  );
}

export function TestPanel({ node }: NodePanelProps) {
  const { config, setConfig } = useNodeConfig(node);
  const assertions = (config.assertions as { expression: string }[]) ?? [];

  return (
    <PanelField label="断言规则">
      {assertions.map((a, index) => (
        <Input
          key={index}
          size="sm"
          value={a.expression}
          onChange={(e) => {
            const next = assertions.map((item, i) =>
              i === index ? { expression: e.target.value } : item,
            );
            setConfig({ assertions: next });
          }}
          placeholder="表达式"
        />
      ))}
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setConfig({ assertions: [...assertions, { expression: '' }] })}
      >
        添加断言
      </Button>
    </PanelField>
  );
}

export function DelayPanel({ node }: NodePanelProps) {
  const { config, setConfig } = useNodeConfig(node);
  return (
    <>
      <PanelField label="延时时长">
        <Input
          size="sm"
          type="number"
          value={String(config.duration ?? 10)}
          onChange={(e) => setConfig({ duration: Number(e.target.value) })}
        />
      </PanelField>
      <PanelField label="单位">
        <FormSelect
          value={(config.unit as string) ?? 'seconds'}
          options={[
            { value: 'seconds', label: '秒' },
            { value: 'minutes', label: '分钟' },
          ]}
          onChange={(unit) => setConfig({ unit })}
        />
      </PanelField>
    </>
  );
}

export function CodePanel({ node }: NodePanelProps) {
  const { config, setConfig } = useNodeConfig(node);
  const [monacoFailed, setMonacoFailed] = useState(false);

  return (
    <>
      <PanelField label="语言">
        <FormSelect
          value={(config.language as string) ?? 'python'}
          options={[
            { value: 'python', label: 'Python' },
            { value: 'javascript', label: 'JavaScript' },
          ]}
          onChange={(language) => setConfig({ language })}
        />
      </PanelField>
      <PanelField label="代码">
        {monacoFailed ? (
          <textarea
            className="panel-field__textarea panel-field__textarea--code"
            value={(config.code as string) ?? ''}
            onChange={(e) => setConfig({ code: e.target.value })}
            rows={12}
          />
        ) : (
          <MonacoEditorLazy
            language={(config.language as string) === 'javascript' ? 'javascript' : 'python'}
            value={(config.code as string) ?? ''}
            onChange={(code) => setConfig({ code })}
            onError={() => setMonacoFailed(true)}
          />
        )}
      </PanelField>
    </>
  );
}

function MonacoEditorLazy({
  language,
  value,
  onChange,
  onError,
}: {
  language: string;
  value: string;
  onChange: (value: string) => void;
  onError: () => void;
}) {
  const [EditorComponent, setEditorComponent] = useState<
    typeof import('@monaco-editor/react').default | null
  >(null);

  useEffect(() => {
    import('@monaco-editor/react')
      .then((mod) => setEditorComponent(() => mod.default))
      .catch(() => onError());
  }, [onError]);

  if (!EditorComponent) {
    return <div className="panel-field__loading">加载编辑器...</div>;
  }

  const Editor = EditorComponent;

  return (
    <Editor
      language={language}
      value={value}
      onChange={(v) => onChange(v ?? '')}
      height="240px"
      theme="vs-dark"
      options={{ minimap: { enabled: false }, fontSize: 13 }}
    />
  );
}

export function TemplatePanel({ node }: NodePanelProps) {
  const { config, setConfig } = useNodeConfig(node);
  return (
    <VariableInput
      nodeId={node.id}
      label="Jinja2 模板"
      value={(config.template as string) ?? ''}
      onChange={(template) => setConfig({ template })}
      multiline
    />
  );
}

export function VariableAggregatorPanel({ node }: NodePanelProps) {
  const { config, setConfig } = useNodeConfig(node);
  const variables = (config.variables as string[]) ?? [];
  const [text, setText] = useState(variables.join('\n'));

  return (
    <>
      <PanelField label="聚合变量（每行一个引用）">
        <textarea
          className="panel-field__textarea"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={() =>
            setConfig({
              variables: text
                .split('\n')
                .map((s) => s.trim())
                .filter(Boolean),
            })
          }
          rows={5}
        />
      </PanelField>
      <PanelField label="输出变量名">
        <Input
          size="sm"
          value={(config.outputVariable as string) ?? 'aggregated'}
          onChange={(e) => setConfig({ outputVariable: e.target.value })}
        />
      </PanelField>
    </>
  );
}

export function HttpRequestPanel({ node }: NodePanelProps) {
  const { config, setConfig } = useNodeConfig(node);
  return (
    <>
      <PanelField label="方法">
        <FormSelect
          value={(config.method as string) ?? 'GET'}
          options={['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map((m) => ({
            value: m,
            label: m,
          }))}
          onChange={(method) => setConfig({ method })}
        />
      </PanelField>
      <VariableInput
        nodeId={node.id}
        label="URL"
        value={(config.url as string) ?? ''}
        onChange={(url) => setConfig({ url })}
      />
      <PanelField label="请求体">
        <textarea
          className="panel-field__textarea"
          value={(config.body as string) ?? ''}
          onChange={(e) => setConfig({ body: e.target.value })}
          rows={4}
        />
      </PanelField>
    </>
  );
}

export const panelComponents: Record<NodeType, React.ComponentType<NodePanelProps>> = {
  start: StartPanel,
  end: EndPanel,
  agent: AgentPanel,
  knowledgeRetrieval: KnowledgeRetrievalPanel,
  questionClassifier: QuestionClassifierPanel,
  parameterExtractor: ParameterExtractorPanel,
  condition: ConditionPanel,
  parallel: ParallelPanel,
  loop: LoopPanel,
  review: ReviewPanel,
  test: TestPanel,
  delay: DelayPanel,
  code: CodePanel,
  template: TemplatePanel,
  variableAggregator: VariableAggregatorPanel,
  httpRequest: HttpRequestPanel,
};

export { CommonHeader };
