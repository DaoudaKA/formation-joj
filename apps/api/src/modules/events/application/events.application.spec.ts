import { describe, expect, it } from 'vitest';
import { InMemoryEventRepository } from './testing/in-memory-event.repository';
import { ChangeEventStatus } from './use-cases/change-event-status';
import { CreateEvent } from './use-cases/create-event';

const LUTTE_ID = '0199f5c2-0000-7000-8000-000000000001';
const UNKNOWN_ID = '0199f5c2-0000-7000-8000-0000000000ff';

function setup() {
  const events = new InMemoryEventRepository([LUTTE_ID]);
  return {
    events,
    createEvent: new CreateEvent(events),
    changeEventStatus: new ChangeEventStatus(events),
  };
}

const lutteEvent = (disciplineId = LUTTE_ID) => ({
  disciplineId,
  name: 'Lutte -60 kg garçons',
  site: 'diamniadio' as const,
  startsAt: '2026-11-03T10:00:00.000Z',
});

describe('events (application layer)', () => {
  it('002-AS5: refuses an event for an unknown discipline', async () => {
    const { events, createEvent } = setup();
    await expect(createEvent.execute(lutteEvent(UNKNOWN_ID))).rejects.toMatchObject({
      code: 'EVENT_DISCIPLINE_NOT_FOUND',
      kind: 'NOT_FOUND',
    });
    expect(events.count()).toBe(0);
  });

  it('002-AS6: saves an event moved to in progress, then to finished', async () => {
    const { events, createEvent, changeEventStatus } = setup();
    const event = await createEvent.execute(lutteEvent());

    expect(await changeEventStatus.execute(event.id, { status: 'in-progress' })).toMatchObject({
      status: 'in-progress',
    });
    expect((await events.findById(event.id))?.status).toBe('in-progress');

    await changeEventStatus.execute(event.id, { status: 'finished' });
    expect((await events.findById(event.id))?.status).toBe('finished');
  });

  it('002-AS10: refuses a status change on an unknown event', async () => {
    const { changeEventStatus } = setup();
    await expect(
      changeEventStatus.execute(UNKNOWN_ID, { status: 'in-progress' }),
    ).rejects.toMatchObject({ code: 'EVENT_NOT_FOUND', kind: 'NOT_FOUND' });
  });
});
