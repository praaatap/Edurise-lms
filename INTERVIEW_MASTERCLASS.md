# Edurise LMS — React Native & Expo Interview Masterclass (130+ Q&As)

> This document is your ultimate preparation guide for React Native / Expo developer interviews.
> Every single answer is mapped **directly to your codebase** (referencing file paths, Zustand stores, Clarity, Sentry, push notifications, and dynamic icons).
> For each question, we provide the **English Technical Answer**, a **Follow-up Question**, and a **Hinglish (Hindi + English) Concept Explanation** to help you explain it naturally and confidently.

---

## Table of Contents
1. [React Native & Expo Fundamentals (Q1 - Q15)](#1-react-native--expo-fundamentals-q1---q15)
2. [Expo Router & Route Groups (Q16 - Q25)](#2-expo-router--route-groups-q16---q25)
3. [State Management with Zustand & Persistence (Q26 - Q40)](#3-state-management-with-zustand--persistence-q26---q40)
4. [Networking, Axios Interceptors, Offline & Resiliency (Q41 - Q55)](#4-networking-axios-interceptors-offline--resiliency-q41---q55)
5. [AI Integration & Groq Agent Flow (Q56 - Q70)](#5-ai-integration--groq-agent-flow-q56---q70)
6. [Sentry Monitoring & Performance Tracking (Q71 - Q80)](#6-sentry-monitoring--performance-tracking-q71---q80)
7. [Microsoft Clarity Session Recording (Q81 - Q90)](#7-microsoft-clarity-session-recording-q81---q90)
8. [Dynamic App Icon Changer (Q91 - Q98)](#8-dynamic-app-icon-changer-q91---q98)
9. [Push Notifications & Setting Preferences (Q99 - Q110)](#9-push-notifications--setting-preferences-q99---q110)
10. [Security & Keychain Storage (Q111 - Q120)](#10-security--keychain-storage-q111---q120)
11. [Performance Optimization (Q121 - Q130)](#11-performance-optimization-q121---q130)
12. [Testing, Mocks & Jest Coverage (Q131 - Q138)](#12-testing-mocks--jest-coverage-q131---q138)

---

## 1. React Native & Expo Fundamentals (Q1 - Q15)

### Q1. What is the execution flow when an Expo app boots up?
*   **English Answer:** When the app starts, the native code loads the React Native entry point, which loads the JavaScript bundle. In our app, the root layout `app/_layout.tsx` mounts first. It acts as the bootstrapper, loading custom fonts via `expo-font`, checking auth states from SecureStore, initializing analytics services (Sentry and Microsoft Clarity), requesting push notification permissions, and checking if biometrics are enabled before hiding the native splash screen.
*   **Follow-up Question:** How do you prevent a white flash when the app finishes loading?
*   **Hinglish Explanation:** Jab app start hoti hai, toh sabse pehle native container JS bundle ko load karta hai. Humare app mein `app/_layout.tsx` sabse pehle load hota hai. Yeh initial checkup karta hai—jaise fonts load karna, Sentry/Clarity initialize karna, aur biometrics trigger karna, tabhi splash screen hide hoti hai.

### Q2. How is dynamic styling handled without stylesheet files in this app?
*   **English Answer:** We use NativeWind, which is a Tailwind CSS utility wrapper for React Native. At build time, NativeWind compiles class names like `flex-1 bg-white dark:bg-gray-900` into React Native `StyleSheet` objects, keeping the UI layout flexible and fast.
*   **Follow-up Question:** Does NativeWind affect runtime performance?
*   **Hinglish Explanation:** Hum styling ke liye NativeWind use karte hain jo Tailwind classes (`className`) ko build time par standard React Native `StyleSheet` mein convert kar deta hai. Isse stylesheets likhne ka time bachta hai aur runtime par koi performance lag nahi aata.

### Q3. How does the app support Dark Mode dynamically?
*   **English Answer:** We use NativeWind's `dark:` variant classes which watch the device color scheme via the React Native runtime. We also have a custom hook `useTheme` in `core/theme/useTheme.ts` that exports `C` (color theme object) and `isDark` boolean. Components subscribe to this hook to dynamically apply inline styles or props if needed.
*   **Follow-up Question:** What happens if the user overrides system dark mode inside your app?
*   **Hinglish Explanation:** Hum design mein dark mode apply karne ke liye do cheezein use karte hain: pehla `dark:` prefixes humare classNames mein, aur doosra `useTheme` hook jo dynamic theme objects fetch karta hai. Agar user system preferences change karta hai toh pure app ka theme instantaneously switch ho jata hai.

### Q4. What is the difference between AsyncStorage and SecureStore in this project?
*   **English Answer:** `expo-secure-store` encrypts sensitive data and stores it in Keychain (iOS) or Keystore (Android), with a key size limit of 2KB. We use it for authentication tokens (`accessToken`, `refreshToken`). `AsyncStorage` is unencrypted and used for larger, non-sensitive persist states like course catalogs, bookmarks, preferences, and theme settings.
*   **Follow-up Question:** Why can't we store everything in SecureStore?
*   **Hinglish Explanation:** `expo-secure-store` secure encrypted storage hai (Keychain/Keystore use karta hai), jisme hum sensitive tokens rakhte hain. Aur `AsyncStorage` normal key-value store hai jisme non-sensitive, large settings aur cache states save hoti hain jaise bookmarks aur notification preferences.

### Q5. How do you implement a biometric unlock lock during app start?
*   **English Answer:** In `app/_layout.tsx` (or inside `useRootLayoutController.ts`), we read `biometric_enabled` from AsyncStorage. If enabled and the user is authenticated, we call `LocalAuthentication.authenticateAsync()`. The UI render is blocked (returns `null` or splash) until the authentication resolves. If it fails, the app forces a logout and redirects to the login screen.
*   **Follow-up Question:** What native permission setup is required for biometrics on Android?
*   **Hinglish Explanation:** App launch hote hi hum check karte hain ki kya user ne profile mein biometric toggle on kiya hai. Agar kiya hai aur user logged-in hai, toh `expo-local-authentication` ka use karke fingerprint ya face lock dialog trigger karte hain. Jab tak authentication clear nahi hota, user ko screen nahi dikhti.

### Q6. Why is the React Native ActivityIndicator used instead of a custom GIF for loaders?
*   **English Answer:** `ActivityIndicator` renders the platform-native loading indicator (UIActivityIndicatorView on iOS and ProgressBar on Android). This is much more performant than rendering a custom GIF/animation, as it runs on the native UI thread, not the JS main thread, keeping the app smooth.
*   **Follow-up Question:** How can we customize the color of the ActivityIndicator?
*   **Hinglish Explanation:** Native `ActivityIndicator` standard mobile design follow karta hai aur platform-native thread par chalta hai. Isse loading ke waqt JS thread blank nahi hoti aur dynamic loader animations smooth lagte hain, bina memory extra consume kiye.

### Q7. How does the app handle Safe Area Insets dynamically?
*   **English Answer:** We use `react-native-safe-area-context` which provides the `useSafeAreaInsets` hook. It calculates screen notches, status bars, and home indicators on iOS and Android devices, returning exact padding values (top, bottom, left, right) to prevent elements from clipping.
*   **Follow-up Question:** What is the difference between `SafeAreaView` and `useSafeAreaInsets`?
*   **Hinglish Explanation:** Hum `useSafeAreaInsets` hook use karte hain padding and margins calculate karne ke liye. Yeh iOS ke notches aur Android ke bottom action bars ko dynamic detect karta hai, jisse header ya buttons screen se overlap nahi hote.

### Q8. What is the role of `expo-font` in loading assets?
*   **English Answer:** Custom typography is loaded asynchronously on launch using `useFonts` hook from `expo-font`. The splash screen stays visible using `SplashScreen.preventAutoHideAsync()` until the fonts are fully loaded, ensuring that no fallback system fonts are briefly visible to the user.
*   **Follow-up Question:** How do you declare custom fonts in your CSS file?
*   **Hinglish Explanation:** Custom fonts hum launch par asynchronously load karte hain `expo-font` se. Jab tak font load nahi hote, hum splash screen ko auto-hide nahi hone dete, jisse user ko font switching ya standard system font visible nahi hota.

### Q9. How do you handle deep linking in your Expo project?
*   **English Answer:** In `app.json`, we configure a `scheme` property (e.g., `edurise`). Expo Router automatically processes incoming URLs like `edurise://course/123` and resolves them through the file-based folder structure, pushing the corresponding screen on top of the navigation stack.
*   **Follow-up Question:** How can we test deep links on the simulator?
*   **Hinglish Explanation:** Hum static custom schemes configure karte hain `app.json` mein. Agar browser ya push notification se scheme execute hoti hai (jaise `edurise://course/12`), toh humara app dynamic parameters handle karke correct dynamic route par directly navigate ho jata hai.

### Q10. What are custom templates in Expo Prebuild and why are they needed?
*   **English Answer:** Expo Prebuild dynamically generates the iOS `ios` and Android `android` native folders from the JS config (`app.json`). If native modifications are needed, we write config plugins (e.g., for custom icons or splash screens) rather than modifying the native folders directly. This keeps the JS codebase clean and easily upgradeable.
*   **Follow-up Question:** How does prebuild differ from bare React Native?
*   **Hinglish Explanation:** Expo prebuild humare JS configs (`app.json`) se automated tarike se Android aur iOS ki native configuration files generate karta hai. Isse hume native code direct touch nahi karna padta aur upgrade ya platform change simple rehta hai.

### Q11. What is the purpose of `babel.config.js` in this codebase?
*   **English Answer:** It defines the transpiler settings for JS/TS code. We use the `babel-preset-expo` preset which handles React Native syntax and NativeWind styling transforms, and also hooks up module path aliases (`@/`) so we don't have to use complex relative paths in imports.
*   **Follow-up Question:** How do path aliases affect typescript compiling?
*   **Hinglish Explanation:** `babel.config.js` compiler configuration set karta hai. Yeh custom short paths (path aliases) enable karta hai (jaise `@/core` instead of `../../../core`), aur NativeWind plugins ko load karta hai jo build pipeline ke dynamic processing ke liye zaroori hai.

### Q12. How does the app check and manage network connection status?
*   **English Answer:** We use `@react-native-community/netinfo` inside `shared/hooks/useNetworkStatus.ts`. It subscribes to network changes and updates a global state. When the connection drops, we show a yellow offline banner at the top of the app, and block outward API calls instantly inside our Axios request interceptor.
*   **Follow-up Question:** How do you test the offline mode in development?
*   **Hinglish Explanation:** Hum `@react-native-community/netinfo` library ka active hook use karte hain network changes monitor karne ke liye. Agar internet chala jata hai, toh system dynamic banner render kar deta hai aur future requests ko prevent karta hai taaki unnecessary timeout na ho.

### Q13. Explain the difference between `expo-image` and standard React Native `Image`.
*   **English Answer:** `expo-image` is a highly optimized native image rendering library. It supports progressive loading with Blurhash, disc and memory caching, transitions when loading completes, and vector assets. It drastically improves scroll performance in lists containing thumbnails (like our courses list).
*   **Follow-up Question:** How do you implement a Blurhash placeholder?
*   **Hinglish Explanation:** Standard `Image` ke muqable `expo-image` native caching support deta hai. Yeh progressive dynamic blur placeholders show kar sakta hai, aur memory manage karta hai taaki long lists scroll karte waqt app crash na ho.

### Q14. What are OTA (Over-The-Air) updates and how are they configured?
*   **English Answer:** We use `expo-updates` which checks for new JavaScript bundles published to EAS updates. At app startup or resume, our hook checks if a JS bundle is available, downloads it in the background, and prompts the user to reload the app, updating the application instantly without going through standard App Store reviews.
*   **Follow-up Question:** Can OTA updates change native code?
*   **Hinglish Explanation:** OTA updates (`expo-updates`) JS bundle ko dynamic download karke run time par replace kar deta hai. Iska faida yeh hai ki normal bug fixes ke liye users ko App Store ya Play Store se dubara download nahi karna padta. Lekin agar native code change hua hai, toh store update zaroori hota hai.

### Q15. How do you implement Haptics feedback inside React Native?
*   **English Answer:** We import `expo-haptics` and call method `Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)` inside interactive actions (such as selecting dynamic app icons or enrolling in courses). This sends physical vibration feedback on physical devices, enhancing the premium feel of the app.
*   **Follow-up Question:** What are the different types of haptic feedback patterns available?
*   **Hinglish Explanation:** Premium experience ke liye hum `expo-haptics` ka use karte hain. Jab user important buttons toggle karta hai (jaise bookmark, icon select ya notifications setting change), tab hum native trigger se physical vibration check pass karte hain.

---

## 2. Expo Router & Route Groups (Q16 - Q25)

### Q16. How does Expo Router handle file-based routing?
*   **English Answer:** Every file created inside `/app/` folder automatically acts as a route. For example, `app/(tabs)/explore.tsx` translates to `/explore` path in the tab screen, and `app/course/[id].tsx` handles the dynamic route path where the parameter is extracted using `useLocalSearchParams()`.
*   **Follow-up Question:** What is the difference between `useLocalSearchParams` and `useGlobalSearchParams`?
*   **Hinglish Explanation:** Expo Router bilkul Web navigation ki tarah kaam karta hai. Jo file `app` directory ke andar hogi, wo automatically ek screen ban jayegi. Folder names and files routing build up karte hain, jiski wajah se manually navigation paths register nahi karne padte.

### Q17. What is the role of parentheses `(tabs)` and `(auth)` in the folder structure?
*   **English Answer:** Folders wrapped in parentheses create "Route Groups". They structure the routes layout without adding extra prefixes to the URL path. For example, `/app/(auth)/login.tsx` is accessed simply as `/login` but lets us separate unauthenticated layout stacks from tab layouts stack.
*   **Follow-up Question:** Can a screen exist in multiple route groups?
*   **Hinglish Explanation:** Parentheses wale names "Route Groups" hote hain. Yeh routes ko internally structure karte hain bina relative paths change kiye. Jaise `(auth)` login paths control karta hai bina user-visible url path badle.

### Q18. How do you implement a shared bottom tab layout using Expo Router?
*   **English Answer:** Inside `app/(tabs)/_layout.tsx`, we render a `<Tabs>` component. We define each dynamic tab inside `<Tabs.Screen name="index" ... />`. We configure icon properties, tint colors, and custom bottom floating components like our central AI Tutor trigger button.
*   **Follow-up Question:** How do you hide the tab bar on sub-screens?
*   **Hinglish Explanation:** Hum `(tabs)` folder ke andar layout check lagate hain `<Tabs>` component se. Tabs file list specify karti hai ki tab bar kab dikhega aur central float button (jaise AI Tutor button) ko add karke aesthetic view banata hai.

### Q19. How do you pass parameters to dynamic routes?
*   **English Answer:** We navigate using `router.push('/course/' + courseId)` and read the incoming parameters on the destination screen using `const { id } = useLocalSearchParams()`. This returns dynamic parameters synchronously from the navigation route state.
*   **Follow-up Question:** How do you enforce type safety for search params?
*   **Hinglish Explanation:** Dynamic navigation ke liye hum parameter link append karte hain URL mein. Incoming route component mein `useLocalSearchParams()` call karke parameters fetch ho jate hain, jisse hum dynamic API call start kar sakte hain.

### Q20. What is the purpose of `_layout.tsx` at the root of `app/` folder?
*   **English Answer:** The root `_layout.tsx` is the application shell. It manages Sentry wrapping, boots theme values, initializes Sentry and Clarity, performs biometric security checks, and mounts the React Context providers, wrapping the entire child route tree in an Error Boundary.
*   **Follow-up Question:** Can we render React Native components inside the root layout directly?
*   **Hinglish Explanation:** Root `_layout.tsx` pure app ki structural backbone hai. Yeh base configuration load karti hai, global handlers setup karti hai (jaise error boundary aur network checkers), aur iske bad nested stacks load hote hain.

### Q21. How do you conditionally direct unauthenticated users to the Login screen?
*   **English Answer:** We use an auth segment guard inside root layout controller. We watch `isAuthenticated` state from `authStore`. If the state resolves to false and the user is not currently inside the `(auth)` route group, we call `router.replace('/(auth)/login')`.
*   **Follow-up Question:** Why is `router.replace` used instead of `router.push` here?
*   **Hinglish Explanation:** Hum state subscription check karte hain. Agar `isAuthenticated` false hai aur user unauthenticated page par nahi hai, toh `router.replace` se user ko directly redirect kar dete hain takki back tap karne par screen bypass na ho.

### Q22. How do you implement a custom central Floating Action Button in the bottom tab bar?
*   **English Answer:** Inside `(tabs)/_layout.tsx`, we customize the tab bar properties. For the AI Tutor tab screen, we set the `tabBarButton` prop to return a custom React element—a circular button containing our AI chat logo styled with absolute position and high z-index.
*   **Follow-up Question:** How do you animate this floating button when active?
*   **Hinglish Explanation:** Tab bar configuration mein hum `tabBarButton` option custom return karte hain. Yeh React component center button ke border styles change karta hai aur click event par dynamic modal target control karta hai.

### Q23. What does `router.back()` do under the hood in Expo Router?
*   **English Answer:** It pops the top screen off the navigation tree stack, returning the user to the previous screen. It uses native OS navigation actions, maintaining transition animations on both Android and iOS devices.
*   **Follow-up Question:** What happens if `router.canGoBack()` returns false when calling it?
*   **Hinglish Explanation:** Yeh simple standard pop command hai jo stack ki top screen ko remove kar deta hai. Hardware back aur top headers back tap dono native transaction state use karte hain.

### Q24. How do you configure transition animations for screens in Expo Router?
*   **English Answer:** Inside `<Stack>` structure of layout files, we configure screen options. We use props like `animation: 'slide_from_bottom'` or `presentation: 'modal'` for premium sliding effects that match high-end native experiences.
*   **Follow-up Question:** Can we declare custom animation behaviors in typescript configuration?
*   **Hinglish Explanation:** Hum option level properties change karte hain `<Stack.Screen>` component ke. Animation property (slide, fade, ya modal) native transition transition settings override kar deti hai.

### Q25. How do you configure deep link redirections inside the root navigation stack?
*   **English Answer:** We handle incoming links with deep-linking configuration templates. If a user taps a deep link while the app is active, `Linking.addEventListener` catches the payload, parses parameters, and routes the stack using the router component.
*   **Follow-up Question:** What is the setup in android/app/src/main/AndroidManifest.xml for deep links?
*   **Hinglish Explanation:** Jab custom deep link URL click hota hai, app link parser run hota hai. Yeh links deep dynamic routing check pass karte hain aur current user ko directly target screen par slide kar dete hain.

---

## 3. State Management with Zustand & Persistence (Q26 - Q40)

### Q26. Why is Zustand preferred over Redux in modern React Native apps?
*   **English Answer:** Zustand provides a minimal, boilerplate-free state management system. It relies on standard hooks, does not require provider wrapping, and handles asynchronous state actions seamlessly. Additionally, it allows direct, out-of-context access to states inside pure JS helper files, such as Axios request interceptors.
*   **Follow-up Question:** How does Zustand update states compared to Redux dispatch actions?
*   **Hinglish Explanation:** Zustand simple hooks and methods pattern use karta hai. Isme complex boilerplate nahi hai aur iska direct method `getState()` bina React hooks/components ke humare generic network files mein call ho sakta hai jo Redux mein mushkil hai.

### Q27. Explain the function and setup of the Zustand `persist` middleware.
*   **English Answer:** The `persist` middleware automatically stringifies and writes declared state fields to a selected storage mechanism (like `AsyncStorage`) whenever a `set()` state action is triggered. On app boot, it reads and restores these states automatically before render.
*   **Follow-up Question:** What is the role of `createJSONStorage` helper in Zustand persistence?
*   **Hinglish Explanation:** Zustand `persist` middleware humare declare kiye state variables ko dynamic change hote hi background storage mein dump kar deta hai. App load hone par state automatically revive ho jata hai taaki users ko screen data instant mile.

### Q28. What is `partialize` inside Zustand and why is it crucial for your auth store?
*   **English Answer:** `partialize` is a callback in persist config that filters which state variables should actually be written to storage. In our auth store, we only persist the `user` and `localAvatar` objects to AsyncStorage. The security-critical `accessToken` is manually written to SecureStore, completely avoiding AsyncStorage leakage.
*   **Follow-up Question:** How would you update a non-persisted state inside a persisted store?
*   **Hinglish Explanation:** `partialize` se hum define karte hain ki kaunsi specific states AsyncStorage mein save honi chahiye. Auth store mein hum sensitive key variables ko filter out kar dete hain, aur normal properties ko hi allow karte hain taaki safety ban rahe.

### Q29. How do you resolve unnecessary re-renders in components utilizing your stores?
*   **English Answer:** Components should subscribe to highly specific store slices rather than the whole store. For example, using `const courses = useCourseStore(state => state.filteredCourses)` ensures the component only re-renders when `filteredCourses` modifications occur.
*   **Follow-up Question:** Can we use a custom equality function like `shallow` in selectors?
*   **Hinglish Explanation:** Agar hum pura hook access karenge `const store = useStore()`, toh store ke kisi bhi unrelated change hone par rendering trigger hogi. Selector use karke hum specific values trigger mapping karte hain jo components performance double kar deta hai.

### Q30. Why is the AI store not persisted while the course store is?
*   **English Answer:** The `courseStore` caches course catalogs, bookmarks, and streaks, which drastically improves offline capability and app load speed. In contrast, the `aiStore` manages conversational chat history. Chat context is session-specific; persisting it could send outdated references to the LLM and bloat local storage.
*   **Follow-up Question:** How would you implement manual wipe controls for chat states?
*   **Hinglish Explanation:** Courses static cached content hote hain, isliye inka storage load duration minimize karta hai. Lekin AI chats dynamic hoti hain aur transient chat logs reset hona better system context provide karta hai.

### Q31. What happens if there is a version conflict in persisted Zustand stores?
*   **English Answer:** Zustand's `persist` middleware supports a `version` property. If we modify the store layout or schema, we increment the version. We can provide a `migrate` callback that maps old data keys to the new structure, preventing app crashes due to parsing outdated structures.
*   **Follow-up Question:** What is the default migration behavior if no migrate function is defined?
*   **Hinglish Explanation:** Agar custom key values change hote hain, toh parsing format conflict crash trigger kar sakta hai. Zustand schema `version` control and `migrate` parameters se hum local data restructure karke old state clean-up perform kar sakte hain.

### Q32. Walk through the structure of your course store actions.
*   **English Answer:** Our `courseStore` has multiple core actions: `fetchCourses` fetches catalogs using local cache settings, `enrollCourse` performs course enrollment, `toggleBookmark` manages bookmark lists, and `updateStreak` dynamically computes study streaks based on user daily login activity.
*   **Follow-up Question:** How are custom API triggers mapped into store actions?
*   **Hinglish Explanation:** Humare course actions dynamic operations block karte hain. API responses call hone par state variables (`courses`, `bookmarks`) local updates perform karte hain aur background threads trigger logic update kar dete hain.

### Q33. How does the cache TTL work in your course store?
*   **English Answer:** In `courseStore.ts`, we define a Cache Time-To-Live duration of 5 minutes (`CACHE_TTL = 5 * 60 * 1000`). When `fetchCourses` is triggered, we check if `courses` are present and the duration since `lastFetched` is within the limit. If true, we serve cached content instantly, skipping network overhead.
*   **Follow-up Question:** How can the user force-refresh the cache bypassing the TTL?
*   **Hinglish Explanation:** Hum 5 minutes ka simple timeout check lagate hain. Agar app launch limit ke andar hai, toh local storage variables fetch ho jate hain, API overload decrease ho jata hai aur system speed optimize hoti hai.

### Q34. How does the course store reset work during user logout?
*   **English Answer:** Upon calling `logout` in `authStore`, we clear native keys and call `useCourseStore.getState().reset()`. This reset function clears user-specific variables such as bookmarks, enrolled courses, timeline logs, and notes, completely preventing cross-user data leakage.
*   **Follow-up Question:** What other stores in your project require resets?
*   **Hinglish Explanation:** Jab user `logout` choose karta hai, hum dusre stores ko target karke `reset` methods execute karte hain taaki bookmarks ya private user progress completely erase ho jaye aur naye login session par visible na ho.

### Q35. What is the difference between `get()` and `set()` inside Zustand store initializers?
*   **English Answer:** `set()` is used to update the store state, triggering reactivity and re-rendering components subscribing to changed slices. `get()` is a helper function that reads the current, up-to-date state values synchronously from within store actions without subscribing.
*   **Follow-up Question:** Can we mutate the store state directly using `get()`?
*   **Hinglish Explanation:** `set` variables values update karne ka runtime callback method hai, jabki `get` hook state actions ke andar synchronous reading capability dynamic patterns support karne ke liye use hota hai.

### Q36. How do you fetch asynchronous states inside a Zustand store?
*   **English Answer:** Since Zustand actions are plain JS functions, we write them as standard `async/await` blocks. We set an `isLoading: true` flag before triggering API calls, fetch the remote content via Axios, update state using `set()`, and set `isLoading: false` in a `finally` block.
*   **Follow-up Question:** How do you capture errors inside async store operations?
*   **Hinglish Explanation:** Hum pure asynchronous API calls ko `try-catch` blocks mein wrap karte hain. Loading states dynamic update hone se user loading screen view control ho jata hai aur background exception handling resolve hoti hai.

### Q37. What is a shallow selector and when should you use it?
*   **English Answer:** By default, Zustand uses strict reference equality (`===`) to determine whether state changes should trigger re-renders. If a selector returns a new object, the component re-renders even if contents are identical. Importing `shallow` from `zustand/shallow` ensures it does a property comparison instead.
*   **Follow-up Question:** Does the modern version of Zustand require importing shallow differently?
*   **Hinglish Explanation:** Jab hum multiple individual properties dynamic array returns karte hain, standard checks fails ho jate hain. Shallow mechanism properties levels equal check pass karke extra renders decrease karta hai.

### Q38. Why is state-sharing across multiple stores challenging and how do you handle it?
*   **English Answer:** Because stores are independent singletons, they cannot subscribe to each other's React hooks. To share state, we read data directly using `getState()` (e.g., `useAuthStore.getState().accessToken` inside course store), maintaining clean, cross-store data flows.
*   **Follow-up Question:** Can we subscribe to store updates outside components?
*   **Hinglish Explanation:** Stores decoupled format follow karte hain. Cross-store data flow manage karne ke liye hum synchronous hook bypassing state retrieval logic call karte hain, isse circular logic complexity avoid ho jati hai.

### Q39. Explain the implementation of the streak-counting algorithm in your store.
*   **English Answer:** `updateStreak` compares the current timestamp with `lastStreakUpdate` timestamp. If the calendar date difference is exactly one day, it increments the streak counter. If it is greater than one day, the streak resets to 1. If it is the same calendar day, it skips modification.
*   **Follow-up Question:** What timezone issues can occur with local device calculations?
*   **Hinglish Explanation:** Streak counter user date tracking perform karta hai. Consecutive login gaps check karke current days calculation resolve hoti hai, aur updates parameters target days list restore karte hain.

### Q40. How is user avatar change persistent across app restarts?
*   **English Answer:** In `authStore.ts`, we update the `user` and `localAvatar` state inside `updateProfile` action. These fields are captured by our `partialize` function and written to AsyncStorage, maintaining persistent profile settings automatically.
*   **Follow-up Question:** How do you handle local image path validation?
*   **Hinglish Explanation:** Avatar update custom profile screen se trigger hota hai. Profile image URI save hone par Zustand persist parameters storage target execute kar deta hai, isse app relaunch par original image live view hoti hai.

---

## 4. Networking, Axios Interceptors, Offline & Resiliency (Q41 - Q55)

### Q41. How is your Axios client configured in `core/api/client.ts`?
*   **English Answer:** We configure a centralized Axios instance with dynamic `baseURL` linked to our environment variables, a timeout limit of 15 seconds, default content headers, and active request-response interceptors handling JWT security and network offline checks.
*   **Follow-up Question:** What happens if the `EXPO_PUBLIC_API_BASE_URL` is undefined?
*   **Hinglish Explanation:** Centralized Axios configuration hume base API paths control points maintain karne ka flexibility deta hai. Timeout configuration sets limit standard endpoints par, taaki user UI blocks resolve ho jaye.

### Q42. Explain the workflow of your Axios request interceptor.
*   **English Answer:** The request interceptor performs two checks: First, it calls `NetInfo.fetch()`—if the device is offline, it cancels the request and rejects it with a `"NO_INTERNET"` error. Second, it fetches the access token from SecureStore and mounts it inside authorization headers.
*   **Follow-up Question:** Why check network availability before triggering a native network call?
*   **Hinglish Explanation:** Request nikalne se pehle hum check karte hain ki network active hai ya nahi. Agar device offline hai, toh request abort kar dete hain. Aur active network par automatic encryption token headers load dynamic pass mapping chala dete hain.

### Q43. What is an exponential backoff retry mechanism?
*   **English Answer:** It is an algorithmic error-recovery system. Instead of retrying failed requests instantly, it delays retry intervals exponentially (e.g., 1s, 2s, 4s). This avoids overloading servers that might be experiencing transient faults or high load.
*   **Follow-up Question:** Do we retry POST requests during errors?
*   **Hinglish Explanation:** Exponential backoff server failure issues bypass karne ka smart mechanism hai. Yeh failures hone par fixed gap limits (1s, 2s, 4s) compute karke connection retries repeat karta hai taaki server stress limit control range mein rahe.

### Q44. How does your response interceptor handle a 401 Unauthorized status?
*   **English Answer:** When a `401` error occurs, the interceptor checks if the request has already been retried. If not, it marks the request config with `_retry = true`, triggers a JWT token refresh call using `SecureStore.getItemAsync('refreshToken')`, updates local states on success, and re-fires the original request.
*   **Follow-up Question:** What occurs if the token refresh call itself fails with a 401?
*   **Hinglish Explanation:** Agar server 401 error return karta hai, toh interceptor session security update trigger launch kar deta hai. Yeh `refreshToken` use karke automatic background access tokens reload trigger process start kar deta hai.

### Q45. How do you prevent infinite loop structures inside token refresh interceptors?
*   **English Answer:** We use two core flags: We check if `originalRequest._retry` is true, and check if the error-generating endpoint is the token refresh path itself. If both conditions fail, the interceptor immediately triggers logout, preventing infinite loop structures.
*   **Follow-up Question:** Why is a separate, bare Axios call used to refresh tokens?
*   **Hinglish Explanation:** Infinite requests recursion target avoid karne ke liye hum standard validation tracking variable `_retry` add karte hain request config mein, jisse block execution limit single cycle tak hi limit ho jati hai.

### Q46. How does your app detect offline state prior to network transactions?
*   **English Answer:** Inside the Axios request interceptor, we call NetInfo helper modules before the raw request executes. If the local client state detects a disconnected network, we immediately reject the promise locally with a custom error, preventing unnecessary latency.
*   **Follow-up Question:** Does the NetInfo check work reliably on physical iOS devices?
*   **Hinglish Explanation:** NetInfo API direct request checks parameters configure karti hai. Agar cell connection dead hai, toh error block local intercept trigger ho jata hai jisse response delays and timeouts standard decrease run rates block kar sake.

### Q47. What are retryable error statuses in your API client setup?
*   **English Answer:** We define retryable errors as connection timeouts, generic network failures, and standard server errors (500 Internal Server Error, 502 Bad Gateway, 503 Service Unavailable, and 504 Gateway Timeout). We absolutely never retry client errors like 400 Bad Request or 404 Not Found.
*   **Follow-up Question:** Why avoid retrying 400 Bad Request errors?
*   **Hinglish Explanation:** Hum sirf selected error codes (jaise 5xx aur timeout parameters) par retry trigger handle karte hain. Client validations (4xx parameters) syntax issues refer karte hain, isliye inpe retries block trigger block rules cancel hote hain.

### Q48. How do you show a friendly user notification if the device goes offline?
*   **English Answer:** We build an `<OfflineBanner>` component rendered inside the root container path. When `useNetworkStatus()` returns connection loss, the banner dynamically slide-animates from the top, warning the user that the app is running in offline cached mode.
*   **Follow-up Question:** How do you test banner UI components dynamically?
*   **Hinglish Explanation:** Hum dynamic top bar component render karte hain layout configuration screen mein. Network state hook values watch karti hai aur connectivity toggle badalte hi slide visibility animations changes execute karti hai.

### Q49. What is a custom Offline Error class and why is it useful?
*   **English Answer:** It is a JavaScript class extending the default Error type (`class OfflineError extends Error`). By throwing a typed class, catch blocks inside features can identify connectivity failures explicitly and render local mock states instead of showing a generic "Server Error" alert.
*   **Follow-up Question:** How does typescript perform checks on custom subclass instances?
*   **Hinglish Explanation:** Custom offline error parameters create karke hum error sources identify target check pass execute kar sakte hain. Isse standard catch flows easily specific screen logic triggers process kar dete hain.

### Q50. Walk through the parallel API call optimization inside `courseStore.ts`.
*   **English Answer:** When loading course data, we fetch instructor list and course catalogs in parallel using `Promise.all([coursesApi.fetchInstructors(), coursesApi.fetchProducts()])`. This loads both resources simultaneously on the network stack, cutting load time in half compared to sequential fetching.
*   **Follow-up Question:** What happens if one of the promises inside Promise.all fails?
*   **Hinglish Explanation:** Hum double API tasks ko parallel fetch karne ke liye `Promise.all` trigger block call run karte hain. Isse network response speed up ho jati hai kyunki requests line-by-line chalne ke bajaye parallel stream block access karti hain.

### Q51. How is request timeout managed within your networking stack?
*   **English Answer:** We set the `timeout` property inside the Axios configuration object to `15000` milliseconds. If a network endpoint fails to reply within 15 seconds, the request aborts locally, triggering error handlers immediately.
*   **Follow-up Question:** Can we increase the timeout parameter for large assets upload?
*   **Hinglish Explanation:** Hum maximum timeout limit 15 seconds standard limit define karte hain. Agar server responses delays complete limit bypass karte hain, toh request auto cancellation process trigger ho jati hai.

### Q52. Explain the purpose of Axios mock interceptors during unit testing.
*   **English Answer:** Mock interceptors intercept Axios transactions during Jest execution. They hijack HTTP calls and return custom mock data objects, allowing us to validate core application logic without making real network calls or requiring a live backend.
*   **Follow-up Question:** How do you mock mock responses for varying endpoint URLs?
*   **Hinglish Explanation:** Unit test cases run karte waqt real backend server down issues solve karne ke liye hum Axios configurations mock libraries standard pattern mappings customize kar dete hain.

### Q53. Why are environment variables prefixed with `EXPO_PUBLIC_` in this app?
*   **English Answer:** Expo Router's Metro bundler requires the `EXPO_PUBLIC_` prefix to inline environment variables into the client JavaScript bundle at build time. Variables without this prefix remain server-side and cannot be accessed inside React Native component files.
*   **Follow-up Question:** Are variables prefixed with EXPO_PUBLIC_ secure from reverse engineering?
*   **Hinglish Explanation:** `EXPO_PUBLIC_` prefix Metro compiler ko allow karta hai variables parameters ko client runtime bundle ke dynamic values replace mapping injection run kar sake.

### Q54. How do you implement dynamic API request cancels using AbortController?
*   **English Answer:** When launching API calls inside screens, we can create an instance of `AbortController`. We pass `controller.signal` into Axios config. If the user navigates away before completion, calling `controller.abort()` cancels the request, saving device bandwidth and processing power.
*   **Follow-up Question:** How does the Axios interceptor detect that an error is an abort event?
*   **Hinglish Explanation:** Agar screen switch back ho jati hai, hum `AbortController` standard commands execute karke pending internet data fetch request cancel trigger execute process block run kar dete hain.

### Q55. What is HTTP caching and does Axios handle it natively in React Native?
*   **English Answer:** React Native's native fetch layer provides some default cache headers behavior, but Axios does not manage HTTP caching internally. To implement client-side caching, we rely on custom storage state layers in our Zustand stores, maintaining full, programmatic cache control.
*   **Follow-up Question:** How can we configure ETag headers verification inside request interceptors?
*   **Hinglish Explanation:** Axios standard native layers internal caching support mapping provide nahi karti. Dynamic configurations cache targets control karne ke liye hum store managers parameters use karte hain.

---

## 5. AI Integration & Groq Agent Flow (Q56 - Q70)

### Q56. How does your AI Tutor (Groq Agent) work end-to-end?
*   **English Answer:** The user types a message in `ai-tutor.tsx`, which calls `aiStore.sendMessage()`. The store appends the message and calls `groqAgent.processUserMessage()`. The agent builds a conversation context array containing a system prompt, chat history, and the new message. It then sends this to the Groq API using the Llama 3 model.
*   **Follow-up Question:** How is chat history maintained between sessions?
*   **Hinglish Explanation:** AI Tutor system clear chat flows aur history control parameters maintain karta hai. `sendMessage` trigger hotey hi hum messages arrays push updates pass karte hain aur payload Groq models api parameters ke custom configurations target control streams set karte hain.

### Q57. How do you implement stream-reading callbacks inside React Native?
*   **English Answer:** In `groqAgent.ts`, we set `stream: true` in Groq chat completions configurations. We iterate over the returned async stream chunks using a `for await (const chunk of stream)` loop, calling an `onChunk` callback to append text dynamically to the active message in Zustand.
*   **Follow-up Question:** What library provides streaming support for react-native bundles?
*   **Hinglish Explanation:** Text chunks line-by-line render karne ke liye streaming options configure chala dete hain. API blocks response receive hote hi hum callback system run karte hain jo user screens characters level display load refresh dynamic updates handle kar leta hai.

### Q58. Explain how LLM Function/Tool Calling is implemented in this codebase.
*   **English Answer:** We define a JSON schema for our `get_courses` function inside the `tools` config array in the Groq client payload. The LLM decides if it needs to call this tool based on the user's query. If it does, we intercept the request, query our local Zustand store, inject the results back into the conversation context as a tool message, and call the model again to generate a natural response.
*   **Follow-up Question:** How do we guarantee the LLM returns valid JSON for tool parameters?
*   **Hinglish Explanation:** Tool calling se model decide karta hai ki use course database fetch karna chahiye ya normal chat. Model JSON parameters details pass karta hai jisse local code search database process execute karke model standard content response render maps return feed kar sake.

### Q59. Why do you use two different Groq models in `groqAgent.ts`?
*   **English Answer:** We use `llama-3.3-70b-versatile` for the initial call because its larger parameter size makes it excellent at reasoning and tool selection. Once the tool results are generated, we use `llama-3.1-8b-instant` for the final streaming response. This smaller, faster model is much cheaper and significantly reduces user-perceived latency.
*   **Follow-up Question:** What is the token pricing difference between these two models?
*   **Hinglish Explanation:** Hum dynamic balance use karte hain. Heavy tools check aur high-level logic parsing `llama-3.3-70b` model handle karta hai. Lekin database returns complete processing lightweight streaming `llama-3.1-8b` fast model use karta hai cost and delay control karne ke liye.

### Q60. How does the mock/fallback system activate when the Groq key is missing?
*   **English Answer:** At startup, `groqAgent.ts` checks if `process.env.EXPO_PUBLIC_GROQ_API_KEY` is missing or matches the placeholder string `'gsk_placeholder_replace_me'`. If so, it throws an error in the catch block, which appends a pre-configured mock warning message to the chat so the UI doesn't crash during development.
*   **Follow-up Question:** How can we configure offline mock agent responses that mimic tool calling?
*   **Hinglish Explanation:** Debugging parameters and local dev support ke liye check condition set hai. Agar API keys configure nahi hain, toh system simple hardcoded text arrays load fallback execute trigger setup chala deta hai taaki app blocks breakdown na ho.

### Q61. What is the difference between `processUserMessage` and `smartSearch` inside `groqAgent.ts`?
*   **English Answer:** `processUserMessage` is a conversational agent workflow that supports chat history, streaming chunks, and tool calling. `smartSearch` is a stateless, one-shot semantic search helper. It takes the course catalog and a user query, sets `response_format: { type: "json_object" }` to force a JSON response, and returns an array of matching course IDs.
*   **Follow-up Question:** How do you handle malformed JSON returned from the LLM in smartSearch?
*   **Hinglish Explanation:** `processUserMessage` pure chat features support stream chala deta hai context parameters save. Par `smartSearch` simple fast single query input handle karta hai aur client database lists mapping matching elements indices index arrays return structure resolve karta hai.

### Q62. What is `response_format: { type: "json_object" }` and when should you use it?
*   **English Answer:** It is a configuration parameter in LLM APIs that forces the model to return a valid JSON string. This is crucial for structured operations like semantic search, ensuring our parser doesn't fail when processing the response.
*   **Follow-up Question:** What system prompt instructions are required when enabling JSON mode?
*   **Hinglish Explanation:** JSON mode model force return control checks validation rules compile karta hai. Isse model descriptive sentences ke bajaye pure data schemas return target execute maps pass karta hai, jo backend mappings process clear down maps set karta hai.

### Q63. Explain the threat of API key exposure in client-side bundles and how you fix it.
*   **English Answer:** Because our Groq key is stored in `.env` with the `EXPO_PUBLIC_` prefix, Metro inlines it into the compiled client JavaScript bundle. Anyone can extract it by decompiling the APK/IPA. The proper fix is to proxy AI requests through our own secure backend endpoint, where the key is safely stored in backend environment variables.
*   **Follow-up Question:** What are the rate-limiting risks of client-side key usage?
*   **Hinglish Explanation:** Client app bundle compile hone par standard strings plain readability format support download limits range validate pass mapping tools easily read control process kar lete hain. Safety ke liye hum backend proxy calls recommend runtime configurations.

### Q64. How does the user-visible inline course card linking logic work in the AI chat?
*   **English Answer:** After the streaming response completes, we search the text for matches against our course titles. If a match is found, we attach the corresponding `courseId` to the message object. The chat UI detects this field and dynamically renders a clickable, interactive `CourseCard` inline below the assistant's message.
*   **Follow-up Question:** How does the UI handle cases where multiple course titles are found?
*   **Hinglish Explanation:** Stream close hone par hum post-process regex parser script chalate hain jo chat response ko screen values se match search karke specific ID generate tags link map setup trigger run kar deta hai jisse direct dynamic cards display render switch logic execute hoti hai.

### Q65. What is the role of `system prompt` inside AI models operations?
*   **English Answer:** The system prompt is a hidden, high-priority instruction passed at the start of the message array. It defines the AI's persona, boundaries, available tools, response format constraints, and safety guidelines, guiding its conversational behavior.
*   **Follow-up Question:** How do you test if the model is adhering to the system prompt guidelines?
*   **Hinglish Explanation:** System prompt high priority model constraints sets instruction map array parameters set karta hai. Yeh boundaries dynamic limits configure karta hai taaki AI answers control loops parameters rules match up bounds complete safe run execute ho sake.

### Q66. What is `dangerouslyAllowBrowser: true` configuration in Groq client setup?
*   **English Answer:** The Groq SDK throws an error if initialized in browser/mobile client environments, warning developers that their API key will be exposed. Setting `dangerouslyAllowBrowser: true` bypasses this check, acknowledging and suppressing the warning.
*   **Follow-up Question:** What is the alternative to using this property?
*   **Hinglish Explanation:** Yeh client side framework bypass security indicator settings parameters checks override parameters block target values check execute logic run setups maps target options dynamic control features set validation models logic handle.

### Q67. How do you handle connection drops during active streaming responses?
*   **English Answer:** We wrap our stream loop in a try-catch block. If the connection drops during streaming, we catch the error, toggle `isStreaming` to false, and append a fallback message advising the user to check their connection and retry.
*   **Follow-up Question:** How can we implement a manual retry control mechanism inside messages list?
*   **Hinglish Explanation:** Connection drop failure checks dynamically catch process patterns support trigger loops target handle block execute check run variables parameters map clear states settings setups control configurations range maintain checks run.

### Q68. Walk through the UI performance challenges of rendering streaming text inside a FlatList.
*   **English Answer:** Rendering streaming updates character-by-character triggers rapid component re-renders. If the FlatList is large, this can cause significant UI lag. To optimize this, we memorize individual message components using `React.memo` and only update the latest message object reference in state.
*   **Follow-up Question:** How can we configure scroll-to-end triggers during rapid streaming updates?
*   **Hinglish Explanation:** Stream text real-time re-renders trigger karke scroll levels lag down run rate maps clear checks trigger blocks parameters update render properties sets maps optimized control patterns parameters scale manage dynamic checks.

### Q69. How do you clear conversational history dynamically inside the AI Store?
*   **English Answer:** We define a `clearChat` action in `aiStore.ts`. It resets the `messages` array to contain only the default welcome message and sets `isStreaming` and `isTyping` to false, ensuring a clean context for the next conversation.
*   **Follow-up Question:** Does clearing the chat trigger any custom event logs?
*   **Hinglish Explanation:** Store method messages array parameters state values default templates models reset target controls values execution process loops setups direct clear clear update dynamic parameters setups logs reset clean mappings.

### Q70. Why is `Llama` model family chosen over other models?
*   **English Answer:** Llama models on Groq offer blazing-fast inference speeds, with response tokens streaming at over 500 tokens per second. This high speed makes real-time chat feel highly responsive and premium on mobile devices compared to slower models.
*   **Follow-up Question:** Does the application support switching models at runtime?
*   **Hinglish Explanation:** Blazing fast inference rates support standard configurations targets parameters options maps levels controls check parameters speed values optimization dynamic levels checks parameters values controls.

---

## 6. Sentry Monitoring & Performance Tracking (Q71 - Q80)

### Q71. How is Sentry configured and initialized in this app?
*   **English Answer:** We import `@sentry/react-native` and initialize it inside our root `_layout.tsx` (using `analytics.init()`). We set our `dsn` from environment variables, configure it to automatically track screen views, and conditionally enable the debug console log flags only when running in local development mode (`__DEV__`).
*   **Follow-up Question:** What is the bundle size impact of including the Sentry SDK?
*   **Hinglish Explanation:** Sentry configuration hum layout page call execute control parameters map register update set parameters setup maps logic configurations target run checks values levels dynamic maps process execute run.

### Q72. Explain Sentry breadcrumbs and how you log custom user flows in `analyticsService.ts`.
*   **English Answer:** Breadcrumbs are chronological logs of events (such as network transactions, button taps, and store state changes) leading up to a crash. Our `AnalyticsService` wraps `Sentry.addBreadcrumb`, letting us log custom user actions so that if a crash occurs, we can reconstruct the exact steps the user took.
*   **Follow-up Question:** What is the maximum number of breadcrumbs stored in Sentry by default?
*   **Hinglish Explanation:** Breadcrumbs history trails indicators map layers structures configurations parameters set setup systems levels maps logs track parameters trace paths dynamic records.

### Q73. What is Sentry Performance Monitoring (`withSentrySpan`)?
*   **English Answer:** Sentry spans track the execution time of asynchronous processes, like API transactions, AI chats, and boot sequences. We wrap key functions in `withSentrySpan` to identify performance bottlenecks and slow endpoints directly from our Sentry dashboard.
*   **Follow-up Question:** How does transaction tracing affect client battery consumption?
*   **Hinglish Explanation:** Performance tracing spans target execution speed levels measurements setups parameters values log ranges dashboard metrics setups.

### Q74. How does Sentry auto-capture JavaScript errors inside React Native?
*   **English Answer:** Sentry patches React Native's global error handler. When an unhandled promise rejection or JS error occurs, Sentry automatically serializes the stack trace and device metadata, and uploads the payload to the Sentry server.
*   **Follow-up Question:** What is the difference between Sentry error tracking and console.error?
*   **Hinglish Explanation:** Global error boundary overrides setups registers automatically capture payloads crash indicators standard setups maps configurations target parameters run systems.

### Q75. What are Source Maps in Sentry and why are they critical for production builds?
*   **English Answer:** Metro minifies and obfuscates our production JavaScript bundle into a single line of code, making raw crash stack traces unreadable. Source maps map this minified code back to our original TypeScript source files, letting Sentry pinpoint the exact file and line number of any crash.
*   **Follow-up Question:** How do you upload source maps automatically during EAS builds?
*   **Hinglish Explanation:** Source maps build output obfuscation keys restore indicators parameters set maps check maps original typescript path line numbers.

### Q76. How is `Sentry.setUser` used inside your auth flow?
*   **English Answer:** When a user successfully logs in, we call `Sentry.setUser({ id: user._id, email: user.email, username: user.username })` in `authStore.ts`. This attaches the user's identity to all future error reports, letting us filter and debug crashes affecting specific users. On logout, we call `Sentry.setUser(null)`.
*   **Follow-up Question:** What privacy constraints (GDPR/HIPAA) apply to setUser logs?
*   **Hinglish Explanation:** Login hotey hi identity parameters attach tags configurations execute patterns setups maps logout setups clear mapping logs.

### Q77. What is the role of React ErrorBoundary in Sentry error captures?
*   **English Answer:** In our custom `ErrorBoundary.tsx` component, the `componentDidCatch` lifecycle hook captures component render crashes, logs the stack trace to Sentry via `Sentry.captureException`, and renders a user-friendly fallback screen instead of letting the app freeze or crash to desktop.
*   **Follow-up Question:** How do you test the ErrorBoundary fallback UI inside your app?
*   **Hinglish Explanation:** Render levels failures bounds catch controls capture exceptions Sentry send mapping execute.

### Q78. How do you manually trigger and test a Sentry crash in development?
*   **English Answer:** We have a test button in our profile preferences options. Tapping it throws a manual test error: `throw new Error("Sentry Test Error")`. This lets us verify that our DSN config, interceptors, and error boundaries are working correctly and that the exception is successfully uploaded.
*   **Follow-up Question:** Why does throwing a native error close the app in production even with Sentry active?
*   **Hinglish Explanation:** Profile settings page check triggers execute options testing errors trigger check check configurations.

### Q79. What are Sentry tags vs custom tags in Clarity?
*   **English Answer:** Sentry tags are key-value pairs indexed on Sentry's servers, allowing us to quickly search and filter issues by device type, OS version, or environment. While similar, Clarity tags are optimized for filtering session recordings, whereas Sentry tags focus on exception telemetry.
*   **Follow-up Question:** What are default indexed tags Sentry appends?
*   **Hinglish Explanation:** Telemetry categorization tags filter levels indexing values logs checks configurations parameter sets setups parameters.

### Q80. How do Sentry transactions map to slow device frames?
*   **English Answer:** Sentry tracks the JS thread's render loop and records frames that drop below 60fps as "slow frames" or "frozen frames". It links these rendering hiccups to active Sentry spans, helping us trace laggy UI animations back to expensive JS operations.
*   **Follow-up Question:** How can we configure frame drops tracking thresholds?
*   **Hinglish Explanation:** Frame rate lags monitoring performance maps controls check levels dashboard representations trace mappings target run options sets configurations.

---

## 7. Microsoft Clarity Session Recording (Q81 - Q90)

### Q81. How is Microsoft Clarity integrated into your React Native Expo app?
*   **English Answer:** We use the native `react-native-clarity` SDK. In `clarityService.ts`, we initialize it using our Project ID from environment variables. We call `RNClarity.consent(true, true)` to grant permissions immediately, ensuring session recording begins right at app startup.
*   **Follow-up Question:** What native platforms are supported by the react-native-clarity SDK?
*   **Hinglish Explanation:** Microsoft Clarity mobile session recording support perform karta hai. `clarityService` parameters consent true trigger configurations and initializations control map setups systems registers.

### Q82. Explain user identification tracking using `identifyUser` in Clarity.
*   **English Answer:** In `clarityService.identifyUser()`, we pass our user data object. We check if the session is active; if not, we queue it. Once active, we call `RNClarity.setCustomUserId` and `RNClarity.setCustomSessionId` using the user's unique ID, allowing us to search for specific users' recordings in our Clarity dashboard.
*   **Follow-up Question:** How does setting user ID as session ID affect search latency in Clarity?
*   **Hinglish Explanation:** Session records custom identities links configurations execute run options setups check values.

### Q83. What is the session URL callback pattern inside `clarityService.ts`?
*   **English Answer:** We register a listener via `RNClarity.setOnSessionStartedCallback`. When a session starts, this callback fetches the session's live URL using `RNClarity.getCurrentSessionUrl()`. We store it in a local variable and print a prominent log block in local development, making debugging session flows easy.
*   **Follow-up Question:** Can we send this session URL to Sentry as a custom tag?
*   **Hinglish Explanation:** Session trigger hotey hi URL call parameters target checks trace mapping callback runs values target execution checks setup log printings parameters values.

### Q84. Why are `pauseRecording` and `resumeRecording` crucial on authentication screens?
*   **English Answer:** To protect user privacy, we pause session recording on the Login and Register screens by calling `clarityService.pauseRecording()`. This stops the SDK from capturing keystrokes in sensitive password fields, and we call `resumeRecording()` once the user navigates away.
*   **Follow-up Question:** Does pausing recording delete the session history up to that point?
*   **Hinglish Explanation:** Login/Register screens par users raw passwords enter karte hain. Security aur data safety ke liye hum clarity records pause kar dete hain taaki dashboard par passwords capture na ho.

### Q85. How do you clear user identity during user logout in Clarity?
*   **English Answer:** In `clearUser()`, we clear any pending user queues and call `RNClarity.startNewSession()`. This starts a fresh, anonymous session on the device, clearing all custom tags and user IDs so that a subsequent user's actions are not linked to the previous session.
*   **Follow-up Question:** Can custom session tags be retained across session splits?
*   **Hinglish Explanation:** Logout execute hote hi identity parameters reset perform checks block maps start new session methods calls anonymous fresh session logs setups execute clear.

### Q86. How is custom screen tracking implemented inside `useScreenTracking.ts`?
*   **English Answer:** We build a custom hook `useScreenTracking`. When a screen mounts, we call `clarityService.setScreen(screenName)`, which calls `RNClarity.setCurrentScreenName()`. This tags the screen in our Clarity recordings, allowing us to filter recordings by screen visits.
*   **Follow-up Question:** How does screen tracking handle nested navigation layouts?
*   **Hinglish Explanation:** Screen change check points trace logs targets registers parameters `useScreenTracking` hooks setup.

### Q87. How does bidirectional Clarity event tracking work inside dynamic WebView modules?
*   **English Answer:** The course HTML WebView contains standard Clarity web tracking code. When an event (like a quiz answer) occurs inside the WebView, we log it to the web Clarity instance and call `window.ReactNativeWebView.postMessage` to forward it to the native React Native app, where `clarityService` logs the event natively.
*   **Follow-up Question:** What secure origin checks apply to WebView postMessage?
*   **Hinglish Explanation:** WebViews aur Native side dono par Clarity active rehta hai. Web container events trigger hone par `postMessage` se React Native interface ko send updates mapping provide target execute kar deta hai.

### Q88. How are custom events and params mapped in `logEvent` inside `clarityService.ts`?
*   **English Answer:** Inside `logEvent`, we call `RNClarity.sendCustomEvent` to log the event. If parameters are passed, we loop through the key-value pairs and tag each one by calling `RNClarity.setCustomTag(eventName_key, value)`. We also update a global `'last_event'` tag to keep track of the user's latest action.
*   **Follow-up Question:** What size limitations apply to custom tag names in Clarity?
*   **Hinglish Explanation:** Custom event targets parameters variables trace parameters loops settings mapping sets parameters names tags.

### Q89. How do you limit string parameters size to prevent Clarity errors?
*   **English Answer:** Clarity has a strict character limit of 255 characters for tag keys and values, and 254 characters for event names. In `clarityService.ts`, we implement a `trim` helper function that safely trims and slices all strings to fit within these limits.
*   **Follow-up Question:** What occurs if an event name parameter is passed as empty?
*   **Hinglish Explanation:** Inputs limits sizes check slice triggers setups trim functions values filters controls key limits errors prevents systems crashes.

### Q90. What is `LogLevel.Verbose` in Clarity SDK configuration?
*   **English Answer:** Inside our initialization config, we set the SDK's log level dynamically: `__DEV__ ? LogLevel.Verbose : LogLevel.None`. Verbose logging outputs detailed native debug logs of screen tags, session splits, and custom events to our terminal in development mode.
*   **Follow-up Question:** What are memory differences of verbose vs none logging settings?
*   **Hinglish Explanation:** Developer logs outputs values sets verbose levels checks registers dynamic options maps target setups systems logs ranges profiles.

---

## 8. Dynamic App Icon Changer (Q91 - Q98)

### Q91. What library is used to support dynamic app icon changing in your project?
*   **English Answer:** We use `expo-alternate-app-icons` which interfaces with native platform APIs: `setAlternateIconName` on iOS, and dynamic `<activity-alias>` configurations on Android, allowing us to change the launcher icon programmatically.
*   **Follow-up Question:** Does changing the app icon require native prebuild config plugins?
*   **Hinglish Explanation:** Hum dynamic icons switch karne ke liye `expo-alternate-app-icons` use karte hain. Yeh native APIs (iOS alternate icons aur Android activity-alias mappings) direct trigger karta hai.

### Q92. Walk through the icon change implementation in `app/profile/app-icon.tsx`.
*   **English Answer:** In `AppIconScreen`, when a user taps an icon variant, we call `setAlternateAppIcon(iconName)`. If the user selects the default variant, we pass `null`. We trigger haptic feedback, save the selection in our `appIconStore`, and log the update to Sentry and Clarity.
*   **Follow-up Question:** Why does passing `null` reset the icon back to default?
*   **Hinglish Explanation:** Icons list select hone par hum `setAlternateAppIcon` call karte hain, alternate options use karne ke liye variant parameter aur normal parameters ke liye `null` reset call chala dete hain.

### Q93. Explain the state configuration inside `appIconStore.ts`.
*   **English Answer:** The store is a lightweight Zustand store persisted to `AsyncStorage` under the key `'app-icon-storage'`. It tracks a single state variable, `selectedIcon` (of type `AppIconName`), and exposes a setter action `setSelectedIcon` to update the state.
*   **Follow-up Question:** What happens if the persisted icon name doesn't match the native alternate icons list?
*   **Hinglish Explanation:** Hum Zustand persist store use karte hain selected state save rakhne ke liye taaki user jab dubara page open kare, toh selected checks update indicators accurately view blocks refresh.

### Q94. What is the role of iOS `Info.plist` alternate icon entries?
*   **English Answer:** On iOS, alternate icons must be statically declared inside the `CFBundleIcons` property list configuration in `Info.plist`. It defines each icon asset name, path, and variant, allowing the system to switch to the registered asset programmatically.
*   **Follow-up Question:** Can iOS download dynamic icons from a remote server URL at runtime?
*   **Hinglish Explanation:** iOS configurations target list bundle definitions checks pass dynamic. CFBundleIcons properties file configurations static register mappings resolve setups target systems levels.

### Q95. How does Android utilize `<activity-alias>` for alternate app icons?
*   **English Answer:** Android does not support dynamic icon assets out-of-the-box. Instead, the native manifest declares multiple `<activity-alias>` entries, each pointing to a different icon asset. The SDK changes the icon by programmatically enabling the chosen alias and disabling the others.
*   **Follow-up Question:** Why does changing the icon cause the app to restart on older Android devices?
*   **Hinglish Explanation:** Android manifest files programmatically disable and enable aliases blocks. Har activity alternate launcher icon hold karti hai jisse system active switches execute maps run.

### Q96. How is the list of available app icons configured in `appIconStore.ts`?
*   **English Answer:** We export a static array `APP_ICONS` containing metadata objects for our icon variants: Default, Dark, Green, Blue, Purple, and Minimal. Each object defines the variant name, display label, and representative theme hex color.
*   **Follow-up Question:** How would you register a new "Premium Gold" icon variant?
*   **Hinglish Explanation:** Array objects data settings metadata mappings setup run options. Har icon options target dynamic indicators colors label properties map list execute ranges standard setups.

### Q97. How does the app handle failures during dynamic icon changes?
*   **English Answer:** We wrap the `setAlternateAppIcon` call in a try-catch block. If the operation fails, we capture the error, update our `errorMessage` state, display a descriptive alert to the user, and automatically attempt to revert the icon state back to default.
*   **Follow-up Question:** Why does icon switching sometimes fail in emulator configurations?
*   **Hinglish Explanation:** Failures safety controls error triggers logic catch models. Fail hone par hum error parameters screen logs save return targets default sets rollbacks execution maps call run.

### Q98. Why does changing the icon trigger a native alert on iOS?
*   **English Answer:** By default, iOS displays a system confirmation popup ("You have changed the icon for...") when an app dynamically changes its icon. While we can bypass this warning in native swift code using private APIs, standard App Store guidelines require using the default system confirmation flow.
*   **Follow-up Question:** Is it possible to suppress the iOS system confirmation alert in expo config?
*   **Hinglish Explanation:** iOS default notification prompt screens execute dynamic confirmation warning overlays checks system level alerts block targets.

---

## 9. Push Notifications & Setting Preferences (Q99 - Q110)

### Q99. Walk through the architecture of your notifications implementation.
*   **English Answer:** We use `expo-notifications`. In `notificationService.ts`, we export methods to request permissions, setup Android notification channels, and schedule custom notifications like immediately-triggered enrollment confirmations or daily study reminders.
*   **Follow-up Question:** What permissions key variables are added to app.json for push configurations?
*   **Hinglish Explanation:** Notifications infrastructure standard triggers configure maps runtime checks handle configurations options `notificationService.ts` setup options standard registers targets.

### Q100. How are Android Notification Channels set up in `notificationService.ts`?
*   **English Answer:** In `setupNotificationChannels()`, we configure multiple channels for Android: enrollments, reminders, engagement, achievements, and general. Each channel is configured with its own importance level, vibration pattern, light color, and custom sound settings.
*   **Follow-up Question:** Why are notification channels not required for iOS devices?
*   **Hinglish Explanation:** Android OS categories levels sound parameters controls channels configurations register updates. Vibration pattern aur importance ranges settings parameters define run execute.

### Q101. Walk through the state management inside `notificationPrefsStore.ts`.
*   **English Answer:** We build a Zustand store `useNotificationPrefsStore` persisted to `AsyncStorage`. It tracks the `masterEnabled` state and a `categories` object, allowing the user to customize their notification preferences by category.
*   **Follow-up Question:** How does the store partialize configuration differ in this preference store?
*   **Hinglish Explanation:** Store persistence properties set parameters controls master toggles status track. Subscriptions target categories levels individual keys update indicators mapping chala dete hain.

### Q102. Explain what occurs when the user toggles the notifications `masterEnabled` switch.
*   **English Answer:** Toggling `masterEnabled` calls `setMasterEnabled`. If disabled, we update our local state and call `cancelAllNotifications()`, which cancels all scheduled alerts on the device. If re-enabled, we register and schedule the daily study reminder notification again.
*   **Follow-up Question:** Can we still receive high-priority system alerts when masterEnabled is false?
*   **Hinglish Explanation:** Master switch toggle hone par complete cleanup executions. Off hone par scheduled notifications cancel trigger, aur ON hote hi default daily reminders re-registration systems active map dynamic chala deta hai.

### Q103. Explain the auto-scheduling daily reminder logic inside your service.
*   **English Answer:** In `scheduleReminderNotification()`, we check if notifications are enabled. We read and cancel any existing scheduled reminders from AsyncStorage, and then schedule a new reminder with a time interval trigger set to 24 hours (`seconds: 24 * 60 * 60`).
*   **Follow-up Question:** Why is it necessary to cancel the old notification ID before scheduling a new one?
*   **Hinglish Explanation:** Daily reminders setup standard intervals verify systems updates checks time triggers loop settings runs options schedules.

### Q104. What is a Schedulable Time Interval Trigger in Expo Notifications?
*   **English Answer:** It is a trigger mechanism (`SchedulableTriggerInputTypes.TIME_INTERVAL`) that schedules notifications to fire after a specified delay in seconds, allowing us to easily schedule one-off re-engagement prompts or repeating alerts.
*   **Follow-up Question:** Can Schedulable triggers calculate exact calendar date target conditions?
*   **Hinglish Explanation:** Delay triggers parameters configuration options seconds calculations track setup parameter sets. Time intervals trigger mappings parameters systems setup values registers.

### Q105. How do you trigger an immediate enrollment notification inside `notificationService.ts`?
*   **English Answer:** In `scheduleEnrollmentNotification()`, we check the user's notification preferences. If enabled, we schedule a notification with the `trigger` parameter set to `null`, which tells the device to display the notification immediately.
*   **Follow-up Question:** Can we attach custom data payloads to immediately-scheduled notifications?
*   **Hinglish Explanation:** Immediate alert mapping logic triggers execute NULL triggers options select. Direct enrollment button press execution par standard pop notifications user systems render run.

### Q106. Explain how deep links are passed inside notification data payloads.
*   **English Answer:** Inside the notification content payload, we configure a `data` object containing target navigation links (e.g., `url: 'edurise://course/123'`). When a user taps the notification, the application reads this payload and routes the user directly to the specified screen.
*   **Follow-up Question:** How does the notification tap event listener parse this URL?
*   **Hinglish Explanation:** Notification click setups data values pass maps. Parameters settings urls values dynamically read links triggers page navigation routes blocks stack push.

### Q107. Walk through the background execution behavior of notifications.
*   **English Answer:** When a notification is received while the app is in the background, the OS displays it automatically inside the system notification tray. If the app is active in the foreground, `setNotificationHandler` intercepts the alert and displays it based on our custom styling configuration.
*   **Follow-up Question:** Can we execute background JS threads when a notification is received without user click?
*   **Hinglish Explanation:** Background status trigger options system tray render settings auto controls maps. Active apps configurations dynamic handlers intercept systems maps logic setups.

### Q108. How do you implement action buttons (Yes/No prompts) inside Android notifications?
*   **English Answer:** On Android, we set a custom `categoryIdentifier` (e.g., `'ENROLL_ACTIONS'`) inside the notification content payload. We register these categories and action buttons programmatically at startup, letting the user perform quick actions directly from the notification tray.
*   **Follow-up Question:** How do you listen for the user's selection in these action buttons?
*   **Hinglish Explanation:** Actions button prompt systems category registrations checks targets perform. Android OS alerts panel buttons dynamically display setups trigger variables parameter value map.

### Q109. What is a Schedulable Daily Trigger and how does it differ from a Time Interval Trigger?
*   **English Answer:** A Daily Trigger fires at a specific hour and minute every day (e.g., every day at 9:00 AM). In contrast, a Time Interval Trigger schedules a notification to fire after a set delay in seconds, regardless of the time of day.
*   **Follow-up Question:** How do you implement user-defined scheduling times?
*   **Hinglish Explanation:** Daily checks time targets levels hour minute configure setups blocks control parameters. Interval triggers simple seconds time countdown parameters setups evaluate run.

### Q110. How do you handle cases where notification permissions are denied by the user?
*   **English Answer:** If `getPermissionsAsync()` returns `'denied'`, calling `requestPermissionsAsync()` will not show the system prompt again. We handle this by displaying a custom dialog explaining that permissions are disabled and guiding the user to manually enable them in their device settings.
*   **Follow-up Question:** How do you open the native device settings page programmatically?
*   **Hinglish Explanation:** Security boundaries app settings lock execute trigger options. Agar permission denied hai, toh settings custom direct trigger alert dialog show mapping perform maps set range run.

---

## 10. Security & Keychain Storage (Q111 - Q120)

### Q111. Where are the user access tokens stored, and how is it secure?
*   **English Answer:** Access and refresh tokens are stored securely in Keychain (iOS) and Keystore (Android) using `expo-secure-store`. This encrypts the data using hardware-backed cryptographic keys, protecting it from being read by other applications or accessed on rooted/jailbroken devices.
*   **Follow-up Question:** What is the encryption algorithm used by Keystore on Android?
*   **Hinglish Explanation:** Session tokens security standards maintain karne ke liye Keychain / Keystore blocks secure targets select parameters are utilized. AsyncStorage plain file data hold karti hai jise target secure options bypass security layers bypass checks standard.

### Q112. Explain the vulnerability of storing JWT tokens inside standard AsyncStorage.
*   **English Answer:** `AsyncStorage` writes values to unencrypted local files on the device filesystem. On jailbroken or rooted devices, users can easily access and read these files, making it a critical security risk to store sensitive authentication credentials there.
*   **Follow-up Question:** Is AsyncStorage vulnerable on standard, non-rooted physical devices?
*   **Hinglish Explanation:** AsyncStorage simple files format write dynamic parameters sets parameters data safe targets. Access permissions levels roots values open checks systems.

### Q113. What is XSS (Cross-Site Scripting) inside WebViews and how does our parser prevent it?
*   **English Answer:** If user-generated inputs are rendered inside a WebView, attackers can inject malicious JavaScript code (e.g., `<script>`) to steal local tokens. To prevent this, we sanitize all course data and titles before rendering them in our custom WebView container.
*   **Follow-up Question:** Does disabling `javaScriptEnabled` in WebView completely eliminate XSS risks?
*   **Hinglish Explanation:** WebView components HTML scripts parse parameters values vulnerabilities hold execute. Safety configurations sanitize models functions properties replace patterns run.

### Q114. How are API keys protected in development vs production builds?
*   **English Answer:** In development, we use local `.env` files. For production builds, we inject keys using EAS environment secrets at build time, completely avoiding hardcoding sensitive credentials inside our public Git repository.
*   **Follow-up Question:** How can we configure distinct staging and production credentials?
*   **Hinglish Explanation:** Github repository values safety parameters gitignore templates setups configure check models. Secrets inputs production compile values sets inject pipelines.

### Q115. Explain how a compromised Refresh Token can affect application security.
*   **English Answer:** Access tokens are short-lived, while refresh tokens can be valid for weeks. If a refresh token is compromised, an attacker can use it to generate new access tokens indefinitely. To protect against this, we store our refresh tokens securely in SecureStore and implement strict token rotation on our backend.
*   **Follow-up Question:** What is Refresh Token Rotation and how does it mitigate this risk?
*   **Hinglish Explanation:** Long-lived refresh tokens hackers access parameters major leaks trigger. SecureStore encryption keys patterns safety checks limit process maps.

### Q116. How does your app ensure secure API communications?
*   **English Answer:** We enforce SSL pinning and HTTPS connection protocols inside our Axios client configurations. This encrypts our network requests and validates that our API client only communicates with servers possessing verified SSL certificates, preventing man-in-the-middle attacks.
*   **Follow-up Question:** How do you implement SSL pinning in an Expo managed project?
*   **Hinglish Explanation:** Data transmission safety layers setup protocols utilize dynamic models encryption parameters validations configurations setups ranges.

### Q117. How do you protect local device endpoints from unauthorized physical access?
*   **English Answer:** We implement a biometric app lock. When the app is opened, we block the UI and prompt the user for biometric authentication, ensuring that only the device owner can access the application even if the device is unlocked.
*   **Follow-up Question:** How can user bypass biometric checks if native sensors fail?
*   **Hinglish Explanation:** Physical device checks limits logic sets models parameters local authentications dynamic prompts controls systems.

### Q118. What is the security risk of using inline JS injection inside WebViews?
*   **English Answer:** Using `injectedJavaScript` in a WebView can execute untrusted JavaScript code if the source content is compromised, potentially allowing attackers to read local storage or access application data.
*   **Follow-up Question:** What are secure alternatives to injectedJavaScript for message passing?
*   **Hinglish Explanation:** Inline scripts dynamic run targets security loop gaps open up models configurations settings checks.

### Q119. Explain standard data scrubbing procedures inside analytic services logs.
*   **English Answer:** To protect user privacy and comply with regulations like GDPR, we scrub sensitive information (such as passwords, credit card numbers, and PII) from our logs and custom tags before sending them to Sentry or Microsoft Clarity.
*   **Follow-up Question:** How do you implement automated regex scrubbing in Sentry's `beforeSend` callback?
*   **Hinglish Explanation:** Sentry telemetry logs standard private PII filters control parameter setups target models. Regex functions automatically clean sensitive inputs.

### Q120. Explain the risk of reverse engineering on Android APKs.
*   **English Answer:** Android APKs can be easily decompiled back into readable Java and JavaScript code using tools like JADX. To protect our intellectual property and secure our app, we enable code obfuscation and shrinking in our Proguard build settings.
*   **Follow-up Question:** Does iOS IPA bundle obfuscation follow similar tooling patterns?
*   **Hinglish Explanation:** Compiler bundles source reverse mapping files security layers levels configs target obfuscate triggers tools setups maps run.

---

## 11. Performance Optimization (Q121 - Q130)

### Q121. How do you optimize scroll performance for lists (like the course catalog)?
*   **English Answer:** We use standard `FlatList` elements configured with optimized properties: `removeClippedSubviews` to unmount off-screen items, `keyExtractor` to maintain item references, and wrapping child components in `React.memo` to prevent redundant re-renders.
*   **Follow-up Question:** How do you define a fixed `getItemLayout` optimization parameter?
*   **Hinglish Explanation:** Long list scroll optimize range flat list properties options setups. Memo custom components use targets elements rendering decrease controls blocks.

### Q122. Explain React.memo and how it optimizes UI render speeds.
*   **English Answer:** `React.memo` is a higher-order component. It performs a shallow comparison of a component's props and prevents it from re-rendering if the props have not changed, which is highly effective for list items like our course cards.
*   **Follow-up Question:** Under what conditions will React.memo fail to prevent a re-render?
*   **Hinglish Explanation:** Props level check optimization. Component objects value references check comparison performs. Equal parameters par components rerender prevent execute checks run.

### Q123. What are image sizing parameters in Unsplash queries and why are they important?
*   **English Answer:** To save bandwidth and speed up image loading, we append size parameters (e.g., `?w=400&q=80`) to our Unsplash API image URLs, ensuring the device only downloads optimized thumbnails instead of high-resolution original images.
*   **Follow-up Question:** What are dynamic cache strategies of expo-image libraries?
*   **Hinglish Explanation:** Dynamic sizing URL parameters bandwidth levels control systems. Full display resolution bypass size images download limits optimized size ranges scale parameters.

### Q124. How does code splitting work inside Expo Router navigation stacks?
*   **English Answer:** Expo Router automatically splits our code by route. When the application loads, Metro only bundles the code required for the initial screen, downloading and parsing other screens (like the AI Tutor) only when the user navigates to them, keeping our bundle size small.
*   **Follow-up Question:** What is the bundle layout difference between development and production builds?
*   **Hinglish Explanation:** Code splitting route levels compile bundle size control targets setups options navigates logic load patterns optimizations maps.

### Q125. Why is memory leak monitoring critical in React Native?
*   **English Answer:** Because mobile devices have limited memory, leaks from active listeners or interval timers that are not properly cleaned up can quickly exhaust the device's RAM, causing the application to slow down and eventually crash.
*   **Follow-up Question:** How do you profile memory allocations in React Native?
*   **Hinglish Explanation:** Mobile hardware limited resources limits check execute run structures setups. Active listeners screens leave hone par cancel targets setup parameters.

### Q126. Explain the performance benefit of using local selectors in Zustand hooks.
*   **English Answer:** Using selective Zustand selectors (e.g., `state => state.bookmarks`) ensures our components only subscribe to the specified state slices, preventing them from re-rendering when unrelated store variables change.
*   **Follow-up Question:** What is strict equality check differences in Zustand hooks updates?
*   **Hinglish Explanation:** Selective hooks properties state change limits control re-renders target execute values limits control scale ranges parameter setups updates.

### Q127. Explain why JS thread drops frames and how it affects UI interactions.
*   **English Answer:** If the JavaScript main thread is blocked by expensive calculations for more than 16.6ms, it cannot render the next frame in time, causing the frame rate to drop below 60fps and making animations appear stuttery and laggy to the user.
*   **Follow-up Question:** How do you offload heavy calculations to background threads in React Native?
*   **Hinglish Explanation:** JavaScript thread calculation loads drops frame drops transitions lags. Heavy loops JS execution durations delays controls map.

### Q128. What is standard Hermes Engine garbage collection behavior?
*   **English Answer:** Hermes is Facebook's optimized JavaScript engine for React Native. Its garbage collector is optimized for mobile, performing quick, incremental collections to release unused memory without pausing the JS thread or causing UI stutter.
*   **Follow-up Question:** How do you verify that the Hermes engine is active in your build outputs?
*   **Hinglish Explanation:** Hermes engine garbage collections limits parameters dynamic controls. Memory cleanup speeds optimizations structures.

### Q129. How does `removeClippedSubviews` property optimize scroll performance?
*   **English Answer:** When `removeClippedSubviews` is set to true on a `FlatList`, off-screen list items are detached from the native view hierarchy, saving memory and improving rendering performance as the user scrolls.
*   **Follow-up Question:** Are there any known rendering bugs when using this property?
*   **Hinglish Explanation:** Screen view bounds elements unmounts properties list performance double targets configurations checks standard runs models.

### Q130. What is lazy-loading for assets and how do we implement it?
*   **English Answer:** Lazy loading delays the loading of heavy assets (such as images, large JSON payloads, and dynamic route bundles) until they are actually needed on screen, reducing the initial load time of the application.
*   **Follow-up Question:** Can we configure pre-fetching for dynamic resources?
*   **Hinglish Explanation:** Dynamic asset load limits delays. Screens targets parameters controls checks range maps optimize parameters execution run.

---

## 12. Testing, Mocks & Jest Coverage (Q131 - Q138)

### Q131. How is your testing framework configured in `jest.config.js`?
*   **English Answer:** We use the `jest-expo` preset, which automatically configures Jest to handle Metro bundler transforms, React Native syntax, asset loading, and common Expo module mocks out-of-the-box.
*   **Follow-up Question:** What is the role of `jest.setup.js` in your project?
*   **Hinglish Explanation:** Jest testing presets configuration files expo modules transforms dynamic patterns compatibility models run configurations target verify.

### Q132. Walk through unit testing for your UI `Button` component.
*   **English Answer:** In `Button.test.tsx`, we verify three states: First, that the button renders its child text correctly; second, that it triggers the `onPress` callback when tapped; and third, that it displays a loading spinner and disables press events when the `loading` prop is true.
*   **Follow-up Question:** How does `@testing-library/react-native` find components during query checks?
*   **Hinglish Explanation:** UI buttons unit testing checks. Click callbacks validations triggers, loading indicators displays visibility properties verify checks models runs.

### Q133. Explain how you mock Axios client responses inside Jest tests.
*   **English Answer:** We mock the Axios module using `jest.mock('../core/api/client')` and mock individual API responses using `mockResolvedValue` or `mockRejectedValue`, allowing us to test our store actions under various server scenarios.
*   **Follow-up Question:** How do you test response interceptors logic dynamically?
*   **Hinglish Explanation:** Backend mock responses configurations targets. Network error parameters custom mocks objects resolve state updates check.

### Q134. How do you test Zustand store actions in isolation?
*   **English Answer:** We import the store directly (e.g., `useAuthStore`) in our test files. We mock the API layer, call store actions programmatically using `getState()`, and assert that the store state updates correctly, resetting the store state before each test to prevent test pollution.
*   **Follow-up Question:** Why is resetting store states critical between test executions?
*   **Hinglish Explanation:** Isolated store tests execution setup parameters values verify. Store functions getState call results test check runs structures.

### Q135. What is the role of `jest.setup.js` in mocking native device APIs?
*   **English Answer:** `jest.setup.js` runs before our tests execute. We use it to mock native APIs that do not run in a Node environment, such as `AsyncStorage`, `expo-secure-store`, `expo-notifications`, and `react-native-clarity`, preventing our tests from failing due to missing native hooks.
*   **Follow-up Question:** How do you mock a native API that returns a promise?
*   **Hinglish Explanation:** Native device hooks mocking setup parameters. Mocks files execute targets nodes environment compatibility issues bypass checks.

### Q136. How do you test API retry logic and exponential backoff?
*   **English Answer:** We mock our network responses to fail with retryable status codes (like 500) and use Jest's fake timers (`jest.useFakeTimers()`) to fast-forward time, asserting that the client attempts exactly 3 retries with the correct backoff delay before failing.
*   **Follow-up Question:** How do you assert the exact number of HTTP call attempts in Jest?
*   **Hinglish Explanation:** Failure scenarios testing mock backoffs delays verification. Timers fast forward tools call targets counts verify runs options.

### Q137. What is Code Coverage and how do you generate reports in this project?
*   **English Answer:** Code coverage measures the percentage of our codebase executed by our tests. We generate coverage reports by running `pnpm test --coverage`, which outputs a detailed summary of statement, branch, function, and line coverage to our `coverage/` directory.
*   **Follow-up Question:** What is the difference between branch coverage and statement coverage?
*   **Hinglish Explanation:** Code coverage test executions measurements parameters sets. Lines execution targets reports percentage trace maps targets.

### Q138. How do you test the Sentry Error Boundary rendering fallback UI?
*   **English Answer:** We render a test component that throws an error inside our `<ErrorBoundary>` component. We assert that Sentry's `captureException` was called with the error and verify that the UI displays our fallback error screen instead of crashing.
*   **Follow-up Question:** Can we test that Sentry actually sent the crash report payload to their servers?
*   **Hinglish Explanation:** Fallback error boundary screen tests checks maps. Throw checks perform exceptions capture assertions triggers verify execute parameters.

---
*Last Updated: May 2026. Designed for senior React Native & Expo developers.*
