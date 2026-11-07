import { describe, expect, it } from 'vitest';
import { Event } from './event';

const NOW = new Date('2026-10-20T09:00:00.000Z');
const ID = '0199f5c2-0000-7000-8000-000000000301';
const DISCIPLINE_ID = '0199f5c2-0000-7000-8000-000000000001';
const STARTS_AT = new Date('2026-11-03T10:00:00.000Z');

const create = (overrides: Partial<{ name: string; site: string; startsAt: Date }> = {}) =>
  Event.create({
    id: ID,
    disciplineId: DISCIPLINE_ID,
    name: 'Lutte -60 kg garçons',
    site: 'diamniadio',
    startsAt: STARTS_AT,
    now: NOW,
    ...overrides,
  });

describe('Event', () => {
  it('002-AS1: creates a scheduled event with its trimmed name, discipline, site and date', () => {
    expect(create({ name: '  Lutte -60 kg garçons  ' })).toMatchObject({
      id: ID,
      disciplineId: DISCIPLINE_ID,
      name: 'Lutte -60 kg garçons',
      site: 'diamniadio',
      startsAt: STARTS_AT,
      status: 'scheduled',
      createdAt: NOW,
    });
  });

  it.each(['', '   '])('002-AS2: rejects an empty name (%j)', (name) => {
    expect(() => create({ name })).toThrow(
      expect.objectContaining({ code: 'EVENT_NAME_REQUIRED', kind: 'VALIDATION' }),
    );
  });

  it('002-AS2: rejects a name longer than 100 characters', () => {
    expect(() => create({ name: 'a'.repeat(101) })).toThrow(
      expect.objectContaining({ code: 'EVENT_NAME_TOO_LONG', kind: 'VALIDATION' }),
    );
  });

  it('002-AS3: rejects a site outside the list of the Games', () => {
    expect(() => create({ site: 'Thiès' })).toThrow(
      expect.objectContaining({ code: 'EVENT_SITE_UNKNOWN', kind: 'VALIDATION' }),
    );
  });

  it.each([
    ['just before the Games', '2026-10-30T23:59:59.999Z'],
    ['just after the Games', '2026-11-14T00:00:00.000Z'],
    ['an invalid date', 'not a date'],
  ])('002-AS4: rejects a date %s', (_label, startsAt) => {
    expect(() => create({ startsAt: new Date(startsAt) })).toThrow(
      expect.objectContaining({ code: 'EVENT_DATE_OUTSIDE_GAMES', kind: 'VALIDATION' }),
    );
  });

  it.each(['2026-10-31T00:00:00.000Z', '2026-11-13T23:59:59.999Z'])(
    '002-AS4: accepts the boundary %s of the Games',
    (startsAt) => {
      expect(create({ startsAt: new Date(startsAt) }).startsAt).toEqual(new Date(startsAt));
    },
  );
});
