// src/modules/auth/strategies/supabase.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { FastifyRequest } from 'fastify';
import { AuthUserDto } from '../dto/auth-user.dto';

@Injectable()
export class SupabaseStrategy extends PassportStrategy(Strategy, 'supabase') {
  private supabase: SupabaseClient;

  constructor(configService: ConfigService) {
    // Usa il namespace dalla configurazione tipizzata
    const authConfig = configService.get('auth');
    const supabase = authConfig?.supabase;

    if (!supabase?.jwtSecret) {
      throw new Error('SUPABASE_JWT_SECRET is required');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: supabase.jwtSecret,
      passReqToCallback: true, // Per avere accesso al token originale
    });

    this.supabase = createClient(supabase.url || '', supabase.anonKey || '');
  }

  async validate(request: FastifyRequest): Promise<AuthUserDto> {
    // Il payload è già decodificato da passport-jwt
    // Contiene i claims del token Supabase (sub, email, role, etc.)

    // Estrai il token dalla request per verifica aggiuntiva (opzionale)
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(request);

    if (!token) {
      throw new UnauthorizedException('Token not found');
    }

    try {
      // Verifica aggiuntiva con Supabase (opzionale ma consigliata)
      const {
        data: { user },
        error,
      } = await this.supabase.auth.getUser(token);

      if (error || !user) {
        throw new UnauthorizedException('Invalid token');
      }

      // Mappa i ruoli
      const role = this.mapRole(
        user.app_metadata?.role || user.user_metadata?.role,
      );

      return {
        id: user.id,
        email: user.email || '',
        role,
      };
    } catch {
      throw new UnauthorizedException('Token validation failed');
    }
  }

  private mapRole(role: string | undefined): string {
    if (!role) return 'USER';
    return role.toUpperCase();
  }
}
