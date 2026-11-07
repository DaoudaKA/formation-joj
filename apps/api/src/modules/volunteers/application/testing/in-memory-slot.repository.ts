import type { Registration } from '../../domain/registration';
import { Slot } from '../../domain/slot';
import { slotFull, slotNotFound } from '../../domain/volunteers.errors';
import { SlotRepository } from '../slot.repository';

/**
 * Fake fidèle au contrat du port (place vérifiée au moment d'enregistrer l'inscription),
 * pour tester l'application sans base. Les disciplines connues sont données à la construction.
 */
export class InMemorySlotRepository extends SlotRepository {
  private readonly rows = new Map<string, Slot>();
  private readonly registrations: Registration[] = [];
  private readonly disciplineIds: ReadonlySet<string>;

  constructor(disciplineIds: readonly string[] = []) {
    super();
    this.disciplineIds = new Set(disciplineIds);
  }

  /** Nombre de créneaux enregistrés, pour vérifier qu'un refus n'a rien écrit. */
  count(): number {
    return this.rows.size;
  }

  async findById(id: string): Promise<Slot | null> {
    const found = this.rows.get(id);
    return found ? clone(found) : null;
  }

  async disciplineExists(disciplineId: string): Promise<boolean> {
    return this.disciplineIds.has(disciplineId);
  }

  async insert(slot: Slot): Promise<void> {
    this.rows.set(slot.id, clone(slot));
  }

  /** Comme la mise à jour conditionnelle en base : le nombre stocké fait foi, pas celui de l'appelant. */
  async addRegistration(registration: Registration): Promise<void> {
    const slot = this.rows.get(registration.slotId);
    if (!slot) throw slotNotFound(registration.slotId);
    if (slot.registeredCount >= slot.capacity) throw slotFull(slot.id);
    this.rows.set(slot.id, clone(slot, slot.registeredCount + 1));
    this.registrations.push(registration);
  }
}

/** Copie : un test ne voit pas une modification qui n'a pas été persistée. */
function clone(slot: Slot, registeredCount = slot.registeredCount): Slot {
  return Slot.restore({
    id: slot.id,
    disciplineId: slot.disciplineId,
    startsAt: slot.startsAt,
    endsAt: slot.endsAt,
    capacity: slot.capacity,
    registeredCount,
    createdAt: slot.createdAt,
  });
}
