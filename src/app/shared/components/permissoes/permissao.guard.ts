import { CanActivateFn, Router } from '@angular/router';
import { PermissaoService } from '../../../core/services/permissao.service';
import { inject } from '@angular/core';
import { map, first } from 'rxjs';

/**
 * Guard de rota baseado em permissões
 * 
 * Uso:
 * - Permissão única: canActivate: [permissaoGuard('cliente:visualizar')]
 * - Múltiplas (alguma): canActivate: [permissaoGuard(['ordem_de_servico:cadastrar', 'ordem_de_servico:editar'], 'alguma')]
 * - Múltiplas (todas): canActivate: [permissaoGuard(['cliente:visualizar', 'cliente:editar'], 'todas')]
 * 
 * Se não autorizado, redireciona para /dashboard
 */
export const permissaoGuard = (
  permissoes: string | string[],
  modo: 'alguma' | 'todas' = 'alguma'
): CanActivateFn => {
  return () => {
    const permissaoService = inject(PermissaoService);
    const router = inject(Router);

    // Normaliza para array
    const permissoesArray = Array.isArray(permissoes) ? permissoes : [permissoes];

    // Seleciona o método apropriado baseado no modo
    let verificacao$;
    if (permissoesArray.length === 1) {
      verificacao$ = permissaoService.pode$(permissoesArray[0]);
    } else if (modo === 'todas') {
      verificacao$ = permissaoService.temTodas$(permissoesArray);
    } else {
      verificacao$ = permissaoService.temAlguma$(permissoesArray);
    }

    return verificacao$.pipe(
      first(podeAcessar => podeAcessar !== undefined),
      map(podeAcessar => podeAcessar || router.createUrlTree(['/dashboard']))
    );
  };
};
