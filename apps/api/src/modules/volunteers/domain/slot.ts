import { Registration } from './registration';
import { slotFull, VolunteerError } from './volunteers.errors';

export interface SlotProps {
  id: string;
  disciplineId: string;
  startsAt: Date;
  endsAt: Date;
  capacity: number;
  registeredCount: number;
  createdAt: Date;
}

export interface NewVolunteer {
  id: string;
  name: string;
  email: string;
  now: Date;
}

export interface NewSlot {
  id: string;
  disciplineId: string;
  startsAt: Date;
  endsAt: Date;
  capacity: number;
  now: Date;
}

/** Un créneau d'accueil d'une discipline : des horaires cohérents et un nombre de places. */
export class Slot {
  private constructor(private props: SlotProps) {}

  /** Le domaine revérifie capacité et horaires : il ne fait pas confiance à la validation HTTP. */
  static create({ id, disciplineId, startsAt, endsAt, capacity, now }: NewSlot): Slot {
    if (!Number.isInteger(capacity) || capacity < 1) {
      throw new VolunteerError('SLOT_CAPACITY_INVALID', 'A slot needs at least 1 place', {
        capacity,
      });
    }
    if (endsAt.getTime() <= startsAt.getTime()) {
      throw new VolunteerError('SLOT_TIME_RANGE_INVALID', 'A slot must end after it starts');
    }
    return new Slot({
      id,
      disciplineId,
      startsAt,
      endsAt,
      capacity,
      registeredCount: 0,
      createdAt: now,
    });
  }

  /** Reconstruit un créneau depuis la persistance, sans rejouer les règles de création. */
  static restore(props: SlotProps): Slot {
    return new Slot({ ...props });
  }

  get id(): string {
    return this.props.id;
  }

  get disciplineId(): string {
    return this.props.disciplineId;
  }

  get startsAt(): Date {
    return this.props.startsAt;
  }

  get endsAt(): Date {
    return this.props.endsAt;
  }

  get capacity(): number {
    return this.props.capacity;
  }

  get registeredCount(): number {
    return this.props.registeredCount;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  /**
   * Inscrit un bénévole s'il reste une place. La persistance revérifie la place de façon
   * atomique : deux inscriptions simultanées ne peuvent pas prendre la même.
   */
  register({ id, name, email, now }: NewVolunteer): Registration {
    if (this.props.registeredCount >= this.props.capacity) {
      throw slotFull(this.props.id);
    }
    const registration = Registration.create({ id, slotId: this.props.id, name, email, now });
    this.props = { ...this.props, registeredCount: this.props.registeredCount + 1 };
    return registration;
  }
}
