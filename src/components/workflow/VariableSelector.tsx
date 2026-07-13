import { useMemo, useState } from 'react';
import { FormSelect } from '@/components/shared/FormSelect';
import { getAvailableVariables } from '@/lib/workflow/variableResolver';
import { formatVariableRef } from '@/lib/workflow/variableResolver';
import { useWorkflowEditorStore } from '@/stores/workflowEditorStore';
import type { AvailableVariable } from '@/types';

interface VariableSelectorProps {
  nodeId: string;
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
}

export function VariableSelector({
  nodeId,
  value,
  onChange,
  label = '变量',
  placeholder = '选择变量',
}: VariableSelectorProps) {
  const nodes = useWorkflowEditorStore((s) => s.nodes);
  const edges = useWorkflowEditorStore((s) => s.edges);

  const variables = useMemo(
    () => getAvailableVariables(nodeId, nodes, edges),
    [nodeId, nodes, edges],
  );

  const groupedOptions = useMemo(() => {
    const byNode = new Map<string, AvailableVariable[]>();
    variables.forEach((v) => {
      const list = byNode.get(v.nodeLabel) ?? [];
      list.push(v);
      byNode.set(v.nodeLabel, list);
    });
    const options: { value: string; label: string; group?: string }[] = [];
    byNode.forEach((vars, nodeLabel) => {
      vars.forEach((v) => {
        options.push({
          value: formatVariableRef(v.fullRef),
          label: v.variableName,
          group: nodeLabel,
        });
      });
    });
    return options;
  }, [variables]);

  return (
    <FormSelect
      label={label}
      value={value}
      options={groupedOptions}
      onChange={onChange}
      placeholder={placeholder}
      emptyHint="暂无可用变量"
    />
  );
}

interface VariableInputProps {
  nodeId: string;
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  multiline?: boolean;
}

export function VariableInput({
  nodeId,
  value,
  onChange,
  label,
  placeholder,
  multiline = false,
}: VariableInputProps) {
  const [showPicker, setShowPicker] = useState(false);
  const nodes = useWorkflowEditorStore((s) => s.nodes);
  const edges = useWorkflowEditorStore((s) => s.edges);
  const variables = useMemo(
    () => getAvailableVariables(nodeId, nodes, edges),
    [nodeId, nodes, edges],
  );

  const insertVariable = (fullRef: string) => {
    onChange(`${value}${formatVariableRef(fullRef)}`);
    setShowPicker(false);
  };

  const InputTag = multiline ? 'textarea' : 'input';

  return (
    <div className="variable-input">
      {label ? <label className="panel-field__label">{label}</label> : null}
      <div className="variable-input__row">
        <InputTag
          className={multiline ? 'panel-field__textarea' : 'panel-field__input'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
        <button
          type="button"
          className="variable-input__insert"
          onClick={() => setShowPicker((v) => !v)}
        >
          @
        </button>
      </div>
      {showPicker && variables.length > 0 ? (
        <div className="variable-input__picker">
          {variables.map((v) => (
            <button
              key={v.fullRef}
              type="button"
              className="variable-input__option"
              onClick={() => insertVariable(v.fullRef)}
            >
              <span className="variable-input__option-node">{v.nodeLabel}</span>
              <span>{v.variableName}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
