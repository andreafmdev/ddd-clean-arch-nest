import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { MikroORM } from '@mikro-orm/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from '../../../src/app.module';

export async function initializeApp(): Promise<{
  app: INestApplication;
  orm: MikroORM;
}> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();
  
  // ═══════════════════════════════════════════════════
  // Usa FastifyAdapter anche nei test (come in main.ts)
  // ═══════════════════════════════════════════════════
  const app = moduleFixture.createNestApplication<NestFastifyApplication>(
    new FastifyAdapter(),
  );
  
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  
  // ═══════════════════════════════════════════════════
  // IMPORTANTE: Con Fastify, devi chiamare listen() prima di usare getHttpServer()
  // Usa porta 0 per assegnare una porta casuale disponibile
  // ═══════════════════════════════════════════════════
  await app.init();
  await app.listen(0); // Porta 0 = porta casuale disponibile
  
  const orm = app.get<MikroORM>(MikroORM);
  return { app, orm };
}

export async function resetDatabase(orm: MikroORM): Promise<void> {
  await clearDatabase(orm);
  await orm.getMigrator().up();
}

export async function clearDatabase(orm: MikroORM): Promise<void> {
  await orm.getSchemaGenerator().refreshDatabase();
  await orm.getSchemaGenerator().updateSchema();
  await orm.getMigrator().down();
  await orm.getSchemaGenerator().updateSchema();
}
