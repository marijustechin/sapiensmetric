import {
  Controller,
  Get,
  Inject,
  ServiceUnavailableException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
  HealthResponse,
  healthResponseSchema,
  readinessResponseSchema,
  type ReadinessResponse,
} from '@sapiensmetric/contracts';

@Controller('health')
export class HealthController {
  constructor(@Inject(DataSource) private readonly dataSource: DataSource) {}

  /** Liveness: the process is up. Does not touch the database. */
  @Get()
  getHealth(): HealthResponse {
    const response: HealthResponse = {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
    return healthResponseSchema.parse(response);
  }

  /**
   * Readiness (T-023): the process can serve requests AND the database answers.
   * Used by the container healthcheck; returns 503 when the database is down so
   * orchestration does not route traffic to an unready replica.
   */
  @Get('ready')
  async getReady(): Promise<ReadinessResponse> {
    try {
      await this.dataSource.query('SELECT 1');
    } catch {
      throw new ServiceUnavailableException({ status: 'unavailable' });
    }
    return readinessResponseSchema.parse({ status: 'ok' });
  }
}
