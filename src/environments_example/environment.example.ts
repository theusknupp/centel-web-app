import { EnvironmentConfig } from './environment.interface';

export const environment: EnvironmentConfig = {
  production: false,
  supabaseUrl: 'https://supabase.co',
  supabaseKey: 'chave_supabase',
  PERMISSION_REFRESH_INTERVAL_MS: 60 * 60 * 1000, // 1 hora
};
