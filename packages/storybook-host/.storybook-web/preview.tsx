import './global-web.css';
import type { ReactNode } from 'react';
import type { Preview } from '@storybook/react';
import { View } from 'react-native';
import { ThemeProvider, useTheme, Button } from '@justin-croyable/mobile-ds';

/** Coque commune : thème + fond + bascule dark/light (identique à l'on-device). */
function Shell({ children }: { children: ReactNode }) {
  const { mode, toggleMode } = useTheme();
  return (
    <View className="flex-1 bg-background" style={{ minHeight: '100vh' as never }}>
      <View className="flex-row justify-end p-3">
        <Button size="sm" variant="outline" onPress={toggleMode}>
          {mode === 'dark' ? '☀︎ Light' : '☾ Dark'}
        </Button>
      </View>
      <View className="flex-1 justify-center p-4">{children}</View>
    </View>
  );
}

const preview: Preview = {
  decorators: [
    (Story) => (
      <ThemeProvider defaultMode="light">
        <Shell>
          <Story />
        </Shell>
      </ThemeProvider>
    ),
  ],
  parameters: {
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/ } },
  },
};

export default preview;
