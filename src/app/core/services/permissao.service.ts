import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, map, Observable, interval, Subscription } from 'rxjs';
import { SupabaseService } from './supabase.service';
import { SupabaseClient } from '@supabase/supabase-js';

interface PermissaoCache {
  permissoes: string[];
  timestamp: number;
}

const CACHE_KEY = 'centel_permissoes_cache';

@Injectable({
    providedIn: 'root',
})
export class PermissaoService implements OnDestroy {
    private permissoes = new BehaviorSubject<Set<string>>(new Set());
    permissoes$ = this.permissoes.asObservable();
    
    private supabase: SupabaseClient;
    private supabaseService: any;
    
    private refreshSubscription?: Subscription;
    private isLoading = false;
    private lastLoadTime = 0;

    constructor(supabaseService: SupabaseService) {
        this.supabase = supabaseService.getClient();
        this.supabaseService = supabaseService;
    }

    /**
     * Carrega permissões do Supabase com suporte a cache local
     * @param forceRefresh Se true, ignora cache e busca do servidor
     * @param userId Opcional: user_id para evitar chamada extra ao getUser()
     */
    async carregarPermissoes(forceRefresh: boolean = false, userId?: string): Promise<void> {
        if (this.isLoading) return;
        
        this.isLoading = true;
        try {
            if (!forceRefresh) {
                const cached = this.carregarDoCache();
                if (cached) {
                    this.permissoes.next(new Set(cached));
                    this.isLoading = false;
                    return;
                }
            }

            // Obtém o user_id do usuário autenticado
            let userIdToUse = userId;
            if (!userIdToUse) {
                const { data: { user } } = await this.supabase.auth.getUser();
                if (!user) {
                    console.error('[PermissaoService] Nenhum usuário autenticado');
                    this.isLoading = false;
                    return;
                }
                userIdToUse = user.id;
            }

            // Chama RPC passando o user_id
            const { data, error } = await this.supabase.rpc(
                'buscar_permissoes_usuario_logado',
                { p_user_id: userIdToUse }
            );

            if (error) {
                console.error('[PermissaoService] Erro RPC:', error);
                this.isLoading = false;
                return;
            }
            
            const perms = data?.map((r: any) => r.permissao) ?? [];
            const permsSet = new Set<string>(perms);
            
            this.permissoes.next(permsSet);
            this.lastLoadTime = Date.now();
            
            this.salvarNoCache(perms);
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Inicia refresh automático de permissões
     * @param intervaloMs Intervalo em milissegundos (padrão: 1 hora)
     * 
     * Exemplo:
     * this.permissaoService.iniciarRefreshAutomatico(60 * 60 * 1000); // 1 hora
     */
    iniciarRefreshAutomatico(intervaloMs: number = 60 * 60 * 1000): void {
        // Para refresh anterior se existir
        this.pararRefreshAutomatico();

        this.refreshSubscription = interval(intervaloMs).subscribe(() => {
            this.carregarPermissoes(true); // forceRefresh = true
        });

        console.log(`[PermissaoService] Refresh automático iniciado a cada ${intervaloMs}ms`);
    }

    /**
     * Para o refresh automático
     */
    pararRefreshAutomatico(): void {
        if (this.refreshSubscription) {
            this.refreshSubscription.unsubscribe();
        }
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
        console.log('pode verificar permissão:', permissao);
        return (
            partes.some((_, i) => {
                const nivel = [...partes.slice(0, i + 1), '*'].join(':');

                console.log(`verificando nível ${i}:`, nivel, '=>', this.permissoes.value.has(nivel));

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
        console.log('modo: todos');
        console.log('permissoes:', permissoes);
        return this.permissoes$.pipe(
            map(() => permissoes.every((p) => this.pode(p)))
        );
    }

    temAlguma$(permissoes: string[]): Observable<boolean> {
        console.log('modo: algum');
        console.log('permissoes:', permissoes);
        return this.permissoes$.pipe(
            map(() => permissoes.some((p) => this.pode(p)))
        );
    }

    /**
     * Força refresh de permissões (útil ao receber erro 403 do backend)
     */
    async forcarRefresh(): Promise<void> {
        this.limparCache();
        await this.carregarPermissoes(true);
    }

    // ========== Métodos privados de cache ==========

    private carregarDoCache(): string[] | null {
        try {
            const cached = localStorage.getItem(CACHE_KEY);
            if (!cached) return null;

            const parsed: PermissaoCache = JSON.parse(cached);
            
            // Valida timestamp e estrutura
            if (parsed.timestamp && Array.isArray(parsed.permissoes)) {
                return parsed.permissoes;
            }
        } catch (error) {
            console.warn('[PermissaoService] Erro ao ler cache:', error);
        }
        return null;
    }

    private salvarNoCache(permissoes: string[]): void {
        try {
            const cache: PermissaoCache = {
                permissoes,
                timestamp: Date.now(),
            };
            localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
        } catch (error) {
            console.warn('[PermissaoService] Erro ao salvar cache:', error);
        }
    }

    private limparCache(): void {
        try {
            localStorage.removeItem(CACHE_KEY);
        } catch (error) {
            console.warn('[PermissaoService] Erro ao limpar cache:', error);
        }
    }

    ngOnDestroy(): void {
        this.pararRefreshAutomatico();
    }
}
