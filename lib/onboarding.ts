export type OnboardingStatus = 'not_started' | 'in_progress' | 'completed' | 'skipped';

const STATUS_PREFIX = 'unilife_onboarding_status';
const DRAFT_PREFIX = 'unilife_onboarding_draft';

const safeStorageGet = (key: string): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

const safeStorageSet = (key: string, value: string) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // no-op: localStorage can fail in restricted environments
  }
};

const safeStorageRemove = (key: string) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // no-op
  }
};

const statusKey = (userId: string) => `${STATUS_PREFIX}:${userId}`;
const draftKey = (userId: string) => `${DRAFT_PREFIX}:${userId}`;

export const getOnboardingStatus = (userId: string): OnboardingStatus => {
  const raw = safeStorageGet(statusKey(userId));
  if (raw === 'completed' || raw === 'in_progress' || raw === 'skipped' || raw === 'not_started') {
    return raw;
  }
  return 'not_started';
};

export const setOnboardingStatus = (userId: string, status: OnboardingStatus) => {
  safeStorageSet(statusKey(userId), status);
};

export const clearOnboardingStatus = (userId: string) => {
  safeStorageRemove(statusKey(userId));
};

export const setOnboardingDraft = (userId: string, value: unknown) => {
  safeStorageSet(draftKey(userId), JSON.stringify(value));
};

export const getOnboardingDraft = <T>(userId: string): T | null => {
  const raw = safeStorageGet(draftKey(userId));
  if (!raw) return null;

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

export const clearOnboardingDraft = (userId: string) => {
  safeStorageRemove(draftKey(userId));
};

export const shouldRouteToOnboarding = (userId: string) => {
  const status = getOnboardingStatus(userId);
  return status !== 'completed' && status !== 'skipped';
};
