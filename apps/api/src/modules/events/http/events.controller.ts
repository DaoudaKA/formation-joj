import { Body, Controller, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  changeEventStatusSchema,
  createEventSchema,
  eventIdParamsSchema,
  type EventResponse,
  eventSchema,
} from '@joj/shared';
import { createZodDto, ZodSerializerDto } from 'nestjs-zod';
import { ChangeEventStatus } from '../application/use-cases/change-event-status';
import { CreateEvent } from '../application/use-cases/create-event';
import type { Event } from '../domain/event';

class CreateEventDto extends createZodDto(createEventSchema) {}
class ChangeEventStatusDto extends createZodDto(changeEventStatusSchema) {}
class EventIdParamsDto extends createZodDto(eventIdParamsSchema) {}
class EventDto extends createZodDto(eventSchema) {}

/** Couche fine : valider (DTO zod), appeler un cas d'usage, sérialiser. Aucune règle métier ici. */
@ApiTags('events')
@Controller('events')
export class EventsController {
  constructor(
    private readonly createEvent: CreateEvent,
    private readonly changeEventStatus: ChangeEventStatus,
  ) {}

  @Post()
  @ZodSerializerDto(EventDto)
  async create(@Body() body: CreateEventDto): Promise<EventResponse> {
    return toEventResponse(await this.createEvent.execute(body));
  }

  @Patch(':eventId/status')
  @ZodSerializerDto(EventDto)
  async changeStatus(
    @Param() { eventId }: EventIdParamsDto,
    @Body() body: ChangeEventStatusDto,
  ): Promise<EventResponse> {
    return toEventResponse(await this.changeEventStatus.execute(eventId, body));
  }
}

function toEventResponse(event: Event): EventResponse {
  return {
    id: event.id,
    disciplineId: event.disciplineId,
    name: event.name,
    site: event.site,
    startsAt: event.startsAt.toISOString(),
    status: event.status,
    createdAt: event.createdAt.toISOString(),
  };
}
