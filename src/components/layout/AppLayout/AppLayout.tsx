import { useEffect, useRef, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { WifiOff } from 'lucide-react';
import { TopNav } from '../TopNav';
import { SidebarNav } from '../SidebarNav';
import { useToast } from '@/components/ui/Toast';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useResponsiveSidebar } from '@/hooks/useResponsiveSidebar';
import { useSidebarStore } from '@/stores/sidebarStore';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { cn } from '@/lib/utils';
import './AppLayout.css';

export function AppLayout() {
  const collapsed = useSidebarStore((s) => s.collapsed);
  const isMobile = useIsMobile();
  const online = useOnlineStatus();
  const { info } = useToast();
  const [mobileOpen, setMobileOpen] = useState(false);
  const wasOffline = useRef(false);

  useResponsiveSidebar();

  useEffect(() => {
    if (!online) {
      wasOffline.current = true;
      return;
    }
    if (wasOffline.current) {
      wasOffline.current = false;
      info('网络已恢复');
    }
  }, [online, info]);

  return (
    <div
      className={cn(
        'app-layout',
        collapsed && !isMobile && 'app-layout--collapsed',
        isMobile && 'app-layout--mobile',
        !online && 'app-layout--offline',
      )}
    >
      {!online && (
        <div className="offline-banner">
          <WifiOff size={14} strokeWidth={1.5} />
          <span>网络连接已断开，请检查网络设置</span>
        </div>
      )}
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
