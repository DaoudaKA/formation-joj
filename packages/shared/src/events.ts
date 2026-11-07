import { z } from 'zod';

/** Liste fermée des sites des Jeux : un nouveau site s'ajoute ici, puis dans une migration. */
export const EVENT_SITES = ['dakar', 'diamniadio', 'saly'] as const;
export const eventSiteSchema = z.enum(EVENT_SITES);
export type EventSite = z.infer<typeof eventSiteSchema>;

/** Statuts dans l'ordre où une épreuve les traverse : l'ordre fait la règle. */
export const EVENT_STATUSES = ['scheduled', 'in-progress', 'finished'] as const;
export const eventStatusSchema = z.enum(EVENT_STATUSES);
export type EventStatus = z.infer<typeof eventStatusSchema>;

export const EVENT_NAME_MAX_LENGTH = 100;

/** Période des Jeux, bornes comprises, en heure de Dakar (UTC). */
export const GAMES_PERIOD = {
  start: '2026-10-31T00:00:00.000Z',
  end: '2026-11-13T23:59:59.999Z',
} as const;

/** Vrai si l'instant tombe dans la période des Jeux ; faux pour une date invalide. */
export function isDuringGames(date: Date): boolean {
  const time = date.getTime();
  return time >= Date.parse(GAMES_PERIOD.start) && time <= Date.parse(GAMES_PERIOD.end);
}

/** Corps de `POST /api/events`. Un `status` envoyé est retiré : l'épreuve naît à venir. */
export const createEventSchema = z.object({
  disciplineId: z.uuid(),
  name: z.string().trim().min(1).max(EVENT_NAME_MAX_LENGTH),
  site: eventSiteSchema,
  // `abort` : une date mal formée ne donne qu'une erreur, pas aussi celle de la période.
  startsAt: z.iso
    .datetime({ offset: true, abort: true })
    .refine((value) => isDuringGames(new Date(value)), {
      message: `The event must start between ${GAMES_PERIOD.start} and ${GAMES_PERIOD.end}`,
    }),
});
export type CreateEventInput = z.infer<typeof createEventSchema>;

/** Corps de `PATCH /api/events/:eventId/status` : le statut visé. */
export const changeEventStatusSchema = z.object({ status: eventStatusSchema });
export type ChangeEventStatusInput = z.infer<typeof changeEventStatusSchema>;

/** Paramètre `:eventId` des routes d'une épreuve. */
export const eventIdParamsSchema = z.object({ eventId: z.uuid() });

/** Une épreuve telle que l'API la renvoie. */
export const eventSchema = z.object({
  id: z.uuid(),
  disciplineId: z.uuid(),
  name: z.string(),
  site: eventSiteSchema,
  startsAt: z.iso.datetime(),
  status: eventStatusSchema,
  createdAt: z.iso.datetime(),
});
export type EventResponse = z.infer<typeof eventSchema>;
