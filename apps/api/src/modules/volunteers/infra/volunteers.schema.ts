// Lu par drizzle-kit pour générer les migrations : ce fichier n'importe que drizzle-orm.
import { sql } from 'drizzle-orm';
import { check, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { disciplines } from '../../disciplines/infra/disciplines.schema';

export const slots = pgTable(
  'slots',
  {
    id: uuid('id').primaryKey(),
    // La clé étrangère garantit qu'un créneau appartient à une discipline existante.
    disciplineId: uuid('discipline_id')
      .notNull()
      .references(() => disciplines.id),
    // Précision milliseconde = celle de Date en JavaScript.
    startsAt: timestamp('starts_at', { withTimezone: true, precision: 3 }).notNull(),
    endsAt: timestamp('ends_at', { withTimezone: true, precision: 3 }).notNull(),
    capacity: integer('capacity').notNull(),
    registeredCount: integer('registered_count').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true, precision: 3 }).notNull(),
  },
  (table) => [
    check('slots_capacity_check', sql`${table.capacity} >= 1`),
    check('slots_time_range_check', sql`${table.endsAt} > ${table.startsAt}`),
    // Dernier rempart : même deux inscriptions simultanées ne font pas déborder un créneau.
    check(
      'slots_registered_count_check',
      sql`${table.registeredCount} BETWEEN 0 AND ${table.capacity}`,
    ),
  ],
);

export const registrations = pgTable('registrations', {
  id: uuid('id').primaryKey(),
  slotId: uuid('slot_id')
    .notNull()
    .references(() => slots.id),
  name: text('name').notNull(),
  email: text('email').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, precision: 3 }).notNull(),
});

export type SlotRow = typeof slots.$inferSelect;
export type RegistrationRow = typeof registrations.$inferSelect;
