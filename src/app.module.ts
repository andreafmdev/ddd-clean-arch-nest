import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import mikroOrmConfig from './config/database/mikro-orm.config';
import { ThrottlerModule } from '@nestjs/throttler';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { UserModule } from './modules/user/user.module';
import { HealthModule } from './modules/health/health.module';
import { CqrsModule } from '@nestjs/cqrs';
import { CommunicationModule } from './modules/communication/communication.module';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { AuthModule } from './modules/auth/auth.module';
import { validationSchema } from './config/env/validation.schema';
import appConfig, {
  databaseConfig,
  authConfig,
} from './config/env/configuration';

@Module({
  imports: [
    HttpModule,
    CqrsModule.forRoot(),
    CacheModule.register({
      isGlobal: true,
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      // load the correct .env file based on NODE_ENV or ENVIRONMENT variable
      envFilePath: [
        `.env.${process.env.ENVIRONMENT || process.env.NODE_ENV || 'local'}`,
        '.env', // fallback
      ],
      // Valida le variabili d'ambiente all'avvio
      validationSchema,
      // Carica le configurazioni tipizzate
      load: [appConfig, databaseConfig, authConfig],
      // Valida che tutte le variabili richieste siano presenti
      validationOptions: {
        allowUnknown: true, // Permetti variabili non definite nello schema
        abortEarly: true, // Ferma alla prima validazione fallita
      },
    }),
    MikroOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return {
          ...mikroOrmConfig(configService),
          allowGlobalContext: true,
        };
      },
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
    }),
    ThrottlerModule.forRoot([
      {
        name: '100_CALL_PER_MINUTE',
        ttl: 60000,
        limit: 100,
      },
    ]),
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),
    HealthModule,
    UserModule,
    CommunicationModule,
    AuthModule.forRoot(),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
