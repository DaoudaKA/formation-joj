import type { Registration } from '../domain/registration';
import type { Slot } from '../domain/slot';

/**
 * Port de persistance : ce dont les cas d'usage ont besoin, rien de plus.
 * Implémenté par DrizzleSlotRepository (infra) et InMemorySlotRepository (tests).
 */
export abstract class SlotRepository {
  abstract findById(id: string): Promise<Slot | null>;
  abstract disciplineExists(disciplineId: string): Promise<boolean>;
  abstract insert(slot: Slot): Promise<void>;
  /**
   * Enregistre l'inscription seulement s'il reste une place, de façon atomique :
   * deux inscriptions simultanées ne prennent pas la même place. Lève SLOT_FULL sinon.
   */
  abstract addRegistration(registration: Registration): Promise<void>;
}
