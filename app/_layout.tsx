import { Stack } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { ToastProvider } from '../context/ToastContext';

export default function RootLayout() {
  return (
    <PaperProvider>
      <ToastProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </ToastProvider>
    </PaperProvider>
  );
}
