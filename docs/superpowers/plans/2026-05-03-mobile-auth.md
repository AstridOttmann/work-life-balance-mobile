# Mobile Auth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add JWT login to the React Native mobile app — AuthContext, LoginScreen, Profile tab, and token attached to all API requests.

**Architecture:** AuthContext reads token from SecureStore asynchronously on mount (with a loading state to prevent login flash), registers Axios interceptors, and exposes login/logout. The root layout renders a spinner while loading, LoginScreen when unauthenticated, or the tab Stack when authenticated.

**Tech Stack:** Expo ~54, React Native 0.81, TypeScript, Expo Router ~6, react-native-paper v5, Axios, expo-secure-store.

---

### Task 1: Install expo-secure-store

**Files:**
- Modify: `package.json` (via install)

- [ ] **Step 1: Install the package**

Run: `npx expo install expo-secure-store`
Expected: `expo-secure-store` appears in `package.json` dependencies

- [ ] **Step 2: Commit**

```bash
git add package.json
git commit -m "chore: install expo-secure-store"
```

---

### Task 2: Add authApi.login() to api.ts

**Files:**
- Modify: `services/api.ts`

- [ ] **Step 1: Append authApi after appointmentsApi**

Add to the end of `services/api.ts`:

```typescript
export const authApi = {
  login: (email: string, password: string) =>
    api.post<{ token: string; email: string }>('/auth/login', { email, password }).then(r => r.data),
};
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add services/api.ts
git commit -m "feat: add authApi.login to api service"
```

---

### Task 3: Create AuthContext

**Files:**
- Create: `context/AuthContext.tsx`

- [ ] **Step 1: Create the file**

Create `context/AuthContext.tsx`:

```tsx
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { api, authApi } from '../services/api';

interface AuthContextValue {
  token: string | null;
  email: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const logoutRef = useRef<() => void>(() => {});

  useEffect(() => {
    Promise.all([
      SecureStore.getItemAsync('token'),
      SecureStore.getItemAsync('email'),
    ]).then(([t, e]) => {
      setToken(t);
      setEmail(e);
      setLoading(false);
    });
  }, []);

  const logout = useCallback(() => {
    SecureStore.deleteItemAsync('token');
    SecureStore.deleteItemAsync('email');
    setToken(null);
    setEmail(null);
  }, []);

  logoutRef.current = logout;

  const login = useCallback(async (emailInput: string, password: string) => {
    const { token: newToken, email: newEmail } = await authApi.login(emailInput, password);
    await SecureStore.setItemAsync('token', newToken);
    await SecureStore.setItemAsync('email', newEmail);
    setToken(newToken);
    setEmail(newEmail);
  }, []);

  useEffect(() => {
    const reqId = api.interceptors.request.use(async config => {
      const t = await SecureStore.getItemAsync('token');
      if (t) config.headers['Authorization'] = `Bearer ${t}`;
      return config;
    });
    const resId = api.interceptors.response.use(
      response => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) logoutRef.current();
        return Promise.reject(error);
      }
    );
    return () => {
      api.interceptors.request.eject(reqId);
      api.interceptors.response.eject(resId);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ token, email, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add context/AuthContext.tsx
git commit -m "feat: add AuthContext with JWT token management and SecureStore"
```

---

### Task 4: Fix ToastContext to skip 401

**Files:**
- Modify: `context/ToastContext.tsx`

- [ ] **Step 1: Add the 401 guard**

In `context/ToastContext.tsx`, change the error handler from:

```typescript
      (error: AxiosError<{ message?: string }>) => {
        const serverMessage = error.response?.data?.message;
```

to:

```typescript
      (error: AxiosError<{ message?: string }>) => {
        if (error.response?.status === 401) return Promise.reject(error);
        const serverMessage = error.response?.data?.message;
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add context/ToastContext.tsx
git commit -m "fix: skip 401 in ToastContext error interceptor"
```

---

### Task 5: Create LoginScreen

**Files:**
- Create: `components/LoginScreen.tsx`

- [ ] **Step 1: Create the file**

Create `components/LoginScreen.tsx`:

```tsx
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, HelperText, Text, TextInput } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
    } catch {
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>Work-Life Balance</Text>
      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        style={styles.input}
      />
      <TextInput
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
      />
      {error && (
        <HelperText type="error" visible>
          {error}
        </HelperText>
      )}
      <Button
        mode="contained"
        onPress={handleLogin}
        disabled={loading}
        style={styles.button}
      >
        {loading ? <ActivityIndicator size={16} color="#fff" /> : 'Log in'}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F7',
    justifyContent: 'center',
    padding: 32,
  },
  title: {
    textAlign: 'center',
    marginBottom: 32,
    color: '#D97757',
  },
  input: {
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  button: {
    marginTop: 8,
  },
});
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add components/LoginScreen.tsx
git commit -m "feat: add LoginScreen component"
```

---

### Task 6: Create Profile tab screen

**Files:**
- Create: `app/(tabs)/profile.tsx`

- [ ] **Step 1: Create the file**

Create `app/(tabs)/profile.tsx`:

```tsx
import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { useAuth } from '../../context/AuthContext';

export default function ProfileScreen() {
  const { email, logout } = useAuth();

  return (
    <View style={styles.container}>
      <Text variant="bodyLarge" style={styles.email}>{email}</Text>
      <Button mode="outlined" onPress={logout} style={styles.button}>
        Log out
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF9F7',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  email: {
    marginBottom: 24,
    color: '#5C3D2E',
  },
  button: {
    width: '100%',
  },
});
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add "app/(tabs)/profile.tsx"
git commit -m "feat: add Profile tab screen"
```

---

### Task 7: Add Profile tab to tabs layout

**Files:**
- Modify: `app/(tabs)/_layout.tsx`

- [ ] **Step 1: Rewrite the file**

Replace the entire contents of `app/(tabs)/_layout.tsx` with:

```tsx
import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: '#D97757' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '600' },
        tabBarActiveTintColor: '#D97757',
        tabBarStyle: { backgroundColor: '#FAF9F7' },
        sceneStyle: { backgroundColor: '#FAF9F7' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Daily Log',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="calendar-text" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="summary"
        options={{
          title: 'Summary',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="chart-bar" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add "app/(tabs)/_layout.tsx"
git commit -m "feat: add Profile tab to navigation"
```

---

### Task 8: Wire AuthProvider into root layout

**Files:**
- Modify: `app/_layout.tsx`

- [ ] **Step 1: Rewrite the file**

Replace the entire contents of `app/_layout.tsx` with:

```tsx
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
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Start the app and verify manually**

Run: `npx expo start`

Check the following:
1. App launches → brief spinner → LoginScreen appears (no tab bar visible)
2. Enter wrong credentials → "Invalid email or password" shown inline
3. Enter correct credentials → LoginScreen disappears → three tabs appear (Daily Log, Summary, Profile)
4. Open Profile tab → email displayed + "Log out" button
5. Tap "Log out" → LoginScreen appears
6. Force-close and reopen with valid token in SecureStore → opens directly to tabs (no login)
7. Any API call → Authorization header attached (verify in backend logs or network inspector)

- [ ] **Step 4: Commit**

```bash
git add app/_layout.tsx
git commit -m "feat: wire AuthProvider and conditional LoginScreen into root layout"
```
