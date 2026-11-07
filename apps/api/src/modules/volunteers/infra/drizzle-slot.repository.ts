import { Inject, Injectable } from '@nestjs/common';
import { and, eq, lt, sql } from 'drizzle-orm';
import type { Database } from '../../../core/database/database';
import { DATABASE } from '../../../core/database/database.module';
import { disciplines } from '../../disciplines/infra/disciplines.schema';
import { SlotRepository } from '../application/slot.repository';
import type { Registration } from '../domain/registration';
import type { Slot } from '../domain/slot';
import { slotFull, slotNotFound } from '../domain/volunteers.errors';
import { toDomain, toRegistrationRow, toRow } from './slot.mapper';
import { registrations, slots } from './volunteers.schema';

@Injectable()
export class DrizzleSlotRepository extends SlotRepository {
  constructor(@Inject(DATABASE) private readonly db: Database) {
    super();
  }

  async findById(id: string): Promise<Slot | null> {
    const [row] = await this.db.select().from(slots).where(eq(slots.id, id)).limit(1);
    return row ? toDomain(row) : null;
  }

  async disciplineExists(disciplineId: string): Promise<boolean> {
    const [row] = await this.db
      .select({ id: disciplines.id })
      .from(disciplines)
      .where(eq(disciplines.id, disciplineId))
      .limit(1);
    return row !== undefined;
  }

  async insert(slot: Slot): Promise<void> {
    await this.db.insert(slots).values(toRow(slot));
  }

  /**
   * Une seule mise à jour conditionnelle prend la place : Postgres verrouille la ligne, donc de
   * deux inscriptions simultanées sur la dernière place, la seconde ne trouve plus de place.
   */
  async addRegistration(registration: Registration): Promise<void> {
    await this.db.transaction(async (tx) => {
      const taken = await tx
        .update(slots)
        .set({ registeredCount: sql`${slots.registeredCount} + 1` })
        .where(and(eq(slots.id, registration.slotId), lt(slots.registeredCount, slots.capacity)))
        .returning({ id: slots.id });
      if (taken.length === 0) {
        const [exists] = await tx
          .select({ id: slots.id })
          .from(slots)
          .where(eq(slots.id, registration.slotId))
          .limit(1);
        throw exists ? slotFull(registration.slotId) : slotNotFound(registration.slotId);
      }
      await tx.insert(registrations).values(toRegistrationRow(registration));
    });
  }
}
