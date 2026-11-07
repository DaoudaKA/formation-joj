import type { EventSite, EventStatus } from '@joj/shared';
import { Event } from '../domain/event';
import type { EventRow } from './events.schema';

/** Ligne de la table → entité, sans rejouer les règles de création. */
export function toDomain(row: EventRow): Event {
  return Event.restore({
    id: row.id,
    disciplineId: row.disciplineId,
    name: row.name,
    // Les contraintes CHECK de la table garantissent ces listes.
    site: row.site as EventSite,
    startsAt: row.startsAt,
    status: row.status as EventStatus,
    createdAt: row.createdAt,
  });
}

/** Entité → ligne de la table. */
export function toRow(event: Event): EventRow {
  return {
    id: event.id,
    disciplineId: event.disciplineId,
    name: event.name,
    site: event.site,
    startsAt: event.startsAt,
    status: event.status,
    createdAt: event.createdAt,
  };
}
