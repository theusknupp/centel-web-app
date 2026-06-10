import { Routes } from '@angular/router';

// Importamos as nossas telas (classes) para que o Angular saiba quem elas são.
// ATENÇÃO: Verifique se o caminho './features/...' bate certinho com os nomes dos seus arquivos!
import { Login } from './features/auth/login/login'; 
import { Dashboard } from './features/home/dashboard/dashboard';
import { ClienteCadastro } from './features/clientes/cliente-cadastro/cliente-cadastro';
import { EmissaoOs } from './features/service-order/os-issue/emissao-os';
import { ListaOsComponent } from './features/service-order/lista-os/lista-os';
import { permissaoGuard } from './shared/components/permissoes/permissao.guard';
import { Permissoes } from './core/constants/permissions';
import { ReportsComponent } from './features/reports/reports';
import { ListaClientes } from './features/clientes/lista-clientes/lista-clientes';
import { authGuard } from './core/guards/auth-guard';


export const routes: Routes = [
  // 1. ROTA PADRÃO: Se o usuário acessar o site sem digitar nada na URL, mandamos ele para o login.
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  // 2. ROTA DE LOGIN: Quando a URL for '/login', mostra a tela LOGIN.
  { path: 'login', component: Login },

  // 3. ROTA DO DASHBOARD: Quando a URL for '/dashboard', mostra a tela DASHBOARD.
  { path: 'dashboard', component: Dashboard, canActivate: [authGuard] },

  // 4. ROTA DO CADASTRO CLIENTE: Requer qualquer permissão de cliente
  {
    path: 'cadastro',
    component: ClienteCadastro,
    canActivate: [
      authGuard,
      permissaoGuard(
        [
          Permissoes.CLIENTE.VISUALIZAR,
          Permissoes.CLIENTE.CADASTRAR,
          Permissoes.CLIENTE.EDITAR,
          Permissoes.CLIENTE.EXCLUIR,
        ],
        'alguma'
      ),
    ],
  },

  // 5. ROTA DA EMISSÃO DE OS: Requer permissão para cadastrar ou editar
  {
    path: 'emissao-os',
    component: EmissaoOs,
    canActivate: [
      authGuard,
      permissaoGuard(
        [Permissoes.ORDEM_SERVICO.CADASTRAR, Permissoes.ORDEM_SERVICO.EDITAR],
        'alguma'
      ),
    ],
  },

  // 6. ROTA DA LISTAGEM DE OS: Requer permissão para visualizar, editar ou excluir
  {
    path: 'lista-os',
    component: ListaOsComponent,
    canActivate: [
      authGuard,
      permissaoGuard(
        [
          Permissoes.ORDEM_SERVICO.VISUALIZAR,
          Permissoes.ORDEM_SERVICO.EDITAR,
          Permissoes.ORDEM_SERVICO.EXCLUIR,
        ],
        'alguma'
      ),
    ],
  },

  { path: 'relatorio', component: ReportsComponent, 
    canActivate: [
      authGuard,
      permissaoGuard(
        [
          Permissoes.ORDEM_SERVICO.VISUALIZAR,
        ],
        'alguma'
      ),
    ] },

  { path: 'lista-clientes', component: ListaClientes, canActivate: [
    authGuard,
    permissaoGuard(
        [
          Permissoes.ORDEM_SERVICO.VISUALIZAR,
        ],
        'alguma'
      ),] },

];