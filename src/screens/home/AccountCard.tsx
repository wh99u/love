import { motion } from 'motion/react';
import { useState } from 'react';
import { useStore } from '../../lib/appStore';
import { cardTotal, mainCard } from '../../lib/store';
import { BANK_NAMES } from '../../lib/types';
import { CardArt } from '../../ui/CardArt';
import { Icon } from '../../ui/Icon';
import { springs } from '../../ui/motion';
import { Pressable } from '../../ui/Pressable';
import { useMoney } from '../../ui/useMoney';

/** «Bank Account» from the reference: the one card; the white button moves money in or out. */
export function AccountCard({ onOpen, onMove }: { onOpen: () => void; onMove: () => void }) {
  const card = useStore(mainCard);
  const total = useStore(cardTotal);
  const m = useMoney();
  const [turns, setTurns] = useState(0);

  return (
    <div className="acct">
      <Pressable className="acct-main" scale={0.98} onPress={onOpen} aria-label="Карта: баланс, цифры, картинка">
        <CardArt className="acct-thumb" />
        <span className="acct-text">
          <b>{BANK_NAMES[card?.code ?? 'tbank']}</b>
          <span className="money">{card?.last4 ? `**** ${card.last4}` : m.fmt(total)}</span>
        </span>
      </Pressable>
      <Pressable
        className="acct-move"
        aria-label="Пополнить или списать"
        feedback="medium"
        scale={0.88}
        onPress={() => {
          setTurns((n) => n + 1);
          onMove();
        }}
      >
        <motion.span style={{ display: 'grid' }} animate={{ rotate: turns * 180 }} transition={springs.bouncy}>
          <Icon name="transfer" size={24} />
        </motion.span>
      </Pressable>
    </div>
  );
}
