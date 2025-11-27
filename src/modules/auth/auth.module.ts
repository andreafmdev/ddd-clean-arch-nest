// src/modules/auth/auth.module.ts
import { Module, DynamicModule, Global, Logger } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import {
  KeycloakConnectModule,
  AuthGuard as KeycloakAuthGuard,
  RoleGuard as KeycloakRoleGuard,
} from 'nest-keycloak-connect';
import { KeycloakConfigService } from './infrastructure/keycloak/keycloak-config.service';
import { SupabaseStrategy } from './strategies/supabase.strategy';
import { SupabaseAuthGuard } from './guards/supabase-auth.guard';
import { AuthProvider } from './providers/auth-provider.enum';
import { SupabaseRoleGuard } from './guards/supabase-role.guard';

@Global()
@Module({})
export class AuthModule {
  private static readonly logger = new Logger(AuthModule.name);

  static forRoot(): DynamicModule {
    // Usa process.env perché questo metodo è statico e viene chiamato prima dell'inizializzazione
    // La validazione è già gestita da Joi nello schema di validazione
    const provider =
      (process.env.AUTH_PROVIDER as AuthProvider) || AuthProvider.KEYCLOAK;

    this.logger.log(`Initializing AuthModule with provider: ${provider}`);

    switch (provider) {
      case AuthProvider.KEYCLOAK:
        return this.forKeycloak();
      case AuthProvider.SUPABASE:
        return this.forSupabase();
      default:
        throw new Error(
          `Unsupported auth provider: ${provider}. Supported: ${Object.values(AuthProvider).join(', ')}`,
        );
    }
  }

  private static forKeycloak(): DynamicModule {
    return {
      module: AuthModule,
      imports: [
        ConfigModule,
        KeycloakConnectModule.registerAsync({
          imports: [ConfigModule],
          useClass: KeycloakConfigService,
        }),
      ],
      providers: [
        KeycloakConfigService,
        {
          provide: APP_GUARD,
          useClass: KeycloakAuthGuard,
        },
        {
          provide: APP_GUARD,
          useClass: KeycloakRoleGuard,
        },
      ],
      exports: [],
    };
  }

  private static forSupabase(): DynamicModule {
    return {
      module: AuthModule,
      imports: [
        ConfigModule,
        PassportModule.register({ defaultStrategy: 'supabase' }),
      ],
      providers: [
        SupabaseStrategy,
        {
          provide: APP_GUARD,
          useClass: SupabaseAuthGuard,
        },
        {
          provide: APP_GUARD,
          useClass: SupabaseRoleGuard,
        },
      ],
      exports: [],
    };
  }
}
