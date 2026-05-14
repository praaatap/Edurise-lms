// @ts-check
/**
 * verify-monitoring.js
 * Run with:  node scripts/verify-monitoring.js
 */

const fs   = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const green  = (s) => `\x1b[32m✔  ${s}\x1b[0m`;
const red    = (s) => `\x1b[31m✘  ${s}\x1b[0m`;
const yellow = (s) => `\x1b[33m⚠  ${s}\x1b[0m`;
const bold   = (s) => `\x1b[1m${s}\x1b[0m`;

let passed = 0, failed = 0, warned = 0;

const ok   = (msg) => { console.log(green(msg));  passed++; };
const fail = (msg) => { console.log(red(msg));    failed++; };
const warn = (msg) => { console.log(yellow(msg)); warned++; };
const hdr  = (msg) => console.log(`\n${bold('── ' + msg + ' ' + '─'.repeat(Math.max(0, 50 - msg.length)))}`);

function readFile(rel) {
  const abs = path.join(ROOT, rel);
  return fs.existsSync(abs) ? fs.readFileSync(abs, 'utf8') : null;
}
const has    = (rel, needle) => { const c = readFile(rel); return c ? c.includes(needle) : false; };
const exists = (rel) => fs.existsSync(path.join(ROOT, rel));

function readEnv() {
  const src = readFile('.env') || '';
  return Object.fromEntries(
    src.split('\n')
       .filter(l => l.includes('=') && !l.startsWith('#'))
       .map(l => { const i = l.indexOf('='); return [l.slice(0,i).trim(), l.slice(i+1).trim()]; })
  );
}

console.log(bold('\n╔════════════════════════════════════════════════════╗'));
console.log(bold(  '║  Edurise LMS — Full System Verification v2.0       ║'));
console.log(bold(  '╚════════════════════════════════════════════════════╝'));

const env = readEnv();

// ─── 1. Env vars ──────────────────────────────────────────────────────────────
hdr('1. Environment Variables (.env)');

const sentryDsn = env['EXPO_PUBLIC_SENTRY_DSN'] || '';
if (sentryDsn.startsWith('https://') && sentryDsn.includes('@') && sentryDsn.includes('sentry.io')) {
  ok(`EXPO_PUBLIC_SENTRY_DSN — valid DSN`);
} else {
  fail('EXPO_PUBLIC_SENTRY_DSN missing or malformed');
}

const clarityId = env['EXPO_PUBLIC_CLARITY_PROJECT_ID'] || '';
clarityId.length >= 5 ? ok(`EXPO_PUBLIC_CLARITY_PROJECT_ID — present: "${clarityId}"`) : fail('EXPO_PUBLIC_CLARITY_PROJECT_ID missing');

const apiUrl = env['EXPO_PUBLIC_API_URL'] || '';
apiUrl ? ok(`EXPO_PUBLIC_API_URL — present`) : warn('EXPO_PUBLIC_API_URL missing');

const groqKey = env['EXPO_PUBLIC_GROQ_API_KEY'] || '';
(groqKey && groqKey !== 'your_groq_api_key_here') ? ok('EXPO_PUBLIC_GROQ_API_KEY — present') : warn('EXPO_PUBLIC_GROQ_API_KEY missing or placeholder');

// ─── 2. SDK packages ─────────────────────────────────────────────────────────
hdr('2. SDK Packages (package.json)');

const pkg  = JSON.parse(readFile('package.json'));
const deps = { ...pkg.dependencies, ...pkg.devDependencies };

[
  ['@sentry/react-native',      'Sentry React Native SDK'],
  ['react-native-clarity',      'Microsoft Clarity SDK'],
  ['expo-alternate-app-icons',  'Alternate App Icons'],
  ['expo-notifications',        'Expo Notifications'],
  ['expo-haptics',              'Expo Haptics'],
].forEach(([name, label]) => {
  deps[name] ? ok(`${label} (${name}@${deps[name]})`) : fail(`${label} not in package.json`);
});

// ─── 3. app.json plugins ──────────────────────────────────────────────────────
hdr('3. Native Plugins (app.json)');

const appJson    = JSON.parse(readFile('app.json'));
const plugins    = appJson.expo?.plugins ?? [];
const pluginNames = plugins.map(p => Array.isArray(p) ? p[0] : p);

pluginNames.includes('@sentry/react-native/expo')
  ? ok('@sentry/react-native/expo plugin present')
  : fail('@sentry/react-native/expo plugin MISSING');

pluginNames.includes('expo-alternate-app-icons')
  ? ok('expo-alternate-app-icons plugin present')
  : fail('expo-alternate-app-icons plugin MISSING');

pluginNames.includes('expo-notifications')
  ? ok('expo-notifications plugin present')
  : warn('expo-notifications plugin not found — push notifications may not work');

// ─── 4. Dynamic App Icons ─────────────────────────────────────────────────────
hdr('4. Dynamic App Icons');

const iconNames = ['dark', 'green', 'blue', 'purple', 'minimal'];

// Check source PNG files exist
iconNames.forEach(name => {
  exists(`assets/images/app-icons/icon-${name}.png`)
    ? ok(`Source icon exists: icon-${name}.png`)
    : fail(`Source icon MISSING: assets/images/app-icons/icon-${name}.png`);
});

// Check Android activity-alias entries in manifest
const manifest = readFile('android/app/src/main/AndroidManifest.xml') || '';
iconNames.forEach(name => {
  manifest.includes(`MainActivity${name}`)
    ? ok(`Android activity-alias present: .MainActivity${name}`)
    : fail(`Android activity-alias MISSING: .MainActivity${name} — run: node scripts/inject-app-icons.js`);
});

// Check mipmap PNGs copied
iconNames.forEach(name => {
  exists(`android/app/src/main/res/mipmap-xxhdpi/ic_launcher_${name}.png`)
    ? ok(`Android mipmap resource: ic_launcher_${name}.png`)
    : fail(`Android mipmap MISSING: ic_launcher_${name}.png`);
});

// Check app-icon screen & store
exists('features/settings/store/appIconStore.ts')
  ? ok('appIconStore.ts exists — icons persisted across sessions')
  : fail('appIconStore.ts MISSING');

has('app/profile/app-icon.tsx', 'setAlternateAppIcon')
  ? ok('app-icon.tsx calls setAlternateAppIcon()')
  : fail('app-icon.tsx does not call setAlternateAppIcon()');

// ─── 5. Sentry SDK Wiring ─────────────────────────────────────────────────────
hdr('5. Sentry Error & Performance Tracking');

has('app/_layout.tsx', 'Sentry.init(')         ? ok('Sentry.init() in _layout.tsx') : fail('Sentry.init() NOT found');
has('app/_layout.tsx', 'Sentry.wrap(')         ? ok('Sentry.wrap() — JS error boundary active') : fail('Sentry.wrap() MISSING');
has('app/_layout.tsx', 'reactNativeTracingIntegration') ? ok('reactNativeTracingIntegration — auto perf tracing') : warn('reactNativeTracingIntegration not found');
has('app/_layout.tsx', 'debug: __DEV__')        ? ok('Sentry debug: __DEV__') : warn('Sentry debug not dynamic');
has('features/auth/store/authStore.ts', 'Sentry.setUser(') ? ok('Sentry.setUser() on login') : fail('Sentry.setUser() missing');

[
  ['core/api/client.ts',                    'trackApiRequest',  'HTTP timing (API client)'],
  ['features/auth/store/authStore.ts',      'withSentrySpan',   'Auth spans'],
  ['features/courses/store/courseStore.ts', 'withSentrySpan',   'Course fetch spans'],
  ['features/ai/services/groqAgent.ts',     'withSentrySpan',   'AI/Groq spans'],
].forEach(([file, fn, label]) => {
  has(file, fn) ? ok(label) : fail(`${label} — ${fn} not in ${file}`);
});

// ─── 6. Microsoft Clarity Wiring ─────────────────────────────────────────────
hdr('6. Microsoft Clarity Session Recording');

has('app/_layout.tsx', 'clarityService.initialize()')
  ? ok('clarityService.initialize() at app startup')
  : fail('clarityService.initialize() MISSING in _layout.tsx');

has('core/services/clarityService.ts', 'consent(true, true)')
  ? ok('consent(true, true) called — recording starts immediately')
  : fail('consent() not called — recording may be delayed');

has('core/services/clarityService.ts', 'LogLevel.Verbose')
  ? ok('LogLevel.Verbose in dev — SDK logs visible in Metro')
  : warn('LogLevel not set to Verbose in dev');

has('core/services/clarityService.ts', 'setCustomSessionId')
  ? ok('setCustomSessionId — sessions searchable by user ID')
  : warn('setCustomSessionId not used — sessions not tied to user ID');

has('core/services/clarityService.ts', 'getCurrentSessionUrl')
  ? ok('getCurrentSessionUrl — session recording URL accessible')
  : warn('getCurrentSessionUrl not used');

has('features/auth/store/authStore.ts', 'clarityService.identifyUser')
  ? ok('identifyUser() on login — user tagged in recordings')
  : fail('identifyUser() missing');

has('features/auth/store/authStore.ts', 'clarityService.clearUser()')
  ? ok('clearUser() on logout — new anonymous session')
  : fail('clearUser() missing');

// Clarity pause on sensitive screens
has('app/(auth)/login.tsx', 'pauseRecording')
  ? ok('pauseRecording() on Login — password not captured')
  : warn('Login screen not pausing Clarity — password may be recorded');

has('app/(auth)/register.tsx', 'pauseRecording')
  ? ok('pauseRecording() on Register — password not captured')
  : warn('Register screen not pausing Clarity — password may be recorded');

// ─── 7. Clarity Events ────────────────────────────────────────────────────────
hdr('7. Clarity Custom Events');

const clarityEvents = [
  ['features/auth/store/authStore.ts',      'login_success',         'login_success event'],
  ['features/auth/store/authStore.ts',      'register_success',      'register_success event'],
  ['features/auth/store/authStore.ts',      'logout',                'logout event'],
  ['features/courses/store/courseStore.ts', 'course_enrolled',       'course_enrolled event'],
  ['features/courses/store/courseStore.ts', 'course_unenrolled',     'course_unenrolled event'],
  ['features/courses/store/courseStore.ts', 'course_completed',      'course_completed event'],
  ['features/courses/store/courseStore.ts', 'course_bookmarked',     'course_bookmarked event'],
  ['features/courses/store/courseStore.ts', 'course_note_saved',     'course_note_saved event'],
  ['app/course/[id]/index.tsx',             'course_viewed',         'course_viewed event'],
  ['app/course/[id]/content.tsx',           'course_content_opened', 'course_content_opened event'],
  ['app/(tabs)/explore.tsx',                'course_searched',       'course_searched event'],
  ['app/(tabs)/explore.tsx',                'course_filter_applied', 'course_filter_applied event'],
  ['app/ai-tutor.tsx',                      'ai_chat_opened',        'ai_chat_opened event'],
  ['app/ai-tutor.tsx',                      'ai_message_sent',       'ai_message_sent event'],
];
clarityEvents.forEach(([file, needle, label]) => {
  has(file, needle) ? ok(`Clarity: ${label}`) : fail(`Clarity: ${label} NOT found in ${file}`);
});

// ─── 8. Screen Tracking ───────────────────────────────────────────────────────
hdr('8. Screen Tracking (useScreenTracking)');

exists('shared/hooks/useScreenTracking.ts') ? ok('useScreenTracking hook exists') : fail('useScreenTracking MISSING');
has('shared/hooks/useScreenTracking.ts', 'clarityService.setScreen') ? ok('Hook → clarityService.setScreen()') : fail('Hook missing setScreen');
has('shared/hooks/useScreenTracking.ts', 'trackScreenView')          ? ok('Hook → trackScreenView() (Sentry)') : fail('Hook missing trackScreenView');

const screenFiles = [
  'app/(tabs)/index.tsx', 'app/(tabs)/explore.tsx', 'app/(tabs)/bookmarks.tsx',
  'app/(tabs)/profile.tsx', 'app/(auth)/login.tsx', 'app/(auth)/register.tsx',
  'app/course/[id]/index.tsx', 'app/course/[id]/content.tsx', 'app/ai-tutor.tsx',
  'app/profile/notifications.tsx', 'app/profile/app-icon.tsx', 'app/profile/notes.tsx',
  'app/instructor/[id].tsx', 'app/profile/event-testing.tsx',
];
let withHook = 0, missingHook = [];
screenFiles.forEach(f => has(f, 'useScreenTracking(') ? withHook++ : missingHook.push(f));
ok(`${withHook}/${screenFiles.length} screens use useScreenTracking()`);
missingHook.forEach(f => warn(`  Missing useScreenTracking in ${f}`));

// ─── 9. Notifications ────────────────────────────────────────────────────────
hdr('9. Notifications');

exists('features/notifications/services/notificationService.ts')
  ? ok('notificationService.ts exists')
  : fail('notificationService.ts MISSING');

has('features/notifications/services/notificationService.ts', 'scheduleEnrollmentNotification')
  ? ok('scheduleEnrollmentNotification — fires on course enroll')
  : fail('scheduleEnrollmentNotification MISSING');

has('features/notifications/services/notificationService.ts', 'scheduleCourseReengagementReminder')
  ? ok('scheduleCourseReengagementReminder — fires when user leaves course')
  : fail('scheduleCourseReengagementReminder MISSING');

has('features/notifications/services/notificationService.ts', 'scheduleReminderNotification')
  ? ok('scheduleReminderNotification — daily reminder')
  : fail('scheduleReminderNotification MISSING');

has('features/settings/store/notificationPrefsStore.ts', 'scheduleReminderNotification')
  ? ok('notificationPrefsStore re-schedules on master toggle ON')
  : warn('notificationPrefsStore does not re-schedule on toggle ON');

has('features/settings/store/notificationPrefsStore.ts', 'clearReminderNotification')
  ? ok('notificationPrefsStore cancels reminder when category toggled OFF')
  : warn('notificationPrefsStore does not cancel on category toggle OFF');

exists('app/profile/send-notification.tsx')
  ? ok('Send Notification screen exists (manual push composer)')
  : warn('Send Notification screen missing');

// ─── 10. Analytics Service ────────────────────────────────────────────────────
hdr('10. Analytics Service');

['Sentry.addBreadcrumb', 'clarityService.logCustomEvent', 'AsyncStorage.setItem'].forEach(needle => {
  has('core/services/analyticsService.ts', needle)
    ? ok(`→ ${needle}`)
    : fail(`→ ${needle} NOT found in analyticsService`);
});

const analyticsFile = readFile('core/services/analyticsService.ts') || '';
const eventTypes = analyticsFile.match(/\| '[a-z_]+'/g) || [];
ok(`${eventTypes.length} event types in EventName union`);

// ─── 11. Event Testing Screen ─────────────────────────────────────────────────
hdr('11. Event Testing & Live Debug Screen');

exists('app/profile/event-testing.tsx') ? ok('Event testing screen exists') : fail('Event testing screen MISSING');
has('app/(tabs)/profile.tsx', 'event-testing') ? ok('Linked from Profile tab') : fail('Not linked from Profile tab');

['Sentry Performance', 'Microsoft Clarity', 'Analytics Service', 'Combined Flow Test'].forEach(s => {
  const etFile = readFile('app/profile/event-testing.tsx') || '';
  etFile.includes(s) ? ok(`Section: "${s}"`) : fail(`Section MISSING: "${s}"`);
});

has('app/profile/event-testing.tsx', 'getSessionUrl') || has('app/profile/event-testing.tsx', 'sessionUrl')
  ? ok('Session URL banner in event testing — live Clarity link')
  : warn('No session URL display in event testing screen');

has('app/profile/event-testing.tsx', 'pauseRecording')
  ? ok('Pause/Resume recording buttons present')
  : warn('No pause/resume buttons in event testing');

// ─── 12. Welcome Animation ────────────────────────────────────────────────────
hdr('12. Post-Login Welcome Animation');

exists('shared/components/ui/WelcomeScreen.tsx') ? ok('WelcomeScreen component exists') : fail('WelcomeScreen MISSING');
has('app/_layout.tsx', 'showWelcome') && has('app/_layout.tsx', 'WelcomeScreen')
  ? ok('WelcomeScreen rendered on fresh login')
  : fail('WelcomeScreen not wired in _layout.tsx');

// ─── 13. GitHub Actions ───────────────────────────────────────────────────────
hdr('13. GitHub Actions CI/CD');

exists('.github/workflows/build.yml') ? ok('.github/workflows/build.yml exists') : fail('build.yml MISSING');
has('.github/workflows/build.yml', 'assembleRelease')
  ? ok('assembleRelease — local Gradle build (no EAS needed)')
  : warn('assembleRelease not found — may be using EAS cloud build');
has('.github/workflows/build.yml', 'softprops/action-gh-release')
  ? ok('GitHub Release creation wired up')
  : warn('No GitHub Release step found');
has('.github/workflows/build.yml', 'pnpm')
  ? ok('pnpm used (matches project lockfile)')
  : warn('pnpm not used — may fail with lockfile');

// ─── Summary ──────────────────────────────────────────────────────────────────
console.log('\n' + bold('═'.repeat(54)));
console.log(bold(`  Results: ${passed} passed  |  ${warned} warnings  |  ${failed} failed`));
console.log(bold('═'.repeat(54)));

if (failed === 0 && warned === 0) {
  console.log('\n\x1b[32m' + bold('  ✅ All checks passed. App is fully production-ready.') + '\x1b[0m\n');
} else if (failed === 0) {
  console.log('\n\x1b[33m' + bold('  ⚠  Passed with warnings — see yellow items above.') + '\x1b[0m\n');
} else {
  console.log('\n\x1b[31m' + bold(`  ❌ ${failed} issue(s) found. Fix red items before shipping.`) + '\x1b[0m\n');
  process.exit(1);
}
