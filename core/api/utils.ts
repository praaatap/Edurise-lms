export function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function getBackoffTime(retryCount: number) {
  return Math.pow(2, retryCount - 1) * 1000;
}

export function isRetryableStatus(status?: number) {
  return (
    status === 429 ||
    status === 500 ||
    status === 502 ||
    status === 503 ||
    status === 504
  );
}
