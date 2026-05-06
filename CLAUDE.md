# Work-Life Balance — Mobile App

Expo SDK / Expo Router / React Native Paper / TypeScript / Axios / dayjs.

## Run

```bash
npx expo start   # scan QR with Expo Go on iPhone (same WiFi)
```

API URL: `EXPO_PUBLIC_API_URL` in `.env` (not committed) — set to laptop's local IP, e.g. `http://192.168.x.x:8080/api`.

## Architecture

```
app/
  _layout.tsx         Root: PaperProvider > ToastProvider > AuthProvider > RootContent
                      RootContent shows ActivityIndicator while loading, LoginScreen if no token, tabs if authenticated
  (tabs)/
    _layout.tsx       Three tabs: Daily Log, Summary, Profile
    index.tsx         Daily Log screen — entry list + add/edit modals
    summary.tsx       Summary screen (weekly/monthly)
    profile.tsx       Profile tab (placeholder / logout)
components/
  EntryCard.tsx       Card: date + weekday abbreviation, mood/health chips, expandable appointments
  EntryForm.tsx       forwardRef with submit() handle; pending blocks pattern for create mode
  TimeBlockList.tsx   Lists WORK/FREE blocks with Add button, optimistic local state
  TimeBlockForm.tsx   Add/edit a single time block (nested modal — see iOS rule below)
  AppointmentList.tsx / AppointmentForm.tsx
  LoginScreen.tsx     Full-screen login
context/
  AuthContext.tsx     Token in expo-secure-store; 401 interceptor calls logout()
  ToastContext.tsx    Global Axios error interceptor → Snackbar toasts
services/
  api.ts              Axios instance + all API functions via apiRequest()
  apiRequest.ts       Central catch: if error._handled → return API_ERROR; else re-throw
types/entry.ts
```

## Auth

- Token stored in `expo-secure-store` (key: `token`, `email`) — survives app restarts.
- On launch, `AuthContext` reads SecureStore and restores session (shows spinner during load).
- 401 interceptor in `AuthContext` calls `logout()` → clears SecureStore → shows `LoginScreen`.
- **Token expiry is 24 h** (backend setting) — **pending change to 30 days** so users stay logged in.

## Error handling pattern (apiRequest)

All API calls go through `apiRequest()` in `services/apiRequest.ts`:
- Success → returns data
- Error with `_handled = true` (set by ToastContext interceptor after showing toast) → returns `API_ERROR` symbol
- Error without `_handled` (real bug) → re-throws so the Expo red screen appears

In every handler, check the result before the success path:
```ts
const result = await entriesApi.create(data);
if (result === API_ERROR) return;   // toast already fired, stay on screen
// ... success path
```

`ToastContext` skips toasts for 401 (passes through to AuthContext interceptor).

## iOS nested modal rule

Sibling top-level `Modal` components don't show while another `Modal` is open on iOS. All child modals (e.g. add-block form) must be nested **inside** the parent modal component — never at the same level in the tree.

## Pending blocks pattern

In create mode, time blocks are buffered as `PendingBlock[]` in `EntryForm` state. After `onSave(data, pendingBlocks)` is called and the entry is created in the parent, blocks are POSTed with the new entry ID.

## Field order in EntryForm

Date (create only) → Work blocks → Free blocks → Sleep → Mood → Health → Notes

## Current branch state (feature/auth)

Auth working. `SecurityConfig` on backend has an uncommitted `AuthenticationEntryPoint` fix — commit that before testing. Token expiry pending increase to 30 days.
