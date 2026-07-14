import { describe, expect, it } from 'vitest';
import {
  getPasswordStrength,
  validateEmail,
  validatePassword,
  validateUsername,
} from './validation';

describe('validation (Phase 1 auth)', () => {
  it('validateEmail rejects empty and invalid emails', () => {
    expect(validateEmail('')).toBe('请输入邮箱地址');
    expect(validateEmail('bad')).toBe('请输入有效的邮箱地址');
    expect(validateEmail('a@b.com')).toBeUndefined();
  });

  it('validateUsername enforces length and charset', () => {
    expect(validateUsername('')).toBe('请输入用户名');
    expect(validateUsername('a')).toBe('用户名长度为 2-30 个字符');
    expect(validateUsername('ok_用户')).toBeUndefined();
  });

  it('validatePassword requires complexity', () => {
    expect(validatePassword('')).toBe('请输入密码');
    expect(validatePassword('short1')).toMatch(/至少 8 位/);
    expect(validatePassword('Password1')).toBeUndefined();
  });

  it('getPasswordStrength scores input', () => {
    expect(getPasswordStrength('')).toBe(0);
    expect(getPasswordStrength('Password1!')).toBeGreaterThanOrEqual(3);
  });
});
