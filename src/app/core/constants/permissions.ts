/**
 * Constantes centralizadas de permissões do sistema
 * 
 * Uso:
 * - No HTML: *temPermissao="Permissoes.CLIENTE.CRUD"
 * - No TS: this.permissaoService.pode(Permissoes.CLIENTE.CRUD)
 * - Na rota: canActivate: [permissaoGuard(Permissoes.CLIENTE.CRUD)]
 */

export const Permissoes = {
  CLIENTE: {
    VISUALIZAR: 'cliente:visualizar',
    CADASTRAR: 'cliente:cadastrar',
    EDITAR: 'cliente:editar',
    EXCLUIR: 'cliente:excluir',
    // CRUD: 'cliente:crud',
  },
  ORDEM_SERVICO: {
    VISUALIZAR: 'ordem_de_servico:visualizar',
    CADASTRAR: 'ordem_de_servico:cadastrar',
    EDITAR: 'ordem_de_servico:editar',
    EXCLUIR: 'ordem_de_servico:excluir',
    // CRUD: 'ordem_de_servico:crud',
  },
  ESTOQUE: {
    VISUALIZAR: 'estoque:visualizar',
  },
RELATORIO: {
    VISUALIZAR: 'relatorio:visualizar',
  },
} as const;

/**
 * Type-safe union de todas as permissões
 * Usável em funções genéricas
 */
export type PermissaoString = 
  | typeof Permissoes[keyof typeof Permissoes][keyof typeof Permissoes[keyof typeof Permissoes]];
