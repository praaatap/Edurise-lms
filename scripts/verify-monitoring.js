// @ts-check
/**
 * verify-monitoring.js
 * Run with:  node scripts/verify-monitoring.js
 *
 * Checks that Sentry + Clarity are properly wired up across the codebase.
 * No network calls — pure file inspection.
 */

const fs   = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

// ─── helpers ─────────────────────────────────────────────────────────────────
const green  = (s) => `\x1b[32m✔  ${s}\x1b[0m`;
const red    = (s) => `\x1b[31m✘  ${s}\x1b[0m`;
const yellow = (s) => `\x1b[33m⚠  ${s}\x1b[0m`;
const bold   = (s) => `\x1b[1m${s}\x1b[0m`;
const dim    = (s) => `\x1b[2m${s}\x1b[0m`;

let passed = 0, failed = 0, warned = 0;

const ok   = (msg) => { console.log(green(msg));  passed++; };
const fail = (msg) => { console.log(red(msg));    failed++; };
const warn = (msg) => { console.log(yellow(msg)); warned++; };
const hdr  = (msg) => console.log(`\n${bold('── ' + msg + ' ' + '─'.repeat(Math.max(0, 44 - msg.length)))}`);

function readFile(rel) {
  const abs = path.join(ROOT, rel);
  return fs.existsSync(abs) ? fs.readFileSync(abs, 'utf8') : null;
}
const has  = (rel, needle) => { const c = readFile(rel); return c ? c.includes(needle) : false; };
const exists = (rel) => fs.existsSync(path.join(ROOT, rel));

// ─── .env parsing ─────────────────────────────────────────────────────────────
function readEnv() {
  const src = readFile('.env') || '';
  return Object.fromEntries(
    src.split('\n')
       .filter(l => l.includes('=') && !l.startsWith('#'))
       .map(l => { const i = l.indexOf('='); return [l.slice(0,i).trim(), l.slice(i+1).trim()]; })
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
console.log(bold('\n╔══════════════════════════════════════════════╗'));
console.log(bold(  '║  Edurise LMS — Monitoring Verification v1.0  ║'));
console.log(bold(  '╚══════════════════════════════════════════════╝'));

const env = readEnv();

// ─── 1. Env vars ──────────────────────────────────────────────────────────────
hdr('1. Environment Variables (.env)');

const sentryDsn = env['EXPO_PUBLIC_SENTRY_DSN'] || '';
if (sentryDsn.startsWith('https://') && sentryDsn.includes('@') && sentryDsn.includes('sentry.io')) {
  ok(`EXPO_PUBLIC_SENTRY_DSN — valid DSN: ${sentryDsn.slice(8, 42)}...`);
} else if (sentryDsn) {
  fail(`EXPO_PUBLIC_SENTRY_DSN — present but malformed: "${sentryDsn.slice(0, 40)}"`);
} else {
  fail('EXPO_PUBLIC_SENTRY_DSN missing from .env');
}

const clarityId = env['EXPO_PUBLIC_CLARITY_PROJECT_ID'] || '';
if (clarityId.length >= 5) {
  ok(`EXPO_PUBLIC_CLARITY_PROJECT_ID — present: "${clarityId}"`);
} else {
  fail('EXPO_PUBLIC_CLARITY_PROJECT_ID missing from .env');
}

// ─── 2. SDK packages ─────────────────────────────────────────────────────────
hdr('2. SDK Packages (package.json)');

const pkg = JSON.parse(readFile('package.json'));
const deps = { ...pkg.dependencies, ...pkg.devDependencies };

const sdks = [
  ['@sentry/react-native', 'Sentry React Native SDK'],
  ['react-native-clarity', 'Microsoft Clarity SDK'],
];
sdks.forEach(([name, label]) => {
  deps[name] ? ok(`${label} (${name}@${deps[name]})`) : fail(`${label} not in package.json`);
});

// ─── 3. app.json plugins ──────────────────────────────────────────────────────
hdr('3. Native Plugins (app.json)');

const appJson = JSON.parse(readFile('app.json'));
const plugins = appJson.expo?.plugins ?? [];
const pluginNames = plugins.map(p => Array.isArray(p) ? p[0] : p);

pluginNames.includes('@sentry/react-native/expo')
  ? ok('@sentry/react-native/expo plugin present — source maps will upload on EAS build')
  : fail('@sentry/react-native/expo plugin MISSING — source maps won\'t upload');

pluginNames.includes('expo-alternate-app-icons')
  ? ok('expo-alternate-app-icons plugin present')
  : warn('expo-alternate-app-icons plugin not found');

// ─── 4. Sentry wiring ─────────────────────────────────────────────────────────
hdr('4. Sentry SDK Wiring');

has('app/_layout.tsx', 'Sentry.init(')
  ? ok('Sentry.init() called in _layout.tsx')
  : fail('Sentry.init() NOT found in _layout.tsx');

has('app/_layout.tsx', 'Sentry.wrap(')
  ? ok('Root component wrapped with Sentry.wrap() — JS error boundary active')
  : fail('Sentry.wrap() NOT found — uncaught JS errors won\'t be reported');

has('app/_layout.tsx', 'reactNativeTracingIntegration')
  ? ok('reactNativeTracingIntegration registered — auto performance tracing ON')
  : warn('reactNativeTracingIntegration not found — performance tracing limited');

has('app/_layout.tsx', 'debug: __DEV__')
  ? ok('Sentry debug: __DEV__ — verbose logs in dev, silent in prod')
  : warn('Sentry debug is not dynamic (debug: __DEV__) — add it for better dev visibility');

has('features/auth/store/authStore.ts', 'Sentry.setUser(')
  ? ok('Sentry.setUser() called on login — errors tagged with user identity')
  : fail('Sentry.setUser() NOT called — errors won\'t be linked to users');

// ─── 5. Sentry performance spans ─────────────────────────────────────────────
hdr('5. Sentry Performance Spans');

const spanTargets = [
  ['core/api/client.ts',                    'trackApiRequest',  'HTTP timing breadcrumbs (API client)'],
  ['features/auth/store/authStore.ts',      'withSentrySpan',   'Auth API spans (login/register/checkAuth)'],
  ['features/courses/store/courseStore.ts', 'withSentrySpan',   'Course fetch spans'],
  ['features/ai/services/groqAgent.ts',     'withSentrySpan',   'AI/Groq API spans'],
];
spanTargets.forEach(([file, fn, label]) => {
  has(file, fn) ? ok(label) : fail(`${label} — ${fn} not found in ${file}`);
});

// trackUserAction usage spot-check
const actionTargets = [
  ['features/auth/store/authStore.ts',      'trackUserAction(\'logout\')',         'logout action'],
  ['features/courses/store/courseStore.ts', 'trackUserAction(\'enroll_course\'',   'enroll action'],
  ['features/courses/store/courseStore.ts', 'trackUserAction(\'toggle_bookmark\'', 'bookmark action'],
  ['app/(tabs)/index.tsx',                  'trackUserAction(\'course_tapped\'',   'home course tap'],
  ['app/(tabs)/explore.tsx',                'trackUserAction(\'search\'',          'search action'],
  ['app/course/[id]/index.tsx',             'trackUserAction(\'course_enrolled\'', 'course enroll action'],
  ['app/ai-tutor.tsx',                      'trackUserAction(\'ai_message_sent\'', 'AI message send'],
];
actionTargets.forEach(([file, needle, label]) => {
  has(file, needle) ? ok(`trackUserAction: ${label}`) : warn(`trackUserAction: ${label} not found in ${file}`);
});

// ─── 6. Clarity wiring ────────────────────────────────────────────────────────
hdr('6. Microsoft Clarity Wiring');

has('app/_layout.tsx', 'clarityService.initialize()')
  ? ok('clarityService.initialize() called at app startup')
  : fail('clarityService.initialize() NOT in _layout.tsx');

has('app/_layout.tsx', 'clarityService.identifyUser')
  ? ok('clarityService.identifyUser() called after auth — user tagged in sessions')
  : fail('clarityService.identifyUser() NOT called — sessions anonymous');

has('features/auth/store/authStore.ts', 'clarityService.clearUser()')
  ? ok('clarityService.clearUser() on logout — new anonymous session starts')
  : fail('clarityService.clearUser() NOT on logout');

has('core/services/clarityService.ts', 'get isInitialized()')
  ? ok('isInitialized getter exposed — test screen can check status at runtime')
  : warn('isInitialized not publicly exposed — runtime status check unavailable');

// ─── 7. Screen tracking ───────────────────────────────────────────────────────
hdr('7. Screen Tracking (useScreenTracking)');

exists('shared/hooks/useScreenTracking.ts')
  ? ok('useScreenTracking hook file exists')
  : fail('useScreenTracking hook file MISSING');

has('shared/hooks/useScreenTracking.ts', 'clarityService.setScreen')
  ? ok('Hook calls clarityService.setScreen()')
  : fail('Hook does NOT call clarityService.setScreen()');

has('shared/hooks/useScreenTracking.ts', 'trackScreenView')
  ? ok('Hook calls trackScreenView() → Sentry breadcrumb')
  : fail('Hook does NOT call trackScreenView()');

const screenFiles = [
  'app/(tabs)/index.tsx',
  'app/(tabs)/explore.tsx',
  'app/(tabs)/bookmarks.tsx',
  'app/(tabs)/profile.tsx',
  'app/(auth)/login.tsx',
  'app/(auth)/register.tsx',
  'app/course/[id]/index.tsx',
  'app/course/[id]/content.tsx',
  'app/ai-tutor.tsx',
  'app/profile/notifications.tsx',
  'app/profile/app-icon.tsx',
  'app/profile/notes.tsx',
  'app/instructor/[id].tsx',
  'app/profile/event-testing.tsx',
];

let withHook = 0;
const missing = [];
screenFiles.forEach(f => {
  has(f, 'useScreenTracking(') ? withHook++ : missing.push(f);
});

ok(`${withHook}/${screenFiles.length} screens use useScreenTracking()`);
missing.forEach(f => warn(`  Missing useScreenTracking in ${f}`));

has('app/_layout.tsx', 'usePathname') && has('app/_layout.tsx', 'trackScreenView(screenName)')
  ? ok('Global pathname listener in _layout.tsx as fallback — all routes tracked')
  : warn('Global pathname-based fallback tracking not found in _layout.tsx');

// ─── 8. Analytics service ─────────────────────────────────────────────────────
hdr('8. Analytics Service (multi-destination)');

[
  ['Sentry.addBreadcrumb',             'Sentry breadcrumbs'],
  ['clarityService.logCustomEvent',    'Clarity custom events'],
  ['AsyncStorage.setItem',             'LocalStorage persistence'],
].forEach(([needle, label]) => {
  has('core/services/analyticsService.ts', needle)
    ? ok(`→ ${label}`)
    : fail(`→ ${label} NOT found`);
});

// Count event types
const analyticsFile = readFile('core/services/analyticsService.ts') || '';
const eventTypeMatches = analyticsFile.match(/\| '[a-z_]+'/g) || [];
ok(`${eventTypeMatches.length} event types defined in EventName union type`);

// ─── 9. Event testing screen ─────────────────────────────────────────────────
hdr('9. Event Testing Screen');

exists('app/profile/event-testing.tsx')
  ? ok('Event testing screen exists at app/profile/event-testing.tsx')
  : fail('Event testing screen MISSING');

has('app/(tabs)/profile.tsx', 'event-testing')
  ? ok('Event testing screen linked from Profile tab with "Event Testing Dashboard" button')
  : fail('Event testing screen NOT linked from Profile tab');

// Check all 4 sections exist
const etFile = readFile('app/profile/event-testing.tsx') || '';
['Sentry Performance', 'Microsoft Clarity', 'Analytics Service', 'Combined Flow Test'].forEach(s => {
  etFile.includes(s)
    ? ok(`  Section present: "${s}"`)
    : fail(`  Section MISSING: "${s}"`);
});

// ─── 10. Welcome animation ────────────────────────────────────────────────────
hdr('10. Post-Login Welcome Animation');

exists('shared/components/ui/WelcomeScreen.tsx')
  ? ok('WelcomeScreen component exists')
  : fail('WelcomeScreen component MISSING');

has('app/_layout.tsx', 'showWelcome') && has('app/_layout.tsx', 'WelcomeScreen')
  ? ok('WelcomeScreen rendered from _layout.tsx on fresh login')
  : fail('WelcomeScreen not wired up in _layout.tsx');

// ─── Summary ──────────────────────────────────────────────────────────────────
console.log('\n' + bold('═'.repeat(48)));
console.log(bold(`  Results: ${passed} passed  |  ${warned} warnings  |  ${failed} failed`));
console.log(bold('═'.repeat(48)));

if (failed === 0 && warned === 0) {
  console.log('\n\x1b[32m' + bold('  All checks passed. Monitoring is fully wired up.') + '\x1b[0m\n');
} else if (failed === 0) {
  console.log('\n\x1b[33m' + bold('  Passed with warnings — see yellow items above.') + '\x1b[0m\n');
} else {
  console.log('\n\x1b[31m' + bold(`  ${failed} issue(s) found. Fix red items before shipping.`) + '\x1b[0m\n');
  process.exit(1);
}
