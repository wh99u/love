import { rub } from '../../lib/money';
import { BANK_NAMES, type Bank } from '../../lib/types';

/** Brand colours of the cards, matte. */
export const BANK_THEME: Record<Bank['code'], { bg: string; ink: string; dot: string }> = {
  tbank: { bg: 'linear-gradient(140deg,#2c2c30 0%,#141416 60%,#0c0c0d 100%)', ink: '#ffdd2d', dot: '#ffdd2d' },
  sber: { bg: 'linear-gradient(140deg,#21a453 0%,#11793a 60%,#0a4f25 100%)', ink: '#ffffff', dot: '#30c463' },
  alfa: { bg: 'linear-gradient(140deg,#f2333f 0%,#b8141f 60%,#6e0a10 100%)', ink: '#ffffff', dot: '#ff3b47' },
  vtb: { bg: 'linear-gradient(140deg,#2f63e6 0%,#1a3fae 60%,#0d2566 100%)', ink: '#ffffff', dot: '#4d7dff' },
  ozon: { bg: 'linear-gradient(140deg,#2f7dff 0%,#4436e0 60%,#2a1a96 100%)', ink: '#ffffff', dot: '#5a6bff' },
};

export function BankCard({ bank }: { bank: Bank }) {
  const t = BANK_THEME[bank.code];
  return (
    <div className="bank-card" style={{ background: t.bg, color: t.ink }}>
      <div className="bank-card-top">
        <b>{BANK_NAMES[bank.code]}</b>
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
          <path d="M8.5 8.5a5 5 0 0 1 0 7M12 6a8.5 8.5 0 0 1 0 12M15.5 3.5a12 12 0 0 1 0 17" />
        </svg>
      </div>
      <span className="bank-card-chip" />
      <div className="bank-card-sum money">{rub(bank.sum)}</div>
    </div>
  );
}
