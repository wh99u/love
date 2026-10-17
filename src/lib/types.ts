export type BankCode = 'alfa' | 'sber' | 'vtb' | 'tbank' | 'ozon';

export const BANK_CODES: BankCode[] = ['tbank', 'sber', 'alfa', 'vtb', 'ozon'];
export const BANK_NAMES: Record<BankCode, string> = {
  alfa: 'Альфа-Банк',
  sber: 'Сбербанк',
  vtb: 'ВТБ',
  tbank: 'Т-Банк',
  ozon: 'Озон Банк',
};

/** Every synced record carries an id and a modification time; deletes are tombstones. */
export interface Rec {
  id: string;
  updatedAt: number;
  deleted?: true;
}

export interface Bank extends Rec {
  code: BankCode;
  sum: number;
  order: number;
}

export interface Income extends Rec {
  date: string;
  amount: number;
  bankId: string;
  source: 'manual' | 'shortcut';
  note?: string;
}

export interface Car {
  name: string;
  price: number;
  date: string;
  color: string;
  imgId?: string;
  updatedAt: number;
}

export interface Buy extends Rec {
  title: string;
  url: string;
  price: number;
  imgId?: string;
  tint?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  limit: number;
}

export interface BudgetMonth extends Rec {
  ym: string;
  income: number;
  cats: Category[];
}

export interface Spend extends Rec {
  ym: string;
  catId: string;
  amount: number;
  date: string;
  note?: string;
}

export interface Shift extends Rec {
  date: string;
  type: 'd' | 'n';
  pay: number;
  h: number;
}

export interface Task extends Rec {
  title: string;
  desc: string;
  due: string;
  done: boolean;
}

export interface Settings {
  botLink: string;
  lastTopUpBankId?: string;
}

export interface StateV4 {
  v: 4;
  shared: {
    banks: Bank[];
    incomes: Income[];
    car: Car;
    buys: Buy[];
    budgets: BudgetMonth[];
    spends: Spend[];
  };
  personal: {
    shifts: Shift[];
    tasks: Task[];
    plan: number;
    settings: Settings;
    processedLaunches: string[];
  };
}
