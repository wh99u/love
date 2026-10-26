import { motion, useScroll, useTransform } from 'motion/react';
import { useRef, useState } from 'react';
import { actions, appStore, useStore } from '../../lib/appStore';
import { cutoutFromBlob } from '../../lib/cutoutBrowser';
import { addDays, dayKey } from '../../lib/dates';
import { deleteImage, putImage } from '../../lib/images';
import { visible } from '../../lib/records';
import { cardTotal } from '../../lib/store';
import { Icon } from '../../ui/Icon';
import { springs } from '../../ui/motion';
import { Pressable } from '../../ui/Pressable';
import { openSheet } from '../../ui/sheets';
import { toast } from '../../ui/Toast';
import { useImage } from '../../ui/useImage';
import { AccountCard } from './AccountCard';
import { BudgetNote } from './BudgetNote';
import { FlutedGlass } from './FlutedGlass';
import { PlanCard } from './PlanCard';
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
      <p className="t-sub hero-sheet-lead">Своё фото окажется за рифлёным стеклом на главном экране. Лучше всего — портрет на светлом фоне.</p>
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
          Вернуть картинку из референса
        </Pressable>
      )}
    </>
  );
}

export const openHeroSheet = () => openSheet((close) => <HeroSheet close={close} />);

interface HomeScreenProps {
  onOpenPlanner: () => void;
  onOpenCard: () => void;
  onMoney: () => void;
}

/** The home screen of the reference: a picture behind reeded glass, the total over it, the card and this month's budget below. */
export function HomeScreen({ onOpenPlanner, onOpenCard, onMoney }: HomeScreenProps) {
  const total = useStore(cardTotal);
  const incomes = useStore((s) => s.shared.incomes);
  const heroId = useStore((s) => s.personal.settings.heroImgId);
  const heroUrl = useImage(heroId);
  const scroller = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll({ container: scroller });
  const heroY = useTransform(scrollY, (v) => (v > 0 ? v * 0.45 : v));
  const heroScale = useTransform(scrollY, (v) => (v < 0 ? 1 - v / 500 : 1));
  const melt = useTransform(scrollY, [0, 400], [0, 1], { clamp: true });

  const since = dayKey(addDays(new Date(), -6));
  const weekIn = visible(incomes)
    .filter((x) => x.date >= since)
    .reduce((t, x) => t + x.amount, 0);

  return (
    <div className="screen home" ref={scroller}>
      <motion.div className="home-hero" style={{ y: heroY, scale: heroScale }}>
        <FlutedGlass src={heroId ? heroUrl : null} melt={melt} />
        <i className="home-hero-fade" />
        <BudgetNote total={total} weekIn={weekIn} />
      </motion.div>

      <div className="home-body">
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ ...springs.soft, delay: 0.25 }}>
          <AccountCard onOpen={onOpenCard} onMove={onMoney} />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} transition={{ ...springs.soft, delay: 0.38 }}>
          <PlanCard onOpen={onOpenPlanner} />
        </motion.div>
      </div>
    </div>
  );
}
