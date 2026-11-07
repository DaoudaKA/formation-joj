import { Module } from '@nestjs/common';
import { EventRepository } from './application/event.repository';
import { ChangeEventStatus } from './application/use-cases/change-event-status';
import { CreateEvent } from './application/use-cases/create-event';
import { EventsController } from './http/events.controller';
import { DrizzleEventRepository } from './infra/drizzle-event.repository';

@Module({
  controllers: [EventsController],
  providers: [
    // Le port (classe abstraite) est relié ici à son implémentation Drizzle.
    { provide: EventRepository, useClass: DrizzleEventRepository },
    CreateEvent,
    ChangeEventStatus,
  ],
})
export class EventsModule {}
