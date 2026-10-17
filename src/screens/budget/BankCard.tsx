import { rub } from '../../lib/money';
import { BANK_NAMES, type Bank } from '../../lib/types';

/** Brand colours for cards and the ambient light behind them. */
export const BANK_THEME: Record<Bank['code'], { bg: string; ink: string; glow: [string, string, string] }> = {
  tbank: { bg: 'linear-gradient(135deg,#3a3a3f 0%,#141416 55%,#0b0b0c 100%)', ink: '#ffdd2d', glow: ['#3a3214', '#26262c', '#1a1a1f'] },
  sber: { bg: 'linear-gradient(135deg,#3fd06b 0%,#13853a 55%,#0b5226 100%)', ink: '#ffffff', glow: ['#0f3d22', '#123326', '#1a2a1f'] },
  alfa: { bg: 'linear-gradient(135deg,#ff5a4a 0%,#c81e12 55%,#7a0e08 100%)', ink: '#ffffff', glow: ['#4a1410', '#33151a', '#2a1a1a'] },
  vtb: { bg: 'linear-gradient(135deg,#3f78ff 0%,#1a46c9 55%,#0b2a7a 100%)', ink: '#ffffff', glow: ['#13285a', '#162040', '#1a1f2e'] },
  ozon: { bg: 'linear-gradient(135deg,#2b8cff 0%,#4a3df0 55%,#3a1aa8 100%)', ink: '#ffffff', glow: ['#1a2a5a', '#2a1a52', '#1a1f33'] },
};

export function BankCard({ bank }: { bank: Bank }) {
  const t = BANK_THEME[bank.code];
  return (
    <div className="bank-card" style={{ background: t.bg, color: t.ink }}>
      <span className="bank-card-stripe" />
      <span className="bank-card-sheen" />
      <div className="bank-card-top">
        <b>{BANK_NAMES[bank.code]}</b>
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
          <path d="M8.5 8.5a5 5 0 0 1 0 7M12 6a8.5 8.5 0 0 1 0 12M15.5 3.5a12 12 0 0 1 0 17" />
        </svg>
      </div>
      <div className="bank-card-sum money">{rub(bank.sum)}</div>
    </div>
  );
}
