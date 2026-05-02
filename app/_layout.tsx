import { Stack } from 'expo-router';
import { MD3LightTheme, PaperProvider } from 'react-native-paper';
import { ToastProvider } from '../context/ToastContext';

const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#D97757',
    onPrimary: '#FFFFFF',
    primaryContainer: '#FFDCCA',
    onPrimaryContainer: '#351000',
    secondary: '#D97757',
    secondaryContainer: '#F5DDD5',
    onSecondaryContainer: '#3D1500',
    background: '#FAF9F7',
    surface: '#FFFFFF',
    surfaceVariant: '#F5E1D8',
    onSurfaceVariant: '#5C3D2E',
  },
};

export default function RootLayout() {
  return (
    <PaperProvider theme={theme}>
      <ToastProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </ToastProvider>
    </PaperProvider>
  );
}
