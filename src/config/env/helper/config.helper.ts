import { ConfigService } from '@nestjs/config';
import { DatabaseConfig, AuthConfig, AppConfig } from '../configuration';

export class ConfigHelper {
  constructor(private readonly configService: ConfigService) {}

  get app(): AppConfig {
    return this.configService.get<AppConfig>('app')!;
  }

  get database(): DatabaseConfig {
    return this.configService.get<DatabaseConfig>('database')!;
  }

  get auth(): AuthConfig {
    return this.configService.get<AuthConfig>('auth')!;
  }
}
