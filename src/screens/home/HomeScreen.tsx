import { motion, useScroll, useTransform } from 'motion/react';
import { useRef, useState } from 'react';
import { actions, appStore, useStore } from '../../lib/appStore';
import { cutoutFromBlob } from '../../lib/cutoutBrowser';
import { deleteImage, putImage } from '../../lib/images';
import { visible } from '../../lib/records';
import { inWeek, weekRange } from '../../lib/weeks';
import { Avatars } from '../../ui/Avatars';
import { Icon } from '../../ui/Icon';
import { springs } from '../../ui/motion';
import { Pressable } from '../../ui/Pressable';
import { openSheet } from '../../ui/sheets';
import { toast } from '../../ui/Toast';
import { useImage } from '../../ui/useImage';
import { clampIndex } from '../budget/pocket';
import { AccountCard } from './AccountCard';
import { BudgetStack } from './BudgetStack';
import { FlutedGlass } from './FlutedGlass';
import { IncomeFeed } from './IncomeFeed';
import './home.css';

function HeroSheet({ close }: { close: () => void }) {
  const file = useRef<HTMLInputElement>(null);
  const current = useStore((s) => s.personal.settings.heroImgId);
  const [busy, setBusy] = useState(false);

  const pick = async (f: File) => {
    setBusy(true);
    try {
      const { blob } = await cutoutFromBlob(f, { removeBg: false });
      const id = await putImage(blob);
      const old = appStore.get().personal.settings.heroImgId;
      actions.setSettings({ heroImgId: id });
      if (old) void deleteImage(old).catch(() => {});
      close();
    } catch {
      toast('Не получилось открыть картинку', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <h2 className="sheet-title">Картинка под стеклом</h2>
      <p className="t-sub hero-sheet-lead">Любое фото станет рифлёным стеклом на главном экране. Лучше всего — портрет или предмет на светлом фоне.</p>
      <input ref={file} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && void pick(e.target.files[0])} />
      <Pressable className="btn btn--primary" disabled={busy} onPress={() => file.current?.click()}>
        <Icon name="photo" size={20} />
        {busy ? 'Готовим…' : 'Выбрать фото'}
      </Pressable>
      {current && (
        <Pressable
          className="btn btn--ghost"
          onPress={() => {
            actions.setSettings({ heroImgId: undefined });
            void deleteImage(current).catch(() => {});
            close();
          }}
        >
          Вернуть стандартную
        </Pressable>
      )}
    </>
  );
}

interface HomeScreenProps {
  onOpenBudget: () => void;
  onOpenSync: () => void;
  onTopUp: (bankId?: string) => void;
  onNewCard: () => void;
  onAccruals: () => void;
}

export function HomeScreen({ onOpenBudget, onOpenSync, onTopUp, onNewCard, onAccruals }: HomeScreenProps) {
  const banks = useStore((s) => visible(s.shared.banks).sort((a, b) => a.order - b.order));
  const incomes = useStore((s) => s.shared.incomes);
  const heroId = useStore((s) => s.personal.settings.heroImgId);
  const heroUrl = useImage(heroId);
  const [index, setIndex] = useState(0);
  const i = clampIndex(index, banks.length);
  const scroller = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll({ container: scroller });
  const heroY = useTransform(scrollY, (v) => (v > 0 ? v * 0.45 : v));
  const heroScale = useTransform(scrollY, (v) => (v < 0 ? 1 - v / 500 : 1));
  const heroDim = useTransform(scrollY, [0, 420], [1, 0.35]);
  const melt = useTransform(scrollY, [0, 420], [0, 0.8], { clamp: true });

  const total = banks.reduce((t, b) => t + b.sum, 0);
  const week = weekRange(new Date());
  const weekIn = visible(incomes)
    .filter((x) => inWeek(x.date, week))
    .reduce((t, x) => t + x.amount, 0);

  return (
    <div className="screen home" ref={scroller}>
      <motion.div className="home-hero" style={{ y: heroY, scale: heroScale, opacity: heroDim }}>
        <FlutedGlass src={heroUrl} melt={melt} />
        <i className="home-hero-fade" />
      </motion.div>

      <div className="home-lead">
        <motion.header className="home-top" initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }} transition={{ ...springs.soft, delay: 0.2 }}>
          <Pressable className="home-chip glass" aria-label="Общий план" scale={0.9} onPress={onOpenSync}>
            <Avatars />
          </Pressable>
          <Pressable className="home-chip home-chip--icon glass" aria-label="Сменить картинку" scale={0.88} onPress={() => openSheet((close) => <HeroSheet close={close} />)}>
            <Icon name="photo" size={20} />
          </Pressable>
        </motion.header>
        <BudgetStack banks={banks} total={total} weekIn={weekIn} />
      </div>

      <div className="home-body">
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ ...springs.soft, delay: 0.3 }}>
          <AccountCard banks={banks} index={i} onIndex={setIndex} onOpen={onOpenBudget} onAdd={onNewCard} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} transition={{ ...springs.soft, delay: 0.42 }}>
          <IncomeFeed incomes={incomes} banks={banks} onAdd={() => onTopUp(banks[i]?.id)} onAll={onAccruals} />
        </motion.div>
      </div>
    </div>
  );
}
