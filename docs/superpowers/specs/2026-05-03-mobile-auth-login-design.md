# Mobile Auth — Login Design

**Date:** 2026-05-03
**Status:** Approved

## Problem

The backend requires a JWT Bearer token on all API endpoints. The mobile app has no login UI and no mechanism to attach tokens to requests.

## Solution

Add an `AuthContext` (following the existing `ToastContext` pattern) using `expo-secure-store` for token persistence. Show a full-screen login screen when unauthenticated. Add a Profile tab for account info and logout.

## Out of Scope

- Register form (accounts created via `POST /api/auth/register` from the terminal)
- Password reset, remember-me, token refresh

---

## Architecture

### AuthContext (`context/AuthContext.tsx`)

- Holds `token: string | null` and `email: string | null` in React state
- On mount, reads both from `SecureStore` to restore session after app restart
- `login(email, password)`: calls `POST /api/auth/login`, stores token + email in state and SecureStore
- `logout()`: clears state and SecureStore
- Axios request interceptor: attaches `Authorization: Bearer <token>` on every request
- Axios response interceptor: calls `logout()` on 401
- Exposes `useAuth()` hook

### ToastContext fix (`context/ToastContext.tsx`)

- Skip 401 in the error interceptor (same fix as web)

### Auth API (`services/api.ts`)

- Add `authApi.login(email, password)` → `POST /api/auth/login` → returns `{ token: string; email: string }`

---

## UI

### LoginScreen (`components/LoginScreen.tsx`)

- Full-screen component matching app theme (primary `#D97757`, bg `#FAF9F7`)
- Email and password `TextInput` fields (react-native-paper)
- Login button — calls `AuthContext.login()`, shows inline error on wrong credentials
- Loading indicator while request is in flight

### Profile Tab (`app/(tabs)/profile.tsx`)

- Displays the logged-in email (read-only)
- "Log out" button that calls `AuthContext.logout()`

### Navigation changes

- `app/_layout.tsx`: wrap with `AuthProvider`; inner component renders `<LoginScreen />` when `token === null`, or the tab `<Stack>` when authenticated
- `app/(tabs)/_layout.tsx`: add Profile tab with `account` icon (MaterialCommunityIcons)

---

## Data Flow

1. App launches → AuthContext reads SecureStore → token found → tabs render normally
2. App launches → no token → `LoginScreen` shown full-screen, tabs not mounted
3. Login → token stored → `LoginScreen` disappears → tabs appear
4. Any request → interceptor attaches `Authorization: Bearer <token>`
5. 401 received → logout → `LoginScreen` appears
6. Profile tab → email displayed + logout button
7. Logout → token cleared → `LoginScreen` appears
