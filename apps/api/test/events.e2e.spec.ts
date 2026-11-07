import type { INestApplication } from '@nestjs/common';
import { disciplineSchema, eventSchema } from '@joj/shared';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTestApp } from './create-test-app';

const UNKNOWN_ID = '0199f5c2-0000-7000-8000-0000000000ff';

describe('/api/events (e2e)', () => {
  let app: INestApplication;
  let lutteId: string;
  const api = () => request(app.getHttpServer());

  const eventBody = (overrides: Record<string, unknown> = {}) => ({
    disciplineId: lutteId,
    name: 'Lutte -60 kg garçons',
    site: 'diamniadio',
    startsAt: '2026-11-03T10:00:00.000Z',
    ...overrides,
  });

  const createEvent = async (): Promise<string> => {
    const response = await api().post('/api/events').send(eventBody()).expect(201);
    return eventSchema.parse(response.body).id;
  };

  const changeStatus = (eventId: string, body: Record<string, unknown>) =>
    api().patch(`/api/events/${eventId}/status`).send(body);

  /** Une épreuve amenée au statut voulu par les transitions permises. */
  const eventWithStatus = async (status: 'in-progress' | 'finished'): Promise<string> => {
    const eventId = await createEvent();
    await changeStatus(eventId, { status: 'in-progress' }).expect(200);
    if (status === 'finished') await changeStatus(eventId, { status: 'finished' }).expect(200);
    return eventId;
  };

  beforeAll(async () => {
    app = await createTestApp();
    const response = await api()
      .post('/api/disciplines')
      .send({ name: 'Lutte', category: 'sports-de-combat' })
      .expect(201);
    lutteId = disciplineSchema.parse(response.body).id;
  });

  afterAll(() => app?.close());

  it('002-AS1: creates a scheduled event (201) with its trimmed name, even if a status is sent', async () => {
    const response = await api()
      .post('/api/events')
      .send(eventBody({ name: '  Lutte -60 kg garçons  ', status: 'finished' }))
      .expect(201);

    expect(eventSchema.parse(response.body)).toMatchObject({
      disciplineId: lutteId,
      name: 'Lutte -60 kg garçons',
      site: 'diamniadio',
      startsAt: '2026-11-03T10:00:00.000Z',
      status: 'scheduled',
    });
  });

  it.each([
    ['a missing name', undefined],
    ['an empty name', ''],
    ['a name of spaces', '   '],
    ['a name of 101 characters', 'a'.repeat(101)],
  ])('002-AS2: rejects %s (400, RFC 9457)', async (_label, name) => {
    const response = await api().post('/api/events').send(eventBody({ name })).expect(400);

    expect(response.headers['content-type']).toMatch(/application\/problem\+json/);
    expect(response.body).toMatchObject({ status: 400, code: 'VALIDATION_FAILED' });
    expect(response.body.errors).toEqual([expect.objectContaining({ path: 'name' })]);
  });

  it.each([
    ['a missing site', undefined],
    ['a site outside the list', 'Thiès'],
  ])('002-AS3: rejects %s (400)', async (_label, site) => {
    const response = await api().post('/api/events').send(eventBody({ site })).expect(400);

    expect(response.body).toMatchObject({ status: 400, code: 'VALIDATION_FAILED' });
    expect(response.body.errors).toEqual([expect.objectContaining({ path: 'site' })]);
  });

  it.each([
    ['a missing date', undefined],
    ['a malformed date', '3 novembre 2026 10h'],
    ['a date before the Games', '2026-10-30T23:59:00.000Z'],
    ['a date after the Games', '2026-11-14T00:00:00.000Z'],
  ])('002-AS4: rejects %s (400)', async (_label, startsAt) => {
    const response = await api().post('/api/events').send(eventBody({ startsAt })).expect(400);

    expect(response.body).toMatchObject({ status: 400, code: 'VALIDATION_FAILED' });
    expect(response.body.errors).toEqual([expect.objectContaining({ path: 'startsAt' })]);
  });

  it('002-AS5: rejects an event for an unknown discipline (404, EVENT_DISCIPLINE_NOT_FOUND)', async () => {
    const response = await api()
      .post('/api/events')
      .send(eventBody({ disciplineId: UNKNOWN_ID }))
      .expect(404);

    expect(response.body).toMatchObject({ status: 404, code: 'EVENT_DISCIPLINE_NOT_FOUND' });
  });

  it('002-AS6: moves an event to in progress, then to finished (200)', async () => {
    const eventId = await createEvent();

    const inProgress = await changeStatus(eventId, { status: 'in-progress' }).expect(200);
    expect(eventSchema.parse(inProgress.body)).toMatchObject({
      id: eventId,
      status: 'in-progress',
    });

    const finished = await changeStatus(eventId, { status: 'finished' }).expect(200);
    expect(eventSchema.parse(finished.body)).toMatchObject({ id: eventId, status: 'finished' });
  });

  it('002-AS7: refuses to skip a status (422, EVENT_STATUS_TRANSITION_INVALID)', async () => {
    const eventId = await createEvent();

    const response = await changeStatus(eventId, { status: 'finished' }).expect(422);

    expect(response.body).toMatchObject({ status: 422, code: 'EVENT_STATUS_TRANSITION_INVALID' });
    // Toujours à venir : le passage en cours reste permis.
    await changeStatus(eventId, { status: 'in-progress' }).expect(200);
  });

  it.each([
    ['finished', 'in-progress'],
    ['finished', 'scheduled'],
    ['finished', 'finished'],
    ['in-progress', 'scheduled'],
    ['in-progress', 'in-progress'],
  ] as const)(
    '002-AS8: refuses to move a %s event back or in place to %s (422)',
    async (from, to) => {
      const eventId = await eventWithStatus(from);

      const response = await changeStatus(eventId, { status: to }).expect(422);

      expect(response.body).toMatchObject({
        status: 422,
        code: 'EVENT_STATUS_TRANSITION_INVALID',
      });
    },
  );

  it('002-AS8: keeps an in-progress event in progress after a refused move back', async () => {
    const eventId = await eventWithStatus('in-progress');
    await changeStatus(eventId, { status: 'scheduled' }).expect(422);

    // Toujours en cours : le passage à terminée reste permis.
    const response = await changeStatus(eventId, { status: 'finished' }).expect(200);
    expect(eventSchema.parse(response.body).status).toBe('finished');
  });

  it.each([
    ['a missing status', {}],
    ['an unknown status', { status: 'annulée' }],
  ])('002-AS9: rejects %s (400) and keeps the event scheduled', async (_label, body) => {
    const eventId = await createEvent();

    const response = await changeStatus(eventId, body).expect(400);

    expect(response.body).toMatchObject({ status: 400, code: 'VALIDATION_FAILED' });
    expect(response.body.errors).toEqual([expect.objectContaining({ path: 'status' })]);
    await changeStatus(eventId, { status: 'in-progress' }).expect(200);
  });

  it('002-AS10: rejects a status change on an unknown event (404, EVENT_NOT_FOUND)', async () => {
    const response = await changeStatus(UNKNOWN_ID, { status: 'in-progress' }).expect(404);

    expect(response.body).toMatchObject({ status: 404, code: 'EVENT_NOT_FOUND' });
  });
});
