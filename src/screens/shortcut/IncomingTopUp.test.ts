import { beforeEach, describe, expect, test, vi } from 'vitest';

const launch = { param: 'inc_5000_sber' as string | null, authDate: '1760000000' as string | null };
vi.mock('../../lib/telegram', () => ({ getLaunch: () => launch, haptic: () => {} }));
vi.mock('../budget/TopUpSheet', () => ({ openTopUp: vi.fn() }));
vi.mock('../budget/BankForm', () => ({ openBankForm: vi.fn() }));
vi.mock('../../ui/Toast', () => ({ toast: vi.fn() }));

const { actions, appStore } = await import('../../lib/appStore');
const { openTopUp } = await import('../budget/TopUpSheet');
const { openBankForm } = await import('../budget/BankForm');
const { handleLaunch } = await import('./IncomingTopUp');

describe('handleLaunch', () => {
  beforeEach(() => {
    vi.mocked(openTopUp).mockClear();
    vi.mocked(openBankForm).mockClear();
    for (const b of appStore.get().shared.banks) actions.deleteBank(b.id);
    launch.param = 'inc_5000_sber';
    launch.authDate = String(Math.random());
  });

  test('opens a prefilled top-up on the matching bank', () => {
    actions.addBank('tbank', 100);
    const sber = actions.addBank('sber', 200);
    handleLaunch();
    expect(openTopUp).toHaveBeenCalledWith(sber.id, 5000, 'shortcut');
  });

  test('the same launch never tops up twice', () => {
    actions.addBank('sber', 200);
    handleLaunch();
    handleLaunch();
    expect(openTopUp).toHaveBeenCalledTimes(1);
  });

  test('unknown bank falls back to the last used card, then the first', () => {
    const a = actions.addBank('tbank', 1);
    const b = actions.addBank('vtb', 1);
    actions.setSettings({ lastTopUpBankId: b.id });
    launch.param = 'inc_700';
    handleLaunch();
    expect(openTopUp).toHaveBeenLastCalledWith(b.id, 700, 'shortcut');
    actions.setSettings({ lastTopUpBankId: undefined });
    launch.authDate = 'other';
    handleLaunch();
    expect(openTopUp).toHaveBeenLastCalledWith(a.id, 700, 'shortcut');
  });

  test('no cards asks to add one and keeps the launch for later', () => {
    handleLaunch();
    expect(openTopUp).not.toHaveBeenCalled();
    expect(openBankForm).toHaveBeenCalled();
    actions.addBank('sber', 0);
    handleLaunch();
    expect(openTopUp).toHaveBeenCalledTimes(1);
  });

  test('ignores launches without a top-up', () => {
    actions.addBank('sber', 0);
    launch.param = null;
    handleLaunch();
    launch.param = 'inc_0';
    handleLaunch();
    expect(openTopUp).not.toHaveBeenCalled();
  });

  test('an invite link asks to join once', () => {
    const onJoin = vi.fn();
    launch.param = 'join_Ab3dEf7hJk2mNp4qRs5t';
    handleLaunch(onJoin);
    handleLaunch(onJoin);
    expect(onJoin).toHaveBeenCalledTimes(1);
    expect(onJoin).toHaveBeenCalledWith('Ab3dEf7hJk2mNp4qRs5t');
    expect(openTopUp).not.toHaveBeenCalled();
  });
});
