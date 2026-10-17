# «Мой план» — редизайн, план реализации

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Переписать мини-приложение на React с дизайном «жидкое стекло», экраном бюджета как у Т-Банка, планировщиком и пополнениями через «Быструю команду», сохранив данные пользователя.

**Architecture:** Чистая логика в `src/lib/*` (без React, под тестами Vitest), единое хранилище с `useSyncExternalStore`, UI-кит в `src/ui/*`, экраны в `src/screens/*`. Сборка Vite → статика → GitHub Pages через Actions.

**Tech Stack:** React 19.3, Motion 14.3 (`motion/react`), Vite 8.3, @vitejs/plugin-react 6.1, TypeScript 7.0, Vitest 5.0, jsdom 30, fake-indexeddb 6.2.

**Spec:** `docs/superpowers/specs/2026-10-17-planner-redesign-design.md`

## Global Constraints

- Node: `D:\Claude\tools\nodejs` (в PATH). Все команды — из `D:\Claude\TG app`.
- Новых зависимостей сверх списка в Tech Stack не добавлять. Типы Telegram — свои минимальные в `src/lib/telegram.ts`.
- Ключи хранения: `planner_v4` (рабочий), `planner_v3` (только чтение, никогда не писать и не удалять), `planner_demo` (режим `?demo=1`). IndexedDB: база `planner-images`, хранилище `images`.
- Формат денег: `rub(5000) === '5\u00a0000\u00a0₽'` (группы и знак через U+00A0).
- Даты — локальные ключи `YYYY-MM-DD`, месяцы `YYYY-MM`; никогда не `toISOString()` для ключей.
- Пружины: `snappy {stiffness:520,damping:38}`, `soft {260,30}`, `bouncy {380,22}` — в `src/ui/motion.ts`.
- Токены цветов из спеки §6.1: `#FFDD2D`, `#30D158`, `#FF453A`, `#8AB4FF`, `#6E4BFF`; радиусы 36/28/20/999.
- Весь текст интерфейса — по-русски. Суммы — `tabular-nums`.
- `prefers-reduced-motion: reduce` → `MotionConfig reducedMotion="user"` + CSS без сдвигов.
- Не больше ~8 слоёв `backdrop-filter` в кадре.
- UI-задачи выполняются с подключёнными скиллами `frontend-design:frontend-design` и `vercel-react-best-practices`.
- Визуальная проверка: встроенный браузер, вьюпорт 390×844, адрес `http://localhost:5173/?demo=1`.

## Review Focus

1. Старые данные v3 с пропусками (нет `car`, у карты `name` без `code`, смена без `h`, задача без `desc`) — миграция не падает, подставляет значения по умолчанию. → тест в Task 3.
2. Повторное открытие той же ссылки `startapp` или перезагрузка — пополнение не задваивается. → тест в Task 5.
3. 0 или 1 карта, удаление последней/активной карты — индекс зажат в границы, карман не пустеет. → тест `clampIndex` в Task 9.
4. Огромные суммы и длинные названия (1 000 000 000 ₽, название из 40 символов) — шрифт баланса уменьшается, названия обрезаются в 2 строки. → тест `balanceFontSize` в Task 9.
5. Границы месяцев: последний день месяца даёт `daysLeft = 1`, февраль високосного года, ключи дат по местному времени. → тесты в Task 2.

---

### Task 1: Каркас проекта

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/vite-env.d.ts`, `src/styles/tokens.css`, `src/styles/base.css`, `src/ui/motion.ts`, `src/smoke.test.ts`, `.claude/launch.json`

**Interfaces:**
- Produces: скрипты `npm run dev` (порт 5173), `npm test` (= `vitest run`), `npm run build` (= `tsc -b && vite build`); `springs` из `src/ui/motion.ts`.

- [ ] **Step 1:** `npm init -y`, установить зависимости точных мажорных версий из Tech Stack (`react react-dom motion`; dev: `vite @vitejs/plugin-react typescript vitest jsdom fake-indexeddb @types/react @types/react-dom`).
- [ ] **Step 2:** `vite.config.ts`: `base: './'`, плагин react, `test: { environment: 'jsdom' }` (через `vitest/config`). `tsconfig.json`: `strict`, `jsx: react-jsx`, `moduleResolution: bundler`, `noEmit`.
- [ ] **Step 3:** `index.html` — `<meta viewport ... viewport-fit=cover, user-scalable=no>`, `theme-color #000`, `<script src="https://telegram.org/js/telegram-web-app.js">` до модуля, `<div id="root">`. `tokens.css` — CSS-переменные из спеки §6.1; `base.css` — сброс, `body{background:#000;color:#fff}`, системный шрифт, `#root` max-width 430px по центру, на ≥600px рамка 390×844 как в legacy.
- [ ] **Step 4:** `src/smoke.test.ts`: `expect(springs.snappy).toEqual({type:'spring',stiffness:520,damping:38})`. Запустить `npm test` → PASS.
- [ ] **Step 5:** `.claude/launch.json` с конфигурацией `dev` (`npm run dev`, порт 5173). `npm run build` → без ошибок.
- [ ] **Step 6:** Commit `chore: каркас Vite + React + Motion`.

### Task 2: Деньги и даты (`money.ts`)

**Files:**
- Create: `src/lib/types.ts` (типы из спеки §5.1 дословно + `BANK_CODES`, `BANK_NAMES`), `src/lib/dates.ts`, `src/lib/money.ts`, `src/lib/money.test.ts`, `src/lib/dates.test.ts`

**Interfaces:**
- Produces:
  - `dates.ts`: `dayKey(d: Date): string`, `ymKey(d: Date): string`, `addMonths(ym: string, n: number): string`, `daysInMonth(ym: string): number`, `daysLeftInMonth(today: Date): number` (включая сегодня), `fmtDay(key: string, long?: boolean): string`, `fmtMonth(ym: string): string` («октябрь 2026»).
  - `money.ts`: `rub(n: number): string`, `kf(n: number): string` (как legacy: `1500 → '1.5к'`), `monthAccruals(shifts: Shift[], ym: string): number`, `budgetSummary(month: BudgetMonth | undefined, spends: Spend[], today: Date): BudgetSummary`, `dreamProgress(car: Car, saved: number, shifts: Shift[], today: Date): DreamProgress`.
  - `interface BudgetSummary { income: number; allocated: number; free: number; spent: number; left: number; perDay: number | null; daysLeft: number | null; cats: { cat: Category; spent: number; pct: number; over: boolean }[] }`
  - `interface DreamProgress { price: number; saved: number; left: number; pct: number; daysToDeadline: number | null; perDay: number | null; perWeek: number | null; perMonth: number | null; forecastYm: string | null; milestones: boolean[] }`

- [ ] **Step 1: Тесты дат** (`dates.test.ts`):

```ts
expect(dayKey(new Date(2026, 0, 5))).toBe('2026-01-05');
expect(daysInMonth('2028-02')).toBe(29);
expect(daysInMonth('2026-02')).toBe(28);
expect(daysLeftInMonth(new Date(2026, 9, 31))).toBe(1);
expect(daysLeftInMonth(new Date(2026, 9, 17))).toBe(15);
expect(addMonths('2026-12', 1)).toBe('2027-01');
expect(addMonths('2026-01', -1)).toBe('2025-12');
```

- [ ] **Step 2: Тесты денег** (`money.test.ts`):

```ts
expect(rub(5000)).toBe('5\u00a0000\u00a0₽');
expect(rub(-1200.6)).toBe('-1\u00a0201\u00a0₽');
expect(kf(1500)).toBe('1.5к'); expect(kf(2000)).toBe('2к'); expect(kf(800)).toBe('800');

const cats = [{ id:'a', name:'Еда', icon:'food', color:'#30D158', limit:10000 },
              { id:'b', name:'Транспорт', icon:'bus', color:'#0A84FF', limit:5000 }];
const month = { id:'2026-10', ym:'2026-10', income:20000, cats, updatedAt:0 };
const spends = [{ id:'1', ym:'2026-10', catId:'a', amount:12000, date:'2026-10-02', updatedAt:0 },
                { id:'2', ym:'2026-10', catId:'b', amount:1000, date:'2026-10-03', updatedAt:0 },
                { id:'3', ym:'2026-09', catId:'a', amount:999, date:'2026-09-03', updatedAt:0 }];
const s = budgetSummary(month, spends, new Date(2026, 9, 17));
expect(s).toMatchObject({ income:20000, allocated:15000, free:5000, spent:13000, left:2000, daysLeft:15 });
expect(s.perDay).toBeCloseTo(2000/15);
expect(s.cats[0]).toMatchObject({ spent:12000, over:true });
expect(budgetSummary(month, spends, new Date(2026, 10, 1)).perDay).toBeNull(); // не текущий месяц
expect(budgetSummary(undefined, [], new Date()).allocated).toBe(0);

const car = { name:'Porsche Panamera', price:100000, date:'2026-11-16', color:'#1c1c1e', updatedAt:0 };
const shifts = [{ id:'s', date:'2026-10-10', type:'d', pay:15000, h:12, updatedAt:0 }];
const d = dreamProgress(car, 40000, shifts, new Date(2026, 9, 17));
expect(d).toMatchObject({ left:60000, pct:40, daysToDeadline:30, milestones:[true,false,false,false] });
expect(d.perDay).toBe(2000);
expect(d.forecastYm).toBe('2027-02'); // 15000 за 30 дн → 500/день → 120 дней → 14.02.2027
expect(dreamProgress({ ...car, price:0 }, 1, [], new Date()).pct).toBe(0);
```

- [ ] **Step 3:** `npm test` → FAIL (модулей нет).
- [ ] **Step 4:** Реализовать `dates.ts` и `money.ts`. `rub`: `Math.round`, `toLocaleString('ru-RU')`, все пробельные символы → `\u00a0`, суффикс `\u00a0₽`. `perDay = max(0,left)/daysLeft` только если `month.ym === ymKey(today)`. `dreamProgress`: доход за 30 дней — смены с `date >= dayKey(today − 30 дн.)`; прогноз = сегодня + `ceil(left / (income30/30))` дней → `ymKey`, `null` при нулевом доходе или `left <= 0`; `perWeek = perDay*7`, `perMonth = perDay*30`; `pct` в 0..100.
- [ ] **Step 5:** `npm test` → PASS. Commit `feat: расчёты бюджета, мечты и форматирование`.

### Task 3: Миграция v3 → v4

**Files:**
- Create: `src/lib/ids.ts`, `src/lib/migrate.ts`, `src/lib/migrate.test.ts`, `src/lib/defaults.ts`

**Interfaces:**
- Consumes: `types.ts`.
- Produces: `uid(): string`; `emptyState(): StateV4` (машина по умолчанию `{ name:'Porsche Panamera', price:0, date:'', color:'#1c1c1e' }`, `plan: 15`, `settings: { botLink: '' }`); `migrateV3(raw: unknown, now: number): StateV4`; `bankCodeFromLegacy(b: { code?: string; name?: string }): BankCode` (правила legacy `code()`).

- [ ] **Step 1: Тест** — фикстура в форме реального `planner_v3`:

```ts
const v3 = { banks:[{id:1,code:'sber',sum:5000},{id:2,name:'Альфа-Банк',sum:100}],
  car:{name:'BMW M5',price:9000000,date:'2027-05-01',color:'#1f4fbf',img:''},
  buys:[{id:3,title:'Стол',url:'',price:12000}],
  shifts:[{id:4,date:'2026-10-01',type:'d',pay:4500,h:12},{id:5,date:'2026-10-02',type:'n',pay:5000}],
  tasks:[{id:6,title:'Позвонить',due:'2026-10-03',done:false}], plan:12 };
const s = migrateV3(v3, 1000);
expect(s.v).toBe(4);
expect(s.shared.banks.map(b => [b.id, b.code, b.sum, b.order])).toEqual([['1','sber',5000,0],['2','alfa',100,1]]);
expect(s.shared.car).toMatchObject({ name:'BMW M5', price:9000000, color:'#1f4fbf', updatedAt:1000 });
expect(s.personal.shifts[1].h).toBe(0);
expect(s.personal.tasks[0].desc).toBe('');
expect(s.personal.plan).toBe(12);
expect(s.shared.incomes).toEqual([]); expect(s.shared.budgets).toEqual([]);
// Review Focus 1: мусор не роняет миграцию
expect(migrateV3({ banks:'x', car:null, shifts:[{}] }, 1).personal.shifts).toEqual([]);
expect(migrateV3(null, 1)).toMatchObject({ v:4, shared:{ banks:[], buys:[], car:{ name:'Porsche Panamera', price:0 } }, personal:{ shifts:[], tasks:[], plan:15 } });
```

- [ ] **Step 2:** `npm test src/lib/migrate.test.ts` → FAIL.
- [ ] **Step 3:** Реализовать: записи без обязательных полей (`date` у смены, `title` у покупки/задачи) отбрасываются; числа через `Number(x) || 0`; `id` → `String`.
- [ ] **Step 4:** PASS. Commit `feat: перенос данных из planner_v3`.

### Task 4: Хранилище

**Files:**
- Create: `src/lib/store.ts`, `src/lib/store.test.ts`, `src/lib/demo.ts`

**Interfaces:**
- Consumes: `migrateV3`, `emptyState`, `uid`, типы.
- Produces:
  - `createStore(storage: Storage, key: string, opts?: { legacyKey?: string; seed?: () => StateV4 }): Store`
  - `interface Store { get(): StateV4; subscribe(fn: () => void): () => void; flush(): void; onError(fn: (e: 'save' | 'load') => void): () => void; actions: Actions }`
  - `Actions`: `addBank(code, sum)`, `updateBank(id, patch)`, `deleteBank(id)`, `topUp(bankId, amount, source, note?): Income`, `transfer(fromId, toId, amount): boolean`, `setCar(patch)`, `addBuy(b)`, `updateBuy(id, patch)`, `deleteBuy(id)`, `ensureBudget(ym): BudgetMonth`, `updateBudget(ym, patch)`, `addCategory(ym, cat)`, `updateCategory(ym, catId, patch)`, `deleteCategory(ym, catId)`, `copyBudget(fromYm, toYm)`, `applyTemplate(ym)`, `addSpend(s)`, `deleteSpend(id)`, `addShift(s)`, `deleteShift(id)`, `addTask(t)`, `updateTask(id, patch)`, `toggleTask(id)`, `deleteTask(id)`, `setPlan(n)`, `setSettings(patch)`, `markLaunch(key): boolean` (false — уже был).
  - `visible<T extends Rec>(list: T[]): T[]`
  - Синглтон приложения `appStore` в `src/lib/appStore.ts`: `?demo=1` → `createStore(localStorage,'planner_demo',{ seed: demoState })`, иначе `createStore(localStorage,'planner_v4',{ legacyKey:'planner_v3' })`; хук `useStore<T>(sel: (s: StateV4) => T): T` и `actions = appStore.actions`.
  - `demoState(today = new Date()): StateV4` — 3 карты (Т-Банк 48 200, Сбер 12 400, Альфа 3 150), Panamera 12 500 000 ₽ к дате +1 год, 4 покупки (без фото), 8 смен текущего месяца (дневные и ночные), 5 задач с описаниями, бюджет текущего месяца из шаблона при доходе 90 000 и 6 трат.
- Шаблон `applyTemplate`: категории и доли от `income` — Жильё 30% `#FF9F0A` `home`, Еда 20% `#30D158` `food`, Транспорт 8% `#0A84FF` `bus`, Связь 3% `#64D2FF` `phone`, Развлечения 10% `#BF5AF2` `fun`, Здоровье 5% `#FF375F` `health`, Накопления на мечту 24% `#FFDD2D` `car`; лимиты округлены до 100 ₽.

- [ ] **Step 1: Тесты** (jsdom `localStorage`, `vi.useFakeTimers()`):
  - нет ключей → `get()` равен `emptyState()` по полям;
  - есть только `planner_v3` → данные мигрированы, `planner_v3` после `flush()` не изменён побайтно;
  - `topUp('1', 500, 'manual')` → баланс +500, в `incomes` запись с `source:'manual'`, `date` = сегодня;
  - `transfer` больше баланса → `false`, балансы не изменились; корректный → суммы сдвинулись;
  - `deleteBank(id)` → запись `deleted:true`, `visible(banks)` без неё;
  - `applyTemplate('2026-10')` при `income` 90000 → 7 категорий, сумма лимитов 90000;
  - `copyBudget('2026-09','2026-10')` копирует категории с новыми `id` трат не копирует;
  - `markLaunch('k')` → true, повтор → false, хранится не больше 50 ключей;
  - сохранение через 150 мс (`advanceTimersByTime(149)` — ещё нет, `(1)` — есть);
  - `setItem` бросает → подписчик `onError` получает `'save'`, `get()` остаётся новым состоянием.
- [ ] **Step 2:** FAIL → **Step 3:** реализация (неизменяемые обновления, `updatedAt = Date.now()` на изменённой записи, `visibilitychange: hidden` → `flush`) → **Step 4:** PASS.
- [ ] **Step 5:** Commit `feat: хранилище с миграцией и демо-режимом`.

### Task 5: Параметр запуска и «Быстрая команда»

**Files:**
- Create: `src/lib/startParam.ts`, `src/lib/startParam.test.ts`, `src/lib/shortcut.ts`, `src/lib/shortcut.test.ts`

**Interfaces:**
- Produces:
  - `parseStartParam(p: string | undefined | null): { kind: 'inc'; amount: number; bank?: BankCode } | null` — `^inc_(\d{1,8})(?:_(alfa|sber|vtb|tbank|ozon))?$`, сумма 1…10 000 000.
  - `launchKey(authDate: string | number | undefined, param: string): string` → `` `${authDate ?? 'na'}:${param}` ``.
  - `AMOUNT_PATTERN: string`, `SHORTCUT_PATTERN = '(?i)' + AMOUNT_PATTERN`, `extractAmount(text: string): number | null`, `shortcutUrl(botLink: string): string` (`https://t.me/x` → `https://t.me/x?startapp=inc_`; ссылка уже с `?` → `&startapp=inc_`; пустая → `''`).

- [ ] **Step 1: Тесты:**

```ts
expect(parseStartParam('inc_5000_tbank')).toEqual({ kind:'inc', amount:5000, bank:'tbank' });
expect(parseStartParam('inc_250')).toEqual({ kind:'inc', amount:250 });
for (const bad of ['inc_0','inc_10000001','inc_5000_bank','join_x','', undefined]) expect(parseStartParam(bad)).toBeNull();

const cases: [string, number | null][] = [
  ['Т-Банк Пополнение на 5 000 ₽', 5000],
  ['Перевод от Иван И. +12 500 ₽', 12500],
  ['Зачисление зарплаты 30 000,00 ₽', 30000],
  ['СЧЁТ2202 14:05 зачисление 4500р Баланс: 12 345.67р', 4500],
  ['Альфа-Банк Поступление 7 300,00 RUR на счет *1234', 7300],
  ['ВТБ Поступление 2500.00 RUB Счет *1234 Баланс 10000.00 RUB', 2500],
  ['Озон Банк Входящий перевод 1 200 ₽ от Петр П.', 1200],
  ['Покупка 350 ₽ Пятёрочка. Баланс 214 ₽', null],
];
for (const [t, v] of cases) expect(extractAmount(t)).toBe(v);
expect(shortcutUrl('https://t.me/my_bot')).toBe('https://t.me/my_bot?startapp=inc_');
expect(shortcutUrl('https://t.me/my_bot/app')).toBe('https://t.me/my_bot/app?startapp=inc_');
```

- [ ] **Step 2:** FAIL → **Step 3:** реализация. Выражение (одинаково валидно в JS с флагами `iu` и в ICU iOS):

```
(?:пополнение|зачисление|поступление|перевод от|входящий перевод|\+)[^\d+]{0,40}?\+?\s?(\d{1,3}(?:[\s\u00A0]\d{3})+|\d+)(?:[.,]\d{1,2})?\s?(?:₽|руб|rub|rur|р(?![а-яё]))
```

`extractAmount`: первая находка, группа 1 без пробелов → `Math.round(Number(...))`.
- [ ] **Step 4:** PASS. Commit `feat: разбор ссылки пополнения и суммы из уведомлений`.

### Task 6: Картинки и вырезание фона

**Files:**
- Create: `src/lib/images.ts`, `src/lib/images.test.ts`, `src/lib/cutout.ts`, `src/lib/cutout.test.ts`, `src/lib/cutoutBrowser.ts`

**Interfaces:**
- Produces:
  - `putImage(blob: Blob): Promise<string>`, `getImageUrl(id: string): Promise<string | null>` (кэш object URL), `deleteImage(id: string): Promise<void>`, `imagesAvailable(): Promise<boolean>`; хук `useImage(id?: string): string | null` в `src/ui/useImage.ts` (Task 8).
  - `removeFlatBackground(img: ImageData, tolerance = 32): { removed: boolean; tint: string }` — мутирует альфу; `trimTransparent(img: ImageData): ImageData`; `averageColor(img: ImageData): string` (`#rrggbb` по непрозрачным пикселям).
  - `cutoutFromBlob(blob: Blob, opts: { removeBg: boolean }): Promise<{ blob: Blob; tint: string; removed: boolean }>` и `loadImageBlob(url: string): Promise<Blob | null>` (`fetch` с `mode:'cors'`; ошибка → `null`).

- [ ] **Step 1: Тесты:** `images.test.ts` с `import 'fake-indexeddb/auto'` — put → get возвращает строку, delete → `null`. `cutout.test.ts` на синтетике 20×20: белый фон + красный квадрат 8×8 в центре → `removed:true`, угловой пиксель альфа 0, центр 255, `tint` = `#ff0000`; после `trimTransparent` размер 8×8 (±1 из-за сглаживания); пёстрая рамка (случайные цвета) → `removed:false`, альфа не тронута.
- [ ] **Step 2:** FAIL → **Step 3:** реализация. Алгоритм: медиана цветов рамки (1 пиксель по периметру); если ≥90% пикселей рамки ближе `40` к медиане — заливка BFS от всех пикселей рамки по соседям с расстоянием до медианы `< tolerance` (евклид RGB) → альфа 0; затем один проход сглаживания: непрозрачный пиксель, соседствующий с прозрачным, получает альфу 160. `cutoutFromBlob` — `createImageBitmap`, канвас ≤768px по большей стороне, `toBlob('image/webp', .9)` с откатом на `image/png`.
- [ ] **Step 4:** PASS. Commit `feat: хранение фото и вырезание однотонного фона`.

### Task 7: Telegram и наклон

**Files:**
- Create: `src/lib/telegram.ts`, `src/lib/tilt.ts`, `src/lib/tilt.test.ts`

**Interfaces:**
- Produces:
  - `initTelegram(): void` — `ready`, `expand`, `setHeaderColor('#000000')`, `setBackgroundColor('#000000')`, `setBottomBarColor('#000000')`, `disableVerticalSwipes()`, на `platform` `ios`/`android` — `requestFullscreen()`; копирует `safeAreaInset`/`contentSafeAreaInset` в CSS-переменные `--sat`, `--sab`, `--csat` (сумма верхних отступов также доступна как `--top-inset`) и обновляет по событиям `safeAreaChanged`, `contentSafeAreaChanged`, `fullscreenChanged`. Каждый вызов обёрнут в проверку версии/try.
  - `haptic(kind: 'light' | 'medium' | 'selection' | 'success' | 'warning' | 'error'): void`
  - `backButton: { show(cb: () => void): void; hide(): void }` (без Telegram — no-op; App показывает свою кнопку, если `!isTelegram`).
  - `isTelegram: boolean`, `getLaunch(): { param: string | null; authDate: string | null }` (`initDataUnsafe.start_param` / `auth_date`, иначе `URLSearchParams.get('tgWebAppStartParam')`), `getUser(): { firstName: string; photoUrl?: string }`, `openLink(url: string): void`.
  - `tiltFromOrientation(beta: number, gamma: number): { x: number; y: number }` — `gamma/0.6`, `(beta − 0.7)/0.6`, зажать в [−1,1]; `startTilt(): () => void` — `DeviceOrientation.start({ refresh_rate: 50 })`, пишет `--tilt-x/--tilt-y` на `document.documentElement`, останавливается при `visibilitychange: hidden` и в `reduced-motion`.

- [ ] **Step 1: Тест:** `tiltFromOrientation(0.7, 0)` → `{x:0,y:0}`; `(2, 1)` → `{x:1,y:1}`; `(0, -0.3)` → `{x:-0.5, y:-1}`.
- [ ] **Step 2:** FAIL → **Step 3:** реализация → **Step 4:** PASS. Commit `feat: обёртка Telegram WebApp и наклон для бликов`.

### Task 8: UI-кит и оболочка приложения

**Files:**
- Create: `src/styles/glass.css`, `src/ui/Glass.tsx`, `src/ui/Pressable.tsx`, `src/ui/Sheet.tsx`, `src/ui/AnimatedNumber.tsx`, `src/ui/Ring.tsx`, `src/ui/Donut.tsx`, `src/ui/ProgressLiquid.tsx`, `src/ui/Keypad.tsx`, `src/ui/keypad.ts`, `src/ui/keypad.test.ts`, `src/ui/Toast.tsx`, `src/ui/Icon.tsx`, `src/ui/Ambient.tsx`, `src/ui/TabBar.tsx`, `src/ui/Page.tsx`, `src/ui/useImage.ts`, `src/ui/sheets.tsx`
- Modify: `src/App.tsx`, `src/main.tsx`

**Interfaces:**
- Produces:
  - `<Glass as? radius? tint? className? style?>` — класс `.glass` (спека §6.2: blur 24 + saturate 180%, фон `rgba(255,255,255,.06)`, градиентная кромка через `::before` с маской, внутренние блики, `::after` — блик, позиция от `--tilt-x/--tilt-y`). В Chromium: `@supports (backdrop-filter: url(#x))` → преломление для `.glass--lens` через SVG-фильтр `#lens` (`feTurbulence` + `feDisplacementMap scale 18`), фильтр вставляется один раз в `App`.
  - `<Pressable onPress haptic?='light'>` — `motion.button`, `whileTap={{ scale: .96 }}`, вызывает `haptic`.
  - Шторки: `openSheet(render: (close: () => void) => ReactNode, opts?: { onClose?: () => void })`, `closeSheet()` в `sheets.tsx`; `<SheetHost/>` рендерит стек. `Sheet`: `drag="y"`, `dragConstraints={{ top: 0 }}`, закрытие при `offset.y > 25% высоты` или `velocity.y > 600`, подложка затемняется по прогрессу, `haptic('light')` при открытии.
  - `<AnimatedNumber value={number} format={rub} className />` — строка разбивается на символы; цифры — вертикальные ленты 0–9, сдвиг пружиной `soft`; нецифровые символы статичны.
  - `<Ring value={0..100} size color label/>`, `<Donut segments={{ value, color }[]} progress={{ value, color }[]} size thickness>{center}</Donut>`, `<ProgressLiquid value={0..100} color/>` (заполнение с «волной» — SVG-путь, анимируемый сдвиг фазы).
  - `keypadReduce(value: string, key: string): string` — клавиши `'0'..'9'`, `'000'`, `'⌫'`; без ведущих нулей; значение не больше 1 000 000 000 (нажатие, которое превысит, игнорируется). `<Keypad value onChange/>` — сетка 3×4 крупных стеклянных клавиш.
  - `toast(text: string, kind?: 'info' | 'success' | 'error')`, `<ToastHost/>`.
  - `<Icon name size/>` — набор SVG-путей: навигация (`wallet`, `car`, `bag`, `calendar`, `plus`), действия (`topup`, `transfer`, `pie`, `bolt`, `card`, `search`, `bell`, `chevron`, `back`, `copy`, `trash`, `edit`, `check`, `close`, `photo`, `link`), категории (`home`, `food`, `bus`, `phone`, `fun`, `health`, `car`, `gift`), смены (`sun` — круг + 8 лучей, `moon`), предметы (иконки из legacy `IC`, ключ по регулярке названия: `iconForTitle(title: string): string`).
  - `<Ambient colors={string[]}/>` — 3 размытых пятна (`filter: blur(60px)`, `opacity .35`), медленное плавание (CSS keyframes 18–26 с); смена цвета — переход 600 мс.
  - `<TabBar tab onChange onPlus/>` — стеклянная капсула, 4 вкладки (иконка + подпись 10px: Бюджет, Мечта, Покупки, Календарь) + белая «+» 58px справа; активная «капля» — `motion.div layoutId="tab-drop"` с пружиной `bouncy`.
  - `<Page title onBack>` — страница поверх вкладок: въезд справа (`x: '100%' → 0`, `snappy`), `backButton.show(onBack)` в эффекте.
  - `App`: состояние `tab: 'budget' | 'dream' | 'buys' | 'calendar'`, стек страниц `page: 'planner' | 'shortcut' | null`; переход вкладок — `AnimatePresence mode="popLayout"` с направлением по индексу (сдвиг ±24px, blur 6px→0); `MotionConfig reducedMotion="user"`; `initTelegram()`, `startTilt()`; `appStore.onError` → `toast('Не удалось сохранить', 'error')` / `toast('Старые данные не прочитались', 'error')`; обработка запуска — в Task 11.
- [ ] **Step 1: Тест `keypadReduce`:** `('', '0') → ''`, `('5','0') → '50'`, `('5','000') → '5000'`, `('123','⌫') → '12'`, `('', '⌫') → ''`, `('100000000','0') → '1000000000'`, `('999999999','9') → '999999999'`.
- [ ] **Step 2:** FAIL → **Step 3:** реализация кита и оболочки с заглушками экранов (заголовок вкладки) → **Step 4:** PASS.
- [ ] **Step 5: Визуальная проверка:** `preview_start dev`, 390×844, `?demo=1`: переключение 4 вкладок (капля перетекает, контент сдвигается), открыть/смахнуть тестовую шторку, стекло читаемо на фоне пятен, в консоли нет ошибок.
- [ ] **Step 6:** Commit `feat: UI-кит жидкого стекла и оболочка приложения`.

### Task 9: Экран бюджета — карман с картами

**Files:**
- Create: `src/screens/budget/BudgetScreen.tsx`, `src/screens/budget/budget.css`, `src/screens/budget/CardPocket.tsx`, `src/screens/budget/pocket.ts`, `src/screens/budget/pocket.test.ts`, `src/screens/budget/BankCard.tsx`, `src/screens/budget/ActionRow.tsx`, `src/screens/budget/OpsPanel.tsx`
- Modify: `src/App.tsx` (вкладка `budget`)

**Interfaces:**
- Consumes: `useStore`, `actions`, `rub`, `monthAccruals`, `budgetSummary`, `Glass`, `Pressable`, `AnimatedNumber`, `Ring`, `Ambient`, `Icon`, `getUser`, `haptic`.
- Produces (`pocket.ts`, чистые):
  - `cardPose(d: number): { x: number; y: number; scale: number; opacity: number; z: number }` — `d = i − pos`; `x = d * 0.78` (в ширинах карты), `y = −24 + min(|d|,1) * 42`, `scale = 1 − min(|d|,1) * 0.14`, `opacity = 1 − min(|d|,1) * 0.4`, `z = 100 − round(|d| * 10)`.
  - `snapTarget(current: number, dragCards: number, velocityX: number, count: number): number` — `+1` при `dragCards < −0.3 || velocityX < −400`, `−1` при `> 0.3 || > 400`, иначе 0; результат через `clampIndex`.
  - `rubberBand(pos: number, count: number): number` — за пределами `[0, count−1]` превышение умножается на 0.35.
  - `clampIndex(i: number, count: number): number` — `count === 0 → 0`.
  - `balanceFontSize(text: string): number` — длина ≤ 9 → 64, ≤ 12 → 52, иначе 42.
- Колбэк `onOpenPlanner`, `onOpenShortcut` — пропсы `BudgetScreen` от `App`.

- [ ] **Step 1: Тесты `pocket.test.ts`:**

```ts
expect(cardPose(0)).toEqual({ x:0, y:-24, scale:1, opacity:1, z:100 });
expect(cardPose(1)).toMatchObject({ x:0.78, y:18, scale:0.86, opacity:0.6 });
expect(cardPose(-2.5).x).toBeCloseTo(-1.95); expect(cardPose(-2.5).y).toBe(18);
expect(snapTarget(0, -0.4, 0, 3)).toBe(1); expect(snapTarget(0, -0.1, -500, 3)).toBe(1);
expect(snapTarget(2, -0.9, -900, 3)).toBe(2); expect(snapTarget(1, 0.1, 0, 3)).toBe(1);
expect(snapTarget(0, 0.5, 0, 3)).toBe(0);
expect(rubberBand(-1, 3)).toBeCloseTo(-0.35); expect(rubberBand(3, 3)).toBeCloseTo(2.35); expect(rubberBand(1.5, 3)).toBe(1.5);
expect(clampIndex(5, 2)).toBe(1); expect(clampIndex(0, 0)).toBe(0); expect(clampIndex(-1, 3)).toBe(0);
expect(balanceFontSize('214 ₽')).toBe(64); expect(balanceFontSize('1 000 000 000 ₽')).toBe(42);
```

- [ ] **Step 2:** FAIL → **Step 3:** реализация `pocket.ts` → PASS.
- [ ] **Step 4: `CardPocket`:** `useMotionValue(pos)`; карты абсолютны, позы через `useTransform(pos, p => cardPose(i − p))`; жест — `onPanStart/onPan/onPanEnd` на контейнере с `touch-action: pan-y`, `pos = rubberBand(start − offset.x / cardWidth)`; на `onPanEnd` — `animate(pos, snapTarget(...), springs.snappy)`; смена ближайшего индекса → `haptic('selection')` и колбэк `onIndex(i)`. Индекс хранится в компоненте (`useState`), при изменении числа карт — `clampIndex`. Ширина карты 58% контейнера, соотношение 1.586, радиус 22. Передний слой кармана — SVG на всю ширину высотой 92px: верхняя кромка с плавным U-вырезом по центру (глубина 22px, ширина выреза = ширина карты + 40px), заливка — градиент `#0b0b0c → #000`, обводка кромки `rgba(255,255,255,.14)` 1.5px. Видимая высота кармана с картой 150px. Нажатие на активную карту (без сдвига > 6px) → `openSheet(BankForm)` (Task 10).
- [ ] **Step 5: Экран** по спеке §7.1: `OpsPanel` (стекло, скругление снизу 36, раскрытие `height: auto` пружиной), строка профиля (аватар 52px, поле «Поиск» — `Glass` высотой 52 с иконкой, фиолетовая кнопка 52px с `pie`), точки (активная растягивается до 22px), пилюля банка (`AnimatePresence` при смене карты: снизу вверх), баланс `AnimatedNumber` с `balanceFontSize`, `CardPocket`, `ActionRow` (кнопки 64px, подписи 13px, горизонтальная прокрутка без полосы), карточки «Начисления» и «Бюджет на <месяц>» (`Ring` 44px). `Ambient` берёт цвета активной карты.
- [ ] **Step 6: Визуальная проверка** `?demo=1`: свайп карт мышью (медленно и быстро), упор на краях, пилюля и точки меняются, баланс перекатывается; удалить все карты в демо → «Добавьте карту»; экран сверить со скрином `docs/references/1-budget-tbank.webp`.
- [ ] **Step 7:** Commit `feat: экран бюджета с картами в кармане`.

### Task 10: Шторки бюджета и поиск

**Files:**
- Create: `src/screens/budget/BankForm.tsx`, `src/screens/budget/TopUpSheet.tsx`, `src/screens/budget/TransferSheet.tsx`, `src/screens/budget/AccrualsSheet.tsx`, `src/screens/budget/SearchSheet.tsx`, `src/lib/search.ts`, `src/lib/search.test.ts`, `src/ui/forms.css`

**Interfaces:**
- Consumes: `actions.addBank/updateBank/deleteBank/topUp/transfer`, `Keypad`, `openSheet`, `toast`.
- Produces:
  - `searchAll(s: StateV4, q: string): SearchHit[]`, `type SearchHit = { group: 'buys' | 'tasks' | 'incomes' | 'categories' | 'spends'; id: string; title: string; subtitle: string; ym?: string; date?: string }` — без учёта регистра, пустой/пробельный запрос → `[]`, удалённые не находятся, не больше 30 результатов.
  - `openTopUp(bankId?: string, amount?: number, source?: 'manual' | 'shortcut')` — используется в Task 11.
- [ ] **Step 1: Тест `searchAll`:** на `demoState()`: `'СТОЛ'` находит покупку «Стол»; запрос по описанию задачи находит задачу; `'  '` → `[]`; удалённая покупка не находится.
- [ ] **Step 2:** FAIL → **Step 3:** реализация → PASS.
- [ ] **Step 4: Шторки:** `BankForm` — выбор банка (горизонтальный ряд мини-карт, выбранная приподнята, как в legacy `pk`), баланс через `Keypad`, «Удалить карту» (подтверждение вторым нажатием). `TopUpSheet` — крупная сумма сверху (`AnimatedNumber`), выбор карты чипами, `Keypad`, кнопка «Зачислить» → `topUp`, `haptic('success')`, тост «+N ₽ на <банк>» с «Отменить» (5 с, отмена = `updateBank` обратно + `deleted` у дохода). `TransferSheet` — «с» и «на» чипами, сумма; больше баланса → кнопка неактивна и подсказка. `AccrualsSheet` — сегменты «Смены / Пополнения», группы по датам (`fmtDay(key, true)`), итог месяца. `SearchSheet` — поле с автофокусом, результаты по группам, нажатие → переход на вкладку/страницу.
- [ ] **Step 5: Визуальная проверка:** пополнить на 5 000 → баланс и общая сумма анимируются, запись в «Пополнениях»; перевод больше баланса блокируется; поиск «стол».
- [ ] **Step 6:** Commit `feat: пополнение, перевод, начисления и поиск`.

### Task 11: Автопополнение по ссылке и инструкция

**Files:**
- Create: `src/screens/shortcut/IncomingTopUp.ts`, `src/screens/shortcut/ShortcutGuidePage.tsx`, `src/screens/shortcut/shortcut.css`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `getLaunch`, `parseStartParam`, `launchKey`, `actions.markLaunch`, `openTopUp`, `SHORTCUT_PATTERN`, `shortcutUrl`, `actions.setSettings`, `Page`.
- Produces: `handleLaunch(): void` — вызывается один раз в `App` после первого рендера: валидный параметр и `markLaunch(key) === true` → `openTopUp(bankId, amount, 'shortcut')`, где карта = первая видимая с `code === bank` → `settings.lastTopUpBankId` → первая видимая; нет карт → тост «Сначала добавьте карту» и открыть `BankForm`.

- [ ] **Step 1: Тест** `src/screens/shortcut/IncomingTopUp.test.ts` с моками `getLaunch` и `openTopUp` (`vi.mock`): параметр `inc_5000_sber` при картах [tbank, sber] → `openTopUp('<id sber>', 5000, 'shortcut')`; второй вызов с тем же `authDate` → `openTopUp` не вызван.
- [ ] **Step 2:** FAIL → **Step 3:** реализация → PASS.
- [ ] **Step 4: `ShortcutGuidePage`:** шаги карточками с номерами: 1) Открыть «Команды» → «+» → назвать «Пополнение»; 2) «Сделать снимок экрана»; 3) «Извлечь текст из изображения»; 4) «Сопоставить текст» — выражение (кнопка «Скопировать» → `navigator.clipboard.writeText`, тост); 5) «Получить группу по индексу» 1; 6) «Заменить текст» `\D` на пусто (включить «Регулярное выражение»); 7) «Открыть URL» — `shortcutUrl(botLink)` + переменная из шага 6 (кнопка «Скопировать»); 8) Настройки → Универсальный доступ → Касание → Касание задней панели → Двойное касание → «Пополнение». Поле «Ссылка на бота» (`settings.botLink`, пример `https://t.me/my_bot`), пока пусто — шаг 7 подсвечен предупреждением. Кнопка «Проверить» → `openTopUp(undefined, 100, 'shortcut')` в демонстрационном виде (без записи: шторка с пометкой «Проверка»).
- [ ] **Step 5: Визуальная проверка:** `?demo=1&tgWebAppStartParam=inc_5000_tbank` → шторка «+5 000 ₽ → Т-Банк»; перезагрузка → шторки нет; инструкция открывается из кнопки «Автопополнение», кнопка «Назад» возвращает.
- [ ] **Step 6:** Commit `feat: автопополнение через быструю команду`.

### Task 12: Планировщик

**Files:**
- Create: `src/screens/planner/PlannerPage.tsx`, `src/screens/planner/planner.css`, `src/screens/planner/CategorySheet.tsx`, `src/screens/planner/SpendForm.tsx`, `src/screens/planner/CategoryForm.tsx`, `src/screens/planner/IncomeForm.tsx`
- Modify: `src/App.tsx` (страница `planner`), `src/screens/budget/BudgetScreen.tsx` (переходы)

**Interfaces:**
- Consumes: `budgetSummary`, `monthAccruals`, `actions.ensureBudget/updateBudget/addCategory/updateCategory/deleteCategory/copyBudget/applyTemplate/addSpend/deleteSpend`, `Donut`, `Keypad`, `Page`.
- [ ] **Step 1: Страница** по спеке §7.3: переключатель месяца (стрелки + свайп по шапке), `Donut` 240px толщиной 22 (сегменты — лимиты, поверх прогресс потраченного тем же цветом на 100% яркости, основа — 35%), центр: `AnimatedNumber left` (красный при < 0) и «из Y ₽»; строка «Можно тратить ~D ₽ в день · до конца месяца N дн.»; блок дохода с подсказками-чипами «по сменам: …» (`monthAccruals`) и «на картах: …» (сумма балансов) — нажатие подставляет; полоса «распределено / свободно», при `free < 0` — предупреждение «Распределено больше дохода на …»; список категорий (`Glass` строки 64px: иконка в цветном круге, название, `ProgressLiquid`, «3 200 / 8 000 ₽»); кнопка «+ Трата» плавающая над TabBar.
- [ ] **Step 2: Пустой месяц:** если нет категорий — карточка с «Скопировать план <прошлого месяца>» (если у прошлого месяца есть категории) и «Начать с шаблона» (сначала спросить доход через `IncomeForm`, если он 0).
- [ ] **Step 3: Шторки:** `CategorySheet` (лимит через `Keypad`, название, выбор иконки из 8 категорийных, цвет из 8 токенов, список трат с удалением свайпом/кнопкой, «Добавить трату», «Удалить категорию»), `SpendForm` (сумма, чипы категорий, заметка, дата `input[type=date]`, по умолчанию сегодня), `CategoryForm` (новая категория).
- [ ] **Step 4: Визуальная проверка:** в демо — пончик, превышенная категория красная, дневной лимит; в следующем месяце — «Скопировать план»; добавить трату → пончик и полоса анимируются; «Назад» Telegram/своя кнопка закрывает страницу.
- [ ] **Step 5:** Commit `feat: планировщик бюджета на месяц`.

### Task 13: Экран мечты и Panamera в SVG

**Files:**
- Create: `src/screens/dream/DreamScreen.tsx`, `src/screens/dream/dream.css`, `src/screens/dream/PanameraSvg.tsx`, `src/screens/dream/DreamForm.tsx`, `src/ui/PhotoPicker.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `dreamProgress`, `useImage`, `cutoutFromBlob`, `loadImageBlob`, `imagesAvailable`, `putImage`, `deleteImage`, `actions.setCar`, `ProgressLiquid`, `AnimatedNumber`.
- Produces: `<PanameraSvg color: string; className?: string />`; `<PhotoPicker value?: { blob: Blob; tint: string } | null; onChange(v: { blob: Blob; tint: string } | null) />` — «Из галереи» (`input[type=file][accept=image/*]`), «По ссылке на картинку» (поле + «Загрузить» → `loadImageBlob`; `null` → тост «Сайт не отдаёт картинку, сохраните её в галерею»), превью на шахматном фоне, переключатель «Убрать фон» (по умолчанию вкл., если `removed`); IndexedDB недоступен → блок скрыт с подсказкой. Переиспользуется в Task 14.

- [ ] **Step 1: `PanameraSvg`** — `viewBox="0 0 800 300"`, вид сбоку, нос справа (как на референсе). Пропорции (масштаб 0.15 px/мм от реальной машины 5050 × 1420 мм, колёсная база 2950): длина кузова 760px (x 20…780), колёсная база 443px, центры колёс x≈193 и x≈636, диаметр шины 112px, диск 21" (диаметр 82px) с 10 тонкими двойными спицами, видимый тормозной суппорт, низ кузова y≈252, крыша y≈62 с самой высокой точкой над передней дверью, длинный капот, покатая линия крыши до короткой кормы (фастбэк), 4 двери, хромовая окантовка окон одним контуром, тонкая светодиодная полоса задних фонарей слева, фара справа. Слои: тень на полу (эллипс с размытием), кузов — линейный градиент от `color` (светлее на 18% сверху) к `color` темнее на 35% снизу, плечевая линия-блик (белая, opacity .35), стёкла — тёмный градиент с отражением неба, пороги и бампер темнее кузова, отражение всей машины снизу (`scale(1,-1)`, маска-градиент, opacity .12). Все `id` градиентов — через `useId()`, чтобы не конфликтовать.
- [ ] **Step 2: Экран** по спеке §7.5: карточка (радиус 36, градиент `#3a3a3c → #1c1c1e`, стеклянная кромка), заголовок 34px/600, чип «✦ Авто мечты», машина (своё фото с `useImage(car.imgId)` или `PanameraSvg`), вход: `x: 120 → 0`, `rotate: 1.5 → 0`, пружина `bouncy`, затем блик — полоса `linear-gradient` проходит слева направо за 900 мс; лёгкое «дыхание» тени. Ниже: «Накоплено X из Y» + `ProgressLiquid` + процент; три плитки `Glass` (в день / в неделю / в месяц); строка прогноза («При текущем темпе — к март 2027» → использовать `fmtMonth`); «До срока N дн.»; вехи — 4 круга с процентами, достигнутые светятся жёлтым. Нет цены → карточка-призыв с кнопкой «Указать цену и срок».
- [ ] **Step 3: `DreamForm`:** название, цена (`Keypad`), дата, цвет (5 образцов: чёрный `#1c1c1e`, белый `#e8e8ea`, серый `#8d9097`, синий `#1f4fbf`, красный `#b3202a`), своё фото (галерея / ссылка, вырезание фона) и «Убрать фото».
- [ ] **Step 4: Визуальная проверка:** сверить с `docs/references/2-dream-tbank.webp` (композиция карточки), смена цвета кузова, анимация въезда, пустых областей на экране нет.
- [ ] **Step 5:** Commit `feat: экран мечты с Panamera`.

### Task 14: Экран покупок

**Files:**
- Create: `src/screens/buys/BuysScreen.tsx`, `src/screens/buys/buys.css`, `src/screens/buys/BuyCard.tsx`, `src/screens/buys/BuyForm.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `useImage`, `putImage`, `deleteImage`, `PhotoPicker` (Task 13), `iconForTitle`, `actions.addBuy/updateBuy/deleteBuy`, `openLink`.

- [ ] **Step 1: `BuyCard`:** сетка 2 колонки, `column-gap 12`, `row-gap 64`; карточка `min-height 150`, радиус 28, фон — `Glass` с подкраской `tint` (или цветом палитры legacy `PAL` по названию) градиентом 145°; слева сверху цена 13px/600 с прозрачностью .75, ниже название 21px/700, до 2 строк, справа отступ 40%; фото 120×120 `object-fit: contain`, `position:absolute; right:4px; top:-56px`, тень `drop-shadow(0 12px 18px rgba(0,0,0,.45))`, при появлении всплывает (`y: 20 → 0`, `scale .9 → 1`, `bouncy`); без фото — `Icon` 96px с глянцевым градиентом в той же позиции. Нажатие → `openLink(url)` (если есть), долгое нажатие 450 мс → меню «Изменить / Удалить» (`haptic('medium')`). Удаление — карточка сжимается и исчезает (`AnimatePresence`, `layout`).
- [ ] **Step 2: Шапка:** «Сумма покупок» + `AnimatedNumber` + пилюля «Останется на счетах: …» (зелёная/красная по знаку).
- [ ] **Step 3: `BuyForm`:** название, ссылка на товар, цена (`Keypad`), `PhotoPicker`; при сохранении `putImage` и `tint` из выбранного фото, старое фото — `deleteImage`.
- [ ] **Step 4: Визуальная проверка:** сверить с `docs/references/3-buy-card.png`; загрузить локальную картинку товара на белом фоне (создать тестовую PNG канвасом в консоли или взять любую из `public/`) → фон вырезан, фото выходит за верх карточки; длинное название обрезано в 2 строки.
- [ ] **Step 5:** Commit `feat: карточки покупок с вырезанными фото`.

### Task 15: Календарь

**Files:**
- Create: `src/screens/calendar/CalendarScreen.tsx`, `src/screens/calendar/calendar.css`, `src/screens/calendar/DaySheet.tsx`, `src/screens/calendar/TaskCard.tsx`, `src/screens/calendar/ShiftForm.tsx`, `src/screens/calendar/TaskForm.tsx`, `src/screens/calendar/PlanForm.tsx`
- Modify: `src/App.tsx` («+» на вкладке календаря → `TaskForm` на выбранный день)

**Interfaces:**
- Consumes: `actions.addShift/deleteShift/addTask/toggleTask/updateTask/deleteTask/setPlan`, `Ring`, `kf`, `fmtDay`, `fmtMonth`, `Icon sun/moon`.
- [ ] **Step 1: Экран** по спеке §7.7: кольца (`Ring` 56px; «Выполнено» жёлтое, «Смены» зелёное), шапка месяца со стрелками и свайпом (смена месяца — сдвиг сетки по направлению), дни недели, сетка 7×N, ячейка радиус 16. Дневная смена: иконка `sun` 13px `#FFDD2D` + сумма жёлтым + фон ячейки `rgba(255,221,45,.10)` и кромка `rgba(255,221,45,.35)`; ночная — `moon` `#8AB4FF` + сумма синим; обе в один день — солнце и луна рядом, сумма белая; сегодня — обводка `#FFDD2D` 1.5px; выбранный — светлое стекло; задачи — точка-маркер.
- [ ] **Step 2: `DaySheet`:** заголовок дня (`fmtDay(key, true)`), сводка смен (`Glass` строка: иконка 26px, «Дневная смена · 12 ч», сумма справа, удалить), `TaskCard`: кружок 28px — по нажатию заливается жёлтым, галочка рисуется (`pathLength 0 → 1`, 300 мс), `haptic('success')`; название 17px/600 (зачёркивается при выполнении), **описание под названием** 14px вторичным цветом, `-webkit-line-clamp: 3`, нажатие по тексту раскрывает полностью (`layout`-анимация); удаление. Кнопки «+ Задача» и «+ Смена».
- [ ] **Step 3: Формы:** `TaskForm` (название, описание `textarea`, срок), `ShiftForm` (дата, тип — сегмент «☀ Дневная / ☾ Ночная», оплата `Keypad`, часы), `PlanForm` (смен в месяц).
- [ ] **Step 4: Визуальная проверка:** дневные смены в демо — жёлтые солнца, ночные — синие луны; у задач видно описание; галочка анимируется; смена месяца.
- [ ] **Step 5:** Commit `feat: календарь с солнцем для дневных смен и описаниями задач`.

### Task 16: Деплой

**Files:**
- Create: `.github/workflows/deploy.yml`, `README.md`

**Interfaces:**
- Consumes: скрипты `npm ci`, `npm test`, `npm run build`.
- [ ] **Step 1:** Workflow: `on: push: branches: [main]` + `workflow_dispatch`; `permissions: pages: write, id-token: write, contents: read`; `concurrency: pages`; job `build` (`actions/checkout`, `actions/setup-node` с Node 24 и кэшем npm, `npm ci`, `npm test`, `npm run build`, `actions/upload-pages-artifact` с `path: dist`), job `deploy` (`actions/deploy-pages`). Версии экшенов — актуальные мажорные на момент выполнения (проверить на GitHub).
- [ ] **Step 2:** `README.md` — что это, `npm run dev`, `?demo=1`, как работает автопополнение, где спека.
- [ ] **Step 3:** Установить GitHub CLI (`winget install GitHub.cli --location D:\Claude\tools\gh`); пользователь сам выполняет `gh auth login`; получить у пользователя адрес репозитория.
- [ ] **Step 4:** `git remote add origin <repo>`, `git fetch origin`, `git merge origin/main --allow-unrelated-histories`; конфликт `index.html` → наша версия (старая уже лежит в `legacy/`); прочие файлы удалённого репозитория (например `CNAME`) сохранить, `CNAME` перенести в `public/`.
- [ ] **Step 5:** Переключить источник Pages на Actions: `gh api -X PUT repos/<owner>/<repo>/pages -f build_type=workflow` (если Pages ещё нет — `POST`). `git push origin main`, дождаться успешного прогона (`gh run watch`).
- [ ] **Step 6:** Открыть опубликованный адрес во встроенном браузере: приложение грузится, ассеты по относительным путям находятся. Commit `ci: деплой на GitHub Pages`.

### Task 17: Финальная проверка

- [ ] **Step 1:** `npm test` → все зелёные; `npm run build` → без ошибок; размер `dist/assets/*.js` (gzip) записать в отчёт.
- [ ] **Step 2:** Сквозной проход во встроенном браузере (390×844, `?demo=1`): все пункты раздела 11 спеки; скриншоты 4 экранов + планировщика.
- [ ] **Step 3:** Проверка миграции на копии: положить в `localStorage` содержимое реального формата v3 (фикстура из Task 3) без `?demo` → данные видны на всех экранах, `planner_v3` не изменён.
- [ ] **Step 4:** Ревью всей ветки свежим ревьюером (superpowers:requesting-code-review), исправить найденное, commit.
