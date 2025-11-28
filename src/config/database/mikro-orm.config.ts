import { defineConfig } from '@mikro-orm/postgresql';
import { Migrator } from '@mikro-orm/migrations';
import { ConfigService } from '@nestjs/config';

// Funzione factory per ottenere la configurazione
// Preferisce ConfigService quando disponibile (NestJS), altrimenti usa process.env (CLI)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default (configService?: any) => {
  // Controlla se configService è un ConfigService valido
  // Verifica che esista, abbia il metodo get, e che get sia una funzione
  const isValidConfigService =
    configService &&
    typeof configService.get === 'function' &&
    configService instanceof ConfigService;

  // Se ConfigService è disponibile e valido (NestJS), usalo (preferenza)
  if (isValidConfigService) {
    return defineConfig({
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
  }

  // Fallback per CLI: usa process.env quando ConfigService non è disponibile
  return defineConfig({
    entities: ['dist/**/*.entity.js'],
    entitiesTs: ['src/**/*.entity.ts'],
    dbName: process.env.DATABASE_NAME || 'db-dev',
    host: process.env.DATABASE_HOST || '127.0.0.1',
    port: parseInt(process.env.DATABASE_PORT || '15432', 10),
    user: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres',
    extensions: [Migrator],
    migrations: {
      tableName: 'migrations',
      path: 'src/config/database/migrations',
    },
  });
};
