import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { actions, appStore } from './lib/appStore';
import { fetchCatalog } from './lib/catalog';
import { dayKey } from './lib/dates';
import { sync } from './lib/sync/controller';
import { initTelegram } from './lib/telegram';
import type { SearchHit } from './lib/search';
import { openAccruals } from './screens/budget/AccrualsSheet';
import { openBankForm } from './screens/budget/BankForm';
import { BudgetScreen } from './screens/budget/BudgetScreen';
import { openSearch } from './screens/budget/SearchSheet';
import { openTopUp } from './screens/budget/TopUpSheet';
import { openTransfer } from './screens/budget/TransferSheet';
import { CalendarScreen } from './screens/calendar/CalendarScreen';
import { openTaskForm } from './screens/calendar/forms';
import { BuysScreen } from './screens/buys/BuysScreen';
import { openBuyForm } from './screens/buys/BuyForm';
import { DreamScreen } from './screens/dream/DreamScreen';
import { openDreamForm } from './screens/dream/DreamForm';
import { PlannerPage } from './screens/planner/PlannerPage';
import { handleLaunch } from './screens/shortcut/IncomingTopUp';
import { ShortcutGuidePage } from './screens/shortcut/ShortcutGuidePage';
import { openJoin } from './screens/sync/JoinSheet';
import { SyncPage } from './screens/sync/SyncPage';
import { Glow, type GlowSpot } from './ui/Glow';
import { fade, springs } from './ui/motion';
import { SheetHost } from './ui/sheets';
import { TabBar, TABS, type Tab } from './ui/TabBar';
import { ToastHost, toast } from './ui/Toast';

export type PageId = 'planner' | 'shortcut' | 'sync';

/** Where the red light sits on every screen. */
const TAB_GLOW: Record<Tab, GlowSpot> = {
  budget: { x: 50, y: 24, size: 92, strength: 1 },
  dream: { x: 50, y: 30, size: 110, strength: 1 },
  buys: { x: 72, y: 10, size: 86, strength: 0.85 },
  calendar: { x: 26, y: 4, size: 80, strength: 0.75 },
};

const variants = {
  enter: (dir: number) => ({ opacity: 0, x: dir * 22 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir * -22 }),
};

async function importCatalog() {
  const items = await fetchCatalog();
  const added = items.length ? actions.importCatalog(items) : 0;
  if (added) toast(added === 1 ? 'В покупки добавлена новая вещь' : `В покупки добавлено вещей: ${added}`, 'success');
}

export function App() {
  const [tab, setTab] = useState<Tab>('budget');
  const [dir, setDir] = useState(1);
  const [page, setPage] = useState<PageId | null>(null);
  const [day, setDay] = useState(() => dayKey(new Date()));

  useEffect(() => {
    initTelegram();
    const off = appStore.onError((e) =>
      toast(e === 'save' ? 'Не удалось сохранить: память браузера заполнена' : 'Старые данные не прочитались, начинаем с чистого листа', 'error'),
    );
    sync.start();
    handleLaunch((space) => openJoin(space, () => setPage('sync')));
    void importCatalog();
    const onVisible = () => document.visibilityState === 'visible' && void importCatalog();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      off();
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  const go = useCallback(
    (t: Tab) => {
      const from = TABS.findIndex((x) => x.id === tab);
      const to = TABS.findIndex((x) => x.id === t);
      setDir(to >= from ? 1 : -1);
      setTab(t);
    },
    [tab],
  );

  const closePage = useCallback(() => setPage(null), []);

  const onPick = (h: SearchHit) => {
    if (h.group === 'buys') go('buys');
    else if (h.group === 'tasks') go('calendar');
    else if (h.group === 'incomes') openAccruals();
    else setPage('planner');
  };

  /** The red «+» adds whatever the current tab is about. */
  const plus: Record<Tab, () => void> = {
    budget: () => openBankForm(),
    dream: openDreamForm,
    buys: () => openBuyForm(),
    calendar: () => openTaskForm(day),
  };

  const screens: Record<Tab, ReactNode> = {
    budget: (
      <BudgetScreen
        onTopUp={(b) => openTopUp(b?.id)}
        onTransfer={(b) => openTransfer(b?.id)}
        onNewCard={() => openBankForm()}
        onEditCard={openBankForm}
        onSearch={() => openSearch(onPick)}
        onAccruals={openAccruals}
        onOpenPlanner={() => setPage('planner')}
        onOpenShortcut={() => setPage('shortcut')}
        onOpenSync={() => setPage('sync')}
      />
    ),
    dream: <DreamScreen />,
    buys: <BuysScreen />,
    calendar: <CalendarScreen selected={day} onSelect={setDay} />,
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="app">
        <Glow spot={TAB_GLOW[tab]} />
        <div className="screens">
          <AnimatePresence initial={false} custom={dir} mode="popLayout">
            <motion.div
              key={tab}
              className="screens"
              custom={dir}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ x: springs.page, opacity: fade }}
            >
              {screens[tab]}
            </motion.div>
          </AnimatePresence>
        </div>
        <TabBar tab={tab} onChange={go} onPlus={plus[tab]} />
        <AnimatePresence>
          {page === 'shortcut' && <ShortcutGuidePage key="shortcut" onBack={closePage} />}
          {page === 'planner' && <PlannerPage key="planner" onBack={closePage} />}
          {page === 'sync' && <SyncPage key="sync" onBack={closePage} />}
        </AnimatePresence>
        <SheetHost />
        <ToastHost />
      </div>
    </MotionConfig>
  );
}
