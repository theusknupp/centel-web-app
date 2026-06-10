import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SupabaseService } from '../services/supabase.service'; 

export const authGuard: CanActivateFn = async (route, state) => {
  const supabaseService = inject(SupabaseService);
  const router = inject(Router);

  // Pergunta ao Supabase se existe alguém logado neste navegador
  const { data } = await supabaseService.getClient().auth.getSession();

  if (data.session) {
    return true; // Tem sessão ativa, a porta está liberada!
  } else {
    // Não tem sessão, manda para tela de login
    router.navigate(['/login']);
    return false;
  }
};