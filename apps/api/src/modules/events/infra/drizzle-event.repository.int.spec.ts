import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { type DatabaseConnection, openDatabase } from '../../../core/database/database';
import { disciplines } from '../../disciplines/infra/disciplines.schema';
import { Event } from '../domain/event';
import { DrizzleEventRepository } from './drizzle-event.repository';

const LUTTE_ID = randomUUID();

const newEvent = () =>
  Event.create({
    id: randomUUID(),
    disciplineId: LUTTE_ID,
    name: 'Lutte -60 kg garçons',
    site: 'diamniadio',
    startsAt: new Date('2026-11-03T10:00:00.000Z'),
    now: new Date('2026-10-20T09:00:00.123Z'),
  });

describe('DrizzleEventRepository (in-memory PGlite, migrations applied)', () => {
  let connection: DatabaseConnection;
  let repository: DrizzleEventRepository;

  beforeAll(async () => {
    connection = openDatabase({ pgliteDataDir: 'memory://' });
    await connection.migrate();
    await connection.db
      .insert(disciplines)
      .values({ id: LUTTE_ID, name: 'Lutte', category: 'sports-de-combat', createdAt: new Date() });
    repository = new DrizzleEventRepository(connection.db);
  });

  afterAll(() => connection?.close());

  it('002-AS1: reads back exactly the event it wrote, and knows its discipline', async () => {
    const event = newEvent();
    await repository.insert(event);

    expect(await repository.findById(event.id)).toEqual(event);
    expect(await repository.findById(randomUUID())).toBeNull();
    expect(await repository.disciplineExists(LUTTE_ID)).toBe(true);
    expect(await repository.disciplineExists(randomUUID())).toBe(false);
  });

  it('002-AS6: persists the status change of an event', async () => {
    const event = newEvent();
    await repository.insert(event);

    event.changeStatus('in-progress');
    await repository.update(event);
    expect((await repository.findById(event.id))?.status).toBe('in-progress');

    event.changeStatus('finished');
    await repository.update(event);
    expect((await repository.findById(event.id))?.status).toBe('finished');
  });
});
