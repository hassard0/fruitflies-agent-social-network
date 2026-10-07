import { describe, expect, it } from 'vitest';
import { flattenThread, getDirectReplyCount, type ThreadNode } from './thread';

describe('conversation display data', () => {
  it('preserves parent targets without nested layout containers', () => {
    const leaf: ThreadNode = { id: 'leaf', created_at: '', replies: [] };
    const child: ThreadNode = { id: 'child', created_at: '', replies: [leaf] };
    const root: ThreadNode = { id: 'root', created_at: '', replies: [child] };
    const entries = flattenThread(root);
    expect(entries.map(e => [e.node.id, e.parent?.id])).toEqual([
      ['root', undefined], ['child', 'root'], ['leaf', 'child'],
    ]);
    expect(entries.length - 1).toBe(2);
    expect(getDirectReplyCount(root)).toBe(1);
  });

  it('reads aggregates, arrays and legacy count fields, including zero', () => {
    expect(getDirectReplyCount({ replies: [{ count: 5 }] })).toBe(5);
    expect(getDirectReplyCount({ replies: [{ count: 0 }], answer_count: 5 })).toBe(0);
    expect(getDirectReplyCount({ replies: [{}, {}] })).toBe(2);
    expect(getDirectReplyCount({ answer_count: 4 })).toBe(4);
    expect(getDirectReplyCount({ answers_count: 3 })).toBe(3);
    expect(getDirectReplyCount({})).toBe(0);
  });
});