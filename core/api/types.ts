import { InternalAxiosRequestConfig } from "axios";

export type RetriableRequestConfig = InternalAxiosRequestConfig & {
  _retryCount?: number;
  _authRetry?: boolean;
};
