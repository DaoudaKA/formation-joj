import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import type { CreateEventInput } from '@joj/shared';
import { Event } from '../../domain/event';
import { eventDisciplineNotFound } from '../../domain/events.errors';
import { EventRepository } from '../event.repository';

@Injectable()
export class CreateEvent {
  constructor(private readonly events: EventRepository) {}

  async execute(input: CreateEventInput): Promise<Event> {
    const event = Event.create({
      id: randomUUID(),
      disciplineId: input.disciplineId,
      name: input.name,
      site: input.site,
      startsAt: new Date(input.startsAt),
      now: new Date(),
    });
    // Message clair dans le cas courant ; la clé étrangère couvre une discipline supprimée entre-temps.
    if (!(await this.events.disciplineExists(event.disciplineId))) {
      throw eventDisciplineNotFound(event.disciplineId);
    }
    await this.events.insert(event);
    return event;
  }
}
