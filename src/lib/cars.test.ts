import { describe, expect, test } from 'vitest';
import { carFromName, distance, norm, searchCars } from './cars';

const titles = (q: string, n = 8) => searchCars(q, n).map((c) => c.title);

describe('norm', () => {
  test('Cyrillic and Latin spellings meet', () => {
    expect(norm('Камри')).toBe(norm('Camry'));
    expect(norm('Королла')).toBe(norm('Corolla'));
    expect(norm('Панамера')).toBe(norm('Panamera'));
    expect(norm('Кашкай')).toBe(norm('Qashqai'));
    expect(norm('Х5')).toBe(norm('X5'));
    expect(norm('Škoda')).toBe('skoda');
  });
});

test('distance counts a swap of neighbours once', () => {
  expect(distance('prosh', 'porsh')).toBe(1);
  expect(distance('kia', 'kia')).toBe(0);
});

describe('searchCars', () => {
  test('a make and the start of a model', () => {
    expect(titles('порш пан')[0]).toBe('Porsche Panamera');
    expect(titles('Porsche Cay')).toEqual(expect.arrayContaining(['Porsche Cayenne', 'Porsche Cayenne Coupe']));
  });
  test('typos and Russian names', () => {
    expect(titles('прош панамера')[0]).toBe('Porsche Panamera');
    expect(titles('киа рио')[0]).toBe('Kia Rio');
    expect(titles('тойота камри')[0]).toBe('Toyota Camry');
    expect(titles('ленд крузер прадо')[0]).toBe('Toyota Land Cruiser Prado');
    expect(titles('мерс гелик')[0]).toBe('Mercedes-Benz G-Class');
    expect(titles('бмв х5')[0]).toBe('BMW X5');
    expect(titles('лада веста')[0]).toBe('Lada Vesta');
    expect(titles('хендай солярис')[0]).toBe('Hyundai Solaris');
  });
  test('a model alone finds its make', () => {
    expect(titles('панамера')[0]).toBe('Porsche Panamera');
    expect(titles('солярис')[0]).toBe('Hyundai Solaris');
  });
  test('a make alone lists its models in order', () => {
    expect(titles('киа', 3)).toEqual(['Kia Rio', 'Kia Ceed', 'Kia Cerato']);
  });
  test('nothing typed gives popular cars; nonsense gives nothing', () => {
    expect(titles('', 2)).toEqual(['Porsche Panamera', 'Porsche 911']);
    expect(titles('qqqzzz')).toEqual([]);
  });
  test('each pick knows its Wikipedia article', () => {
    expect(searchCars('лада 2107', 1)[0]).toMatchObject({ make: 'Lada', model: '2107', wiki: 'VAZ-2107' });
    expect(searchCars('рендж ровер велар', 1)[0].wiki).toBe('Range Rover Velar');
  });
});

test('carFromName reads names saved before the picker', () => {
  expect(carFromName('Porsche Panamera')).toMatchObject({ make: 'Porsche', model: 'Panamera' });
  expect(carFromName('Моя машина')).toBeNull();
});
