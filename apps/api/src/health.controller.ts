import { Controller, Get } from '@nestjs/common';
import {
  HealthResponse,
  healthResponseSchema,
} from '@sapiensmetric/contracts';

@Controller('health')
export class HealthController {
  @Get()
  getHealth(): HealthResponse {
    const response: HealthResponse = {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
    return healthResponseSchema.parse(response);
  }
}
