import { defaultCar, emptyState } from './defaults';
import { BANK_CODES, type Bank, type BankCode, type Buy, type Shift, type StateV4, type Task } from './types';

type Raw = Record<string, unknown>;

const obj = (x: unknown): Raw | null => (x && typeof x === 'object' && !Array.isArray(x) ? (x as Raw) : null);
const list = (x: unknown): Raw[] => (Array.isArray(x) ? x.map(obj).filter((r): r is Raw => r !== null) : []);
const num = (x: unknown) => Number(x) || 0;
const str = (x: unknown) => (typeof x === 'string' ? x : x == null ? '' : String(x));

/** Same rules as `code()` in legacy/index.html. */
export function bankCodeFromLegacy(b: { code?: unknown; name?: unknown }): BankCode {
  if (BANK_CODES.includes(b.code as BankCode)) return b.code as BankCode;
  const name = str(b.name);
  if (/альф/i.test(name)) return 'alfa';
  if (/сбер/i.test(name)) return 'sber';
  if (/втб/i.test(name)) return 'vtb';
  if (/озон|ozon/i.test(name)) return 'ozon';
  return 'tbank';
}

/** planner_v3 → v4. Pure: never touches the input, never throws on junk. */
export function migrateV3(raw: unknown, now: number): StateV4 {
  const s = emptyState(now);
  const r = obj(raw);
  if (!r) return s;

  s.shared.banks = list(r.banks)
    .filter((b) => b.id != null)
    .map((b, i): Bank => ({ id: str(b.id), code: bankCodeFromLegacy(b), sum: num(b.sum), order: i, updatedAt: now }));

  const car = obj(r.car);
  if (car) {
    const d = defaultCar(now);
    s.shared.car = {
      name: str(car.name) || d.name,
      price: num(car.price),
      date: str(car.date),
      color: str(car.color) || d.color,
      updatedAt: now,
    };
  }

  s.shared.buys = list(r.buys)
    .filter((b) => b.id != null && str(b.title))
    .map((b): Buy => ({ id: str(b.id), title: str(b.title), url: str(b.url), price: num(b.price), updatedAt: now }));

  s.personal.shifts = list(r.shifts)
    .filter((x) => x.id != null && /^\d{4}-\d{2}-\d{2}$/.test(str(x.date)))
    .map((x): Shift => ({ id: str(x.id), date: str(x.date), type: x.type === 'd' ? 'd' : 'n', pay: num(x.pay), h: num(x.h), updatedAt: now }));

  s.personal.tasks = list(r.tasks)
    .filter((t) => t.id != null && str(t.title))
    .map((t): Task => ({ id: str(t.id), title: str(t.title), desc: str(t.desc), due: str(t.due), done: t.done === true, updatedAt: now }));

  if (r.plan != null) s.personal.plan = num(r.plan);
  return s;
}
