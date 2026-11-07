import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import type { Database } from '../../../core/database/database';
import { DATABASE } from '../../../core/database/database.module';
import { disciplines } from '../../disciplines/infra/disciplines.schema';
import { EventRepository } from '../application/event.repository';
import type { Event } from '../domain/event';
import { eventNotFound } from '../domain/events.errors';
import { toDomain, toRow } from './event.mapper';
import { events } from './events.schema';

@Injectable()
export class DrizzleEventRepository extends EventRepository {
  constructor(@Inject(DATABASE) private readonly db: Database) {
    super();
  }

  async findById(id: string): Promise<Event | null> {
    const [row] = await this.db.select().from(events).where(eq(events.id, id)).limit(1);
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

  async insert(event: Event): Promise<void> {
    await this.db.insert(events).values(toRow(event));
  }

  /** Seul le statut d'une épreuve change après sa création. */
  async update(event: Event): Promise<void> {
    const updated = await this.db
      .update(events)
      .set({ status: event.status })
      .where(eq(events.id, event.id))
      .returning({ id: events.id });
    if (updated.length === 0) throw eventNotFound(event.id);
  }
}
