import { actions } from '../../lib/appStore';
import { launchKey, parseJoinParam, parseStartParam } from '../../lib/startParam';
import { clearLaunch, getLaunch } from '../../lib/telegram';
import { openTopUp } from '../budget/TopUpSheet';

/**
 * Called once on start: a `?startapp=inc_…` link from the iOS shortcut opens a
 * prefilled top-up, `startapp=join_…` is an invite into a shared plan. Each launch
 * is honoured once, so reloads never double it.
 */
export function handleLaunch(onJoin?: (space: string) => void) {
  const { param, authDate } = getLaunch();
  const join = parseJoinParam(param);
  if (join && param) {
    clearLaunch();
    if (actions.markLaunch(launchKey(authDate, param))) onJoin?.(join.space);
    return;
  }
  const inc = parseStartParam(param);
  if (!inc || !param) return;
  clearLaunch();
  if (!actions.markLaunch(launchKey(authDate, param))) return;
  // one card: the bank in the link no longer matters, the card is created on confirm if missing
  openTopUp(inc.amount, 'shortcut');
}
