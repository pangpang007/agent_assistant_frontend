import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { MenuItem } from '@/components/ui/Sidebar';
import { useSidebarStore } from '@/stores/sidebarStore';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { cn } from '@/lib/utils';
import { getActiveMenuKey, menuConfig } from './menuConfig';
import './SidebarNav.css';

interface SidebarNavProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function SidebarNav({ mobileOpen = false, onMobileClose }: SidebarNavProps) {
  const collapsed = useSidebarStore((s) => s.collapsed);
  const toggle = useSidebarStore((s) => s.toggle);
  const isMobile = useIsMobile();
  const location = useLocation();
  const activeKey = getActiveMenuKey(location.pathname);
  const [expandedKeys, setExpandedKeys] = useState<string[]>(['workflows', 'settings']);

  const toggleExpand = (key: string) => {
    setExpandedKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  const isCollapsed = isMobile ? false : collapsed;

  return (
    <>
      {isMobile && mobileOpen && (
        <div className="sidebar-nav__overlay" onClick={onMobileClose} aria-hidden />
      )}
      <aside
        className={cn(
          'sidebar-nav',
          isCollapsed && 'sidebar-nav--collapsed',
          isMobile && 'sidebar-nav--mobile',
          isMobile && mobileOpen && 'sidebar-nav--mobile-open',
        )}
      >
        <nav className="sidebar-nav__menu">
          {menuConfig.map((item) => (
            <MenuItem
              key={item.key}
              icon={item.icon}
              label={item.label}
              path={item.path}
              active={activeKey === item.key || item.children?.some((c) => c.key === activeKey)}
              collapsed={isCollapsed}
              expanded={expandedKeys.includes(item.key)}
              onToggle={() => toggleExpand(item.key)}
              onClick={onMobileClose}
              children={
                item.children?.map((child) => ({
                  icon: child.icon,
                  label: child.label,
                  path: child.path,
                  active: activeKey === child.key,
                })) ?? undefined
              }
            />
          ))}
        </nav>
        {!isMobile && (
          <div className="sidebar-nav__footer">
            <button
              type="button"
              className="sidebar-nav__collapse-btn"
              onClick={toggle}
              aria-label={collapsed ? '展开侧边栏' : '折叠侧边栏'}
            >
              {collapsed ? (
                <PanelLeftOpen size={16} strokeWidth={1.5} />
              ) : (
                <PanelLeftClose size={16} strokeWidth={1.5} />
              )}
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
