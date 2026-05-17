import { Capacitor } from '@capacitor/core';
import { AdMob, MaxAdContentRating, RewardAdPluginEvents } from '@capacitor-community/admob';

// Rewarded-ad service. Single-source-of-truth interface so the rest of the
// game never has to know if we're using native AdMob or the browser stub.
//
// Native Android builds use AdMob by default. Browser/dev-server runs still use
// the stub overlay so the game remains easy to test with `npm run dev`.

const MODE = envFlag('VITE_ADMOB_ENABLED', true) ? 'admob' : 'stub';
const STUB_AD_DURATION_MS = 1800;
const REWARDED_AD_TIMEOUT_MS = 120000;

export const TEST_REWARDED_AD_ID = 'ca-app-pub-3940256099942544/5224354917';

const REWARDED_AD_ID = envString('VITE_ADMOB_REWARDED_AD_ID', TEST_REWARDED_AD_ID);
const USE_TEST_ADS = envFlag('VITE_ADMOB_TESTING', REWARDED_AD_ID === TEST_REWARDED_AD_ID);

let initPromise = null;

// Subscribers for the UI to render the fake ad modal.
const listeners = new Set();
let activeStub = null;

export function onAdEvent(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
function emit(evt) {
  for (const fn of listeners) fn(evt);
}

export function isStubMode() { return !canUseNativeAdMob(); }

// Returns Promise<boolean> — true if user fully watched the ad, false if dismissed.
export function showRewarded(reason) {
  if (canUseNativeAdMob()) return showRewardedReal(reason);
  return showRewardedStub(reason);
}

function showRewardedStub(reason) {
  return new Promise((resolve) => {
    const startedAt = Date.now();
    activeStub = {
      reason,
      startedAt,
      durationMs: STUB_AD_DURATION_MS,
      cancel: () => {
        activeStub = null;
        emit({ type: 'closed', completed: false });
        resolve(false);
      },
    };
    emit({ type: 'started', reason, durationMs: STUB_AD_DURATION_MS });
    setTimeout(() => {
      if (!activeStub || activeStub.startedAt !== startedAt) return;
      activeStub = null;
      emit({ type: 'closed', completed: true });
      resolve(true);
    }, STUB_AD_DURATION_MS);
  });
}

export function cancelActiveStub() {
  if (activeStub) activeStub.cancel();
}

async function showRewardedReal(reason) {
  try {
    await ensureAdMobInitialized();
    await AdMob.prepareRewardVideoAd({
      adId: REWARDED_AD_ID,
      isTesting: USE_TEST_ADS,
    });
    return await showPreparedRewardedAd(reason);
  } catch (error) {
    console.warn('[ads] rewarded AdMob failed', error);
    return false;
  }
}

function showPreparedRewardedAd(reason) {
  return new Promise((resolve) => {
    let settled = false;
    let earnedReward = false;
    const handles = [];
    const timeoutId = setTimeout(() => settle(false), REWARDED_AD_TIMEOUT_MS);

    const cleanup = () => {
      clearTimeout(timeoutId);
      for (const handle of handles) {
        Promise.resolve(handle)
          .then((listener) => listener.remove())
          .catch((error) => console.warn('[ads] failed to remove AdMob listener', error));
      }
    };

    const settle = (watched) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(watched);
    };

    handles.push(AdMob.addListener(RewardAdPluginEvents.Rewarded, () => {
      earnedReward = true;
      settle(true);
    }));
    handles.push(AdMob.addListener(RewardAdPluginEvents.Dismissed, () => {
      settle(earnedReward);
    }));
    handles.push(AdMob.addListener(RewardAdPluginEvents.FailedToShow, (error) => {
      console.warn(`[ads] rewarded ad failed to show for ${reason}`, error);
      settle(false);
    }));

    AdMob.showRewardVideoAd()
      .then(() => {
        earnedReward = true;
        settle(true);
      })
      .catch((error) => {
        console.warn(`[ads] rewarded ad show failed for ${reason}`, error);
        settle(false);
      });
  });
}

function ensureAdMobInitialized() {
  if (!initPromise) {
    initPromise = AdMob.initialize({
      initializeForTesting: USE_TEST_ADS,
      maxAdContentRating: MaxAdContentRating.Teen,
    }).catch((error) => {
      initPromise = null;
      throw error;
    });
  }
  return initPromise;
}

function canUseNativeAdMob() {
  return MODE === 'admob' && isNativePlatform();
}

function isNativePlatform() {
  if (typeof Capacitor.isNativePlatform === 'function') {
    return Capacitor.isNativePlatform();
  }
  return Capacitor.getPlatform() !== 'web';
}

function envString(name, fallback) {
  const value = import.meta.env?.[name];
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function envFlag(name, fallback) {
  const value = import.meta.env?.[name];
  if (typeof value !== 'string' || !value.trim()) return fallback;
  return !['0', 'false', 'no', 'off'].includes(value.trim().toLowerCase());
}
