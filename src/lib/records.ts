import type { Rec } from './types';

/** Records the UI should show: tombstoned ones are kept only for future sync. */
export const visible = <T extends Rec>(list: T[]): T[] => list.filter((x) => !x.deleted);
