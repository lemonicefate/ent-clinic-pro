import type { Preview } from '@storybook/react-vite';
import '../src/styles/global.css';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'light',
      values: [
        {
          name: 'light',
          value: '#ffffff',
        },
        {
          name: 'medical-neutral-50',
          value: '#f8fafc',
        },
        {
          name: 'medical-primary-50',
          value: '#eff6ff',
        },
        {
          name: 'dark',
          value: '#1e293b',
        },
      ],
    },
    docs: {
      theme: {
        base: 'light',
        brandTitle: 'Astro Clinical Platform',
        brandUrl: 'https://astro-clinical-platform.vercel.app',
        colorPrimary: '#2563eb',
        colorSecondary: '#0ea5e9',
      },
    },
    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo',
      config: {
        rules: [
          {
            id: 'color-contrast',
            enabled: true,
          },
          {
            id: 'focus-order-semantics',
            enabled: true,
          },
          {
            id: 'keyboard-navigation',
            enabled: true,
          },
        ],
      },
    },
    viewport: {
      viewports: {
        mobile: {
          name: 'Mobile',
          styles: {
            width: '375px',
            height: '667px',
          },
        },
        tablet: {
          name: 'Tablet',
          styles: {
            width: '768px',
            height: '1024px',
          },
        },
        desktop: {
          name: 'Desktop',
          styles: {
            width: '1024px',
            height: '768px',
          },
        },
        largeDesktop: {
          name: 'Large Desktop',
          styles: {
            width: '1440px',
            height: '900px',
          },
        },
      },
    },
  },
  globalTypes: {
    theme: {
      description: 'Global theme for components',
      defaultValue: 'light',
      toolbar: {
        title: 'Theme',
        icon: 'paintbrush',
        items: ['light', 'dark'],
        dynamicTitle: true,
      },
    },
  },
  decorators: [
    (Story, context) => {
      const theme = context.globals.theme || 'light';
      
      return (
        <div 
          className={`storybook-wrapper ${theme === 'dark' ? 'dark' : ''}`}
          style={{
            minHeight: '100vh',
            backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff',
            color: theme === 'dark' ? '#f1f5f9' : '#1e293b',
            padding: '1rem',
          }}
        >
          <Story />
        </div>
      );
    },
  ],
};

export default preview;
