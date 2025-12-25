import { Controller, Get, Req } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  DiskHealthIndicator,
  HealthCheck,
  HealthCheckService,
  HttpHealthIndicator,
  MikroOrmHealthIndicator,
} from '@nestjs/terminus';
import { FastifyRequest } from 'fastify';
import { Unprotected } from 'nest-keycloak-connect';
import { platform } from 'os';
@ApiTags('Health')
@Controller({
  path: 'health',
})
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private http: HttpHealthIndicator,
    private db: MikroOrmHealthIndicator,
    private readonly disk: DiskHealthIndicator,
  ) {}

  @Unprotected()
  @Get()
  @HealthCheck()
  @ApiOperation({
    summary: 'Health check',
    description:
      'Verify the health of the application, database, external connectivity and storage',
  })
  @ApiResponse({
    status: 200,
    description: 'All services are operational',
  })
  @ApiResponse({
    status: 503,
    description: 'One or more services are not available',
  })
  check() {
    // Determina il percorso root in base al sistema operativo
    const rootPath =
      platform() === 'win32' ? process.cwd().split('\\')[0] + '\\' : '/';

    return this.health.check([
      () => this.http.pingCheck('external-connectivity', 'https://google.com'),
      () => this.db.pingCheck('database'),
      () =>
        this.disk.checkStorage('storage', {
          path: rootPath,
          thresholdPercent: 0.8,
        }),
    ]);
  }
  @Unprotected()
  @Get('test-logging')
  @ApiOperation({
    summary: 'Test logging',
    description: 'Test endpoint to verify structured logging and Request ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Test completed, check the logs for the output',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Check console/logs for logging output',
        },
        requestId: {
          type: 'string',
          example: 'abc-123-def-456',
        },
        timestamp: {
          type: 'string',
          format: 'date-time',
          example: '2025-12-25T11:35:24.123Z',
        },
      },
    },
  })
  testLogging(@Req() req: FastifyRequest) {
    // Il logger è disponibile tramite req.log (Fastify)
    req.log.info({ test: true }, 'Test log message');
    req.log.warn({ test: true }, 'Test warning');
    req.log.error({ test: true }, 'Test error');

    return {
      message: 'Check console/logs for logging output',
      requestId: req.id,
      timestamp: new Date().toISOString(),
    };
  }
}
