import {
  EVENT_NAME_MAX_LENGTH,
  EVENT_SITES,
  GAMES_PERIOD,
  isDuringGames,
  type EventSite,
  type EventStatus,
} from '@joj/shared';
import { EventError } from './events.errors';

export interface EventProps {
  id: string;
  disciplineId: string;
  name: string;
  site: EventSite;
  startsAt: Date;
  status: EventStatus;
  createdAt: Date;
}

export interface NewEvent {
  id: string;
  disciplineId: string;
  name: string;
  /** Vérifié ici : le domaine ne fait pas confiance à la validation HTTP. */
  site: string;
  startsAt: Date;
  now: Date;
}

/** Une épreuve d'une discipline, à un site et une date des Jeux, avec son statut. */
export class Event {
  private constructor(private props: EventProps) {}

  /** Revérifie nom, site et date ; l'épreuve naît toujours à venir. */
  static create({ id, disciplineId, name, site, startsAt, now }: NewEvent): Event {
    return new Event({
      id,
      disciplineId,
      name: validName(name),
      site: validSite(site),
      startsAt: validStartsAt(startsAt),
      status: 'scheduled',
      createdAt: now,
    });
  }

  /** Reconstruit une épreuve depuis la persistance, sans rejouer les règles de création. */
  static restore(props: EventProps): Event {
    return new Event({ ...props });
  }

  get id(): string {
    return this.props.id;
  }

  get disciplineId(): string {
    return this.props.disciplineId;
  }

  get name(): string {
    return this.props.name;
  }

  get site(): EventSite {
    return this.props.site;
  }

  get startsAt(): Date {
    return this.props.startsAt;
  }

  get status(): EventStatus {
    return this.props.status;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }
}

function validName(name: string): string {
  const trimmed = name.trim();
  if (trimmed.length === 0) {
    throw new EventError('EVENT_NAME_REQUIRED', 'An event needs a name');
  }
  if (trimmed.length > EVENT_NAME_MAX_LENGTH) {
    throw new EventError(
      'EVENT_NAME_TOO_LONG',
      `An event name has at most ${EVENT_NAME_MAX_LENGTH} characters`,
    );
  }
  return trimmed;
}

function validSite(site: string): EventSite {
  if (!(EVENT_SITES as readonly string[]).includes(site)) {
    throw new EventError('EVENT_SITE_UNKNOWN', `Unknown site ${site}`, {
      site,
      allowed: EVENT_SITES,
    });
  }
  return site as EventSite;
}

function validStartsAt(startsAt: Date): Date {
  if (!isDuringGames(startsAt)) {
    throw new EventError(
      'EVENT_DATE_OUTSIDE_GAMES',
      `An event must start between ${GAMES_PERIOD.start} and ${GAMES_PERIOD.end}`,
    );
  }
  return startsAt;
}
