import * as Sentry from '@sentry/react-native';

export async function withSentrySpan<T>(
  name: string,
  op: string,
  fn: () => Promise<T>,
): Promise<T> {
  return Sentry.startSpan({ name, op }, async () => {
    return fn();
  });
}

export function trackUserAction(action: string, data?: Record<string, any>) {
  Sentry.addBreadcrumb({
    category: 'user.action',
    message: action,
    data,
    level: 'info',
  });
}

export function trackScreenView(screenName: string) {
  Sentry.addBreadcrumb({
    category: 'navigation',
    message: `Viewed ${screenName}`,
    level: 'info',
  });
}

export function trackApiRequest(
  method: string,
  url: string,
  status: number,
  durationMs: number,
) {
  Sentry.addBreadcrumb({
    category: 'http',
    message: `${method.toUpperCase()} ${url}`,
    data: { status, duration_ms: durationMs, url },
    level: status >= 400 ? 'error' : 'info',
  });
}
