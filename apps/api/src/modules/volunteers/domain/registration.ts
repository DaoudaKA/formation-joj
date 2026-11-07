import { VolunteerError } from './volunteers.errors';

/** Forme minimale d'un email : une partie locale, un @, un domaine avec un point, sans espace. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface RegistrationProps {
  id: string;
  slotId: string;
  name: string;
  email: string;
  createdAt: Date;
}

export interface NewRegistration {
  id: string;
  slotId: string;
  name: string;
  email: string;
  now: Date;
}

/** L'inscription d'un bénévole, identifié par son nom et son email, à un créneau. */
export class Registration {
  private constructor(private readonly props: RegistrationProps) {}

  /** Retire les espaces autour, puis revérifie nom et email : le domaine ne fait pas confiance à HTTP. */
  static create({ id, slotId, name, email, now }: NewRegistration): Registration {
    const trimmedName = name.trim();
    if (trimmedName.length === 0) {
      throw new VolunteerError('REGISTRATION_NAME_REQUIRED', 'A registration needs a name');
    }
    const trimmedEmail = email.trim();
    if (!EMAIL_PATTERN.test(trimmedEmail)) {
      throw new VolunteerError('REGISTRATION_EMAIL_INVALID', 'A registration needs a valid email', {
        email: trimmedEmail,
      });
    }
    return new Registration({ id, slotId, name: trimmedName, email: trimmedEmail, createdAt: now });
  }

  /** Reconstruit une inscription depuis la persistance, sans rejouer les règles de création. */
  static restore(props: RegistrationProps): Registration {
    return new Registration({ ...props });
  }

  get id(): string {
    return this.props.id;
  }

  get slotId(): string {
    return this.props.slotId;
  }

  get name(): string {
    return this.props.name;
  }

  get email(): string {
    return this.props.email;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }
}
