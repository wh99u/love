import { actions, appStore } from '../../lib/appStore';
import { visible } from '../../lib/records';
import { launchKey, parseStartParam } from '../../lib/startParam';
import { getLaunch } from '../../lib/telegram';
import { toast } from '../../ui/Toast';
import { openBankForm } from '../budget/BankForm';
import { openTopUp } from '../budget/TopUpSheet';

/**
 * Called once on start: a `startapp=inc_…` link from the iOS shortcut opens a
 * prefilled top-up. Each launch is honoured once, so reloads never double it.
 */
export function handleLaunch() {
  const { param, authDate } = getLaunch();
  const inc = parseStartParam(param);
  if (!inc || !param) return;

  const s = appStore.get();
  const banks = visible(s.shared.banks).sort((a, b) => a.order - b.order);
  if (!banks.length) {
    toast('Сначала добавьте карту, потом зачислим пополнение');
    openBankForm();
    return;
  }
  if (!actions.markLaunch(launchKey(authDate, param))) return;

  const bank =
    (inc.bank && banks.find((b) => b.code === inc.bank)) || banks.find((b) => b.id === s.personal.settings.lastTopUpBankId) || banks[0];
  openTopUp(bank.id, inc.amount, 'shortcut');
}
