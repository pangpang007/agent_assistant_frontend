import { Outlet } from 'react-router-dom';
import './EditorLayout.css';

export function EditorLayout() {
  return (
    <div className="editor-layout">
      <Outlet />
    </div>
  );
}
