import { describe, it, expect } from 'vitest';
import { sanitizeSettings } from './settingsSanitize';
import { defaultSettings } from '../constants/defaultSettings';

describe('sanitizeSettings', () => {
  it('returns defaults for empty/null input (B1)', () => {
    expect(sanitizeSettings({})).toEqual(defaultSettings);
    expect(sanitizeSettings(null)).toEqual(defaultSettings);
    expect(sanitizeSettings(undefined)).toEqual(defaultSettings);
    expect(sanitizeSettings('garbage')).toEqual(defaultSettings);
  });

  it('clamps gridCols into the slider range and falls back enums (B1)', () => {
    const s = sanitizeSettings({ gridCols: 99, language: 'fr', searchEngine: 'evil' });
    expect(s.gridCols).toBe(6);
    expect(s.language).toBe('zh');
    expect(s.searchEngine).toBe('google');
  });

  it('keeps valid scalar values', () => {
    const s = sanitizeSettings({
      gridCols: 3,
      language: 'en',
      searchEngine: 'baidu',
      globalBgType: 'gradient',
    });
    expect(s.gridCols).toBe(3);
    expect(s.language).toBe('en');
    expect(s.searchEngine).toBe('baidu');
    expect(s.globalBgType).toBe('gradient');
  });

  it('keeps whitelisted preset gradients (A2)', () => {
    const s = sanitizeSettings({
      globalBgGradient: { from: 'from-blue-400', to: 'to-cyan-400' },
    });
    expect(s.globalBgGradient).toEqual({ from: 'from-blue-400', to: 'to-cyan-400' });
  });

  it('rejects gradient classes outside the Tailwind palette (A2)', () => {
    const s = sanitizeSettings({
      globalBgGradient: { from: 'evil; position: fixed', to: 'to-red-500' },
    });
    expect(s.globalBgGradient).toEqual(defaultSettings.globalBgGradient);
  });

  it('drops dangerous globalBgImage (A2)', () => {
    expect(sanitizeSettings({ globalBgImage: 'javascript:alert(1)' }).globalBgImage).toBeUndefined();
  });

  it('keeps safe globalBgImage (https / base64)', () => {
    const https = sanitizeSettings({ globalBgImage: 'https://example.com/bg.jpg' });
    expect(https.globalBgImage).toBe('https://example.com/bg.jpg');

    const base64 = sanitizeSettings({ globalBgImage: 'data:image/png;base64,iVBORw0KGgo=' });
    expect(base64.globalBgImage).toBe('data:image/png;base64,iVBORw0KGgo=');
  });

  it('clamps card appearance values and fills defaults when missing (B1)', () => {
    // iconSize 非数值 → 回落默认 24；textSize 超上限 → 收敛到上限 24
    const clamped = sanitizeSettings({ cardAppearanceConfig: { iconSize: 'x', textSize: 99 } });
    expect(clamped.cardAppearanceConfig?.iconSize).toBe(24);
    expect(clamped.cardAppearanceConfig?.textSize).toBe(24);

    const filled = sanitizeSettings({});
    expect(filled.cardAppearanceConfig).toEqual(defaultSettings.cardAppearanceConfig);
  });

  it('keeps valid card appearance values', () => {
    const s = sanitizeSettings({
      cardAppearanceConfig: { iconSize: 32, iconMarginTop: 4, textSize: 10, textMarginTop: 8 },
    });
    expect(s.cardAppearanceConfig).toEqual({
      iconSize: 32,
      iconMarginTop: 4,
      textSize: 10,
      textMarginTop: 8,
    });
  });
});
