/**
 * Constantes centralizadas de permissões do sistema
 * * Uso:
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
  },
  ORDEM_SERVICO: {
    VISUALIZAR: 'ordem_de_servico:visualizar',
    CADASTRAR: 'ordem_de_servico:cadastrar',
    EDITAR: 'ordem_de_servico:editar',
    EXCLUIR: 'ordem_de_servico:excluir',
  },
  ESTOQUE: {
    VISUALIZAR: 'estoque:visualizar',
  },
  RELATORIO: {
    VISUALIZAR: 'relatorio:visualizar',
  },
  USUARIO: {
    GERENCIAR: 'usuario:gerenciar',
  },
} as const;

/**
 * Type-safe union de todas as permissões
 * Extrai os valores internos de forma segura e performática para o compilador
 */
export type PermissaoString = {
  [K in keyof typeof Permissoes]: typeof Permissoes[K][keyof typeof Permissoes[K]]
}[keyof typeof Permissoes]