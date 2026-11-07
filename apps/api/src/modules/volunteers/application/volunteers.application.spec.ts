import { describe, expect, it } from 'vitest';
import { InMemorySlotRepository } from './testing/in-memory-slot.repository';
import { OpenSlot } from './use-cases/open-slot';
import { RegisterVolunteer } from './use-cases/register-volunteer';

const LUTTE_ID = '0199f5c2-0000-7000-8000-000000000001';
const UNKNOWN_ID = '0199f5c2-0000-7000-8000-0000000000ff';

function setup() {
  const slots = new InMemorySlotRepository([LUTTE_ID]);
  return { slots, openSlot: new OpenSlot(slots), registerVolunteer: new RegisterVolunteer(slots) };
}

const lutteSlot = (disciplineId = LUTTE_ID) => ({
  disciplineId,
  startsAt: '2026-11-01T09:00:00.000Z',
  endsAt: '2026-11-01T12:00:00.000Z',
  capacity: 2,
});

describe('volunteers (application layer)', () => {
  it('001-AS4: refuses a slot for an unknown discipline', async () => {
    const { slots, openSlot } = setup();
    await expect(openSlot.execute(lutteSlot(UNKNOWN_ID))).rejects.toMatchObject({
      code: 'SLOT_DISCIPLINE_NOT_FOUND',
      kind: 'NOT_FOUND',
    });
    expect(slots.count()).toBe(0);
  });

  it('001-AS5: registers a volunteer with a trimmed name and email, and counts 1 registration', async () => {
    const { slots, openSlot, registerVolunteer } = setup();
    const slot = await openSlot.execute(lutteSlot());

    const registration = await registerVolunteer.execute(slot.id, {
      name: '  Awa Diop ',
      email: ' awa@example.sn ',
    });

    expect(registration).toMatchObject({
      slotId: slot.id,
      name: 'Awa Diop',
      email: 'awa@example.sn',
    });
    expect((await slots.findById(slot.id))?.registeredCount).toBe(1);
  });

  it('001-AS9: refuses a registration on an unknown slot', async () => {
    const { registerVolunteer } = setup();
    await expect(
      registerVolunteer.execute(UNKNOWN_ID, { name: 'Awa Diop', email: 'awa@example.sn' }),
    ).rejects.toMatchObject({ code: 'SLOT_NOT_FOUND', kind: 'NOT_FOUND' });
  });
});
