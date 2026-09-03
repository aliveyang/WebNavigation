import { describe, it, expect } from 'vitest';
import {
  isSafeUrl,
  sanitizeUrl,
  isValidImageUrl,
  validateTitle,
  validateUrl,
  validatePin,
  sanitizeBookmarks,
} from './security';

describe('isSafeUrl', () => {
  it('accepts http/https', () => {
    expect(isSafeUrl('https://example.com')).toBe(true);
    expect(isSafeUrl('http://example.com/path?q=1')).toBe(true);
  });

  it('accepts whitelisted local app protocols', () => {
    expect(isSafeUrl('mailto:a@b.com')).toBe(true);
    expect(isSafeUrl('vscode://open/file')).toBe(true);
    expect(isSafeUrl('weixin://profile')).toBe(true);
  });

  it('rejects dangerous executable protocols', () => {
    expect(isSafeUrl('javascript:alert(1)')).toBe(false);
    expect(isSafeUrl('data:text/html;base64,PGI+')).toBe(false);
    expect(isSafeUrl('vbscript:msgbox')).toBe(false);
  });

  it('rejects malformed URLs', () => {
    expect(isSafeUrl('not a url')).toBe(false);
    expect(isSafeUrl('')).toBe(false);
  });
});

describe('sanitizeUrl', () => {
  it('blocks dangerous protocols by rewriting to about:blank', () => {
    expect(sanitizeUrl('javascript:alert(1)')).toBe('about:blank');
    expect(sanitizeUrl('data:text/html,<b>x</b>')).toBe('about:blank');
    expect(sanitizeUrl('vbscript:x')).toBe('about:blank');
  });

  it('is case-insensitive against protocol smuggling', () => {
    expect(sanitizeUrl('JaVaScRiPt:alert(1)')).toBe('about:blank');
  });

  it('prepends http:// to protocol-less input', () => {
    expect(sanitizeUrl('example.com')).toBe('http://example.com');
  });

  it('passes through whitelisted protocols unchanged', () => {
    expect(sanitizeUrl('https://example.com')).toBe('https://example.com');
    expect(sanitizeUrl('spotify:track:123')).toBe('spotify:track:123');
  });
});

describe('isValidImageUrl', () => {
  it('accepts base64 images with known MIME types', () => {
    expect(isValidImageUrl('data:image/png;base64,iVBORw0KGgo=')).toBe(true);
    expect(isValidImageUrl('data:image/jpeg;base64,/9j/4AAQ')).toBe(true);
  });

  it('rejects non-image data URLs', () => {
    expect(isValidImageUrl('data:text/html;base64,PGI+')).toBe(false);
  });

  it('accepts http(s) image URLs without extension (regression: CDN links)', () => {
    expect(isValidImageUrl('https://images.unsplash.com/photo-123?w=800')).toBe(true);
  });

  it('rejects dangerous protocols and garbage', () => {
    expect(isValidImageUrl('javascript:alert(1)')).toBe(false);
    expect(isValidImageUrl('ftp://example.com/a.png')).toBe(false);
    expect(isValidImageUrl('hello world')).toBe(false);
    expect(isValidImageUrl('')).toBe(false);
  });
});

describe('validateTitle', () => {
  it('rejects empty and overlong titles', () => {
    expect(validateTitle('').valid).toBe(false);
    expect(validateTitle('x'.repeat(51)).valid).toBe(false);
  });

  it('rejects script injection', () => {
    expect(validateTitle('<script>alert(1)</script>').valid).toBe(false);
    expect(validateTitle('a" onclick="evil').valid).toBe(false);
  });

  it('accepts normal titles', () => {
    expect(validateTitle('YouTube').valid).toBe(true);
    expect(validateTitle('知乎 ZHIHU').valid).toBe(true);
  });
});

describe('validateUrl', () => {
  it('rejects empty input', () => {
    expect(validateUrl('').valid).toBe(false);
    expect(validateUrl('   ').valid).toBe(false);
  });

  it('rejects dangerous protocols', () => {
    expect(validateUrl('javascript:alert(1)').valid).toBe(false);
    expect(validateUrl('data:text/html,x').valid).toBe(false);
  });

  it('accepts http(s) and protocol-less domains', () => {
    expect(validateUrl('https://example.com').valid).toBe(true);
    expect(validateUrl('example.com').valid).toBe(true);
  });
});

describe('validatePin', () => {
  it('requires at least 8 characters (A1)', () => {
    expect(validatePin('1234567').valid).toBe(false);
    expect(validatePin('12345678').valid).toBe(true);
  });

  it('rejects overlong PINs and dangerous characters', () => {
    expect(validatePin('x'.repeat(21)).valid).toBe(false);
    expect(validatePin('pin<script').valid).toBe(false);
  });
});

describe('sanitizeBookmarks', () => {
  const raw = [
    { id: '1', title: 'ok', url: 'https://a.com', colorFrom: 'from-red-500', colorTo: 'to-orange-500' },
    { id: '2', title: 'evil', url: 'javascript:alert(1)', colorFrom: '', colorTo: '' },
    {
      id: '3',
      title: 'bad image',
      url: 'https://b.com',
      colorFrom: '',
      colorTo: '',
      bgImage: 'javascript:alert(2)',
    },
    {
      id: '4',
      title: 'good image',
      url: 'https://c.com',
      colorFrom: '',
      colorTo: '',
      bgImage: 'data:image/png;base64,iVBORw0KGgo=',
    },
  ];

  it('drops dangerous URLs entirely (red line §6-2)', () => {
    const result = sanitizeBookmarks(raw);
    expect(result.map((b) => b.id)).toEqual(['1', '3', '4']);
  });

  it('strips invalid bgImage but keeps the bookmark (A2)', () => {
    const result = sanitizeBookmarks(raw);
    expect(result.find((b) => b.id === '3')?.bgImage).toBeUndefined();
    expect(result.find((b) => b.id === '4')?.bgImage).toBe('data:image/png;base64,iVBORw0KGgo=');
  });

  it('keeps the original array untouched', () => {
    sanitizeBookmarks(raw);
    expect(raw[2].bgImage).toBe('javascript:alert(2)');
  });
});
