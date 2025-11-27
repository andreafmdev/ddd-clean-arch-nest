import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  KeycloakConnectOptions,
  KeycloakConnectOptionsFactory,
  PolicyEnforcementMode,
  TokenValidation,
} from 'nest-keycloak-connect';

@Injectable()
export class KeycloakConfigService implements KeycloakConnectOptionsFactory {
  constructor(private readonly configService: ConfigService) {}

  createKeycloakConnectOptions(): KeycloakConnectOptions {
    // Usa i namespace dalla configurazione tipizzata
    const authConfig = this.configService.get('auth');
    const keycloak = authConfig?.keycloak;

    if (!keycloak?.authServerUrl || !keycloak?.realm || !keycloak?.clientId) {
      throw new Error('Missing required Keycloak configuration');
    }

    return {
      authServerUrl: keycloak.authServerUrl,
      realm: keycloak.realm,
      clientId: keycloak.clientId,
      secret: keycloak.clientSecret || '',
      policyEnforcement: PolicyEnforcementMode.PERMISSIVE,
      tokenValidation: TokenValidation.ONLINE,
    };
  }
}
