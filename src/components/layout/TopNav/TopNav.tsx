import { Bot, Menu, Moon, Sun } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { GlobalSearch } from '@/components/common/GlobalSearch';
import { Dropdown } from '@/components/ui/Dropdown';
import { useTheme } from '@/theme/useTheme';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/lib/utils';
import './TopNav.css';

interface TopNavProps {
  onMenuClick?: () => void;
  showMenuButton?: boolean;
}

export function TopNav({ onMenuClick, showMenuButton = false }: TopNavProps) {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const avatarLabel = user?.username?.charAt(0).toUpperCase() ?? '?';

  return (
    <header className="top-nav">
      {showMenuButton && (
        <button type="button" className="top-nav__menu-btn" onClick={onMenuClick} aria-label="打开菜单">
          <Menu size={20} strokeWidth={1.5} />
        </button>
      )}
      <div className="top-nav__logo">
        <Bot size={20} strokeWidth={1.5} />
        <span className="top-nav__brand">汤圆代码助手</span>
      </div>
      <div className="top-nav__search">
        <GlobalSearch />
      </div>
      <div className="top-nav__spacer" />
      <button
        type="button"
        className={cn('top-nav__icon-btn', 'top-nav__theme-btn')}
        onClick={toggleTheme}
        aria-label={theme === 'dark' ? '切换到亮色模式' : '切换到暗色模式'}
      >
        {theme === 'dark' ? (
          <Sun size={18} strokeWidth={1.5} />
        ) : (
          <Moon size={18} strokeWidth={1.5} />
        )}
      </button>
      <Dropdown
        trigger={
          <button type="button" className="top-nav__avatar" aria-label="用户菜单">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt={user.username} className="top-nav__avatar-img" />
            ) : (
              avatarLabel
            )}
          </button>
        }
        align="right"
        items={[
          { key: 'personal', label: '个人设置' },
          { key: 'logout', label: '退出登录', danger: true },
        ]}
        onSelect={(key) => {
          if (key === 'personal') navigate('/settings/profile');
          if (key === 'logout') void logout();
        }}
      />
    </header>
  );
}
