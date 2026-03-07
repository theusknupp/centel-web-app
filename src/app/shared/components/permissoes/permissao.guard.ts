import { CanActivateFn, Router } from '@angular/router';
import { PermissaoService } from '../../../core/services/permissao/permissao.service';
import { inject } from '@angular/core';
import { map, first } from 'rxjs';

export const permissaoGuard =
	(permissaoNecessaria: string): CanActivateFn =>
	() => {
		const permissiao = inject(PermissaoService);
		const router = inject(Router);
		return permissiao.pode$(permissaoNecessaria).pipe(
			first(pode => pode !== undefined),
			map(pode => pode || router.createUrlTree(['/nao-autorizado']))
		);
	};
