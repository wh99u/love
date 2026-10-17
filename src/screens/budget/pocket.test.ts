import { describe, expect, test } from 'vitest';
import { balanceFontSize, cardPose, clampIndex, rubberBand, snapTarget } from './pocket';

describe('cardPose', () => {
  test('active card is raised out of the pocket', () => {
    expect(cardPose(0)).toEqual({ x: 0, y: -24, scale: 1, opacity: 1, z: 100 });
  });
  test('neighbours sit lower, smaller and dimmer', () => {
    expect(cardPose(1)).toMatchObject({ x: 0.78, y: 0, scale: 0.86, opacity: 0.6 });
    expect(cardPose(-1).x).toBeCloseTo(-0.78);
  });
  test('far cards keep spreading but stop sinking', () => {
    const p = cardPose(-2.5);
    expect(p.x).toBeCloseTo(-1.95);
    expect(p.y).toBe(0);
    expect(p.scale).toBeCloseTo(0.86);
    expect(p.z).toBe(75);
  });
  test('halfway between two cards blends smoothly', () => {
    const p = cardPose(0.5);
    expect(p.y).toBe(-12);
    expect(p.scale).toBeCloseTo(0.93);
  });
});

describe('snapTarget', () => {
  test('a long drag or a flick goes to the next card', () => {
    expect(snapTarget(0, -0.4, 0, 3)).toBe(1);
    expect(snapTarget(0, -0.1, -500, 3)).toBe(1);
    expect(snapTarget(1, 0.5, 0, 3)).toBe(0);
    expect(snapTarget(1, 0.05, 900, 3)).toBe(0);
  });
  test('a short slow drag stays', () => {
    expect(snapTarget(1, 0.1, 0, 3)).toBe(1);
  });
  test('never leaves the deck', () => {
    expect(snapTarget(2, -0.9, -900, 3)).toBe(2);
    expect(snapTarget(0, 0.5, 0, 3)).toBe(0);
    expect(snapTarget(0, -0.9, 0, 0)).toBe(0);
  });
});

describe('rubberBand', () => {
  test('resists past the ends only', () => {
    expect(rubberBand(-1, 3)).toBeCloseTo(-0.35);
    expect(rubberBand(3, 3)).toBeCloseTo(2.35);
    expect(rubberBand(1.5, 3)).toBe(1.5);
    expect(rubberBand(0.4, 1)).toBeCloseTo(0.14);
  });
});

describe('clampIndex', () => {
  test('keeps the index inside the deck', () => {
    expect(clampIndex(5, 2)).toBe(1);
    expect(clampIndex(0, 0)).toBe(0);
    expect(clampIndex(-1, 3)).toBe(0);
    expect(clampIndex(1, 3)).toBe(1);
  });
});

describe('balanceFontSize', () => {
  test('long totals shrink so they never wrap', () => {
    expect(balanceFontSize('214 ₽')).toBe(64);
    expect(balanceFontSize('48 200 ₽')).toBe(64);
    expect(balanceFontSize('1 250 000 ₽')).toBe(52);
    expect(balanceFontSize('1 000 000 000 ₽')).toBe(42);
  });
});
