import { afterEach, describe, expect, test, vi } from 'vitest';
import { visible } from '../records';
import { createStore } from '../store';
import { createSyncEngine, type ImageStore, type SyncMeta } from './engine';
import { createMemoryServer } from './memory';

const tick = async (ms = 50) => {
  for (let i = 0; i < 5; i++) await vi.advanceTimersByTimeAsync(ms);
};

function phone(server: ReturnType<typeof createMemoryServer>, name: string, images?: ImageStore) {
  const storage = new Map<string, string>();
  const mem = {
    getItem: (k: string) => storage.get(k) ?? null,
    setItem: (k: string, v: string) => void storage.set(k, v),
    removeItem: (k: string) => void storage.delete(k),
  } as unknown as Storage;
  const store = createStore(mem, `p_${name}`);
  let meta: SyncMeta = { base: {}, imgs: [] };
  const engine = createSyncEngine({ store, transport: server.transport(), meta, saveMeta: (m) => (meta = m), images, delay: 10 });
  return { store, engine, meta: () => meta };
}

afterEach(() => vi.useRealTimers());

describe('two phones', () => {
  test('cards, purchases and the car travel both ways; personal data stays', async () => {
    vi.useFakeTimers();
    const server = createMemoryServer();
    const a = phone(server, 'a');
    const b = phone(server, 'b');
    await tick();

    a.store.actions.addBank('tbank', 1000);
    a.store.actions.addTask({ title: 'личное', desc: '', due: '2026-10-25' });
    b.store.actions.addBuy({ title: 'Куртка', url: '', price: 7990 });
    b.store.actions.setCar({ name: 'Porsche 911' });
    await tick();

    for (const p of [a, b]) {
      const s = p.store.get().shared;
      expect(visible(s.banks).map((x) => x.sum)).toEqual([1000]);
      expect(visible(s.buys).map((x) => x.title)).toEqual(['Куртка']);
      expect(s.car.name).toBe('Porsche 911');
    }
    expect(b.store.get().personal.tasks).toEqual([]);
  });

  test('top-ups made at the same time on both phones add up', async () => {
    vi.useFakeTimers();
    const server = createMemoryServer();
    const a = phone(server, 'a');
    const b = phone(server, 'b');
    await tick();
    const card = a.store.actions.addBank('sber', 1000);
    await tick();

    server.setOnline(false);
    a.store.actions.topUp(card.id, 500, 'manual');
    b.store.actions.topUp(card.id, 300, 'manual');
    await tick();
    server.setOnline(true);
    await tick(300);
    await tick(5000);

    for (const p of [a, b]) {
      expect(visible(p.store.get().shared.banks)[0].sum).toBe(1800);
      expect(visible(p.store.get().shared.incomes)).toHaveLength(2);
    }
  });

  test('a phone joining later gets everything and adds its own records', async () => {
    vi.useFakeTimers();
    const server = createMemoryServer();
    const a = phone(server, 'a');
    await tick();
    a.store.actions.addBuyList('Одежда');
    await tick();

    const storage = new Map<string, string>();
    const mem = { getItem: (k: string) => storage.get(k) ?? null, setItem: (k: string, v: string) => void storage.set(k, v) } as unknown as Storage;
    const bStore = createStore(mem, 'p_b');
    bStore.actions.addBank('vtb', 50);
    createSyncEngine({ store: bStore, transport: server.transport(), meta: { base: {}, imgs: [] }, saveMeta: () => {}, delay: 10 });
    await tick();

    expect(visible(bStore.get().shared.buyLists).map((l) => l.name)).toEqual(['Одежда']);
    expect(visible(a.store.get().shared.banks).map((x) => x.code)).toEqual(['vtb']);
  });

  test('a deleted purchase disappears on the other phone', async () => {
    vi.useFakeTimers();
    const server = createMemoryServer();
    const a = phone(server, 'a');
    const b = phone(server, 'b');
    await tick();
    const buy = a.store.actions.addBuy({ title: 'Стол', url: '', price: 1 });
    await tick();
    b.store.actions.deleteBuy(buy.id);
    await tick();
    expect(visible(a.store.get().shared.buys)).toEqual([]);
  });

  test('pictures follow their purchase', async () => {
    vi.useFakeTimers();
    const server = createMemoryServer();
    const disk = (): ImageStore & { m: Map<string, { type: string; b64: string }> } => {
      const m = new Map<string, { type: string; b64: string }>();
      return { m, get: async (id) => m.get(id) ?? null, put: async (id, img) => void m.set(id, img) };
    };
    const da = disk();
    const db = disk();
    const a = phone(server, 'a', da);
    phone(server, 'b', db);
    await tick();
    da.m.set('img1', { type: 'image/webp', b64: 'AAAA' });
    a.store.actions.addBuy({ title: 'Куртка', url: '', price: 1, imgId: 'img1' });
    await tick();
    expect(db.m.get('img1')).toEqual({ type: 'image/webp', b64: 'AAAA' });
  });

  test('nothing is uploaded before the server answered', async () => {
    vi.useFakeTimers();
    const server = createMemoryServer();
    server.setOnline(false);
    const a = phone(server, 'a');
    a.store.actions.addBank('tbank', 1);
    await tick();
    expect(server.recs.size).toBe(0);
    server.setOnline(true);
    await tick();
    expect(server.recs.size).toBeGreaterThan(0);
  });
});
