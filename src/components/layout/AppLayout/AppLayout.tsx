import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { TopNav } from '../TopNav';
import { SidebarNav } from '../SidebarNav';
import { useSidebarStore } from '@/stores/sidebarStore';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { cn } from '@/lib/utils';
import './AppLayout.css';

export function AppLayout() {
  const collapsed = useSidebarStore((s) => s.collapsed);
  const isMobile = useIsMobile();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div
      className={cn(
        'app-layout',
        collapsed && !isMobile && 'app-layout--collapsed',
        isMobile && 'app-layout--mobile',
      )}
    >
      <TopNav
        showMenuButton={isMobile}
        onMenuClick={() => setMobileOpen((v) => !v)}
      />
      <SidebarNav mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <main className="app-layout__content">
        <Outlet />
      </main>
    </div>
  );
}
