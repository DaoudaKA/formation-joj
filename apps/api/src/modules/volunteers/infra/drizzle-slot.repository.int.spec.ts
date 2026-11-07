import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { type DatabaseConnection, openDatabase } from '../../../core/database/database';
import { disciplines } from '../../disciplines/infra/disciplines.schema';
import { Slot } from '../domain/slot';
import { DrizzleSlotRepository } from './drizzle-slot.repository';

const LUTTE_ID = randomUUID();

const newSlot = (capacity: number) =>
  Slot.create({
    id: randomUUID(),
    disciplineId: LUTTE_ID,
    startsAt: new Date('2026-11-01T09:00:00.000Z'),
    endsAt: new Date('2026-11-01T12:00:00.000Z'),
    capacity,
    now: new Date('2026-10-31T09:00:00.123Z'),
  });

const volunteer = (name: string) => ({
  id: randomUUID(),
  name,
  email: `${name.toLowerCase()}@example.sn`,
  now: new Date(),
});

describe('DrizzleSlotRepository (in-memory PGlite, migrations applied)', () => {
  let connection: DatabaseConnection;
  let repository: DrizzleSlotRepository;

  beforeAll(async () => {
    connection = openDatabase({ pgliteDataDir: 'memory://' });
    await connection.migrate();
    await connection.db
      .insert(disciplines)
      .values({ id: LUTTE_ID, name: 'Lutte', category: 'sports-de-combat', createdAt: new Date() });
    repository = new DrizzleSlotRepository(connection.db);
  });

  afterAll(() => connection?.close());

  it('001-AS1: reads back exactly the slot it wrote, and knows its discipline', async () => {
    const slot = newSlot(2);
    await repository.insert(slot);

    expect(await repository.findById(slot.id)).toEqual(slot);
    expect(await repository.findById(randomUUID())).toBeNull();
    expect(await repository.disciplineExists(LUTTE_ID)).toBe(true);
    expect(await repository.disciplineExists(randomUUID())).toBe(false);
  });

  it('001-AS5: stores a registration and counts it on the slot', async () => {
    const slot = newSlot(2);
    await repository.insert(slot);

    await repository.addRegistration(slot.register(volunteer('Awa')));

    expect((await repository.findById(slot.id))?.registeredCount).toBe(1);
  });

  it('001-AS8: accepts only one of two simultaneous registrations for the last place', async () => {
    const slot = newSlot(1);
    await repository.insert(slot);
    // Deux lectures du même créneau : chacune croit qu'il reste une place.
    const [first, second] = await Promise.all([
      repository.findById(slot.id),
      repository.findById(slot.id),
    ]);

    const results = await Promise.allSettled([
      repository.addRegistration(first!.register(volunteer('Awa'))),
      repository.addRegistration(second!.register(volunteer('Moussa'))),
    ]);

    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(results.find((result) => result.status === 'rejected')).toMatchObject({
      reason: { code: 'SLOT_FULL', kind: 'CONFLICT' },
    });
    expect((await repository.findById(slot.id))?.registeredCount).toBe(1);
  });
});
