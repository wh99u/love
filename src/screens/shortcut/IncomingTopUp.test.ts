import { beforeEach, describe, expect, test, vi } from 'vitest';

const launch = { param: 'inc_5000_sber' as string | null, authDate: '1760000000' as string | null };
vi.mock('../../lib/telegram', () => ({ getLaunch: () => launch, clearLaunch: () => {}, haptic: () => {} }));
vi.mock('../budget/TopUpSheet', () => ({ openTopUp: vi.fn() }));

const { openTopUp } = await import('../budget/TopUpSheet');
const { handleLaunch } = await import('./IncomingTopUp');

describe('handleLaunch', () => {
  beforeEach(() => {
    vi.mocked(openTopUp).mockClear();
    launch.param = 'inc_5000_sber';
    launch.authDate = String(Math.random());
  });

  test('opens a prefilled top-up of the card', () => {
    handleLaunch();
    expect(openTopUp).toHaveBeenCalledWith(5000, 'shortcut');
  });

  test('the same launch never tops up twice', () => {
    handleLaunch();
    handleLaunch();
    expect(openTopUp).toHaveBeenCalledTimes(1);
  });

  test('ignores launches without a top-up', () => {
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
