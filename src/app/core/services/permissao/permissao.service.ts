import { Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable } from 'rxjs';
import { SupabaseService } from '../supabase.service';
import { SupabaseClient } from '@supabase/supabase-js';

@Injectable({
	providedIn: 'root',
})
export class PermissaoService {
	private permissoes = new BehaviorSubject<Set<string>>(new Set());
	permissoes$ = this.permissoes.asObservable();
	private supabase: SupabaseClient;
  private supabaseService: any;

	constructor(supabaseService: SupabaseService) {
		this.supabase = supabaseService.getClient();
		this.supabaseService = supabaseService;
	}

	async carregarPermissoes() {
		const { data } = await this.supabase.rpc('buscar_permissoes_usuario_logado');
		const perms = new Set<string>(data?.map((r: any) => r.permissao) ?? []);
		this.permissoes.next(perms);
	}

  async temPerfil(perfil: string): Promise<boolean> {
		const {
			data: { user },
		} = await this.supabase.auth.getUser();
		if (!user) return false;

		const { data } = await this.supabaseService.getClient()
			.from('perfis')
			.select('id, perfis_usuario!inner(usuario_id)')
			.eq('nome', perfil)
			.eq('perfis_usuario.usuario_id', user.id)
			.maybeSingle();
    
    return !!data;
	}

	tem(permissao: string): boolean {
		return this.permissoes.value.has(permissao);
	}

	pode(permissao: string): boolean {
		const partes = permissao.split(':');
		return (
			partes.some((_, i) => {
				const nivel = [...partes.slice(0, i + 1), '*'].join(':');

				return this.permissoes.value.has(nivel);
			}) || this.permissoes.value.has(permissao)
		);
	}

	temTodas(permissoes: string[]): boolean {
		return permissoes.every((p) => this.pode(p));
	}

	temAlguma(permissoes: string[]): boolean {
		return permissoes.some((p) => this.pode(p));
	}

	pode$(permissao: string): Observable<boolean> {
		return this.permissoes$.pipe(
			map(perms => {
				const parts = permissao.split(':');
				return (
					parts.some((_, i) => {
						const nivel = [...parts.slice(0, i + 1), '*'].join(':');
						return perms.has(nivel);
					}) || perms.has(permissao)
				);
			})
		);
	}

	temTodas$(permissoes: string[]): Observable<boolean> {
		return this.permissoes$.pipe(
			map(() => permissoes.every((p) => this.pode(p)))
		);
	}

	temAlguma$(permissoes: string[]): Observable<boolean> {
		return this.permissoes$.pipe(
			map(() => permissoes.some((p) => this.pode(p)))
		);
	}
}
