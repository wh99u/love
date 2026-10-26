import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { actions, appStore } from './lib/appStore';
import { fetchCatalog } from './lib/catalog';
import { dayKey } from './lib/dates';
import { sync } from './lib/sync/controller';
import { initTelegram } from './lib/telegram';
import type { SearchHit } from './lib/search';
import { openAccruals } from './screens/budget/AccrualsSheet';
import { openCard } from './screens/budget/CardSheet';
import { openSearch } from './screens/budget/SearchSheet';
import { openMoney } from './screens/budget/TopUpSheet';
import { CalendarScreen } from './screens/calendar/CalendarScreen';
import { BuysScreen } from './screens/buys/BuysScreen';
import { DreamScreen } from './screens/dream/DreamScreen';
import { PlannerPage } from './screens/planner/PlannerPage';
import { HomeScreen, openHeroSheet } from './screens/home/HomeScreen';
import { handleLaunch } from './screens/shortcut/IncomingTopUp';
import { ShortcutGuidePage } from './screens/shortcut/ShortcutGuidePage';
import { openJoin } from './screens/sync/JoinSheet';
import { SyncPage } from './screens/sync/SyncPage';
import { Glow, type GlowSpot } from './ui/Glow';
import { fade, springs } from './ui/motion';
import { NavPill, type Tab, type Tool } from './ui/NavPill';
import { SheetHost } from './ui/sheets';
import { ToastHost, toast } from './ui/Toast';
import { refreshRate } from './ui/useMoney';

export type PageId = 'planner' | 'shortcut' | 'sync';

/** Where the white light sits on every screen. */
const TAB_GLOW: Record<Tab, GlowSpot> = {
  home: { x: 50, y: 92, size: 120, strength: 0.5 },
  dream: { x: 50, y: 30, size: 110, strength: 1 },
  buys: { x: 72, y: 10, size: 86, strength: 0.85 },
  calendar: { x: 26, y: 4, size: 80, strength: 0.75 },
};

const variants = {
  enter: (dir: number) => ({ opacity: 0, x: dir * 36, scale: 0.98 }),
  center: { opacity: 1, x: 0, scale: 1 },
  exit: (dir: number) => ({ opacity: 0, x: dir * -36, scale: 0.98 }),
};

async function importCatalog() {
  const items = await fetchCatalog();
  const added = items.length ? actions.importCatalog(items) : 0;
  if (added) toast(added === 1 ? 'В покупки добавлена новая вещь' : `В покупки добавлено вещей: ${added}`, 'success');
}

export function App() {
  const [tab, setTab] = useState<Tab>('home');
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
    void refreshRate();
    const onVisible = () => document.visibilityState === 'visible' && void importCatalog();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      off();
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  const go = useCallback((t: Tab, d: number) => {
    setDir(d);
    setTab(t);
  }, []);

  const closePage = useCallback(() => setPage(null), []);

  const onPick = (h: SearchHit) => {
    if (h.group === 'buys') go('buys', 1);
    else if (h.group === 'tasks') go('calendar', 1);
    else if (h.group === 'incomes') openAccruals();
    else setPage('planner');
  };

  const tools: Tool[] = [
    { id: 'planner', label: 'Планировщик бюджета', icon: 'pie', run: () => setPage('planner') },
    { id: 'card', label: 'Карта и баланс', icon: 'card', run: openCard },
    { id: 'accruals', label: 'Начисления и пополнения', icon: 'coins', run: openAccruals },
    { id: 'search', label: 'Поиск', icon: 'search', run: () => openSearch(onPick) },
    { id: 'sync', label: 'Вместе', icon: 'users', run: () => setPage('sync') },
    { id: 'shortcut', label: 'Автопополнение', icon: 'bolt', run: () => setPage('shortcut') },
    { id: 'hero', label: 'Картинка на главной', icon: 'photo', run: openHeroSheet },
  ];

  const screens: Record<Tab, ReactNode> = {
    home: <HomeScreen onOpenPlanner={() => setPage('planner')} onOpenCard={openCard} onMoney={() => openMoney()} />,
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
              transition={{ x: springs.page, scale: springs.page, opacity: fade }}
            >
              {screens[tab]}
            </motion.div>
          </AnimatePresence>
        </div>
        <NavPill tab={tab} dir={dir} onTab={go} tools={tools} />
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
