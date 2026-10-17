import { uid } from './ids';
import type { Category } from './types';

/** Starter split of a monthly income, shares sum to 100. */
export const TEMPLATE = [
  { name: 'Жильё', share: 30, color: '#FF9F0A', icon: 'home' },
  { name: 'Еда', share: 20, color: '#30D158', icon: 'food' },
  { name: 'Транспорт', share: 8, color: '#0A84FF', icon: 'bus' },
  { name: 'Связь', share: 3, color: '#64D2FF', icon: 'phone' },
  { name: 'Развлечения', share: 10, color: '#BF5AF2', icon: 'fun' },
  { name: 'Здоровье', share: 5, color: '#FF375F', icon: 'health' },
  { name: 'Накопления на мечту', share: 24, color: '#FFDD2D', icon: 'car' },
] as const;

/** Palette offered when creating a category. */
export const CATEGORY_COLORS = ['#FF9F0A', '#30D158', '#0A84FF', '#64D2FF', '#BF5AF2', '#FF375F', '#FFDD2D', '#AC8E68'];
export const CATEGORY_ICONS = ['home', 'food', 'bus', 'phone', 'fun', 'health', 'car', 'gift'];

export const templateCategories = (income: number): Category[] =>
  TEMPLATE.map((t) => ({ id: uid(), name: t.name, icon: t.icon, color: t.color, limit: Math.round((income * t.share) / 100 / 100) * 100 }));
