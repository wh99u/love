import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { SHORTCUT_PATTERN, shortcutUrl } from '../../lib/shortcut';
import { Surface } from '../../ui/Surface';
import { Icon } from '../../ui/Icon';
import { Page } from '../../ui/Page';
import { Pressable } from '../../ui/Pressable';
import { copyText } from '../../ui/copy';
import { openTopUp } from '../budget/TopUpSheet';
import './shortcut.css';

function CopyBox({ text, label }: { text: string; label: string }) {
  return (
    <div className="copybox">
      <code>{text}</code>
      <Pressable className="copybox-btn" feedback={false} onPress={() => copyText(text)} aria-label={label}>
        <Icon name="copy" size={18} />
        Скопировать
      </Pressable>
    </div>
  );
}

function Step({ n, title, children, warn }: { n: number; title: string; children?: ReactNode; warn?: boolean }) {
  return (
    <motion.li className={`step ${warn ? 'step--warn' : ''}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: n * 0.04 }}>
      <span className="step-n">{String(n).padStart(2, '0')}</span>
      <div className="step-body">
        <p className="t-h3">{title}</p>
        {children}
      </div>
    </motion.li>
  );
}

export function ShortcutGuidePage({ onBack }: { onBack: () => void }) {
  const url = shortcutUrl();

  return (
    <Page title="Автопополнение" onBack={onBack}>
      <Surface className="guide-intro surface--lit">
        <span className="guide-intro-icon">
          <Icon name="bolt" size={24} fill />
        </span>
        <p className="t-sub">
          iPhone не даёт сайтам читать уведомления банков. Поэтому команда делает снимок экрана с уведомлением, находит в нём сумму и открывает «Мой план» с готовым
          пополнением. Останется нажать «Зачислить».
        </p>
      </Surface>

      <ol className="steps">
        <Step n={1} title="Создайте команду">
          <p className="t-sub">Откройте приложение «Команды», нажмите «+» и назовите команду «Пополнение».</p>
        </Step>
        <Step n={2} title="Сделать снимок экрана">
          <p className="t-sub">Добавьте это действие первым.</p>
        </Step>
        <Step n={3} title="Извлечь текст из изображения">
          <p className="t-sub">На вход — снимок экрана из прошлого шага.</p>
        </Step>
        <Step n={4} title="Сопоставить текст">
          <p className="t-sub">Вставьте в поле шаблона это выражение. Оно находит сумму рядом со словами «пополнение», «зачисление», «поступление», «перевод от» или со знаком «+».</p>
          <CopyBox text={SHORTCUT_PATTERN} label="Скопировать выражение" />
        </Step>
        <Step n={5} title="Получить группу из совпадений">
          <p className="t-sub">Номер группы — 1.</p>
        </Step>
        <Step n={6} title="Заменить текст">
          <p className="t-sub">
            Найти <code className="inline">\D</code>, заменить на пустую строку, включите «Регулярное выражение». Останутся только цифры.
          </p>
        </Step>
        <Step n={7} title="Открыть URL">
          <p className="t-sub">Вставьте ссылку на этот сайт и сразу после неё добавьте переменную «Обновлённый текст».</p>
          <CopyBox text={url} label="Скопировать ссылку" />
        </Step>
        <Step n={8} title="Назначьте касание задней панели">
          <p className="t-sub">Настройки → Универсальный доступ → Касание → Касание задней панели → Двойное касание → «Пополнение».</p>
        </Step>
      </ol>

      <Surface className="guide-use">
        <p className="t-h3">Как пользоваться</p>
        <p className="t-sub">Пришло уведомление о зачислении — дважды коснитесь задней крышки iPhone, пока баннер на экране. Можно и из Центра уведомлений.</p>
      </Surface>

      <Pressable className="btn btn--ghost" onPress={() => openTopUp(undefined, 5000, 'test')}>
        <Icon name="check" size={20} />
        Проверить, как это выглядит
      </Pressable>
    </Page>
  );
}
