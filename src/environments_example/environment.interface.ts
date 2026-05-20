/**
 * Interface para type-safety do arquivo environment
 * Garante que todos os environment files (development, production, etc)
 * tenham as mesmas propriedades
 */
export interface EnvironmentConfig {
  production: boolean;
  supabaseUrl: string;
  supabaseKey: string;
  PERMISSION_REFRESH_INTERVAL_MS: number;
}
