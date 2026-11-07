import { describe, expect, it } from 'vitest';
import { Slot } from './slot';

const NOW = new Date('2026-10-31T09:00:00.000Z');
const ID = '0199f5c2-0000-7000-8000-000000000101';
const DISCIPLINE_ID = '0199f5c2-0000-7000-8000-000000000001';
const STARTS_AT = new Date('2026-11-01T09:00:00.000Z');
const ENDS_AT = new Date('2026-11-01T12:00:00.000Z');

const open = (overrides: Partial<{ capacity: number; startsAt: Date; endsAt: Date }> = {}) =>
  Slot.create({
    id: ID,
    disciplineId: DISCIPLINE_ID,
    startsAt: STARTS_AT,
    endsAt: ENDS_AT,
    capacity: 2,
    now: NOW,
    ...overrides,
  });

describe('Slot', () => {
  it('001-AS1: creates a slot with its discipline, times, capacity and no registration', () => {
    expect(open()).toMatchObject({
      id: ID,
      disciplineId: DISCIPLINE_ID,
      startsAt: STARTS_AT,
      endsAt: ENDS_AT,
      capacity: 2,
      registeredCount: 0,
      createdAt: NOW,
    });
  });

  it.each([0, -1, 1.5])('001-AS2: rejects a capacity of %s', (capacity) => {
    expect(() => open({ capacity })).toThrow(
      expect.objectContaining({ code: 'SLOT_CAPACITY_INVALID', kind: 'VALIDATION' }),
    );
  });

  it.each([
    ['equal to', STARTS_AT],
    ['before', new Date('2026-11-01T08:00:00.000Z')],
  ])('001-AS3: rejects an end %s the start', (_label, endsAt) => {
    expect(() => open({ endsAt })).toThrow(
      expect.objectContaining({ code: 'SLOT_TIME_RANGE_INVALID', kind: 'VALIDATION' }),
    );
  });
});
