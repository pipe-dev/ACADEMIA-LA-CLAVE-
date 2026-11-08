/**
 * Application Version & Build Metadata
 * Single source of truth for the app version and git commit hash.
 */

export const APP_VERSION = 'v1.0.40';
export const APP_COMMIT_FALLBACK = '54455ff';

export interface AppBuildInfo {
  version: string;
  commit: string;
}

export function getAppBuildInfo(): AppBuildInfo {
  const version = process.env.NEXT_PUBLIC_APP_VERSION || APP_VERSION;
  const commit = process.env.NEXT_PUBLIC_GIT_COMMIT || APP_COMMIT_FALLBACK;
  return {
    version,
    commit,
  };
}
