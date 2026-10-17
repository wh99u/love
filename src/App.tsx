import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { appStore } from './lib/appStore';
import { initTelegram } from './lib/telegram';
import { startTilt } from './lib/tilt';
import type { SearchHit } from './lib/search';
import { openAccruals } from './screens/budget/AccrualsSheet';
import { openBankForm } from './screens/budget/BankForm';
import { BudgetScreen } from './screens/budget/BudgetScreen';
import { openSearch } from './screens/budget/SearchSheet';
import { openTopUp } from './screens/budget/TopUpSheet';
import { openTransfer } from './screens/budget/TransferSheet';
import { BuysScreen } from './screens/buys/BuysScreen';
import { openBuyForm } from './screens/buys/BuyForm';
import { DreamScreen } from './screens/dream/DreamScreen';
import { openDreamForm } from './screens/dream/DreamForm';
import { PlannerPage } from './screens/planner/PlannerPage';
import { handleLaunch } from './screens/shortcut/IncomingTopUp';
import { ShortcutGuidePage } from './screens/shortcut/ShortcutGuidePage';
import { Ambient } from './ui/Ambient';
import { SheetHost } from './ui/sheets';
import { TabBar, TABS, type Tab } from './ui/TabBar';
import { ToastHost, toast } from './ui/Toast';

export type PageId = 'planner' | 'shortcut';
export type AmbientColors = [string, string, string];

const TAB_AMBIENT: Record<Tab, AmbientColors> = {
  budget: ['#2b2b33', '#3a2f12', '#1b2333'],
  dream: ['#3a3326', '#262a33', '#1f1f24'],
  buys: ['#2c1f45', '#123a3a', '#3a1f2c'],
  calendar: ['#3a3212', '#162a4a', '#1f1f24'],
};

const variants = {
  enter: (dir: number) => ({ opacity: 0, x: dir * 28, filter: 'blur(6px)' }),
  center: { opacity: 1, x: 0, filter: 'blur(0px)' },
  exit: (dir: number) => ({ opacity: 0, x: dir * -28, filter: 'blur(6px)' }),
};

function Placeholder({ title }: { title: string }) {
  return (
    <div className="screen">
      <h1 className="t-title">{title}</h1>
    </div>
  );
}

export function App() {
  const [tab, setTab] = useState<Tab>('budget');
  const [dir, setDir] = useState(1);
  const [page, setPage] = useState<PageId | null>(null);
  const [ambient, setAmbient] = useState<AmbientColors | null>(null);

  useEffect(() => {
    initTelegram();
    const stopTilt = startTilt();
    const off = appStore.onError((e) =>
      toast(e === 'save' ? 'Не удалось сохранить: память браузера заполнена' : 'Старые данные не прочитались, начинаем с чистого листа', 'error'),
    );
    handleLaunch();
    return () => {
      stopTilt();
      off();
    };
  }, []);

  const go = useCallback(
    (t: Tab) => {
      const from = TABS.findIndex((x) => x.id === tab);
      const to = TABS.findIndex((x) => x.id === t);
      setDir(to >= from ? 1 : -1);
      setTab(t);
      setAmbient(null);
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

  /** The white «+» adds whatever the current tab is about. */
  const plus: Record<Tab, () => void> = {
    budget: () => openBankForm(),
    dream: openDreamForm,
    buys: () => openBuyForm(),
    calendar: () => toast('Скоро'),
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
        onAmbient={setAmbient}
      />
    ),
    dream: <DreamScreen />,
    buys: <BuysScreen />,
    calendar: <Placeholder title="Календарь" />,
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="app">
        <Ambient colors={ambient ?? TAB_AMBIENT[tab]} />
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
              transition={{ type: 'spring', stiffness: 420, damping: 40 }}
            >
              {screens[tab]}
            </motion.div>
          </AnimatePresence>
        </div>
        <TabBar tab={tab} onChange={go} onPlus={plus[tab]} />
        <AnimatePresence>
          {page === 'shortcut' && <ShortcutGuidePage key="shortcut" onBack={closePage} />}
          {page === 'planner' && <PlannerPage key="planner" onBack={closePage} />}
        </AnimatePresence>
        <SheetHost />
        <ToastHost />
        <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
          <filter id="lens" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.008 0.012" numOctaves="2" seed="7" result="n" />
            <feGaussianBlur in="n" stdDeviation="2" result="nb" />
            <feDisplacementMap in="SourceGraphic" in2="nb" scale="18" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </svg>
      </div>
    </MotionConfig>
  );
}

