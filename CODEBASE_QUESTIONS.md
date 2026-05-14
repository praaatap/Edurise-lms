# Edurise LMS — Codebase Questions & Detailed Answers

> Full answers derived from actual source code. Every answer references real files and real logic.

---

## 1. Architecture & Project Structure

### What is the overall folder structure?

```
/app/                   Expo Router pages (file = route)
  _layout.tsx           Root layout, auth guard, biometric lock, error boundary
  (tabs)/               Bottom tab screens (home, explore, bookmarks, profile)
  (auth)/               Login and Register screens
  instructor/[id].tsx   Dynamic instructor profile route
  course/[id].tsx        Dynamic course detail route
  ai-tutor.tsx          AI chat screen

/features/              Feature modules, each self-contained
  auth/                 Auth store, screens, hooks
  courses/              Course store, screens, utils
  ai/                   AI store, Groq agent service, screens
  notifications/        Push notification service

/core/                  Shared infrastructure
  api/client.ts         Axios instance with interceptors and retry
  services/             Analytics (Sentry), Unsplash image fetching
  theme/                Color tokens and theme constants

/shared/                Truly reusable cross-feature code
  components/ui/        Button, Card, Badge, Dialog, ErrorBoundary, etc.
  hooks/                useNetworkStatus, useTheme, useUpdates
  types/index.ts        Global TypeScript interfaces

/assets/                Static images and fonts
/scripts/               reset-project.js utility
```

### Why is Expo Router used instead of React Navigation directly?

Expo Router wraps React Navigation and adds **file-based routing** — every file inside `/app/` automatically becomes a route. This means:
- `/app/(tabs)/index.tsx` → the Home tab, no manual route registration
- `/app/course/[id].tsx` → dynamic route, `id` is available via `useLocalSearchParams()`
- Auth/guest route groups `(auth)` and `(tabs)` control which stack a screen belongs to

The root `_layout.tsx` uses `<Stack>` and `<Redirect>` to implement the auth guard.

### How are features organized into modules?

Each feature folder follows the same internal shape:
```
features/auth/
  store/authStore.ts      Zustand state + actions
  screens/                UI screens for this feature
  hooks/                  Feature-specific hooks (optional)
  services/               API calls or external integrations
```
This keeps all auth-related code colocated. Screens import from the store; the store imports from `core/api/client`.

### What is the purpose of `/core/` vs `/shared/`?

| Directory | Contains | Used by |
|-----------|----------|---------|
| `/core/` | Infrastructure that the whole app depends on (API client, analytics, theme) | Every feature |
| `/shared/` | UI components, hooks, and types that are reused across features | Multiple features |

`/core/` is "plumbing"; `/shared/` is "building blocks".

### How does `_layout.tsx` bootstrap the app?

`app/_layout.tsx` does six things in order:
1. **Loads fonts** via `expo-font` before rendering anything
2. **Hides the splash screen** once fonts are ready
3. **Checks biometric lock** — reads `biometric_enabled` from AsyncStorage; if enabled, triggers `LocalAuthentication.authenticateAsync()` and blocks UI until the user passes
4. **Reads auth state** from `authStore` (Zustand, persisted to SecureStore)
5. **Renders an `<ErrorBoundary>`** around the whole tree
6. **Redirects**: if the user is not authenticated it renders `<Redirect href="/(auth)/login" />`; otherwise renders the `<Stack>` with all screens

### How are environment variables loaded?

Via `.env` file at the project root, read by Expo's Metro bundler as `process.env.EXPO_PUBLIC_*` variables:
```
EXPO_PUBLIC_GROQ_API_KEY=...
EXPO_PUBLIC_SENTRY_DSN=...
EXPO_PUBLIC_API_BASE_URL=...
EXPO_PUBLIC_UNSPLASH_ACCESS_KEY=...
```
These are accessed directly in service files, e.g. `process.env.EXPO_PUBLIC_GROQ_API_KEY` in `groqAgent.ts`.

---

## 2. Authentication

### How does the login flow work end-to-end?

1. User fills email + password on `(auth)/login.tsx`
2. Screen calls `authStore.login(email, password)`
3. Store calls `POST /auth/login` via the Axios client
4. On success the API returns `{ user, accessToken, refreshToken }`
5. Store stores both tokens: `accessToken` in memory (Zustand state), `refreshToken` in **SecureStore** via `expo-secure-store`
6. Store sets `isAuthenticated = true` and `user = { ... }`
7. Zustand's `persist` middleware writes the updated state to AsyncStorage
8. `_layout.tsx` reacts to `isAuthenticated` changing and removes the `<Redirect>` to login, rendering the tabs instead

### How does the registration flow work?

1. User fills name, email, password on `(auth)/register.tsx`
2. Calls `authStore.register(name, email, password)`
3. Store calls `POST /auth/register`
4. On success, the same token + user flow as login runs automatically (API returns tokens on register)

### How are tokens stored on device?

| Token | Storage | Reason |
|-------|---------|--------|
| `accessToken` | Zustand in-memory + AsyncStorage (via persist) | Fast access for every request |
| `refreshToken` | `expo-secure-store` (encrypted) | Sensitive — only read when access token expires |

SecureStore uses the device Keychain (iOS) / Keystore (Android) — it survives app reinstalls but is encrypted and never accessible outside the app.

### How does automatic token refresh work?

In `core/api/client.ts`, a **response interceptor** catches every `401 Unauthorized` response:
```
response interceptor:
  if (error.response.status === 401 && !originalRequest._retry):
    originalRequest._retry = true
    refreshToken = await SecureStore.getItemAsync('refreshToken')
    POST /auth/refresh { refreshToken }
    → new accessToken saved to store + request header
    → retry originalRequest with new token
  else:
    authStore.logout()  ← refresh itself failed, force logout
```
A `_retry` flag prevents infinite retry loops.

### How does logout clear all state?

`authStore.logout()`:
1. Calls `DELETE /auth/logout` (tells the server to invalidate the refresh token)
2. Clears Zustand state: `user = null`, `accessToken = null`, `isAuthenticated = false`
3. Deletes `refreshToken` from SecureStore
4. Zustand persist writes the cleared state to AsyncStorage

Because `_layout.tsx` watches `isAuthenticated`, it immediately redirects to login.

### How are protected routes enforced?

In `app/_layout.tsx`:
```tsx
const { isAuthenticated } = useAuthStore();
if (!isAuthenticated) return <Redirect href="/(auth)/login" />;
return <Stack>...</Stack>;
```
There is no per-screen guard — the entire `<Stack>` (which includes all tabs) is behind this single check.

---

## 3. API Client & Networking

### How is the Axios client configured?

`core/api/client.ts` creates a single Axios instance:
```ts
const apiClient = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});
```
All API calls in every feature service go through this one instance.

### How do request interceptors attach the auth token?

```ts
apiClient.interceptors.request.use(async (config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
```
`useAuthStore.getState()` reads outside of React — safe to call in non-component code.

### How does the retry logic work?

A custom retry mechanism wraps failed requests:
- Up to **3 retries** for network errors or 5xx responses
- **Exponential backoff**: waits 1s, then 2s, then 4s between attempts
- `4xx` errors (except 401 which is handled by token refresh) are **not retried** — they represent client errors

### How does the app detect offline state before requests?

`shared/hooks/useNetworkStatus.ts` uses `@react-native-community/netinfo`:
```ts
NetInfo.addEventListener(state => {
  setIsConnected(state.isConnected && state.isInternetReachable);
});
```
The API client interceptor also checks this: if `isConnected === false`, it immediately rejects the request with a custom `OfflineError` instead of letting Axios try and fail with a timeout.

---

## 4. Course Features

### How are courses fetched and cached?

`features/courses/store/courseStore.ts` uses Zustand with persist:
```ts
fetchCourses: async () => {
  if (courses.length > 0) return;   // cache hit — skip network call
  const data = await GET /courses;
  set({ courses: data });
}
```
The first call fetches from the API. Subsequent calls return the in-memory (and AsyncStorage-persisted) list instantly.

### How does course search/filtering work?

In `courseStore`, a `searchQuery` string and `selectedCategory` value are stored. A derived selector `filteredCourses` applies both:
```ts
filteredCourses = courses.filter(c =>
  c.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
  (selectedCategory === 'All' || c.category === selectedCategory)
);
```
The Explore screen reads `filteredCourses` directly and re-renders when either filter changes.

### How does enrollment work?

1. User taps "Enroll" on the course detail screen
2. Calls `courseStore.enrollCourse(courseId)`
3. Store calls `POST /courses/:id/enroll`
4. On success, adds `courseId` to `enrolledCourses` array in state (persisted)
5. Adds a timeline event: `{ type: 'enrolled', courseId, date: new Date() }`
6. Profile screen reads `enrolledCourses.length` for the stats card

### How does the HTML course content parser work?

`features/courses/utils/courseHtml.ts` **generates** an HTML string that is rendered inside a `WebView`. It builds:
- A styled `<html>` document with inline CSS matching the app theme (dark/light)
- Course sections rendered as `<h2>`, `<p>`, `<ul>` blocks
- Code snippets wrapped in `<pre><code>` with syntax highlighting styles
- A quiz section at the bottom with radio-button `<input>` elements
- A `postMessage` call from within the WebView to send quiz answers back to React Native

The output is a self-contained HTML page injected into `WebView`'s `injectedJavaScript` prop.

### How are course images fetched from Unsplash?

`core/services/unsplashService.ts` calls the Unsplash API:
```ts
GET https://api.unsplash.com/photos/random?query={courseTitle}&orientation=landscape
Authorization: Client-ID {EXPO_PUBLIC_UNSPLASH_ACCESS_KEY}
```
Results are cached by course title to avoid duplicate calls. The home screen and course cards use these URLs as `Image` sources.

---

## 5. AI Tutor (Groq Agent)

### How does the Groq AI tutor work end-to-end?

1. User types a message in `app/ai-tutor.tsx`
2. Screen calls `aiStore.sendMessage(userMessage)`
3. Store appends the message to `messages[]` and calls `groqAgent.chat(messages)`
4. `groqAgent.ts` sends the full conversation history to Groq's `llama3-70b-8192` model
5. Response streams back; each chunk updates the last message in `messages[]` in real time
6. If the model decides to call a tool, the agent executes it (see below) and sends the result back
7. Final text response is stored; UI re-renders showing the complete reply

### How does tool-calling work?

The agent registers one tool with Groq:
```ts
tools = [{
  type: 'function',
  function: {
    name: 'get_courses',
    description: 'Search available courses by keyword or category',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        category: { type: 'string' },
      }
    }
  }
}]
```
When Groq returns `finish_reason: 'tool_calls'`, the agent:
1. Reads the tool name and arguments from the response
2. Calls `courseStore.getState().courses` and filters by the query
3. Formats the results as a JSON string
4. Sends a second request to Groq with `role: 'tool'` containing the course data
5. Groq then generates a natural-language reply using that data

### What is the difference between the mock agent and the real Groq agent?

The file `groqAgent.ts` checks `process.env.EXPO_PUBLIC_GROQ_API_KEY`:
- **If key exists**: Uses the real `Groq` SDK, sends actual API calls, streams real responses
- **If key is missing**: Falls back to a mock that returns hardcoded responses after a 1.5s delay — useful for UI development without spending API credits

### How is chat history managed?

`features/ai/store/aiStore.ts` (Zustand, not persisted):
```ts
{
  messages: Message[],    // full conversation history
  isStreaming: boolean,   // true while a response is in flight
  sendMessage: (text) => void,
  clearChat: () => void,
}
```
`messages` is **not persisted** — it resets when the app restarts. Each message has `{ role: 'user' | 'assistant', content: string, id: string }`.

### How are streaming responses handled?

`groqAgent.ts` uses Groq SDK's streaming API:
```ts
const stream = await groq.chat.completions.create({ stream: true, ...params });
for await (const chunk of stream) {
  const delta = chunk.choices[0]?.delta?.content ?? '';
  onChunk(delta);   // callback updates the store message in real time
}
```
`aiStore.sendMessage` passes an `onChunk` callback that calls `set()` to append each delta to the last message, causing the UI to update character-by-character.

---

## 6. State Management (Zustand)

### Which stores use persistence?

| Store | Persisted | Storage |
|-------|-----------|---------|
| `authStore` | Yes | AsyncStorage + SecureStore (tokens separately) |
| `courseStore` | Yes | AsyncStorage |
| `aiStore` | No | In-memory only |

### How do stores reset on logout?

`authStore.logout()` resets its own state. It also calls:
```ts
useCourseStore.getState().reset();  // clears course cache, enrollments, bookmarks
```
This ensures stale data from a previous user is wiped before a new user logs in.

### How do components subscribe to store slices?

Components use selector functions to avoid unnecessary re-renders:
```ts
// Only re-renders when 'courses' changes, not when other store fields change
const courses = useCourseStore(state => state.courses);
```

---

## 7. Offline & Network Resilience

### How does the offline banner work?

`shared/hooks/useNetworkStatus.ts` returns `{ isConnected }`. The root layout (or a wrapping component) renders an `<OfflineBanner>` when `isConnected === false`:
```tsx
{!isConnected && <OfflineBanner message="No internet connection" />}
```
The banner is a fixed-position `<View>` at the top of the screen with a yellow background.

### How does the app recover when connectivity is restored?

`NetInfo.addEventListener` fires when connectivity changes. When `isConnected` flips back to `true`:
1. The banner disappears
2. Any pending UI actions the user tried while offline can be retried manually
3. There is no automatic request replay queue — users must refresh screens manually

---

## 8. UI Components & Styling

### How does NativeWind work here?

NativeWind lets you use Tailwind class names in React Native via the `className` prop:
```tsx
<View className="flex-1 bg-white dark:bg-gray-900 px-4">
```
The `tailwind.config.js` maps these to React Native `StyleSheet` objects at build time. Dark mode classes (`dark:`) respond to the system color scheme.

### What shared UI components exist?

Located in `shared/components/ui/`:

| Component | Purpose |
|-----------|---------|
| `Button` | Pressable with `primary`, `secondary`, `ghost`, `destructive` variants + loading state |
| `Card` | Rounded container with shadow, accepts `onPress` |
| `Badge` | Small label pill with color variants |
| `CustomDialog` | Modal alert/confirm with `default` and `destructive` types |
| `ErrorBoundary` | Class component that catches render errors and shows a fallback UI |
| `UnsplashPicker` | Modal that searches and displays Unsplash images for avatar selection |

### How does the Button component work?

```tsx
<Button
  variant="primary"    // 'primary' | 'secondary' | 'ghost' | 'destructive'
  size="md"            // 'sm' | 'md' | 'lg'
  loading={false}      // shows ActivityIndicator, disables press
  onPress={handlePress}
>
  Enroll Now
</Button>
```
Internally it uses `Pressable` with animated opacity on press. The `loading` prop replaces children with a spinner and sets `pointerEvents="none"`.

### How is the app theme defined?

`core/theme/` and `core/colors.ts` export a `Colors` object:
```ts
Colors = {
  primary: '#6366f1',    // indigo
  dark: {
    background: '#0f172a',
    surface: '#1e293b',
    text: '#f1f5f9',
    border: '#334155',
    textMuted: '#94a3b8',
  },
  light: { ... }
}
```
Screens read `useTheme()` which returns the current scheme's colors as `C`:
```ts
const { C, isDark } = useTheme();
// C.background, C.text, C.textMuted etc.
```

---

## 9. Navigation & Routing

### How is tab navigation structured?

`app/(tabs)/_layout.tsx` defines 4 tabs using Expo Router's `<Tabs>` component:

| Tab | File | Icon |
|-----|------|------|
| Home | `index.tsx` | `home` |
| Explore | `explore.tsx` | `compass` |
| Bookmarks | `bookmarks.tsx` | `bookmark` |
| Profile | `profile.tsx` | `person` |

A **floating AI button** sits in the center of the tab bar (rendered as a custom `tabBarButton`) and navigates to `ai-tutor.tsx`.

### How are dynamic routes handled?

`app/course/[id].tsx` — the `id` is read via:
```ts
const { id } = useLocalSearchParams<{ id: string }>();
```
Navigation to a course detail page:
```ts
router.push(`/course/${course.id}`);
```
Same pattern for `instructor/[id].tsx`.

### How does the auth/app routing split work?

`app/_layout.tsx` has two branches:
```tsx
if (!isAuthenticated) {
  return (
    <Stack>
      <Stack.Screen name="(auth)" />   // login, register
    </Stack>
  );
}
return (
  <Stack>
    <Stack.Screen name="(tabs)" />    // main app
    <Stack.Screen name="course/[id]" />
    <Stack.Screen name="instructor/[id]" />
    <Stack.Screen name="ai-tutor" />
  </Stack>
);
```

---

## 10. Bookmarks

### How does bookmarking work?

1. User taps the bookmark icon on a course card or detail screen
2. Calls `courseStore.toggleBookmark(courseId)`
3. Store checks if `bookmarks.includes(courseId)`:
   - If yes → removes it (splice)
   - If no → appends it
4. State is persisted to AsyncStorage immediately
5. The icon re-renders as filled/outlined based on `bookmarks.includes(courseId)`

### How does the bookmarks screen work?

`app/(tabs)/bookmarks.tsx` reads:
```ts
const { bookmarks, courses } = useCourseStore();
const bookmarkedCourses = courses.filter(c => bookmarks.includes(c.id));
```
It renders a `FlatList` of those courses. Long-pressing a course shows a `CustomDialog` asking to confirm removal.

---

## 11. Profile

### What data is shown on the profile screen?

`app/(tabs)/profile.tsx` computes and displays:
- **Avatar** — local image URI or Unsplash URL, picked by the user
- **Level & XP** — derived from `enrolledCourses.length` and `completedCourses.length`:
  - Each enrollment = 50 XP, each completion = 200 XP
  - Level thresholds: 0–200 XP = Level 1, 200–500 = Level 2, etc.
- **Stats**: enrolled count, bookmarks count, completion percentage
- **Achievements badges**: hardcoded array of 5 badges (First Step, Quick Learner, etc.) always shown
- **Timeline**: last 10 activity events from `courseStore.timeline`
- **Preferences**: dark mode toggle, notifications link, biometric toggle, privacy link

### How does the profile image picker work?

Two options via `UnsplashPicker` modal:
1. **Pick from gallery**: calls `ImagePicker.launchImageLibraryAsync()` — requests permission first; on iOS, if `denied`, shows a dialog explaining how to re-enable in Settings
2. **Unsplash search**: `UnsplashPicker` component calls `unsplashService.search(query)` and displays a grid of results; tapping one sets the avatar URL

Selected URI/URL is saved with `authStore.updateProfile({ avatar: { url, localPath } })`.

### How does the biometric unlock work?

On app launch in `_layout.tsx`:
```ts
const biometricEnabled = await AsyncStorage.getItem('biometric_enabled');
if (biometricEnabled === 'true') {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Unlock Edurise',
    fallbackLabel: 'Use Passcode',
  });
  if (!result.success) {
    // App stays on a blank screen — cannot proceed without auth
  }
}
```
The profile screen's toggle saves `'true'` or `'false'` to AsyncStorage and checks `hasHardwareAsync()` + `isEnrolledAsync()` before enabling.

---

## 12. Notifications

### How is the notifications service structured?

`features/notifications/` wraps `expo-notifications`:
- **Permission request**: `requestPermissionsAsync()` on first launch
- **Scheduling**: `scheduleNotificationAsync({ content, trigger })` for reminders
- **Handling foreground notifications**: `addNotificationReceivedListener`
- **Handling taps**: `addNotificationResponseReceivedListener` → parses the notification data and calls `router.push(data.route)`

The service is initialized in `_layout.tsx` on app start.

---

## 13. Explore & Search

### How does the Explore screen work?

`app/(tabs)/explore.tsx`:
- Reads `courses` and `filteredCourses` from `courseStore`
- Renders a **category chip bar** at the top (horizontal `ScrollView`) — tapping a chip calls `setSelectedCategory(cat)`
- Renders a **sort dropdown**: `Latest`, `Most Popular`, `Highest Rated`
- Renders a `FlatList` of `CourseCard` components

### How does SmartSearch differ from regular search?

- **Regular search**: `courseStore.setSearchQuery(text)` → client-side string filter on `courses[]`
- **SmartSearch (AI)**: User's query is sent to the Groq agent as a message. The agent calls `get_courses` tool with semantic interpretation of the query (e.g. "something to learn Python for data science" → `{ query: 'python', category: 'Data Science' }`), then replies with natural language plus course recommendations

---

## 14. Error Handling & Analytics

### How is Sentry integrated?

`core/services/analyticsService.ts` wraps Sentry:
```ts
class AnalyticsService {
  init() { Sentry.init({ dsn: process.env.EXPO_PUBLIC_SENTRY_DSN }); }
  logEvent(name, data) { Sentry.addBreadcrumb({ message: name, data }); }
  captureError(err) { Sentry.captureException(err); }
}
export const analytics = new AnalyticsService();
```
`analytics.init()` is called in `_layout.tsx`. The profile screen has a "Try Sentry Error" button that manually calls `Sentry.captureException(new Error(...))` to verify the DSN is working.

### How does the ErrorBoundary work?

`shared/components/ui/ErrorBoundary.tsx` is a React class component:
```tsx
componentDidCatch(error, info) {
  analytics.captureError(error);
}
render() {
  if (this.state.hasError) return <ErrorFallback onRetry={this.reset} />;
  return this.props.children;
}
```
It wraps the entire `<Stack>` in `_layout.tsx`. On any unhandled render error, it shows a friendly "Something went wrong" screen with a retry button.

---

## 15. Certificates & Course Completion

### How is course completion tracked?

`courseStore` has a `completedCourses: string[]` array. After a user finishes all content sections in a course (tracked via `courseProgress` object), the course detail screen calls:
```ts
courseStore.markComplete(courseId)
```
This pushes `courseId` into `completedCourses` and adds a `{ type: 'completed', courseId }` timeline event.

### What triggers the CertificateModal?

After `markComplete()` is called, the course detail screen renders `<CertificateModal visible={true} course={course} user={user} />`. The modal displays a stylized certificate with the user's name, course title, and completion date. There is a **Share** button (uses `expo-sharing`) and a **Download** button (partially implemented — prints to PDF via `expo-print`).

### Is certificate generation fully implemented?

Partially. The modal renders correctly and sharing works. The PDF download uses `expo-print` to convert the HTML certificate template to a PDF file, but saving to the device's Files app on Android is not yet implemented.

---

## 16. Instructor Profiles

### What does the instructor profile page display?

`app/instructor/[id].tsx` fetches `GET /instructors/:id` and displays:
- Avatar, name, bio
- Rating and student count
- List of courses by this instructor (filtered from `courseStore.courses`)

### Is it fully implemented?

Mostly. The screen renders correctly. Missing: follow/unfollow functionality and the "Message Instructor" button navigates nowhere yet.

---

## 17. Testing

### How is Jest configured?

`jest.config.js` uses `jest-expo` preset which handles Metro bundler, Expo module transforms, and React Native mocks automatically.

### What is tested?

- `shared/components/ui/Button.test.tsx` — renders, press events, loading state
- `features/auth/store/authStore.test.ts` — login, logout, register state transitions
- `core/api/client.test.ts` — interceptor behavior, retry logic

Run tests:
```bash
pnpm test
```

### How are Zustand stores tested?

Stores are tested by importing them directly and calling actions:
```ts
it('sets isAuthenticated on login', async () => {
  await useAuthStore.getState().login('a@b.com', 'pass');
  expect(useAuthStore.getState().isAuthenticated).toBe(true);
});
```
The `api/client` is mocked with `jest.mock('../core/api/client')`.

---

## 18. Build & Deployment

### How is EAS configured?

`eas.json` defines three build profiles:
```json
{
  "build": {
    "development": { "developmentClient": true, "distribution": "internal" },
    "preview":     { "distribution": "internal" },
    "production":  { "autoIncrement": true }
  }
}
```

Build commands:
```bash
eas build --platform android --profile production
eas build --platform ios --profile production
```

### How do OTA updates work?

`shared/hooks/useUpdates.ts` uses `expo-updates`:
```ts
const update = await Updates.checkForUpdateAsync();
if (update.isAvailable) {
  await Updates.fetchUpdateAsync();
  await Updates.reloadAsync();   // restarts the JS bundle
}
```
This hook is called on app foreground. Users get new features without going through the App Store review process.

### What does `reset-project.js` do?

`scripts/reset-project.js` is an Expo scaffold utility — it deletes the example content (demo screens, placeholder files) generated by `create-expo-app` so you start from a clean slate. It is a one-time setup script, not used in CI/CD.

---

## 19. Security

### How are API keys and secrets protected?

- All secrets live in `.env` (gitignored)
- `EXPO_PUBLIC_*` variables are inlined at build time — they end up in the JS bundle. **Do not put truly secret keys here** (backend keys, private API keys). The Groq and Unsplash keys are acceptable since they are client-side keys with rate limits
- The refresh token is stored in `expo-secure-store` (device Keychain), not in AsyncStorage or the JS bundle

### How is course HTML content secured?

The `WebView` that renders course HTML uses:
```tsx
<WebView
  originWhitelist={['*']}
  javaScriptEnabled={true}
  source={{ html: courseHtml }}
  // no onMessage handler for arbitrary postMessage — only quiz answers are accepted
/>
```
The HTML is **generated by the app itself** from course data — it is not loaded from an external URL, so XSS risk is low. However, if course content from the API ever contains raw HTML, it should be sanitized before being passed to the generator.

### Are there known security gaps?

1. `EXPO_PUBLIC_GROQ_API_KEY` is in the client JS bundle — anyone who decompiles the app can read it. Consider proxying AI requests through your own backend.
2. `accessToken` is stored in AsyncStorage (not SecureStore) via Zustand persist — on rooted/jailbroken devices this is readable. Moving it to SecureStore would be more secure.
3. The `retry` logic retries on 5xx without checking for idempotency — `POST` requests that partially succeed could be duplicated.

---

## 20. Performance

### How is the course list optimized?

- `FlatList` with `keyExtractor`, `getItemLayout` (fixed height cards), and `removeClippedSubviews={true}`
- `React.memo` wraps `CourseCard` — only re-renders when the specific course object changes
- Course images use `expo-image` (not the built-in `Image`) which has a disk + memory cache and progressive loading

### How are images lazy-loaded?

`expo-image` is used throughout:
```tsx
<Image
  source={{ uri: course.imageUrl }}
  placeholder={blurhash}      // shows a blurred placeholder instantly
  contentFit="cover"
  transition={300}             // fade in when loaded
/>
```
Unsplash URLs include size parameters (`?w=400&q=80`) to avoid downloading full-resolution images on mobile.

### How is bundle size managed?

- Expo Router enables **automatic code splitting** per route — the AI tutor screen's Groq SDK code is only loaded when the user navigates to it
- `babel-plugin-module-resolver` aliases are set up to avoid deep relative imports, keeping the import graph clean
- Icons use `@expo/vector-icons` (tree-shakeable) rather than a full icon library

---

*Last updated: May 2026 — answers reflect actual source code, not assumptions.*
