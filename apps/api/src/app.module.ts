import { Module } from '@nestjs/common';
import { CoreModule } from './core/core.module';
import { DisciplinesModule } from './modules/disciplines/disciplines.module';
import { EventsModule } from './modules/events/events.module';
import { VolunteersModule } from './modules/volunteers/volunteers.module';

@Module({
  imports: [CoreModule, DisciplinesModule, EventsModule, VolunteersModule],
})
export class AppModule {}
