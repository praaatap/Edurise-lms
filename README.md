<div align="center">
  <h1>Edurise LMS Mobile App</h1>
  <p><i>A premium, production-ready Learning Management System built with React Native Expo, TypeScript, and NativeWind v4.</i></p>
</div>

---

## Project Overview
This project demonstrates senior-level proficiency in native mobile app development, state management, and modern UI architecture. It bridges the gap between native functionality and embedded web content seamlessly, delivering a high-performance experience under the **Edurise LMS** brand.

## Key Features

### Premium UI/UX
- **Custom Animated Splash Screen**: A sophisticated entrance animation featuring logo scaling and text transitions for a high-end feel.
- **Dynamic Design System**: Modern, light-themed aesthetic focused on tonal layering and refined typography.
- **Micro-animations**: Smooth transitions using React Native Reanimated throughout the app.

### Authentication & Security
- **Secure Login & Registration**: Via `api.freeapi.app` with JWT persistence using Expo SecureStore.
- **Biometric Security**: Face ID / Touch ID unlock capability integrated into the root layout.
- **Identity Verification**: Automatic session validation on app restart.

### Course Catalog & AI
- **Smart Discovery**: High-performance course lists utilizing LegendList for 60fps scrolling.
- **AI-Powered Recommendations**: Integrated OpenAI SDK for personalized course suggestions.
- **Interactive Syllabus**: Comprehensive course details with enrollment management.
- **Learning Timeline**: A persistent "Learning Journey" tracker in the user profile.

### WebView Integration
- **Bidirectional Bridge**: Real-time communication between the native app and embedded course content.
- **State Sync**: Course completion and quiz scores are instantly synced from WebView to the global Zustand store.

### Monitoring & Resilience
- **Error Tracking**: Full Sentry integration for real-time crash reporting and error monitoring.
- **Custom Analytics**: Internal analytics service tracking key user interactions (enrollment, bookmarks, etc.).
- **Offline Readiness**: Global network monitoring with an immediate offline banner and retry mechanisms.

---

## Setup Instructions

1. Clone the repository:
   ```bash
   git clone <repo-url>
   cd AITVMini
   ```

2. Install dependencies:
   ```bash
   npm install
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
SENTRY_AUTH_TOKEN=your_token # Required for source map uploads during build
```

---

## 📐 Key Architectural Decisions

| Decision | Rationale |
|---|---|
| **Feature-based structure** | Scalable organization where features (auth, courses) own their logic and components. |
| **Zustand + Persist** | Lightweight state management with selective persistence (SecureStore for tokens, AsyncStorage for data). |
| **Sentry + Breadcrumbs** | Automated error tracking combined with manual analytics breadcrumbs for deep debugging. |
| **Custom Splash Sequence** | Native Splash -> Animated Custom Splash -> App Content for a seamless first impression. |
| **LegendList Optimization** | Virtualized lists with `estimatedItemSize` to ensure performance on lower-end devices. |

---

## 🏗️ APK Build

I have configured the project for easy APK builds using EAS.

### Build Instructions:

1. Install EAS CLI: `npm install -g eas-cli`
2. Login: `eas login`
3. Run APK Build:
   ```bash
   eas build --profile apk --platform android
   ```

---

Built with ❤️ for the React Native Expo Developer Assignment.
