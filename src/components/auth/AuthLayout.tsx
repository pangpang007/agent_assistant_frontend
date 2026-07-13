import type { ReactNode } from 'react';
import { Bot } from 'lucide-react';
import './AuthLayout.css';

interface AuthLayoutProps {
  children: ReactNode;
  cardWidth?: number;
}

export function AuthLayout({ children, cardWidth = 400 }: AuthLayoutProps) {
  return (
    <div className="auth-layout">
      <div className="auth-layout__brand">
        <Bot className="auth-layout__logo" size={40} strokeWidth={1.5} />
        <h1 className="auth-layout__title">汤圆代码助手</h1>
        <p className="auth-layout__subtitle">多 Agent 工作流编排平台</p>
      </div>
      <div className="auth-layout__card" style={{ maxWidth: cardWidth }}>
        {children}
      </div>
      <footer className="auth-layout__footer">© 汤圆代码助手</footer>
    </div>
  );
}
