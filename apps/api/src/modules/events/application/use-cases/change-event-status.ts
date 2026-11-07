import { Injectable } from '@nestjs/common';
import type { ChangeEventStatusInput } from '@joj/shared';
import type { Event } from '../../domain/event';
import { eventNotFound } from '../../domain/events.errors';
import { EventRepository } from '../event.repository';

@Injectable()
export class ChangeEventStatus {
  constructor(private readonly events: EventRepository) {}

  async execute(id: string, input: ChangeEventStatusInput): Promise<Event> {
    const event = await this.events.findById(id);
    if (!event) throw eventNotFound(id);
    event.changeStatus(input.status);
    await this.events.update(event);
    return event;
  }
}
