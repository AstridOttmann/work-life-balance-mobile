import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Stack } from 'expo-router';
import { MD3LightTheme, PaperProvider } from 'react-native-paper';
import { ToastProvider } from '../context/ToastContext';
import { AuthProvider, useAuth } from '../context/AuthContext';
import LoginScreen from '../components/LoginScreen';

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

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: '#FAF9F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

function RootContent() {
  const { token, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color="#D97757" />
      </View>
    );
  }

  if (!token) return <LoginScreen />;

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  return (
    <PaperProvider theme={theme}>
      <ToastProvider>
        <AuthProvider>
          <RootContent />
        </AuthProvider>
      </ToastProvider>
    </PaperProvider>
  );
}
