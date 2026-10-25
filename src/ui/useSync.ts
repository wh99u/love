import { useSyncExternalStore } from 'react';
import { sync } from '../lib/sync/controller';

export const useSync = () => useSyncExternalStore(sync.subscribe, sync.get);
