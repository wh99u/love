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
  /** last four digits shown on the home screen */
  last4?: string;
  /** picture of the card (IndexedDB, synced) */
  imgId?: string;
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
  /** picked from the car list; absent for names typed by hand */
  make?: string;
  model?: string;
  price: number;
  date: string;
  /** colour of the old drawing, kept for older data */
  color: string;
  imgId?: string;
  /** name the photo was found for; absent means the photo is the user's own */
  photoFor?: string;
  /** link to the found photo when the browser could not keep a copy */
  photoUrl?: string;
  updatedAt: number;
}

export interface Buy extends Rec {
  title: string;
  url: string;
  price: number;
  imgId?: string;
  /** Picture shipped with the app (catalog items), relative to the site root. */
  src?: string;
  tint?: string;
  listId?: string;
}

/** A tab on the purchases screen: «Одежда», «Дом»… */
export interface BuyList extends Rec {
  name: string;
  order: number;
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

export type Currency = 'rub' | 'usd';

export interface Settings {
  /** Telegram bot link from the mini-app days; unused on the website. */
  botLink: string;
  lastTopUpBankId?: string;
  /** Name the partner sees in the shared plan. */
  name?: string;
  /** Currency of the totals on the home screen. */
  currency?: Currency;
  /** Own picture behind the glass on the home screen (IndexedDB). */
  heroImgId?: string;
}

export interface StateV4 {
  v: 4;
  shared: {
    banks: Bank[];
    incomes: Income[];
    car: Car;
    buys: Buy[];
    buyLists: BuyList[];
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
