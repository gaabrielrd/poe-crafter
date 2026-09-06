import { describe, expect, it } from 'vitest';
import { MAX_SCREENSHOT_BYTES, validateScreenshot } from '../model/image-validation';

describe('validateScreenshot', () => {
  it('aceita PNG, JPEG e WebP dentro do limite', () => {
    expect(validateScreenshot({ type: 'image/png', size: MAX_SCREENSHOT_BYTES })).toBeNull();
    expect(validateScreenshot({ type: 'image/jpeg', size: 1 })).toBeNull();
    expect(validateScreenshot({ type: 'image/webp', size: 1 })).toBeNull();
  });

  it('rejeita vazio, tipo desconhecido e arquivo acima de 8 MB', () => {
    expect(validateScreenshot({ type: 'image/png', size: 0 })).toMatchObject({ code: 'empty' });
    expect(validateScreenshot({ type: 'image/gif', size: 1 })).toMatchObject({ code: 'type' });
    expect(validateScreenshot({ type: 'image/png', size: MAX_SCREENSHOT_BYTES + 1 })).toMatchObject(
      { code: 'too-large' },
    );
  });
});
