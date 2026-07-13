import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Dropdown } from '@/components/ui/Dropdown';
import { useWorkflowEditorStore } from '@/stores/workflowEditorStore';

interface VersionSelectorProps {
  onSelectVersion: (version: number) => void;
}

export function VersionSelector({ onSelectVersion }: VersionSelectorProps) {
  const versions = useWorkflowEditorStore((s) => s.versions);
  const currentVersionNumber = useWorkflowEditorStore((s) => s.currentVersionNumber);

  const items = versions.map((v) => ({
    key: String(v.version),
    label: `v${v.version}${v.note ? ` - ${v.note}` : ''}`,
  }));

  if (items.length === 0) {
    return (
      <Button variant="ghost" size="sm" disabled>
        v{currentVersionNumber}
      </Button>
    );
  }

  return (
    <Dropdown
      trigger={
        <Button variant="ghost" size="sm" rightIcon={<ChevronDown size={14} />}>
          v{currentVersionNumber}
        </Button>
      }
      items={items}
      onSelect={(key) => onSelectVersion(Number(key))}
      align="right"
    />
  );
}
