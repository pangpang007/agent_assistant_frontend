import { useEffect } from 'react';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useSidebarStore } from '@/stores/sidebarStore';

/** Auto-collapse sidebar on smaller viewports. */
export function useResponsiveSidebar() {
  const isMobile = useIsMobile();
  const setCollapsed = useSidebarStore((s) => s.setCollapsed);

  useEffect(() => {
    if (isMobile) {
      setCollapsed(true);
      return;
    }

    const mql = window.matchMedia('(max-width: 1280px)');
    const handler = (e: MediaQueryListEvent | MediaQueryList) => {
      setCollapsed(e.matches);
    };
    handler(mql);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [isMobile, setCollapsed]);

  return { isMobile };
}
