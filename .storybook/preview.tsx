import type { Preview } from '@storybook/react-vite';
import { ThemeProvider } from '../src/theme/ThemeProvider';
import { ToastProvider } from '../src/components/ui/Toast';
import '../src/styles/global.css';

const preview: Preview = {
  decorators: [
    (Story, context) => {
      const theme = context.globals.theme ?? 'dark';
      document.documentElement.setAttribute('data-theme', theme);
      return (
        <ThemeProvider>
          <ToastProvider>
            <div style={{ padding: '24px', background: 'var(--bg-canvas)', minHeight: '100vh' }}>
              <Story />
            </div>
          </ToastProvider>
        </ThemeProvider>
      );
    },
  ],
  globalTypes: {
    theme: {
      description: 'Global theme',
      toolbar: {
        title: 'Theme',
        icon: 'circlehollow',
        items: [
          { value: 'dark', title: 'Dark' },
          { value: 'light', title: 'Light' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    theme: 'dark',
  },
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      test: 'todo',
    },
  },
};

export default preview;
