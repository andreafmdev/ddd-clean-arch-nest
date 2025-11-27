import { defineConfig } from '@mikro-orm/postgresql';
import { Migrator } from '@mikro-orm/migrations';
import { ConfigService } from '@nestjs/config';

// Funzione factory per ottenere la configurazione
export default (configService: ConfigService) =>
  defineConfig({
    entities: ['dist/**/*.entity.js'],
    entitiesTs: ['src/**/*.entity.ts'],
    dbName: configService.get<string>('database.name'),
    host: configService.get<string>('database.host'),
    port: configService.get<number>('database.port'),
    user: configService.get<string>('database.user'),
    password: configService.get<string>('database.password'),
    extensions: [Migrator],
    migrations: {
      tableName: 'migrations',
      path: 'src/config/database/migrations',
    },
  });
