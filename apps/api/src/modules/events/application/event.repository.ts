import type { Event } from '../domain/event';

/**
 * Port de persistance : ce dont les cas d'usage ont besoin, rien de plus.
 * Implémenté par DrizzleEventRepository (infra) et InMemoryEventRepository (tests).
 */
export abstract class EventRepository {
  abstract findById(id: string): Promise<Event | null>;
  abstract disciplineExists(disciplineId: string): Promise<boolean>;
  abstract insert(event: Event): Promise<void>;
  abstract update(event: Event): Promise<void>;
}
