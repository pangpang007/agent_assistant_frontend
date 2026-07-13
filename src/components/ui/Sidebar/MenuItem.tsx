import type { ReactNode } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Tooltip } from '../Tooltip';
import './Sidebar.css';

export interface MenuItemConfig {
  key: string;
  label: string;
  icon?: ReactNode;
  path?: string;
  children?: MenuItemConfig[];
}

export interface MenuItemProps {
  icon?: ReactNode;
  label: string;
  path?: string;
  children?: MenuItemProps[];
  active?: boolean;
  collapsed?: boolean;
  expanded?: boolean;
  onToggle?: () => void;
  onClick?: () => void;
  depth?: number;
}

export function MenuItem({
  icon,
  label,
  path,
  children,
  active = false,
  collapsed = false,
  expanded = false,
  onToggle,
  onClick,
  depth = 0,
}: MenuItemProps) {
  const hasChildren = children && children.length > 0;

  const itemClass = (isActive = active) =>
    cn(
      'menu-item',
      isActive && 'menu-item--active',
      collapsed && 'menu-item--collapsed',
      depth > 0 && 'menu-item--nested',
    );

  const content = (
    <>
      <span className="menu-item__icon">{icon}</span>
      {!collapsed && <span className="menu-item__label">{label}</span>}
      {!collapsed && hasChildren && (
        <span className="menu-item__chevron">
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </span>
      )}
    </>
  );

  let inner: ReactNode;

  if (path && !hasChildren) {
    inner = (
      <NavLink
        to={path}
        className={({ isActive }) => itemClass(isActive || active)}
        onClick={onClick}
      >
        {content}
      </NavLink>
    );
  } else {
    inner = (
      <button
        type="button"
        className={itemClass(active)}
        onClick={() => {
          if (hasChildren) onToggle?.();
          else onClick?.();
        }}
      >
        {content}
      </button>
    );
  }

  const wrapped = collapsed ? (
    <Tooltip content={label} placement="right">
      <span className="menu-item__tooltip-wrap">{inner}</span>
    </Tooltip>
  ) : (
    inner
  );

  return (
    <div className="menu-item-wrapper">
      {wrapped}
      {!collapsed && hasChildren && expanded && (
        <div className="menu-item__children">
          {children.map((child) => (
            <MenuItem key={child.label} {...child} collapsed={collapsed} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
