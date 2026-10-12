import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test } from '@nestjs/testing';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { DataSource } from 'typeorm';
import { healthResponseSchema } from '@sapiensmetric/contracts';
import { HealthController } from './health.controller.js';

describe('GET /health (HTTP)', () => {
  let app: NestFastifyApplication;
  let queryOk = true;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: DataSource,
          useValue: {
            query: () =>
              queryOk ? Promise.resolve([{ '1': 1 }]) : Promise.reject(new Error('db down')),
          },
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns HTTP 200 and a body that satisfies the shared health contract', async () => {
    const instance = app.getHttpAdapter().getInstance();
    const response = await instance.inject({
      method: 'GET',
      url: '/health',
    });

    expect(response.statusCode).toBe(200);

    const body = healthResponseSchema.parse(JSON.parse(response.body));
    expect(body.status).toBe('ok');
    expect(Number.isNaN(Date.parse(body.timestamp))).toBe(false);
  });

  it('readiness returns 200 when the database answers', async () => {
    queryOk = true;
    const response = await app.getHttpAdapter().getInstance().inject({
      method: 'GET',
      url: '/health/ready',
    });
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual({ status: 'ok' });
  });

  it('readiness returns 503 when the database is unavailable', async () => {
    queryOk = false;
    const response = await app.getHttpAdapter().getInstance().inject({
      method: 'GET',
      url: '/health/ready',
    });
    expect(response.statusCode).toBe(503);
  });
});
