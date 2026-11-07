import type { INestApplication } from '@nestjs/common';
import { disciplineSchema, registrationSchema, slotSchema } from '@joj/shared';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTestApp } from './create-test-app';

const UNKNOWN_ID = '0199f5c2-0000-7000-8000-0000000000ff';

describe('/api/slots (e2e)', () => {
  let app: INestApplication;
  let lutteId: string;
  const api = () => request(app.getHttpServer());

  const slotBody = (overrides: Record<string, unknown> = {}) => ({
    disciplineId: lutteId,
    startsAt: '2026-11-01T09:00:00.000Z',
    endsAt: '2026-11-01T12:00:00.000Z',
    capacity: 2,
    ...overrides,
  });

  const openSlot = async (capacity = 2): Promise<string> => {
    const response = await api().post('/api/slots').send(slotBody({ capacity })).expect(201);
    return slotSchema.parse(response.body).id;
  };

  const register = (slotId: string, name: string, email = `${name.toLowerCase()}@example.sn`) =>
    api().post(`/api/slots/${slotId}/registrations`).send({ name, email });

  beforeAll(async () => {
    app = await createTestApp();
    const response = await api()
      .post('/api/disciplines')
      .send({ name: 'Lutte', category: 'sports-de-combat' })
      .expect(201);
    lutteId = disciplineSchema.parse(response.body).id;
  });

  afterAll(() => app?.close());

  it('001-AS1: opens a slot (201) with its discipline, times, capacity and no registration', async () => {
    const response = await api().post('/api/slots').send(slotBody()).expect(201);

    expect(slotSchema.parse(response.body)).toMatchObject({
      disciplineId: lutteId,
      startsAt: '2026-11-01T09:00:00.000Z',
      endsAt: '2026-11-01T12:00:00.000Z',
      capacity: 2,
      registeredCount: 0,
    });
  });

  it.each([0, -1, 1.5, undefined])(
    '001-AS2: rejects a capacity of %s (400, RFC 9457)',
    async (capacity) => {
      const response = await api().post('/api/slots').send(slotBody({ capacity })).expect(400);

      expect(response.headers['content-type']).toMatch(/application\/problem\+json/);
      expect(response.body).toMatchObject({ status: 400, code: 'VALIDATION_FAILED' });
      expect(response.body.errors).toEqual([expect.objectContaining({ path: 'capacity' })]);
    },
  );

  it.each([
    ['an end equal to the start', { endsAt: '2026-11-01T09:00:00.000Z' }, 'endsAt'],
    ['an end before the start', { endsAt: '2026-11-01T08:00:00.000Z' }, 'endsAt'],
    ['a missing start', { startsAt: undefined }, 'startsAt'],
    ['a missing end', { endsAt: undefined }, 'endsAt'],
  ])('001-AS3: rejects %s (400)', async (_label, overrides, path) => {
    const response = await api().post('/api/slots').send(slotBody(overrides)).expect(400);

    expect(response.body).toMatchObject({ status: 400, code: 'VALIDATION_FAILED' });
    expect(response.body.errors).toEqual([expect.objectContaining({ path })]);
  });

  it('001-AS4: rejects a slot for an unknown discipline (404, SLOT_DISCIPLINE_NOT_FOUND)', async () => {
    const response = await api()
      .post('/api/slots')
      .send(slotBody({ disciplineId: UNKNOWN_ID }))
      .expect(404);

    expect(response.body).toMatchObject({ status: 404, code: 'SLOT_DISCIPLINE_NOT_FOUND' });
  });

  it('001-AS5: registers a volunteer (201) with a trimmed name and email', async () => {
    const slotId = await openSlot();

    const response = await register(slotId, '  Awa Diop ', ' awa@example.sn ').expect(201);

    expect(registrationSchema.parse(response.body)).toMatchObject({
      slotId,
      name: 'Awa Diop',
      email: 'awa@example.sn',
    });
  });

  it.each([
    ['an empty name', { name: '   ', email: 'awa@example.sn' }, 'name'],
    ['a missing email', { name: 'Awa Diop' }, 'email'],
    ['a malformed email', { name: 'Awa Diop', email: 'awa@' }, 'email'],
  ])('001-AS6: rejects %s (400) without taking a place', async (_label, body, path) => {
    const slotId = await openSlot(1);

    const response = await api().post(`/api/slots/${slotId}/registrations`).send(body).expect(400);

    expect(response.body).toMatchObject({ status: 400, code: 'VALIDATION_FAILED' });
    expect(response.body.errors).toEqual([expect.objectContaining({ path })]);
    // La seule place est toujours libre : le refus n'a rien compté.
    await register(slotId, 'Moussa').expect(201);
  });

  it('001-AS7: rejects a registration on a full slot (409, SLOT_FULL)', async () => {
    const slotId = await openSlot(2);
    await register(slotId, 'Awa').expect(201);
    await register(slotId, 'Moussa').expect(201);

    const response = await register(slotId, 'Fatou').expect(409);

    expect(response.body).toMatchObject({ status: 409, code: 'SLOT_FULL' });
  });

  it('001-AS9: rejects a registration on an unknown slot (404, SLOT_NOT_FOUND)', async () => {
    const response = await register(UNKNOWN_ID, 'Awa').expect(404);

    expect(response.body).toMatchObject({ status: 404, code: 'SLOT_NOT_FOUND' });
  });
});
