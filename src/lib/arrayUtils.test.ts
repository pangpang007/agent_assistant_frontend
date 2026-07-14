import { describe, expect, it } from 'vitest';
import { asArray, pickList, pickObject } from './arrayUtils';

describe('arrayUtils', () => {
  it('asArray returns empty array for null/undefined/non-array', () => {
    expect(asArray(null)).toEqual([]);
    expect(asArray(undefined)).toEqual([]);
    expect(asArray({ length: 1 })).toEqual([]);
  });

  it('asArray preserves real arrays', () => {
    expect(asArray([1, 2])).toEqual([1, 2]);
  });

  it('pickList supports bare arrays and nested null lists', () => {
    expect(pickList([1], ['items'])).toEqual([1]);
    expect(pickList({ items: null }, ['items'])).toEqual([]);
    expect(pickList({ results: ['a'] }, ['items', 'results'])).toEqual(['a']);
  });

  it('pickObject merges object payload with fallback', () => {
    expect(pickObject({ a: 1 }, { a: 0, b: 2 })).toEqual({ a: 1, b: 2 });
    expect(pickObject(null, { a: 0 })).toEqual({ a: 0 });
  });
});
