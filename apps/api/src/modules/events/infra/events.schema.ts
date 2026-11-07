// Lu par drizzle-kit pour générer les migrations : ce fichier n'importe que drizzle-orm.
import { sql } from 'drizzle-orm';
import { check, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { disciplines } from '../../disciplines/infra/disciplines.schema';

export const events = pgTable(
  'events',
  {
    id: uuid('id').primaryKey(),
    // La clé étrangère garantit qu'une épreuve appartient à une discipline existante.
    disciplineId: uuid('discipline_id')
      .notNull()
      .references(() => disciplines.id),
    // Pas d'unicité : deux épreuves peuvent porter le même nom.
    name: varchar('name', { length: 100 }).notNull(),
    site: varchar('site', { length: 50 }).notNull(),
    // Précision milliseconde = celle de Date en JavaScript.
    startsAt: timestamp('starts_at', { withTimezone: true, precision: 3 }).notNull(),
    status: varchar('status', { length: 20 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, precision: 3 }).notNull(),
  },
  (table) => [
    // Mêmes listes que EVENT_SITES et EVENT_STATUSES ; la période des Jeux et l'ordre des
    // statuts restent des règles du domaine.
    check('events_site_check', sql`${table.site} IN ('dakar', 'diamniadio', 'saly')`),
    check('events_status_check', sql`${table.status} IN ('scheduled', 'in-progress', 'finished')`),
  ],
);

export type EventRow = typeof events.$inferSelect;
