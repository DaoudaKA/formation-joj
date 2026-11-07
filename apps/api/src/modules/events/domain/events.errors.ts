import { AppError, type ErrorKind } from '../../../core/errors/app-error';

/** Codes stables exposés aux clients ; la catégorie décide du statut HTTP. */
const EVENT_ERROR_KINDS = {
  /** Nom vide, ou fait seulement d'espaces. */
  EVENT_NAME_REQUIRED: 'VALIDATION',
  /** Nom de plus de 100 caractères une fois les espaces retirés. */
  EVENT_NAME_TOO_LONG: 'VALIDATION',
  /** Site absent de la liste des sites des Jeux. */
  EVENT_SITE_UNKNOWN: 'VALIDATION',
  /** Date invalide ou hors de la période des Jeux. */
  EVENT_DATE_OUTSIDE_GAMES: 'VALIDATION',
  /** La discipline de l'épreuve n'existe pas. */
  EVENT_DISCIPLINE_NOT_FOUND: 'NOT_FOUND',
  /** Le statut demandé n'est pas celui qui suit immédiatement le statut actuel. */
  EVENT_STATUS_TRANSITION_INVALID: 'BUSINESS_RULE',
  /** Statut absent de la liste des statuts. */
  EVENT_STATUS_UNKNOWN: 'VALIDATION',
  /** Aucune épreuve n'a cet identifiant. */
  EVENT_NOT_FOUND: 'NOT_FOUND',
} as const satisfies Record<string, ErrorKind>;

export type EventErrorCode = keyof typeof EVENT_ERROR_KINDS;

export class EventError extends AppError<EventErrorCode> {
  constructor(code: EventErrorCode, message: string, details?: Record<string, unknown>) {
    super(code, EVENT_ERROR_KINDS[code], message, details);
  }
}

export function eventStatusTransitionInvalid(from: string, to: string): EventError {
  return new EventError(
    'EVENT_STATUS_TRANSITION_INVALID',
    `An event status moves forward one step at a time: ${from} cannot become ${to}`,
    { from, to },
  );
}

export function eventNotFound(id: string): EventError {
  return new EventError('EVENT_NOT_FOUND', `No event with id ${id}`, { id });
}

export function eventDisciplineNotFound(id: string): EventError {
  return new EventError('EVENT_DISCIPLINE_NOT_FOUND', `No discipline with id ${id}`, { id });
}
