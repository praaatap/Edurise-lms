<div align="center">
  <h1>Mini LMS Mobile App</h1>
  <p><i>A production-ready Mini Learning Management System built with React Native Expo, TypeScript, and NativeWind v4.</i></p>
</div>

---

## Project Overview
This project demonstrates senior-level proficiency in native mobile app development, state management, and modern UI architecture. It bridges the gap between native functionality and embedded web content seamlessly.

## Key Features

### Authentication & Security
- Secure Login and Registration via `api.freeapi.app` with JWT persistence using Expo SecureStore.
- Auto-login on app restart with token refresh handling.
- Biometric unlock (Face ID / Touch ID) toggle from the Profile screen.
- Exponential backoff token refresh flow utilizing Axios interceptors.

### Course Catalog
- Merged product and user data from FreeAPI to simulate real LMS courses with instructors.
- High-performance scrollable lists using LegendList (60fps, no UI jank).
- Pull-to-refresh without user experience disruption.
- AI-powered recommendations via OpenAI (falls back to keyword matching without a key).
- Bookmark milestone notifications when 5+ courses are saved.
- 5-minute TTL cache to reduce unnecessary API calls.

### Application Navigation
The application utilizes a 4-tab bottom navigation structure:
- Home: Personalized greeting, live statistics (enrolled/completed/saved), "Continue Learning" carousel, and AI recommendations.
- Explore: Search bar with category filter chips and a full course grid.
- Saved: All bookmarked courses with a live badge count on the tab icon.
- Profile: User information, statistics, quiz scores, learning journey timeline, and biometric settings.

### Course Details & WebView Content
- Details Screen: Hero image, instructor card, syllabus timeline, and animated enrollment via Gorhom BottomSheet with haptic feedback.
- Content Viewer: Local HTML course page generated dynamically per-course.
- Bidirectional Bridge: Native to WebView (headers/token injection) and WebView to Native (quiz scores, course completion).
- Robust Error Handling: Progress bar tracking and full error/retry screens on WebView failures.

### Native Integration & State Management
- Expo Notifications: Bookmark milestones and 24-hour re-engagement reminders.
- Network Monitoring: Real-time offline banner utilizing NetInfo.
- Haptics: Contextual tactile feedback on all interactive actions.
- Zustand + Persist: Lightweight global state with AsyncStorage persistence and SecureStore for tokens.
- Selective Rendering: Stores subscribe only to necessary states to prevent prop drilling and unnecessary re-renders.

---

## Setup Instructions

1. Clone the repository:
   ```bash
   git clone <repo-url>
   cd AITVMini
   ```

2. Install dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```

3. Start the development server:
   ```bash
   npx expo start
   ```

---

## Environment Configuration

Create a `.env` file in the project root directory:

```env
EXPO_PUBLIC_API_URL=https://api.freeapi.app/api/v1
EXPO_PUBLIC_OPENAI_API_KEY=sk-... # Optional for AI features
```

---

## 📐 Key Architectural Decisions

| Decision | Rationale |
|---|---|
| **Feature-based folder structure** | `features/auth`, `features/courses`, `features/notifications` — each owns its API, store, hooks, and components |
| **Zustand + persist** | Lightweight global state with built-in AsyncStorage persistence; `partialize` keeps only serializable data |
| **LegendList over FlatList** | Dramatically better virtualization performance; keyExtractor + `estimatedItemSize` for smooth 60fps |
| **NativeWind v4** | Tailwind-first styling eliminates StyleSheet boilerplate, enables design token consistency |
| **Axios interceptors** | Centralized retry (exponential backoff, max 3x), token refresh on 401, offline detection pre-flight |
| **WebView bridge** | `injectedJavaScriptBeforeContentLoaded` for token/headers injection; `onMessage` handler for bidirectional state sync |
| **Selective Zustand selectors** | `CourseCard` subscribes only to `enrolledCourses` + `completedCourses` — no parent re-render propagation |

---

## ⚠️ Known Issues / Limitations

- **FreeAPI Volatility**: `/randomusers` and `/randomproducts` occasionally timeout. Exponential backoff handles retries, but extended outages show the offline banner.
- **Mocked LMS data**: Products and users are algorithmically merged — not real course data.
- **WebView on old Android**: Rapid open/close of the WebView on low-end devices may cause minor frame drops.
- **OpenAI without key**: Falls back gracefully to keyword-based recommendations; no crash.

---

## 📱 Screenshots of Main Screens

*(Add after building the app)*

- Home Dashboard — Personalized greeting, stats row, Continue Learning carousel
- Explore — Search + category filters
- Course Detail — Hero image, syllabus timeline, enroll bottom sheet
- WebView Content — Interactive quiz with bidirectional bridge
- Profile — Learning journey, quiz scores, biometric settings

---

## 🎥 Demo Video

[Link to Demo Video] — 3–5 minute walkthrough of authentication, course discovery, enrollment, WebView quiz, offline mode, and notifications.

---

## 🏗️ APK Build

The latest development APK is in the **Releases** section.

### Build your own

```bash
npm install -g eas-cli
eas login
eas build -p android --profile preview
```

---

Built with ❤️ for the React Native Expo Developer Assignment.
