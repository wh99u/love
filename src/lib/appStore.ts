import { useSyncExternalStore } from 'react';
import { demoState } from './demo';
import { createStore } from './store';
import type { StateV4 } from './types';

export const isDemo = typeof location !== 'undefined' && new URLSearchParams(location.search).get('demo') === '1';

export const appStore = isDemo
  ? createStore(localStorage, 'planner_demo', { seed: () => demoState() })
  : createStore(localStorage, 'planner_v4', { legacyKey: 'planner_v3' });

export const actions = appStore.actions;

/** Subscribe to the whole state (stable reference until it changes) and derive in render. */
export function useStore<T>(sel: (s: StateV4) => T): T {
  return sel(useSyncExternalStore(appStore.subscribe, appStore.get));
}
