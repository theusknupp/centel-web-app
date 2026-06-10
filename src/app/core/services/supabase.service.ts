import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

// O 'providedIn: root' garante que exista apenas UMA conexão ativa rodando no sistema todo
@Injectable({
  providedIn: 'root'
})
export class SupabaseService {

  // Variável privada para conexão c/ Banco
  private supabase: SupabaseClient;

  constructor() {
    // Inicializa a conexão usando a URL e a Chave Pública que estão no enviroments
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseKey
    );
  }

  // Método público que as telas vão usar para pedir acesso ao banco de dados.
  public getClient(): SupabaseClient {
    return this.supabase;
  }

  async signOut() {
    const { error } = await this.supabase.auth.signOut();
    if (error) {
      console.error('Erro ao fazer logout:', error.message);
      throw error;
    }
  }

}