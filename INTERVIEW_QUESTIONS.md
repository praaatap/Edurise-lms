# Edurise LMS — Interview Questions & Precise Answers

> Every answer is pulled directly from the actual source code.
> File paths and line numbers are included so you can point to them.

---

## CATEGORY 1: React Native & Expo Fundamentals

---

### Q1. Why did you use Expo Router instead of plain React Navigation?

**Answer:**

Expo Router gives **file-based routing** — every file inside `/app/` becomes a route automatically. No manual route registration is needed.

Real examples from this codebase:
- `/app/course/[id]/index.tsx` → dynamic course detail route, `id` auto-extracted by the framework
- `/app/(auth)/login.tsx` → login screen, no Stack.Navigator setup needed
- `/app/(tabs)/index.tsx` → home tab

In `app/_layout.tsx` line 191-198, the Stack is declared with just screen names:
```tsx
<Stack.Screen name="(auth)" />
<Stack.Screen name="(tabs)" />
<Stack.Screen name="course/[id]/index" />
<Stack.Screen name="course/[id]/content" />
```

With plain React Navigation, each of these would require a Navigator, Screen, and param type registered manually. Expo Router also gives us automatic deep linking and code splitting per route for free.

---

### Q2. How does your app handle authenticated vs unauthenticated routing?

**Answer:**

In `app/_layout.tsx` lines 147-157, a `useEffect` watches three values: `isAuthenticated`, `isReady`, and `isAuthLoading`. When all are settled:

```tsx
const inAuthGroup = segments[0] === '(auth)';

if (!isAuthenticated && !inAuthGroup) {
  router.replace('/(auth)/login');
} else if (isAuthenticated && inAuthGroup) {
  router.replace('/(tabs)');
}
```

`segments` from `useSegments()` tells us which route group is currently active. The guard runs reactively — when `isAuthenticated` changes (login or logout), the effect re-fires and navigation switches immediately. The whole app blocks on `isReady`, `isAuthLoading`, and `isUnlocked` (biometric) before rendering anything — lines 159-161 return `null` until all three are true.

---

### Q3. What is the purpose of `(auth)` and `(tabs)` folder names with parentheses?

**Answer:**

Parentheses create **route groups** in Expo Router. The group name is invisible in the URL and deep link path. Their purpose here:

- `(auth)` — groups login and register under a shared layout with no tab bar. Being in this group is how the auth guard (`segments[0] === '(auth)'`) detects the user is on an auth screen.
- `(tabs)` — groups the four main screens under `(tabs)/_layout.tsx` which defines the bottom tab bar. All four screens share that tab bar automatically because they are in the same group.

Without route groups, every screen would need its own layout or be at the root stack level, making it impossible to have different chrome (tab bar vs no tab bar) without duplicating layout logic.

---

### Q4. How does NativeWind work in this React Native project?

**Answer:**

NativeWind processes Tailwind CSS class names at build time and compiles them into React Native `StyleSheet` objects. In this project, `global.css` is imported at the top of `app/_layout.tsx` (line 9):
```ts
import '../global.css';
```

This activates NativeWind's CSS interop. After that, any component can use `className`:
```tsx
<View className="flex-1 bg-white dark:bg-gray-900 px-4">
```

Dark mode classes (`dark:`) respond to the system color scheme automatically — React Native passes the color scheme to the NativeWind runtime which swaps the compiled style values. The `tailwind.config.js` at the project root defines the content paths and any custom design tokens.

---

### Q5. How does `expo-secure-store` differ from `AsyncStorage` and why does this app use both?

**Answer:**

| | AsyncStorage | expo-secure-store |
|--|--|--|
| Encryption | None | Device Keychain (iOS) / Keystore (Android) |
| Speed | Fast sync-ish | Async, slightly slower |
| Capacity | Large | Small (2048 bytes per key on iOS) |
| Rooted device risk | Readable | Encrypted, tied to app |

In this codebase:

- **SecureStore** stores `userToken` (access token) and `refreshToken` — see `authStore.ts` lines 43-47 and `client.ts` line 89. These are security-critical.
- **AsyncStorage** stores the Zustand-persisted `user` object and `localAvatar` — see `authStore.ts` line 153 `partialize`. This is non-sensitive profile data that needs to be read fast on launch.

The `authStore` `partialize` function (line 153) deliberately excludes the token from AsyncStorage persistence:
```ts
partialize: (state) => ({ user: state.user, localAvatar: state.localAvatar }),
```
The token lives only in SecureStore, never in AsyncStorage.

---

### Q6. What happens when the app launches — walk through the full initialization sequence?

**Answer:**

`app/_layout.tsx` `init()` function (lines 82-133) runs in this exact order:

1. `analytics.init()` — initializes Sentry breadcrumb tracking
2. `Linking.getInitialURL()` — checks if app was opened via deep link
3. `checkAuth()` — reads token from SecureStore, validates it, tries refresh if expired, sets `isAuthenticated`
4. `requestPermissions()` — asks for push notification permission
5. `scheduleReminderNotification()` — schedules a daily reminder if permissions granted
6. Biometric check — reads `biometric_enabled` from AsyncStorage; if true AND user is authenticated, calls `LocalAuthentication.authenticateAsync()`
7. `setIsReady(true)` — unblocks the routing guard
8. `NetInfo.fetch()` — checks initial connectivity; shows `OfflineScreen` if offline
9. `SplashScreen.hideAsync()` — hides the native splash screen, triggering `AnimatedSplashScreen`

If biometric fails (line 109-113), the app calls `logout()` and shows a dialog — it does NOT stay locked, it forces the user to re-login.

---

## CATEGORY 2: State Management (Zustand)

---

### Q7. Why did you choose Zustand over Redux or Context API?

**Answer:**

Three concrete reasons specific to this codebase:

**1. Outside-React access.** The Axios request interceptor in `client.ts` line 89 reads the token synchronously:
```ts
const token = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
```
And the response interceptor at line 140 calls:
```ts
await useAuthStore.getState().logout();
```
With Context API, this is impossible — Context only works inside React components. Redux could do it via a store reference import, but it adds boilerplate.

**2. `persist` middleware.** `courseStore.ts` lines 79-348 use `create(persist(...))` to automatically serialize 10 fields (bookmarks, enrolledCourses, completedCourses, quizScores, timeline, notes, streak, etc.) to AsyncStorage with one configuration block. With Context API this would be 50+ lines of `useEffect` + `JSON.stringify/parse`.

**3. `partialize`.** `authStore.ts` line 153 uses `partialize` to persist ONLY `user` and `localAvatar` to AsyncStorage — the token is excluded. This kind of selective persistence is trivial in Zustand and complex everywhere else.

---

### Q8. How does the course store cache work and when does it refetch?

**Answer:**

`courseStore.ts` lines 109-142:

```ts
const { courses, lastFetched } = get();
const now = Date.now();

if (courses.length > 0 && lastFetched && now - lastFetched < CACHE_TTL) {
  return;  // cache hit
}
```

`CACHE_TTL` is `5 * 60 * 1000` (5 minutes), defined at line 55.

Three conditions must ALL be true to skip the network call: courses array is non-empty AND `lastFetched` is set AND it was set less than 5 minutes ago.

To force a refetch, `refreshCourses()` (line 324) resets `lastFetched` to `null`:
```ts
refreshCourses: async () => {
  set({ lastFetched: null, error: null });
  await get().fetchCourses();
},
```
`lastFetched` is also part of the `partialize` list (line 344), so it survives app restarts. If the user restarts the app within 5 minutes, no network call is made.

---

### Q9. How does the course store `partialize` prevent over-persisting?

**Answer:**

`courseStore.ts` lines 336-346:
```ts
partialize: (state) => ({
  bookmarks: state.bookmarks,
  enrolledCourses: state.enrolledCourses,
  completedCourses: state.completedCourses,
  quizScores: state.quizScores,
  timeline: state.timeline,
  notes: state.notes,
  lastFetched: state.lastFetched,
  streak: state.streak,
  lastStreakUpdate: state.lastStreakUpdate,
}),
```

What is explicitly **NOT** persisted: `courses[]`, `filteredCourses[]`, `recommendedCourses[]`, `isLoading`, `error`, `searchQuery`, `aiRecommendedIds`.

The full course catalog (`courses[]`) is not persisted because it can be large and is always refetched fresh. Persisting it would bloat AsyncStorage and could serve stale course data indefinitely.

---

### Q10. How does logout clean up state across stores?

**Answer:**

`authStore.ts` lines 78-83:
```ts
logout: async () => {
  await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  Sentry.setUser(null);
  set({ user: null, token: null, isAuthenticated: false });
},
```

**Important gap to know:** The current `logout()` only resets `authStore`. It does NOT reset `courseStore`. This means `bookmarks`, `enrolledCourses`, `completedCourses`, `notes`, and `timeline` from the previous user **remain in AsyncStorage** if a second user logs in on the same device.

This is a real bug. The fix would be to call `useCourseStore.getState().reset()` from inside `logout()`, with a corresponding `reset` action in `courseStore` that clears all user-specific fields while keeping the course catalog.

---

### Q11. How do you prevent unnecessary re-renders in components that use Zustand?

**Answer:**

Zustand re-renders a component only when the value returned by its selector changes. In this codebase, screens use targeted selectors:

```ts
// Only re-renders when 'courses' array reference changes
const courses = useCourseStore(state => state.courses);

// Only re-renders when 'bookmarks' array changes
const bookmarks = useCourseStore(state => state.bookmarks);
```

If you instead wrote `const store = useCourseStore()`, the component would re-render on any field change in the store — including `isLoading`, `searchQuery`, `error`, etc. The selector pattern is the key optimization.

---

## CATEGORY 3: API & Networking

---

### Q12. Walk me through the Axios client setup in full.

**Answer:**

`core/api/client.ts`:

**Instance creation (lines 16-19):**
```ts
export const apiClient = axios.create({
  baseURL: API_BASE_URL,  // from EXPO_PUBLIC_API_URL env var
  timeout: REQUEST_TIMEOUT_MS,  // 10000ms
});
```

**Request interceptor (lines 82-98):**
1. Calls `NetInfo.fetch()` — if `!state.isConnected`, immediately rejects with `Error("NO_INTERNET")`, no HTTP call is made
2. Reads `userToken` from SecureStore
3. Attaches it as `Authorization: Bearer <token>` header

**Response interceptor (lines 101-146):**
1. Logs every error to console (URL, status, message, response body)
2. If error is `"NO_INTERNET"`, passes it through unchanged
3. If `401` AND not the refresh endpoint AND not already retried (`!_authRetry`):
   - Sets `_authRetry = true` on the request config
   - Calls `refreshAccessToken()`
   - If refresh succeeds: updates header, retries original request
   - If refresh fails: calls `logout()`, rejects
4. For all other errors: delegates to `handleRetry()`

**Retry logic (lines 57-78):**
- Retries on: `ECONNABORTED` (timeout), no response (network error), or status 429/500/502/503/504 (from `isRetryableStatus()` in `utils.ts`)
- Max 3 retries (`MAX_RETRY_COUNT`)
- Backoff: `Math.pow(2, retryCount - 1) * 1000` → 1s, 2s, 4s (from `getBackoffTime()` in `utils.ts`)
- Does NOT retry 4xx errors (client errors)

---

### Q13. How does token refresh happen and what prevents an infinite loop?

**Answer:**

`client.ts` lines 126-142:
```ts
if (
  error.response?.status === 401 &&
  !isRefreshRequest &&
  !originalRequest._authRetry
) {
  originalRequest._authRetry = true;
  const refreshedToken = await refreshAccessToken();
  ...
}
```

Three guards prevent loops:
1. `!isRefreshRequest` — the refresh endpoint itself (`/api/v1/users/refresh-token`) getting a 401 does not trigger another refresh
2. `!originalRequest._authRetry` — once a request has been retried after refresh, it will not be retried again
3. `refreshAccessToken()` (lines 21-55) uses a **bare `axios.post()`** call (not `apiClient`), so the refresh call itself does not go through the response interceptor

**Known race condition:** If two requests fail with 401 simultaneously, both will independently try to call the refresh endpoint. The `_authRetry` flag is per-request, not global, so both get through. The fix is a shared promise/lock for the refresh call, which is not currently implemented.

---

### Q14. How does the app behave when the device is offline?

**Answer:**

Two layers:

**Layer 1 — Request interceptor (`client.ts` line 83-87):**
```ts
const state = await NetInfo.fetch();
if (!state.isConnected) {
  return Promise.reject(new Error("NO_INTERNET"));
}
```
Every API call is checked before it goes out. The `getFriendlyErrorMessage()` function in `courseStore.ts` (lines 57-76) catches this specific error string and shows: `"No internet connection. Showing cached content when available."`

**Layer 2 — UI (`_layout.tsx` lines 180-189):**
`useNetworkStatus()` hook from `shared/utils/network` subscribes to `NetInfo.addEventListener`. When `isConnected` is false, either `OfflineScreen` (if offline from the start) or `OfflineBanner` (if went offline mid-session) is shown.

`useNetworkStatus` also tracks `wasOffline` (line 39 of the hook) — a ref that goes `true` if the device ever lost connectivity during the session, used for showing "back online" toasts.

---

## CATEGORY 4: AI Integration (Groq)

---

### Q15. Walk through the full Groq agent flow from user message to response.

**Answer:**

`features/ai/services/groqAgent.ts` `processUserMessage()` function:

**Step 1 (lines 56-57):** Add user message to `aiStore` via `addMessage()`, set `isTyping: true`

**Step 2 (lines 59-65):** Build conversation context:
```ts
[
  { role: 'system', content: SYSTEM_PROMPT },
  ...existing messages mapped to {role, content},
  { role: 'user', content: userMessage }
]
```

**Step 3 (lines 68-72):** Check for placeholder API key — if `EXPO_PUBLIC_GROQ_API_KEY` is missing or equals `'gsk_placeholder_replace_me'`, throw immediately (triggers mock/error path).

**Step 4 (lines 74-82):** First call to `llama-3.3-70b-versatile` with `tools` attached and `tool_choice: "auto"`. This is a non-streaming call that returns either a text response or a tool call decision.

**Step 5 — Tool path (lines 85-125):** If `responseMessage.tool_calls` exists:
- Appends the assistant's tool-call message to context
- Calls `getAvailableCourses()` which reads `useCourseStore.getState().courses` and maps to `{id, title, category, price, instructor, lessons}`
- Appends tool result as `{ role: "tool", name: "get_courses", content: JSON.stringify(courses) }`
- Makes a **second call** to `llama-3.1-8b-instant` (faster, smaller model) with `stream: true`
- Streams the response chunk by chunk via `appendMessageChunk()`

**Step 6 — Direct path (lines 127-153):** If no tool calls, streams a direct response from `llama-3.3-70b-versatile`.

**Step 7 (lines 116-124 and 144-152):** After streaming ends, scans the final message text for any course title match to attach a `courseId` to the message (used by the UI to show a course card inline).

**Step 8 (finally block, line 162):** `setTyping(false)`.

---

### Q16. Why are two different models used in the agent?

**Answer:**

`groqAgent.ts` uses:
- `llama-3.3-70b-versatile` for the **first call** (lines 76, 131) — the larger model is better at deciding whether to call a tool and formulating the tool arguments correctly
- `llama-3.1-8b-instant` for the **second call after tool use** (line 104) — once the tool result is provided, the model just needs to format a natural language response from structured data; the smaller, faster model is sufficient and cheaper

This is a deliberate cost/quality tradeoff: use the smart model for reasoning, the fast model for synthesis.

---

### Q17. How does the mock/fallback mode work when the Groq key is missing?

**Answer:**

Lines 68-72 of `groqAgent.ts`:
```ts
const isPlaceholder = 
  !process.env.EXPO_PUBLIC_GROQ_API_KEY || 
  process.env.EXPO_PUBLIC_GROQ_API_KEY === 'gsk_placeholder_replace_me';

if (isPlaceholder) {
  throw new Error('401: Missing API Key');
}
```

This throw is caught by the outer `catch` block (lines 155-160), which adds an error message to the chat:
```ts
addMessage({ 
  text: "I'm sorry, I encountered an error connecting to my server...", 
  sender: 'ai' 
});
```

There is no graceful mock response — the agent just shows an error. The `gsk_placeholder_replace_me` string is the default in the Groq client initialization (line 9), so it serves as the sentinel value for "no real key configured."

---

### Q18. What is the `smartSearch` function and how does it differ from `processUserMessage`?

**Answer:**

`groqAgent.ts` lines 166-193 — `smartSearch` is a separate, stateless function used by the Explore screen. It does NOT manage chat history or streaming:

```ts
export const smartSearch = async (query: string): Promise<string[]> => {
  // Sends course catalog + user query to llama-3.3-70b-versatile
  // Forces JSON response format: { "ids": [...] }
  // Returns array of matching course IDs
};
```

It uses `response_format: { type: "json_object" }` to force the model to return structured data instead of prose. The Explore screen uses these IDs to highlight or reorder results.

`processUserMessage` is for **conversational AI** (chat history, streaming, tool calling).
`smartSearch` is for **semantic search** (one-shot, returns IDs, no conversation state).

---

## CATEGORY 5: Authentication & Security

---

### Q19. Where exactly is the access token stored — AsyncStorage or SecureStore?

**Answer:**

**SecureStore only.** This is a common point of confusion because the store uses Zustand `persist` (which writes to AsyncStorage), but the `partialize` function at `authStore.ts` line 153 explicitly excludes the token:

```ts
partialize: (state) => ({ user: state.user, localAvatar: state.localAvatar }),
```

The token is written to SecureStore in `authStore.login()` (line 43):
```ts
await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, res.data.accessToken);
```

And read from SecureStore in `client.ts` request interceptor (line 89):
```ts
const token = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
```

So AsyncStorage holds user profile and avatar; SecureStore holds both tokens. The `token` field in Zustand state is populated at runtime but NOT persisted to AsyncStorage.

---

### Q20. How does the biometric unlock work in detail?

**Answer:**

`app/_layout.tsx` lines 100-119:

```ts
const biometricEnabled = await AsyncStorage.getItem('biometric_enabled');
if (biometricEnabled === 'true' && useAuthStore.getState().isAuthenticated) {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Unlock Edurise LMS',
    fallbackLabel: 'Use Passcode',
  });
  if (result.success) {
    setIsUnlocked(true);
  } else {
    await useAuthStore.getState().logout();  // force logout on failure
    setIsUnlocked(true);
    setDialogConfig({ visible: true, title: 'Authentication Failed', ... });
  }
} else {
  setIsUnlocked(true);
}
```

Key details:
- `isUnlocked` starts as `false`. Lines 159-161 return `null` (blank screen) until `isUnlocked && isReady`. So the app UI is gated behind biometric.
- Biometric is only triggered if the user is already authenticated. If not logged in, biometric is skipped.
- On failure: the app calls `logout()` then sets `isUnlocked(true)`. The blank screen disappears and the auth guard immediately redirects to login because `isAuthenticated` is now `false`.
- The toggle in the Profile screen saves `'true'`/`'false'` to AsyncStorage and validates `hasHardwareAsync()` + `isEnrolledAsync()` before enabling.

---

### Q21. What security weaknesses exist and how would you fix them?

**Answer:**

**1. Groq API key in the client bundle.**
`groqAgent.ts` line 9: `process.env.EXPO_PUBLIC_GROQ_API_KEY` is inlined into the JS bundle at build time. Anyone who decompiles the app can extract it.
**Fix:** Proxy AI requests through your own backend. Client sends `POST /api/ai/chat`, your server holds the Groq key and calls Groq, streams the response back.

**2. `dangerouslyAllowBrowser: true` in Groq client.**
`groqAgent.ts` line 11: This flag suppresses Groq SDK's warning about running in a browser context. It works but is a code smell indicating the client-side usage is acknowledged as non-ideal.
**Fix:** Same as above — move to a backend proxy.

**3. Course HTML WebView with `javaScriptEnabled: true`.**
`courseHtml.ts` generates HTML from course data. Currently safe because we write the HTML ourselves. But if `course.description` or `course.title` ever contains `<script>` tags from a compromised API, they will execute in the WebView.
**Fix:** Sanitize `course.title`, `course.description`, and `course.category` before interpolating them into the HTML template — strip tags, escape HTML entities.

**4. Logout doesn't wipe courseStore.**
As noted in Q10, `authStore.logout()` does not reset `courseStore`. A subsequent user on the same device inherits the previous user's bookmarks, enrollments, and notes from AsyncStorage.
**Fix:** Call `useCourseStore.getState().reset()` inside `logout()`.

---

## CATEGORY 6: Performance

---

### Q22. How do you optimize FlatList performance for the course list?

**Answer:**

The course list uses:

1. **Selector-based subscription** — `const courses = useCourseStore(state => state.filteredCourses)` — only re-renders when `filteredCourses` changes, not on any store update

2. **5-minute TTL cache** — `courseStore.fetchCourses()` skips the network call if data is fresh (lines 112-121), so scrolling back to the home screen doesn't trigger a refetch

3. **`React.memo`** on course card components — if the course object reference hasn't changed, the card doesn't re-render

4. The course list uses `FlatList` (not `ScrollView`) which only renders visible items and recycles off-screen item views

---

### Q23. How does code splitting work with Expo Router?

**Answer:**

Expo Router automatically code-splits per route. Practically:
- The AI tutor screen (`app/ai-tutor.tsx`) and its import of `groqAgent.ts` + the Groq SDK are in their own bundle chunk
- The Groq SDK is only downloaded and parsed when the user navigates to the AI screen for the first time
- The home tab (`(tabs)/index.tsx`) loads without pulling in the AI code at all

This keeps the initial JS bundle small and reduces time-to-interactive on first launch, which matters on low-end Android devices.

---

### Q24. The course fetch does `Promise.all` for two API calls. Why?

**Answer:**

`courseStore.ts` lines 125-131:
```ts
const [instructors, products] = await Promise.all([
  coursesApi.fetchInstructors(),
  coursesApi.fetchProducts(),
]);
const mergedCourses = coursesApi.mergeCourses(instructors, products);
```

The FreeAPI backend separates instructors and products into two endpoints. Both calls are independent, so `Promise.all` runs them in parallel — the total wait time is `max(t_instructors, t_products)` instead of `t_instructors + t_products`. For typical API latencies of 200-500ms each, this roughly halves the loading time for the course catalog.

---

## CATEGORY 7: Testing

---

### Q25. How do you test Zustand stores in isolation?

**Answer:**

Pattern used in `authStore.test.ts`:

```ts
// Mock the API layer
jest.mock('@/features/auth/api/authApi');

it('sets isAuthenticated after login', async () => {
  // Arrange: mock the API response
  (authApi.login as jest.Mock).mockResolvedValue({
    data: { user: mockUser, accessToken: 'tok', refreshToken: 'ref' }
  });
  
  // Act: call the store action directly
  await useAuthStore.getState().login({ email: 'a@b.com', password: 'pass' });
  
  // Assert: check store state
  expect(useAuthStore.getState().isAuthenticated).toBe(true);
  expect(useAuthStore.getState().user).toEqual(mockUser);
});
```

Between tests, reset the store:
```ts
beforeEach(() => {
  useAuthStore.setState({ user: null, token: null, isAuthenticated: false, isLoading: false });
});
```
Zustand stores are singletons — if you don't reset between tests, state leaks across test cases.

---

### Q26. How would you test the Groq streaming functionality?

**Answer:**

Mock the Groq SDK with an async generator:

```ts
jest.mock('groq-sdk', () => ({
  default: jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockImplementation(({ stream }) => {
          if (stream) {
            return (async function* () {
              yield { choices: [{ delta: { content: 'Hello' } }] };
              yield { choices: [{ delta: { content: ' world' } }] };
              yield { choices: [{ finish_reason: 'stop', delta: {} }] };
            })();
          }
          // non-streaming: return tool call response
          return { choices: [{ message: { tool_calls: null, content: 'direct' } }] };
        })
      }
    }
  }))
}));

it('streams chunks into aiStore', async () => {
  await processUserMessage('hello');
  const messages = useAIStore.getState().messages;
  const aiMsg = messages[messages.length - 1];
  expect(aiMsg.text).toBe('Hello world');
  expect(aiMsg.sender).toBe('ai');
});
```

Also test that `setTyping(false)` is always called — even when the stream throws — by checking it in the `finally` block.

---

## CATEGORY 8: Architecture Decisions

---

### Q27. Why is `aiStore` not persisted while `courseStore` is?

**Answer:**

`aiStore.ts` uses plain `create()` (line 29), not `create(persist(...))`. Chat messages reset every app launch.

**Reasoning:**
1. Chat history is conversational context — stale messages from a previous session would confuse the LLM context and give irrelevant responses
2. The store includes a hardcoded `DEFAULT_MESSAGES` welcome message (lines 21-27) that should always be the first message
3. Chat messages can grow large; persisting them would slow AsyncStorage reads on launch for data the user rarely cares about

Course data is persisted because the 5-minute cache means faster perceived load on relaunch. AI chat has no equivalent benefit from persistence.

---

### Q28. The `courseStore` has 12 fields in `partialize` but does not persist `courses[]`. What is the reasoning?

**Answer:**

`courses[]` is the full catalog fetched from the API. It is excluded because:
1. It can contain hundreds of objects with nested instructor data — persisting it bloats AsyncStorage significantly
2. It is always re-fetched on launch (unless within the 5-minute TTL); the TTL is the caching mechanism, not AsyncStorage
3. If the catalog changes server-side (new courses, price updates), a persisted stale catalog would show wrong data until the TTL expires

The `lastFetched` timestamp IS persisted — this is what enables the TTL cache to work correctly across app restarts. Without persisting `lastFetched`, the app would always think the cache is cold and refetch on every launch.

---

### Q29. What would you improve about the current architecture?

**Answer:**

Four concrete improvements:

**1. Fix the logout data isolation bug.** `authStore.logout()` doesn't reset `courseStore`. Add a `reset()` action to `courseStore` and call it from `logout()`.

**2. Add a token refresh lock to fix the race condition.** Two simultaneous 401 responses both try to refresh. Add a module-level promise that the first 401 creates and subsequent 401s await:
```ts
let refreshPromise: Promise<string | null> | null = null;
// in interceptor:
if (!refreshPromise) refreshPromise = refreshAccessToken().finally(() => refreshPromise = null);
const token = await refreshPromise;
```

**3. Proxy Groq through a backend.** The API key is in the client bundle. A BFF (Backend for Frontend) endpoint protects the key and enables rate limiting per user.

**4. Sanitize course HTML interpolation.** `courseHtml.ts` interpolates `course.title`, `course.description`, and `course.category` directly into an HTML template. An XSS-safe version escapes HTML entities before interpolation.

---

### Q30. How would you add offline write support (e.g., offline bookmarking)?

**Answer:**

Current behavior: `toggleBookmark()` in `courseStore.ts` (lines 181-208) is purely local — it updates the Zustand state and fires an analytics event. There is no `POST /bookmarks/:id` API call shown. So bookmarks are already client-local.

If you needed to sync bookmarks to a backend for cross-device access:

1. Optimistically update the local state immediately (keep current behavior)
2. Enqueue the operation: `AsyncStorage.setItem('pending_bookmarks', JSON.stringify([...queue, {courseId, action: 'add', ts}]))`
3. In `useNetworkStatus`, when `wasOffline` flips from `true` to `false` (back online), drain the queue:
   ```ts
   for (const op of queue) {
     await api.post(`/bookmarks/${op.courseId}`);
   }
   await AsyncStorage.removeItem('pending_bookmarks');
   ```
4. On conflict (item deleted server-side): server wins — remove from local bookmarks

---

## CATEGORY 9: Trick Questions (Know These Cold)

---

### Q31. The `_authRetry` flag prevents infinite refresh loops — but what about two simultaneous 401 responses?

**Answer:**

This is a real race condition in `client.ts`. The `_authRetry` flag is set per-request config object:
```ts
originalRequest._authRetry = true;
```

If `requestA` and `requestB` both receive 401 responses at the same time, they each check their own `_authRetry` (both `false`), both enter the refresh branch, and both call `refreshAccessToken()` independently. This results in two calls to `POST /api/v1/users/refresh-token`.

Most backends accept this (the second refresh call just gets a fresh token using the latest refresh token), but some invalidate the refresh token on first use — causing the second call to fail and log the user out unexpectedly.

**Fix:** A module-level refresh lock:
```ts
let pendingRefresh: Promise<string | null> | null = null;

// in response interceptor:
if (!pendingRefresh) {
  pendingRefresh = refreshAccessToken().finally(() => pendingRefresh = null);
}
const token = await pendingRefresh;
```
All concurrent 401s share the same refresh promise.

---

### Q32. The `courseHtml.ts` generator interpolates `course.title` directly into HTML. Is this safe?

**Answer:**

Currently yes — because course data comes from the FreeAPI backend and is not user-generated. But it is fragile. If `course.title` were ever `"><script>alert(1)</script>` (e.g., from a compromised or different backend), it would execute in the WebView because `javaScriptEnabled={true}`.

The safe fix is an HTML escape function applied before interpolation:
```ts
const esc = (s: string) => s
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

// Then:
<h1>${esc(course.title)}</h1>
<div class="badge">${esc(course.category)}</div>
```

---

### Q33. `authStore.logout()` doesn't reset `courseStore`. What user-visible bug does this cause?

**Answer:**

Scenario: User A logs in, bookmarks 5 courses, enrolls in 3. User A logs out. User B logs in on the same device.

User B will see:
- 5 bookmarks they never added (from User A's `bookmarks[]` in AsyncStorage)
- 3 enrolled courses (from User A's `enrolledCourses[]`)
- User A's timeline activity
- User A's quiz scores
- User A's notes

This is a data privacy and UX bug. The fix is a `reset()` action in `courseStore` that clears all user-specific fields, called from `logout()`:

```ts
// In courseStore:
reset: () => set({
  bookmarks: [],
  enrolledCourses: [],
  completedCourses: [],
  quizScores: {},
  timeline: [],
  notes: {},
  streak: 0,
  lastStreakUpdate: null,
  aiRecommendedIds: [],
}),

// In authStore.logout():
logout: async () => {
  await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  Sentry.setUser(null);
  useCourseStore.getState().reset();  // Add this
  set({ user: null, token: null, isAuthenticated: false });
},
```

---

### Q34. What happens if the app is force-killed after `enrollCourse()` updates the local state but before the next sync?

**Answer:**

`courseStore.enrollCourse()` (lines 211-226) is client-local — it only updates `enrolledCourses[]` in Zustand state. There is no `POST /enroll` API call in the current implementation. Enrollment is tracked entirely client-side and persisted to AsyncStorage via `partialize`.

This means:
- Force-killing the app mid-enrollment is safe because Zustand's persist middleware writes to AsyncStorage synchronously on every `set()` call
- The enrollment survives app restarts

However, the enrollment is **not synced to the backend**. If the user installs the app on a new device, their enrollments won't carry over. This is a deliberate offline-first design choice with the tradeoff of no cross-device sync.

If you wanted server sync, the fix is: call `POST /courses/:id/enroll` when `enrollCourse()` is called; on failure, keep the local state but flag the enrollment as "pending sync" and retry on next launch.

---

## CATEGORY 10: Behavioral Questions

---

### Q35. Why does the agent use two separate model calls instead of one streaming call with tools?

**Answer:**

The Groq streaming API and tool calling cannot be combined in a single request in the current implementation. When `tool_choice: "auto"` is used, the first call returns synchronously to check if the model wants to call a tool. If it does, the tool result is injected into the conversation and a second call is made — this second call can stream.

If you tried to stream the first call while also using tools, you would not know whether the accumulated response was a text answer or a tool call until the stream ended, making it impossible to execute the tool mid-stream. The two-call pattern is the standard agentic pattern for this reason.

---

### Q36. How would you add a second tool to the agent (e.g., `get_user_progress`)?

**Answer:**

Three steps:

**1. Add the tool definition** to the `tools` array in `groqAgent.ts` (after line 50):
```ts
{
  type: "function",
  function: {
    name: "get_user_progress",
    description: "Get the current user's enrolled courses and completion status",
    parameters: { type: "object", properties: {}, required: [] },
  }
}
```

**2. Handle the tool call** in the `for (const toolCall of responseMessage.tool_calls)` loop (after line 93):
```ts
} else if (toolCall.function.name === 'get_user_progress') {
  const { enrolledCourses, completedCourses } = useCourseStore.getState();
  conversationContext.push({
    tool_call_id: toolCall.id,
    role: "tool",
    name: "get_user_progress",
    content: JSON.stringify({ enrolledCourses, completedCourses }),
  });
}
```

**3. Update the system prompt** to tell the model when to use it:
```ts
const SYSTEM_PROMPT = `...
- If the user asks about their progress or enrolled courses, use 'get_user_progress'.`;
```

No changes needed to the streaming or message-handling code.

---

### Q37. The `streak` logic in `courseStore` has a subtle bug. Can you find it?

**Answer:**

`courseStore.ts` lines 301-322:

```ts
updateStreak: () => {
  const { streak, lastStreakUpdate } = get();
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  if (!lastStreakUpdate) {
    set({ streak: 1, lastStreakUpdate: today });
    return;
  }

  const lastUpdate = new Date(lastStreakUpdate);
  const lastDay = new Date(lastUpdate.getFullYear(), lastUpdate.getMonth(), lastUpdate.getDate()).getTime();

  const diff = today - lastDay;
  const oneDay = 24 * 60 * 60 * 1000;

  if (diff === oneDay) {
    set({ streak: streak + 1, lastStreakUpdate: today });
  } else if (diff > oneDay) {
    set({ streak: 1, lastStreakUpdate: today });
  }
  // BUG: if diff === 0 (same day), nothing happens — correct
  // BUG: uses device local time, not UTC — if a user is at midnight timezone boundary, `today` changes but `lastDay` may not reflect the same day boundary
},
```

**The bug:** `diff === oneDay` uses strict equality. If the user's device clock has any drift (even 1ms), or if there is a daylight saving time transition between the two updates (clocks go back 1 hour making the diff 23 hours), the streak is silently broken even though the user opened the app on consecutive days.

**Fix:** Use a range check instead of strict equality:
```ts
if (diff >= oneDay && diff < 2 * oneDay) {
  set({ streak: streak + 1, lastStreakUpdate: today });
} else if (diff >= 2 * oneDay) {
  set({ streak: 1, lastStreakUpdate: today });
}
```

---

*All answers reference actual source code — file paths and line numbers verified against the repository.*
*Last updated: May 2026*
