import { Event } from '../../domain/event';
import { eventNotFound } from '../../domain/events.errors';
import { EventRepository } from '../event.repository';

/**
 * Fake fidèle au contrat du port, pour tester l'application sans base.
 * Les disciplines connues sont données à la construction.
 */
export class InMemoryEventRepository extends EventRepository {
  private readonly rows = new Map<string, Event>();
  private readonly disciplineIds: ReadonlySet<string>;

  constructor(disciplineIds: readonly string[] = []) {
    super();
    this.disciplineIds = new Set(disciplineIds);
  }

  /** Nombre d'épreuves enregistrées, pour vérifier qu'un refus n'a rien écrit. */
  count(): number {
    return this.rows.size;
  }

  async findById(id: string): Promise<Event | null> {
    const found = this.rows.get(id);
    return found ? clone(found) : null;
  }

  async disciplineExists(disciplineId: string): Promise<boolean> {
    return this.disciplineIds.has(disciplineId);
  }

  async insert(event: Event): Promise<void> {
    this.rows.set(event.id, clone(event));
  }

  async update(event: Event): Promise<void> {
    if (!this.rows.has(event.id)) throw eventNotFound(event.id);
    this.rows.set(event.id, clone(event));
  }
}

/** Copie : un test ne voit pas une modification qui n'a pas été persistée. */
function clone(event: Event): Event {
  return Event.restore({
    id: event.id,
    disciplineId: event.disciplineId,
    name: event.name,
    site: event.site,
    startsAt: event.startsAt,
    status: event.status,
    createdAt: event.createdAt,
  });
}
